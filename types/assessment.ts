import { PartialCVDetection } from "@/lib/ai/partial-cv-bridge";

export interface DamagePhoto {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
  size: number;
}

export interface PolicyDocument {
  name: string;
  size: number;
  type: string;
}

export interface NewAssessmentFormData {
  // Step 1: Customer Details
  customerName: string;
  phoneNumber: string;
  emailAddress: string;
  address: string;

  // Step 2: Vehicle Details
  registrationNumber: string;
  manufacturer: string;
  model: string;
  manufacturingYear: string;
  vehicleType: string;

  // Step 3: Policy Details
  policyNumber: string;
  insuranceCompany: string;
  policyType: string;
  policyStartDate: string;
  policyExpiryDate: string;
  coverageType: string;
  policyDocument?: PolicyDocument | null;

  // Step 4: Damage Photos
  damagePhotos: DamagePhoto[];

  // Step 5: AI-Identified Damage Details (Placeholders/Configs)
  aiInspectionRequested: boolean;

  // Step 6: Additional Damage / Information
  additionalDamage: string;
  otherRelevantInformation: string;
}

export type AssessmentStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type AssessmentStatus = "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";

export interface AssessmentImageEvidence {
  id: string;
  fileName: string;
  url: string; // Secure API route URL, e.g. /api/service-center/assessments/[id]/images/[imageId]
  size: number;
  mimeType: string;
  storedFileName: string;
}

export interface ImageAssessmentResult {
  imageName: string;
  imageId?: string;
  imageUrl?: string;
  detections: PartialCVDetection[];
  status: string;
  error?: string;
}

export interface AssessmentRecord {
  id: string;
  serviceCenterId: string;
  status: AssessmentStatus;
  createdAt: string;
  updatedAt: string;
  images: AssessmentImageEvidence[];
  customer: {
    name: string;
    phone: string;
    email: string;
    address: string;
  };
  vehicle: {
    registrationNumber: string;
    manufacturer: string;
    model: string;
    year: string;
    type: string;
  };
  policy: {
    policyNumber: string;
    insuranceCompany: string;
    policyType: string;
    startDate: string;
    expiryDate: string;
    coverageType: string;
  };
  additionalNotes: {
    additionalDamage: string;
    otherRelevantInformation: string;
  };
  aiAnalysis: {
    enabled: boolean;
    damageModelLoaded: boolean;
    severityModelLoaded: boolean;
    partsModelStatus: "UNAVAILABLE_INVALID_CHECKPOINT";
    partsModelNote: string;
    totalDetectionsCount: number;
    imagesProcessed: number;
    results: ImageAssessmentResult[];
  };
}

export interface AssessmentGenerationResponse {
  success: boolean;
  assessmentId: string;
  status: AssessmentStatus;
  createdAt: string;
  images: AssessmentImageEvidence[];
  customer: {
    name: string;
    phone: string;
    email: string;
    address: string;
  };
  vehicle: {
    registrationNumber: string;
    manufacturer: string;
    model: string;
    year: string;
    type: string;
  };
  policy: {
    policyNumber: string;
    insuranceCompany: string;
    policyType: string;
    startDate: string;
    expiryDate: string;
    coverageType: string;
  };
  additionalNotes: {
    additionalDamage: string;
    otherRelevantInformation: string;
  };
  aiAnalysis: {
    enabled: boolean;
    damageModelLoaded: boolean;
    severityModelLoaded: boolean;
    partsModelStatus: "UNAVAILABLE_INVALID_CHECKPOINT";
    partsModelNote: string;
    totalDetectionsCount: number;
    imagesProcessed: number;
    results: ImageAssessmentResult[];
  };
  error?: string;
}
