import { execFile } from "child_process";
import { promisify } from "util";
import { AI_CONFIG } from "./config";

const execFileAsync = promisify(execFile);

export interface ClaimAnalyzerImportResult {
  success: boolean;
  className?: string;
  modulePath?: string;
  docstring?: string;
  pythonVersion?: string;
  error?: string;
}

export interface ClaimAnalyzerExecutionInput {
  claimId: string;
  imagePaths: string[];
  vehicleSegment?: "economy" | "mid" | "luxury" | string;
  damageModelPath?: string;
  partsModelPath?: string;
  severityModelPath?: string;
}

export interface ClaimDetection {
  damage_type: string;
  part: string;
  confidence: number;
  bbox?: number[];
  severity?: string;
}

export interface ClaimImageResult {
  image: string;
  status: string;
  detections: ClaimDetection[];
  repair_cost_estimate?: number;
  error?: string;
}

export interface ClaimAnalyzerExecutionResult {
  success: boolean;
  claimId: string;
  data?: {
    claim_id: string;
    vehicle_segment: string;
    images: ClaimImageResult[];
    total_repair_cost?: number;
    currency?: string;
    [key: string]: any;
  };
  stage?: "INIT" | "INFERENCE" | "OUTPUT_PARSING";
  error?: string;
  rawStderr?: string;
}

/**
 * Isolated bridge invocation that imports ClaimAnalyzer from claim_analyzer.py
 * using the configured external AI_PROJECT_PATH.
 *
 * NOTE: As required, this only imports the class to verify module syntax, dependencies,
 * and import-level reachability; it does NOT instantiate or load model weights.
 */
export async function testClaimAnalyzerImport(): Promise<ClaimAnalyzerImportResult> {
  const pythonScript = `
import sys
import json
import inspect

ai_project_path = r"""${AI_CONFIG.projectPath}"""
inference_path = r"""${AI_CONFIG.inferencePath}"""

# Ensure both project root and inference folder are in sys.path
for p in [ai_project_path, inference_path]:
    if p not in sys.path:
        sys.path.insert(0, p)

try:
    from claim_analyzer import ClaimAnalyzer
    result = {
        "success": True,
        "className": ClaimAnalyzer.__name__,
        "modulePath": getattr(ClaimAnalyzer, "__module__", "claim_analyzer"),
        "docstring": (ClaimAnalyzer.__doc__ or "").strip(),
        "pythonVersion": sys.version.split()[0]
    }
    print(json.dumps(result))
except Exception as e:
    result = {
        "success": False,
        "error": str(e),
        "pythonVersion": sys.version.split()[0]
    }
    print(json.dumps(result))
`;

  try {
    const { stdout, stderr } = await execFileAsync(
      AI_CONFIG.pythonExecutable,
      ["-c", pythonScript],
      {
        timeout: 10000,
        env: {
          ...process.env,
          PYTHONPATH: `${AI_CONFIG.projectPath};${AI_CONFIG.inferencePath}`,
        },
      }
    );

    const lines = stdout.trim().split("\n");
    const lastLine = lines[lines.length - 1];
    const parsed = JSON.parse(lastLine) as ClaimAnalyzerImportResult;
    return parsed;
  } catch (err: any) {
    return {
      success: false,
      error: `Bridge process failed: ${err.message}`,
    };
  }
}

/**
 * Executes the external ClaimAnalyzer pipeline:
 * 1. Resolves model paths
 * 2. Initializes ClaimAnalyzer(damage_model, parts_model, severity_model)
 * 3. Calls analyzer.analyze_claim(claim_id, image_paths, vehicle_segment)
 * 4. Returns JSON-structured results or captures initialization/inference errors cleanly.
 */
export async function executeClaimAnalyzer(
  input: ClaimAnalyzerExecutionInput
): Promise<ClaimAnalyzerExecutionResult> {
  const damageModel = input.damageModelPath || AI_CONFIG.damageModelPath;
  const partsModel = input.partsModelPath || AI_CONFIG.partsModelPath;
  const severityModel = input.severityModelPath || AI_CONFIG.severityModelPath;
  const segment = input.vehicleSegment || "economy";

  const runnerPayload = {
    claim_id: input.claimId,
    image_paths: input.imagePaths,
    vehicle_segment: segment,
    damage_model_path: damageModel,
    parts_model_path: partsModel,
    severity_model_path: severityModel,
    ai_project_path: AI_CONFIG.projectPath,
    inference_path: AI_CONFIG.inferencePath,
  };

  const pythonRunnerScript = `
import sys
import json
import traceback

payload = json.loads(sys.argv[1])

# Configure sys.path
for p in [payload["ai_project_path"], payload["inference_path"]]:
    if p not in sys.path:
        sys.path.insert(0, p)

try:
    from claim_analyzer import ClaimAnalyzer
except Exception as e:
    print(json.dumps({
        "success": False,
        "stage": "INIT",
        "error": f"Failed to import ClaimAnalyzer: {str(e)}",
        "traceback": traceback.format_exc()
    }))
    sys.exit(0)

# 1. Initialize ClaimAnalyzer with models
try:
    analyzer = ClaimAnalyzer(
        damage_model_path=payload["damage_model_path"],
        parts_model_path=payload["parts_model_path"],
        severity_model_path=payload.get("severity_model_path")
    )
except Exception as e:
    print(json.dumps({
        "success": False,
        "stage": "INIT",
        "error": f"ClaimAnalyzer model initialization failed: {str(e)}",
        "traceback": traceback.format_exc()
    }))
    sys.exit(0)

# 2. Run analyze_claim
try:
    claim_results = analyzer.analyze_claim(
        claim_id=payload["claim_id"],
        image_paths=payload["image_paths"],
        vehicle_segment=payload["vehicle_segment"]
    )
    print(json.dumps({
        "success": True,
        "stage": "INFERENCE",
        "data": claim_results
    }))
except Exception as e:
    print(json.dumps({
        "success": False,
        "stage": "INFERENCE",
        "error": f"Claim analysis execution failed: {str(e)}",
        "traceback": traceback.format_exc()
    }))
    sys.exit(0)
`;

  try {
    const { stdout, stderr } = await execFileAsync(
      AI_CONFIG.pythonExecutable,
      ["-c", pythonRunnerScript, JSON.stringify(runnerPayload)],
      {
        timeout: 60000,
        env: {
          ...process.env,
          PYTHONPATH: `${AI_CONFIG.projectPath};${AI_CONFIG.inferencePath}`,
        },
      }
    );

    const trimmedOut = stdout.trim();
    if (!trimmedOut) {
      return {
        success: false,
        claimId: input.claimId,
        stage: "OUTPUT_PARSING",
        error: "Python process finished without output",
        rawStderr: stderr,
      };
    }

    const lines = trimmedOut.split("\n");
    const lastLine = lines[lines.length - 1];
    const parsed = JSON.parse(lastLine);

    if (!parsed.success) {
      return {
        success: false,
        claimId: input.claimId,
        stage: parsed.stage || "INIT",
        error: parsed.error,
        rawStderr: parsed.traceback || stderr,
      };
    }

    return {
      success: true,
      claimId: input.claimId,
      stage: "INFERENCE",
      data: parsed.data,
    };
  } catch (err: any) {
    return {
      success: false,
      claimId: input.claimId,
      stage: "INIT",
      error: `Bridge execution error: ${err.message}`,
      rawStderr: err.stderr,
    };
  }
}

