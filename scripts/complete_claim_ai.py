import json
import sys
from pathlib import Path
from datetime import datetime

ROOT = Path(__file__).resolve().parents[1]
CLAIMS_FILE = ROOT / "data" / "claims.json"
VECTOR_DB = ROOT / "processed" / "vector_db"

sys.path.insert(0, str(ROOT))


def load_claims():
    with open(CLAIMS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def save_claims(claims):
    with open(CLAIMS_FILE, "w", encoding="utf-8") as f:
        json.dump(claims, f, indent=2, ensure_ascii=False)


def find_claim(claims, claim_id):
    for claim in claims:
        if claim.get("id") == claim_id:
            return claim
    return None


# =========================================================
# RAG
# =========================================================

def run_rag(claim):
    try:
        import chromadb
        from sentence_transformers import SentenceTransformer

        if not VECTOR_DB.exists():
            raise RuntimeError("Vector database does not exist.")

        client = chromadb.PersistentClient(path=str(VECTOR_DB))
        collection = client.get_collection("insurance_policies")

        model = SentenceTransformer("all-MiniLM-L6-v2")

        incident = claim.get("incident", {})
        policy = claim.get("policy", {})

        question = f"""
Vehicle insurance claim.

Insurance company: {policy.get("insuranceCompany", "")}
Policy type: {policy.get("policyType", "")}
Coverage: {policy.get("coverageType", "")}

Incident:
{incident.get("incidentType", "")}

Damage description:
{incident.get("damageDescription", "")}

Incident details:
{incident.get("incidentDetails", "")}

Identify relevant insurance coverage, claim requirements,
documentation requirements, exclusions or conditions, and
next steps relevant to this claim.
"""

        embedding = model.encode(question).tolist()

        results = collection.query(
            query_embeddings=[embedding],
            n_results=10,
            include=["documents", "metadatas", "distances"]
        )

        documents = results.get("documents", [[]])[0]
        metadatas = results.get("metadatas", [[]])[0]
        distances = results.get("distances", [[]])[0]

        company = policy.get("insuranceCompany", "").lower()

        retrieved = []

        for i, document in enumerate(documents):
            metadata = metadatas[i] if i < len(metadatas) else {}
            distance = distances[i] if i < len(distances) else None

            metadata_text = json.dumps(metadata).lower()

            # Prefer chunks belonging to the claimant's insurer.
            company_match = (
                company in metadata_text
                or company.replace(" general insurance", "") in metadata_text
            )

            retrieved.append({
                "document": document,
                "metadata": metadata,
                "distance": distance,
                "company_match": company_match
            })

        company_results = [
            r for r in retrieved
            if r["company_match"]
        ]

        # If company-specific chunks exist, use them.
        # Otherwise retain the general retrieved policy evidence.
        if company_results:
            retrieved = company_results[:5]
        else:
            retrieved = retrieved[:5]

        return {
            "status": "COMPLETED",
            "result": {
                "query": question.strip(),
                "company": policy.get("insuranceCompany"),
                "retrieved_count": len(retrieved),
                "results": retrieved
            }
        }

    except Exception as e:
        return {
            "status": "FAILED",
            "result": {
                "error": str(e)
            }
        }


# =========================================================
# LLM
# =========================================================

def run_llm(claim, rag_result):

    try:
        import requests

        incident = claim.get("incident", {})
        vehicle = claim.get("vehicle", {})
        policy = claim.get("policy", {})
        ai = claim.get("aiAssessment", {})

        prompt = f"""
You are AutoInsight's AI claim-assessment assistant.

You assist human insurance reviewers.
You MUST NOT approve or reject the claim.

Use only the information supplied below.
Do not invent policy conditions.

VEHICLE
{json.dumps(vehicle, indent=2)}

POLICY
{json.dumps(policy, indent=2)}

INCIDENT
{json.dumps(incident, indent=2)}

COMPUTER VISION
{json.dumps(ai.get("computerVision", {}), indent=2)}

NLP
{json.dumps(ai.get("nlp", {}), indent=2)}

EVIDENCE COMPARISON
{json.dumps(ai.get("evidenceComparison", {}), indent=2)}

MISSING EVIDENCE
{json.dumps(ai.get("missingEvidence", {}), indent=2)}

RETRIEVED INSURANCE KNOWLEDGE
{json.dumps(rag_result.get("result", {}), indent=2)}

Generate a concise assessment with these sections:

1. Claim Summary
2. Detected Damage
3. Evidence Consistency
4. Additional Damage
5. Missing Evidence
6. Relevant Insurance Guidance
7. Recommended Human Review Action

Clearly distinguish detected facts from recommendations.
If policy information is insufficient, say so.
"""

        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "llama3.2:latest",
                "prompt": prompt,
                "stream": False
            },
            timeout=120
        )

        response.raise_for_status()

        data = response.json()

        return {
            "status": "COMPLETED",
            "result": {
                "model": "llama3.2:latest",
                "summary": data.get("response", "").strip()
            }
        }

    except Exception as e:
        return {
            "status": "FAILED",
            "result": {
                "error": str(e)
            }
        }


