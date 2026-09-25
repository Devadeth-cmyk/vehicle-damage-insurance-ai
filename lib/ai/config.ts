import path from "path";
import fs from "fs";

/**
 * AI Integration Configuration
 * Resolves the external AI project paths centrally from environment variables.
 */
export const AI_CONFIG = {
  get projectPath(): string {
    return process.env.AI_PROJECT_PATH || "E:\\ICT_Offline\\vehicle-damage-insurance-ai";
  },
  get pythonExecutable(): string {
    return process.env.PYTHON_EXECUTABLE || "python";
  },
  get inferencePath(): string {
    return path.join(this.projectPath, "inference");
  },
  get modelsPath(): string {
    return path.join(this.projectPath, "models");
  },
  get damageModelPath(): string {
    return process.env.DAMAGE_MODEL_PATH || path.join(this.modelsPath, "damage", "best.pt");
  },
  get partsModelPath(): string {
    return process.env.PARTS_MODEL_PATH || path.join(this.modelsPath, "parts", "parts.pt");
  },
  get severityModelPath(): string {
    return process.env.SEVERITY_MODEL_PATH || path.join(this.modelsPath, "severity", "best.pt");
  },
  get scriptsPath(): string {
    return path.join(this.projectPath, "scripts");
  },
  get metadataPath(): string {
    return path.join(this.projectPath, "metadata");
  },
};

export interface AIConnectivityCheckResult {
  ok: boolean;
  projectPath: string;
  projectExists: boolean;
  inferenceDirExists: boolean;
  modelsDirExists: boolean;
  pythonExecutable: string;
  pythonReachable: boolean;
  pythonVersion?: string;
  inferenceModules: {
    name: string;
    found: boolean;
  }[];
  error?: string;
}

/**
 * Checks file system connectivity and path existence for the external AI project.
 * Does NOT attempt to load heavyweight weights or instantiate models.
 */
export function checkAIFileSystemPaths(): {
  projectExists: boolean;
  inferenceDirExists: boolean;
  modelsDirExists: boolean;
  inferenceModules: { name: string; found: boolean }[];
} {
  const projectExists = fs.existsSync(AI_CONFIG.projectPath);
  const inferenceDirExists = fs.existsSync(AI_CONFIG.inferencePath);
  const modelsDirExists = fs.existsSync(AI_CONFIG.modelsPath);

  const requiredModules = [
    "claim_analyzer.py",
    "damage_detector.py",
    "parts_detector.py",
    "severity_detector.py",
    "severity_estimator.py",
    "repair_estimator.py",
    "fusion.py",
    "visualize.py",
  ];

  const inferenceModules = requiredModules.map((mod) => ({
    name: mod,
    found: inferenceDirExists && fs.existsSync(path.join(AI_CONFIG.inferencePath, mod)),
  }));

  return {
    projectExists,
    inferenceDirExists,
    modelsDirExists,
    inferenceModules,
  };
}
