"""
AutoInsight Claim AI API

Exposes the existing inference/ClaimAnalyzer through FastAPI.

Flow:
    Claim images
        ↓
    ClaimAnalyzer
        ↓
    Damage Detection
    Severity Detection
    Parts Detection (optional)
        ↓
    Detection Fusion
    Repair Estimation
"""

import os
import sys
from pathlib import Path

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel


# ---------------------------------------------------------
# Project paths
# ---------------------------------------------------------

PROJECT_ROOT = Path(__file__).resolve().parent.parent
INFERENCE_DIR = PROJECT_ROOT / "inference"
MODELS_DIR = PROJECT_ROOT / "models"

sys.path.insert(0, str(INFERENCE_DIR))

from claim_analyzer import ClaimAnalyzer


# ---------------------------------------------------------
# Model paths
# ---------------------------------------------------------

DAMAGE_MODEL = MODELS_DIR / "damage" / "best.pt"
PARTS_MODEL = MODELS_DIR / "parts" / "parts.pt"
SEVERITY_MODEL = MODELS_DIR / "severity" / "best.pt"


# ---------------------------------------------------------
# Model availability
# ---------------------------------------------------------

def is_valid_model(path: Path) -> bool:
    """
    Basic checkpoint validation.

    The current parts.pt is only 2 bytes, so it must not be
    passed to Ultralytics as a model.
    """
    try:
        return path.exists() and path.is_file() and path.stat().st_size > 1024
    except OSError:
        return False


DAMAGE_AVAILABLE = is_valid_model(DAMAGE_MODEL)
PARTS_AVAILABLE = is_valid_model(PARTS_MODEL)
SEVERITY_AVAILABLE = is_valid_model(SEVERITY_MODEL)


if not DAMAGE_AVAILABLE:
    raise RuntimeError(
        f"Damage model is missing or invalid: {DAMAGE_MODEL}"
    )

if not SEVERITY_AVAILABLE:
    raise RuntimeError(
        f"Severity model is missing or invalid: {SEVERITY_MODEL}"
    )


# ---------------------------------------------------------
# Load AI models
# ---------------------------------------------------------

print("Loading AutoInsight AI models...")

if PARTS_AVAILABLE:
    print("Parts model found.")
else:
    print(
        "WARNING: Parts model is unavailable. "
        "Continuing with Damage + Severity models."
    )


# IMPORTANT:
# ClaimAnalyzer currently requires a PartsDetector during
# construction. Therefore, when the Parts model is unavailable,
# we create the analyzer with the existing model and replace
# the PartsDetector with a safe fallback.

analyzer = ClaimAnalyzer(
    damage_model_path=str(DAMAGE_MODEL),
    parts_model_path=str(PARTS_MODEL) if PARTS_AVAILABLE else str(DAMAGE_MODEL),
    severity_model_path=str(SEVERITY_MODEL),
)


# ---------------------------------------------------------
# Optional Parts fallback
# ---------------------------------------------------------

class UnavailablePartsDetector:
    """
    Safe fallback used when the trained vehicle-parts model
    is unavailable.

    It deliberately returns no part detections instead of
    pretending that another model is a vehicle-parts model.
    """

    model_version = "parts-unavailable"

    def detect(self, image_path):
        return []


if not PARTS_AVAILABLE:
    analyzer.parts_detector = UnavailablePartsDetector()


print("AutoInsight AI models loaded successfully.")


# ---------------------------------------------------------
# FastAPI
# ---------------------------------------------------------

app = FastAPI(
    title="AutoInsight Claim AI API",
    version="1.0.0",
)


# ---------------------------------------------------------
# Request schema
# ---------------------------------------------------------

class AnalyzeClaimRequest(BaseModel):
    claim_id: str
    image_paths: list[str]
    vehicle_segment: str = "economy"


# ---------------------------------------------------------
# Health check
# ---------------------------------------------------------

@app.get("/")
def root():
    return {
        "status": "ok",
        "service": "AutoInsight Claim AI API",
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "models": {
            "damage": {
                "available": DAMAGE_AVAILABLE,
                "path": str(DAMAGE_MODEL),
            },
            "severity": {
                "available": SEVERITY_AVAILABLE,
                "path": str(SEVERITY_MODEL),
            },
            "parts": {
                "available": PARTS_AVAILABLE,
                "path": str(PARTS_MODEL),
            },
        },
    }


# ---------------------------------------------------------
# Claim analysis
# ---------------------------------------------------------

@app.post("/analyze")
def analyze_claim(request: AnalyzeClaimRequest):

    if not request.claim_id:
        raise HTTPException(
            status_code=400,
            detail="claim_id is required.",
        )

    if not request.image_paths:
        raise HTTPException(
            status_code=400,
            detail="At least one image is required.",
        )

    # Make sure supplied files actually exist.
    missing_images = [
        image_path
        for image_path in request.image_paths
        if not os.path.isfile(image_path)
    ]

    if missing_images:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "One or more images do not exist.",
                "missing_images": missing_images,
            },
        )

    try:
        result = analyzer.analyze_claim(
            claim_id=request.claim_id,
            image_paths=request.image_paths,
            vehicle_segment=request.vehicle_segment,
        )

        return {
            "success": True,
            "models": {
                "damage": "active",
                "severity": "active",
                "parts": (
                    "active"
                    if PARTS_AVAILABLE
                    else "unavailable"
                ),
            },
            "result": result,
        }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail={
                "message": "AI claim analysis failed.",
                "error": str(exc),
            },
        )