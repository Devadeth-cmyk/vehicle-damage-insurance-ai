import { execFile } from "child_process";
import { promisify } from "util";
import { AI_CONFIG, AIConnectivityCheckResult, checkAIFileSystemPaths } from "./config";

const execFileAsync = promisify(execFile);

/**
 * Performs a lightweight connectivity and import verification check:
 * 1. Checks that configured filesystem directories exist
 * 2. Checks Python runtime availability
 * 3. Checks that the inference directory can be placed on sys.path and basic inference modules can be imported
 *
 * NOTE: Model files and weights are NOT loaded in this step.
 */
export async function verifyAIConnectivity(): Promise<AIConnectivityCheckResult> {
  const fsCheck = checkAIFileSystemPaths();

  let pythonReachable = false;
  let pythonVersion: string | undefined;
  let executionError: string | undefined;

  if (!fsCheck.projectExists || !fsCheck.inferenceDirExists) {
    return {
      ok: false,
      projectPath: AI_CONFIG.projectPath,
      projectExists: fsCheck.projectExists,
      inferenceDirExists: fsCheck.inferenceDirExists,
      modelsDirExists: fsCheck.modelsDirExists,
      pythonExecutable: AI_CONFIG.pythonExecutable,
      pythonReachable: false,
      inferenceModules: fsCheck.inferenceModules,
      error: `Configured AI project path not found or unreachable: ${AI_CONFIG.projectPath}`,
    };
  }

  // 1. Test Python execution
  try {
    const { stdout: versionOut } = await execFileAsync(AI_CONFIG.pythonExecutable, ["--version"]);
    pythonReachable = true;
    pythonVersion = versionOut.trim();
  } catch (err: any) {
    return {
      ok: false,
      projectPath: AI_CONFIG.projectPath,
      projectExists: fsCheck.projectExists,
      inferenceDirExists: fsCheck.inferenceDirExists,
      modelsDirExists: fsCheck.modelsDirExists,
      pythonExecutable: AI_CONFIG.pythonExecutable,
      pythonReachable: false,
      inferenceModules: fsCheck.inferenceModules,
      error: `Python executable '${AI_CONFIG.pythonExecutable}' could not be executed: ${err.message}`,
    };
  }

  // 2. Test Python sys.path reachability of the inference package/directory
  // We only test importing Python file AST/module objects, NOT instantiating models
  const testScript = `
import sys
import os

ai_path = r"""${AI_CONFIG.projectPath}"""
if ai_path not in sys.path:
    sys.path.insert(0, ai_path)

import inference
print("INFERENCE_IMPORT_OK")
`;

  try {
    const { stdout, stderr } = await execFileAsync(AI_CONFIG.pythonExecutable, ["-c", testScript], {
      timeout: 5000,
    });

    const isOk = stdout.includes("INFERENCE_IMPORT_OK") && fsCheck.inferenceModules.every((m) => m.found);

    return {
      ok: isOk,
      projectPath: AI_CONFIG.projectPath,
      projectExists: fsCheck.projectExists,
      inferenceDirExists: fsCheck.inferenceDirExists,
      modelsDirExists: fsCheck.modelsDirExists,
      pythonExecutable: AI_CONFIG.pythonExecutable,
      pythonReachable: true,
      pythonVersion,
      inferenceModules: fsCheck.inferenceModules,
      error: stderr ? stderr.trim() : undefined,
    };
  } catch (err: any) {
    executionError = err.message;
    return {
      ok: false,
      projectPath: AI_CONFIG.projectPath,
      projectExists: fsCheck.projectExists,
      inferenceDirExists: fsCheck.inferenceDirExists,
      modelsDirExists: fsCheck.modelsDirExists,
      pythonExecutable: AI_CONFIG.pythonExecutable,
      pythonReachable: true,
      pythonVersion,
      inferenceModules: fsCheck.inferenceModules,
      error: `Failed to import inference package in Python: ${executionError}`,
    };
  }
}
