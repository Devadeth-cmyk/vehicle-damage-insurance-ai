import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { canAccessServiceCenter } from "@/lib/auth/authorization";
import { executePartialCVInference } from "@/lib/ai/partial-cv-bridge";
import { assessmentRepository } from "@/lib/assessment/repository";
import {
  AssessmentGenerationResponse,
  AssessmentRecord,
  AssessmentImageEvidence,
  ImageAssessmentResult,
} from "@/types/assessment";
import fs from "fs";
import path from "path";
import os from "os";

export async function POST(req: NextRequest) {
  try {
    // 1. Role and Authentication Check
    const user = await getCurrentUser();
    if (!user || !canAccessServiceCenter(user)) {
      return NextResponse.json(
        { error: "Unauthorized. Service center access required." },
        { status: 401 }
      );
    }

    // 2. Parse Multipart Form Data
    const formData = await req.formData();

    const customerName = (formData.get("customerName") as string) || "";
    const phoneNumber = (formData.get("phoneNumber") as string) || "";
    const emailAddress = (formData.get("emailAddress") as string) || "";
    const address = (formData.get("address") as string) || "";

    const registrationNumber = (formData.get("registrationNumber") as string) || "";
    const manufacturer = (formData.get("manufacturer") as string) || "";
    const model = (formData.get("model") as string) || "";
    const manufacturingYear = (formData.get("manufacturingYear") as string) || "";
    const vehicleType = (formData.get("vehicleType") as string) || "";

    const policyNumber = (formData.get("policyNumber") as string) || "";
    const insuranceCompany = (formData.get("insuranceCompany") as string) || "";
    const policyType = (formData.get("policyType") as string) || "";
    const policyStartDate = (formData.get("policyStartDate") as string) || "";
    const policyExpiryDate = (formData.get("policyExpiryDate") as string) || "";
    const coverageType = (formData.get("coverageType") as string) || "";

    const additionalDamage = (formData.get("additionalDamage") as string) || "";
    const otherRelevantInformation = (formData.get("otherRelevantInformation") as string) || "";
    const aiInspectionRequested = formData.get("aiInspectionRequested") === "true";

    // Extract images
    const files = formData.getAll("photos") as File[];

    const assessmentId = `ASM-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const tempDir = path.join(os.tmpdir(), "autoinsight_assessments", assessmentId);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const imageResults: ImageAssessmentResult[] = [];
    const persistedImages: AssessmentImageEvidence[] = [];
    let damageModelLoaded = false;
    let severityModelLoaded = false;
    let totalDetections = 0;

    // 3. Process each image if AI analysis is requested
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file || typeof file === "string" || !file.name) continue;

      const imageId = `IMG-${(i + 1).toString().padStart(2, "0")}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const safeFilename = `photo_${i + 1}_${path.basename(file.name).replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const tempFilePath = path.join(tempDir, safeFilename);

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // A. Save to isolated temporary directory for Python AI CV model inference
      fs.writeFileSync(tempFilePath, buffer);

      // B. Save to persistent assessment evidence storage
      const evidenceDir = path.join(process.cwd(), "data", "assessment-evidence", assessmentId);
      if (!fs.existsSync(evidenceDir)) {
        fs.mkdirSync(evidenceDir, { recursive: true });
      }
      const storedFileName = `${Date.now()}_${safeFilename}`;
      const persistentFilePath = path.join(evidenceDir, storedFileName);
      fs.writeFileSync(persistentFilePath, buffer);

      const secureUrl = `/api/service-center/assessments/${assessmentId}/images/${imageId}`;

      const evidenceItem: AssessmentImageEvidence = {
        id: imageId,
        fileName: file.name,
        url: secureUrl,
        size: file.size,
        mimeType: file.type || "image/jpeg",
        storedFileName,
      };
      persistedImages.push(evidenceItem);

      if (aiInspectionRequested) {
        try {
          const cvResult = await executePartialCVInference(tempFilePath);
          if (cvResult.damage_model_loaded) damageModelLoaded = true;
          if (cvResult.severity_model_loaded) severityModelLoaded = true;

          totalDetections += cvResult.detections.length;
          imageResults.push({
            imageName: file.name,
            imageId,
            imageUrl: secureUrl,
            detections: cvResult.detections,
            status: cvResult.success ? "PROCESSED" : "ERROR",
            error: cvResult.error,
          });
        } catch (err: any) {
          imageResults.push({
            imageName: file.name,
            imageId,
            imageUrl: secureUrl,
            detections: [],
            status: "ERROR",
            error: err.message,
          });
        }
      } else {
        imageResults.push({
          imageName: file.name,
          imageId,
          imageUrl: secureUrl,
          detections: [],
          status: "SKIPPED_AI_DISABLED",
        });
      }

      // Cleanup individual temp file
      try {
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      } catch {
        // ignore cleanup errors
      }
    }

    // Cleanup temp folder
    try {
      if (fs.existsSync(tempDir)) {
        fs.rmdirSync(tempDir);
      }
    } catch {
      // ignore
    }

    const timestamp = new Date().toISOString();

    const recordToSave: AssessmentRecord = {
      id: assessmentId,
      serviceCenterId: user.id,
      status: "SUBMITTED",
      createdAt: timestamp,
      updatedAt: timestamp,
      images: persistedImages,
      customer: {
        name: customerName,
        phone: phoneNumber,
        email: emailAddress,
        address,
      },
      vehicle: {
        registrationNumber,
        manufacturer,
        model,
        year: manufacturingYear,
        type: vehicleType,
      },
      policy: {
        policyNumber,
        insuranceCompany,
        policyType,
        startDate: policyStartDate,
        expiryDate: policyExpiryDate,
        coverageType,
      },
      additionalNotes: {
        additionalDamage,
        otherRelevantInformation,
      },
      aiAnalysis: {
        enabled: aiInspectionRequested,
        damageModelLoaded,
        severityModelLoaded,
        partsModelStatus: "UNAVAILABLE_INVALID_CHECKPOINT",
        partsModelNote: "parts.pt in external repository is invalid/corrupted (1 byte). Parts segmentation is currently bypassed.",
        totalDetectionsCount: totalDetections,
        imagesProcessed: imageResults.length,
        results: imageResults,
      },
    };

    // Persist assessment record in repository
    const savedRecord = await assessmentRepository.createAssessment(recordToSave);

    const responseData: AssessmentGenerationResponse = {
      success: true,
      assessmentId: savedRecord.id,
      status: savedRecord.status,
      createdAt: savedRecord.createdAt,
      images: savedRecord.images,
      customer: savedRecord.customer,
      vehicle: savedRecord.vehicle,
      policy: savedRecord.policy,
      additionalNotes: savedRecord.additionalNotes,
      aiAnalysis: savedRecord.aiAnalysis,
    };

    return NextResponse.json(responseData);
  } catch (error: any) {
    return NextResponse.json(
      { error: `Assessment generation failed: ${error.message}` },
      { status: 500 }
    );
  }
}
