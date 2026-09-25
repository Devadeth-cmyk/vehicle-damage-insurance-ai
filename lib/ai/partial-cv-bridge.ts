import { execFile } from "child_process";
import { promisify } from "util";
import { AI_CONFIG } from "./config";

const execFileAsync = promisify(execFile);

export interface PartialCVDetection {
  damage_id: number;
  damage_type: string;
  confidence: number;
  bbox: [number, number, number, number];
  severity: string;
  severity_source: "model" | "heuristic";
  part: null;
}

export interface PartialCVResult {
  success: boolean;
  image_path: string;
  image_found: boolean;
  detections: PartialCVDetection[];
  damage_model_loaded: boolean;
  severity_model_loaded: boolean;
  parts_model_status: "UNAVAILABLE_INVALID_CHECKPOINT";
  parts_model_note: string;
  error?: string;
  rawStderr?: string;
}

/**
 * Runs partial CV inference using ONLY the valid models:
 * - models/damage/best.pt
 * - models/severity/best.pt
 *
 * Explicitly bypasses parts.pt without modifying the external AI repository or model files.
 */
export async function executePartialCVInference(imagePath: string): Promise<PartialCVResult> {
  const runnerPayload = {
    image_path: imagePath,
    damage_model_path: AI_CONFIG.damageModelPath,
    severity_model_path: AI_CONFIG.severityModelPath,
    ai_project_path: AI_CONFIG.projectPath,
    inference_path: AI_CONFIG.inferencePath,
  };

  const pythonScript = `
import sys
import os
import json
import traceback

payload = json.loads(sys.argv[1])

# Configure sys.path
for p in [payload["ai_project_path"], payload["inference_path"]]:
    if p not in sys.path:
        sys.path.insert(0, p)

image_path = payload["image_path"]
if not os.path.exists(image_path):
    print(json.dumps({
        "success": False,
        "image_path": image_path,
        "image_found": False,
        "detections": [],
        "damage_model_loaded": False,
        "severity_model_loaded": False,
        "parts_model_status": "UNAVAILABLE_INVALID_CHECKPOINT",
        "parts_model_note": "parts.pt is invalid/corrupted in external repository; parts detection bypassed.",
        "error": f"Image file does not exist at: {image_path}"
    }))
    sys.exit(0)

# Import individual detector modules
try:
    from damage_detector import DamageDetector
except Exception as e:
    print(json.dumps({
        "success": False,
        "image_path": image_path,
        "image_found": True,
        "detections": [],
        "damage_model_loaded": False,
        "severity_model_loaded": False,
        "parts_model_status": "UNAVAILABLE_INVALID_CHECKPOINT",
        "parts_model_note": "parts.pt is invalid/corrupted in external repository; parts detection bypassed.",
        "error": f"Failed to import DamageDetector: {str(e)}",
        "traceback": traceback.format_exc()
    }))
    sys.exit(0)

try:
    from severity_detector import SeverityDetector
except ImportError:
    SeverityDetector = None

# 1. Load Damage Detector
try:
    damage_detector = DamageDetector(payload["damage_model_path"])
    damage_loaded = True
except Exception as e:
    print(json.dumps({
        "success": False,
        "image_path": image_path,
        "image_found": True,
        "detections": [],
        "damage_model_loaded": False,
        "severity_model_loaded": False,
        "parts_model_status": "UNAVAILABLE_INVALID_CHECKPOINT",
        "parts_model_note": "parts.pt is invalid/corrupted in external repository; parts detection bypassed.",
        "error": f"Failed to load damage model ({payload['damage_model_path']}): {str(e)}",
        "traceback": traceback.format_exc()
    }))
    sys.exit(0)

# 2. Load Severity Detector if available
severity_detector = None
severity_loaded = False
if SeverityDetector is not None and os.path.exists(payload["severity_model_path"]):
    try:
        severity_detector = SeverityDetector(payload["severity_model_path"])
        severity_loaded = True
    except Exception:
        severity_detector = None
        severity_loaded = False

# 3. Run Inference
try:
    severity_detections = []
    if severity_detector is not None:
        severity_detections = severity_detector.detect(image_path)

    raw_detections = damage_detector.detect(image_path, severity_detections=severity_detections)

    # Attach explicit part: null indicator
    normalized = []
    for d in raw_detections:
        normalized.append({
            "damage_id": d.get("damage_id"),
            "damage_type": d.get("damage_type"),
            "confidence": d.get("confidence"),
            "bbox": d.get("bbox"),
            "severity": d.get("severity"),
            "severity_source": d.get("severity_source"),
            "part": None
        })

    print(json.dumps({
        "success": True,
        "image_path": image_path,
        "image_found": True,
        "detections": normalized,
        "damage_model_loaded": damage_loaded,
        "severity_model_loaded": severity_loaded,
        "parts_model_status": "UNAVAILABLE_INVALID_CHECKPOINT",
        "parts_model_note": "parts.pt is invalid/corrupted in external repository; parts detection bypassed.",
    }))
except Exception as e:
    print(json.dumps({
        "success": False,
        "image_path": image_path,
        "image_found": True,
        "detections": [],
        "damage_model_loaded": damage_loaded,
        "severity_model_loaded": severity_loaded,
        "parts_model_status": "UNAVAILABLE_INVALID_CHECKPOINT",
        "parts_model_note": "parts.pt is invalid/corrupted in external repository; parts detection bypassed.",
        "error": f"Inference execution failed: {str(e)}",
        "traceback": traceback.format_exc()
    }))
`;

  try {
    const { stdout, stderr } = await execFileAsync(
      AI_CONFIG.pythonExecutable,
      ["-c", pythonScript, JSON.stringify(runnerPayload)],
      {
        timeout: 60000,
        env: {
          ...process.env,
          PYTHONPATH: `${AI_CONFIG.projectPath};${AI_CONFIG.inferencePath}`,
        },
      }
    );

    const lines = stdout.trim().split("\n");
    const lastLine = lines[lines.length - 1];
    const parsed = JSON.parse(lastLine) as PartialCVResult;
    return parsed;
  } catch (err: any) {
    return {
      success: false,
      image_path: imagePath,
      image_found: false,
      detections: [],
      damage_model_loaded: false,
      severity_model_loaded: false,
      parts_model_status: "UNAVAILABLE_INVALID_CHECKPOINT",
      parts_model_note: "parts.pt is invalid/corrupted in external repository; parts detection bypassed.",
      error: `Bridge execution error: ${err.message}`,
      rawStderr: err.stderr,
    };
  }
}
