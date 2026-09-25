"""
AutoInsight Claim Evidence Pipeline

NLP extraction
    +
CV vs NLP evidence comparison
    +
Missing evidence detection

Works on already-saved claims in data/claims.json.
"""

import json
import re
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parent.parent
CLAIMS_FILE = PROJECT_ROOT / "data" / "claims.json"


# ---------------------------------------------------------
# NLP keyword knowledge
# ---------------------------------------------------------

PART_KEYWORDS = {
    "front bumper": [
        "front bumper",
        "bumper",
    ],
    "left headlamp": [
        "left headlamp",
        "left headlight",
        "headlamp",
        "headlight",
    ],
    "right headlamp": [
        "right headlamp",
        "right headlight",
    ],
    "windshield": [
        "windshield",
        "windscreen",
    ],
    "glass": [
        "glass",
        "window",
    ],
    "bonnet": [
        "bonnet",
        "hood",
    ],
    "door": [
        "door",
    ],
    "fender": [
        "fender",
    ],
    "rear bumper": [
        "rear bumper",
    ],
    "boot": [
        "boot",
        "trunk",
    ],
}

DAMAGE_KEYWORDS = {
    "dent": [
        "dent",
        "dented",
    ],
    "scratch": [
        "scratch",
        "scratches",
        "scratched",
    ],
    "crack": [
        "crack",
        "cracked",
    ],
    "glass shatter": [
        "glass shatter",
        "shattered glass",
        "broken glass",
    ],
    "lamp broken": [
        "broken lamp",
        "broken headlamp",
        "broken headlight",
    ],
}

INCIDENT_KEYWORDS = {
    "collision": [
        "collision",
        "collided",
        "crashed",
        "crash",
    ],
    "accident": [
        "accident",
    ],
    "rear-end collision": [
        "rear-ended",
        "rear end",
    ],
}


# ---------------------------------------------------------
# Helpers
# ---------------------------------------------------------

def normalize(text: str) -> str:
    return re.sub(
        r"\s+",
        " ",
        text.lower().strip(),
    )


def extract_keywords(text: str, dictionary: dict) -> list[str]:
    text = normalize(text)

    found = []

    for label, keywords in dictionary.items():
        for keyword in keywords:
            if keyword in text:
                found.append(label)
                break

    return found


# ---------------------------------------------------------
# NLP extraction
# ---------------------------------------------------------

def extract_nlp_evidence(claim: dict) -> dict:
    incident = claim.get("incident", {})

    description = incident.get(
        "damageDescription",
        "",
    )

    details = incident.get(
        "incidentDetails",
        "",
    )

    combined_text = (
        f"{description} {details}"
    )

    return {
        "source": "claim_description",
        "raw_text": combined_text,

        "incident_types": extract_keywords(
            combined_text,
            INCIDENT_KEYWORDS,
        ),

        "affected_parts": extract_keywords(
            combined_text,
            PART_KEYWORDS,
        ),

        "damage_types": extract_keywords(
            combined_text,
            DAMAGE_KEYWORDS,
        ),
    }


# ---------------------------------------------------------
# CV extraction
# ---------------------------------------------------------

def extract_cv_evidence(claim: dict) -> dict:
    result = (
        claim
        .get("aiAssessment", {})
        .get("computerVision", {})
        .get("result", {})
    )

    damage_types = []
    parts = []
    severities = []

    for image in result.get("images", []):
        for detection in image.get(
            "detections",
            [],
        ):
            damage_type = detection.get(
                "damage_type"
            )

            part = detection.get(
                "part"
            )

            severity = detection.get(
                "severity"
            )

            if damage_type:
                damage_types.append(
                    damage_type
                )

            if part and part != "unknown":
                parts.append(part)

            if severity:
                severities.append(
                    severity
                )

    return {
        "damage_types": sorted(
            set(damage_types)
        ),
        "parts": sorted(
            set(parts)
        ),
        "severities": sorted(
            set(severities)
        ),
    }


# ---------------------------------------------------------
# Evidence comparison
# ---------------------------------------------------------

