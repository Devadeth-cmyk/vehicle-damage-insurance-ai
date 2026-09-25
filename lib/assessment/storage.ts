import fs from "fs";
import path from "path";

// Local persistent evidence storage directory on the server
export const EVIDENCE_STORAGE_DIR = path.join(process.cwd(), "data", "assessment-evidence");

/**
 * Ensures the persistent storage directory exists for an assessment.
 */
export function getAssessmentEvidenceDir(assessmentId: string): string {
  const dir = path.join(EVIDENCE_STORAGE_DIR, assessmentId);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

/**
 * Saves an uploaded file buffer to the persistent evidence store.
 */
export async function saveAssessmentEvidenceFile(
  assessmentId: string,
  fileName: string,
  buffer: Buffer
): Promise<{ storedFileName: string; filePath: string }> {
  const dir = getAssessmentEvidenceDir(assessmentId);
  const cleanName = path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g, "_");
  const storedFileName = `${Date.now()}_${cleanName}`;
  const filePath = path.join(dir, storedFileName);
  fs.writeFileSync(filePath, buffer);
  return { storedFileName, filePath };
}

/**
 * Resolves the physical path of a stored evidence file safely preventing traversal.
 */
export function getStoredEvidenceFilePath(assessmentId: string, storedFileName: string): string | null {
  const cleanStoredName = path.basename(storedFileName);
  const filePath = path.join(EVIDENCE_STORAGE_DIR, assessmentId, cleanStoredName);
  if (fs.existsSync(filePath)) {
    return filePath;
  }
  return null;
}