# =========================================================
# COMPLETE PIPELINE
# =========================================================

def process_claim(claim_id):

    claims = load_claims()
    claim = find_claim(claims, claim_id)

    if claim is None:
        raise ValueError(f"Claim not found: {claim_id}")

    print(f"\nProcessing claim: {claim_id}")

    ai = claim.setdefault("aiAssessment", {})

    # -----------------------------------------------------
    # NLP / Evidence
    # -----------------------------------------------------

    if (
        ai.get("nlp", {}).get("status") != "COMPLETED"
        or ai.get("evidenceComparison", {}).get("status") != "COMPLETED"
        or ai.get("missingEvidence", {}).get("status") != "COMPLETED"
    ):
        print("[1] NLP / evidence stage incomplete.")
        print(
            f"Run: python scripts/claim_evidence.py {claim_id}"
        )
        return

    print("[1] NLP + Evidence: COMPLETED")

    # -----------------------------------------------------
    # RAG
    # -----------------------------------------------------

    print("[2] RAG: searching insurance knowledge base...")

    rag = run_rag(claim)

    ai["rag"] = rag

    if rag["status"] == "COMPLETED":
        count = rag["result"].get("retrieved_count", 0)
        print(f"[2] RAG: COMPLETED ({count} chunks)")
    else:
        print("[2] RAG: FAILED")
        print(rag["result"].get("error"))

    save_claims(claims)

    # -----------------------------------------------------
    # LLM
    # -----------------------------------------------------

    print("[3] LLM: generating claim summary...")

    llm = run_llm(claim, rag)

    ai["llm"] = llm

    if llm["status"] == "COMPLETED":
        print("[3] LLM: COMPLETED")
    else:
        print("[3] LLM: FAILED")
        print(llm["result"].get("error"))

    # -----------------------------------------------------
    # Final status
    # -----------------------------------------------------

    ai["updatedAt"] = datetime.now().isoformat()

    if (
        ai.get("nlp", {}).get("status") == "COMPLETED"
        and ai.get("evidenceComparison", {}).get("status") == "COMPLETED"
        and ai.get("missingEvidence", {}).get("status") == "COMPLETED"
        and ai.get("rag", {}).get("status") == "COMPLETED"
        and ai.get("llm", {}).get("status") == "COMPLETED"
    ):
        ai["status"] = "COMPLETED"
        claim["status"] = "CLAIM_PACKAGE_GENERATED"
    else:
        ai["status"] = "PARTIAL"

    claim["updatedAt"] = datetime.now().isoformat()

    save_claims(claims)

    print("\n========================================")
    print("AUTOINSIGHT AI PIPELINE")
    print("========================================")
    print(f"Claim       : {claim_id}")
    print(f"AI Status   : {ai.get('status')}")
    print(f"Claim Status: {claim.get('status')}")

    if llm["status"] == "COMPLETED":
        print("\nLLM SUMMARY")
        print("----------------------------------------")
        print(llm["result"]["summary"])

    print("========================================")


if __name__ == "__main__":

    if len(sys.argv) != 2:
        print(
            "Usage: python scripts/complete_claim_ai.py CLAIM_ID"
        )
        sys.exit(1)

    process_claim(sys.argv[1])