def compare_evidence(
    nlp: dict,
    cv: dict,
) -> dict:

    nlp_damage = set(
        nlp["damage_types"]
    )

    cv_damage = set(
        cv["damage_types"]
    )

    nlp_parts = set(
        nlp["affected_parts"]
    )

    cv_parts = set(
        cv["parts"]
    )

    damage_supported = (
        nlp_damage & cv_damage
    )

    damage_not_seen = (
        nlp_damage - cv_damage
    )

    cv_not_reported = (
        cv_damage - nlp_damage
    )

    parts_supported = (
        nlp_parts & cv_parts
    )

    parts_not_seen = (
        nlp_parts - cv_parts
    )

    if not nlp_damage:
        consistency = "INSUFFICIENT_TEXT_EVIDENCE"
    elif damage_not_seen:
        consistency = "PARTIAL_MATCH"
    else:
        consistency = "MATCH"

    return {
        "status": consistency,

        "damage": {
            "reported_by_customer": sorted(
                nlp_damage
            ),
            "detected_by_cv": sorted(
                cv_damage
            ),
            "supported": sorted(
                damage_supported
            ),
            "reported_but_not_detected": sorted(
                damage_not_seen
            ),
            "detected_but_not_reported": sorted(
                cv_not_reported
            ),
        },

        "parts": {
            "reported_by_customer": sorted(
                nlp_parts
            ),
            "detected_by_cv": sorted(
                cv_parts
            ),
            "supported": sorted(
                parts_supported
            ),
            "reported_but_not_detected": sorted(
                parts_not_seen
            ),
        },

        "requires_review": bool(
            damage_not_seen
            or cv_not_reported
            or parts_not_seen
        ),
    }


# ---------------------------------------------------------
# Missing evidence
# ---------------------------------------------------------

def detect_missing_evidence(
    claim: dict,
    nlp: dict,
    cv: dict,
    comparison: dict,
) -> dict:

    missing = []

    evidence = claim.get(
        "evidence",
        {},
    )

    if evidence.get(
        "imageCount",
        0,
    ) == 0:
        missing.append(
            "vehicle_damage_images"
        )

    if not nlp["damage_types"]:
        missing.append(
            "clear_damage_description"
        )

    if not nlp["affected_parts"]:
        missing.append(
            "affected_vehicle_parts"
        )

    if comparison[
        "damage"
    ][
        "detected_but_not_reported"
    ]:
        missing.append(
            "description_for_additional_detected_damage"
        )

    if comparison[
        "damage"
    ][
        "reported_but_not_detected"
    ]:
        missing.append(
            "additional_images_or_explanation"
        )

    return {
        "status": (
            "MISSING_EVIDENCE"
            if missing
            else "SUFFICIENT"
        ),
        "items": missing,
    }


# ---------------------------------------------------------
# Full pipeline
# ---------------------------------------------------------

def analyze_claim_evidence(
    claim: dict,
) -> dict:

    nlp = extract_nlp_evidence(
        claim
    )

    cv = extract_cv_evidence(
        claim
    )

    comparison = compare_evidence(
        nlp,
        cv,
    )

    missing = detect_missing_evidence(
        claim,
        nlp,
        cv,
        comparison,
    )

    return {
        "nlp": {
            "status": "COMPLETED",
            "result": nlp,
        },

        "evidenceComparison": {
            "status": "COMPLETED",
            "result": comparison,
        },

        "missingEvidence": {
            "status": "COMPLETED",
            "result": missing,
        },
    }


# ---------------------------------------------------------
# Claim lookup
# ---------------------------------------------------------

def load_claims():
    with open(
        CLAIMS_FILE,
        "r",
        encoding="utf-8",
    ) as file:
        return json.load(file)


def save_claims(claims):
    with open(
        CLAIMS_FILE,
        "w",
        encoding="utf-8",
    ) as file:
        json.dump(
            claims,
            file,
            indent=2,
        )


# ---------------------------------------------------------
# CLI
# ---------------------------------------------------------

if __name__ == "__main__":

    import sys

    if len(sys.argv) < 2:
        print(
            "Usage: python scripts/claim_evidence.py CLM-XXXXXXXXXX"
        )
        raise SystemExit(1)

    claim_id = sys.argv[1]

    claims = load_claims()

    claim = next(
        (
            item
            for item in claims
            if item.get("id") == claim_id
        ),
        None,
    )

    if claim is None:
        print(
            f"Claim not found: {claim_id}"
        )
        raise SystemExit(1)

    evidence_result = (
        analyze_claim_evidence(
            claim
        )
    )

    claim["aiAssessment"]["nlp"] = (
        evidence_result["nlp"]
    )

    claim["aiAssessment"][
        "evidenceComparison"
    ] = evidence_result[
        "evidenceComparison"
    ]

    claim["aiAssessment"][
        "missingEvidence"
    ] = evidence_result[
        "missingEvidence"
    ]

    claim["updatedAt"] = (
        __import__("datetime")
        .datetime.now()
        .isoformat()
    )

    save_claims(claims)

    print(
        json.dumps(
            evidence_result,
            indent=2,
        )
    )