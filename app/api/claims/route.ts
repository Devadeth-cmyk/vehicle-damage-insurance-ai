import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

const DATA_DIR = path.join(process.cwd(), "data");
const CLAIMS_DIR = path.join(DATA_DIR, "claims");
const CLAIMS_FILE = path.join(DATA_DIR, "claims.json");

const AI_API_URL =
  process.env.AUTOINSIGHT_AI_API_URL ||
  "http://127.0.0.1:8001";

type ClaimPayload = {
  registrationNumber: string;
  manufacturer: string;
  model: string;
  manufacturingYear: string;

  accidentDate: string;
  accidentTime: string;
  location: string;
  incidentType: string;
  damageDescription: string;
  incidentDetails: string;

  policyNumber: string;
  insuranceCompany: string;
  policyType: string;
  policyStartDate: string;
  policyExpiryDate: string;
  coverageType: string;

  additionalInformation: string;
  injuries: string;
  policeReport: string;
};

type StoredImage = {
  id: string;
  fileName: string;
  storedFileName: string;
  mimeType: string;
  size: number;
};

type ClaimRecord = {
  id: string;
  status: string;
  createdAt: string;
  updatedAt: string;

  customer: {
    registrationNumber: string;
  };

  vehicle: {
    registrationNumber: string;
    manufacturer: string;
    model: string;
    manufacturingYear: string;
  };

  incident: {
    accidentDate: string;
    accidentTime: string;
    location: string;
    incidentType: string;
    damageDescription: string;
    incidentDetails: string;
  };

  policy: {
    policyNumber: string;
    insuranceCompany: string;
    policyType: string;
    policyStartDate: string;
    policyExpiryDate: string;
    coverageType: string;
  };

  additionalInformation: {
    injuries: string;
    policeReport: string;
    notes: string;
  };

  evidence: {
    images: StoredImage[];
    imageCount: number;
  };

  aiAssessment: {
    status: string;

    computerVision: {
      status: string;
      models?: {
        damage: string;
        severity: string;
        parts: string;
      };
      result?: unknown;
      error?: string;
    };

    nlp: {
      status: string;
    };

    evidenceComparison: {
      status: string;
    };

    missingEvidence: {
      status: string;
    };

    rag: {
      status: string;
    };

    llm: {
      status: string;
    };
  };

  review: {
    status: string;
    reviewer: string | null;
    decision: string | null;
  };
};

function ensureStorage() {
  fs.mkdirSync(CLAIMS_DIR, { recursive: true });

  if (!fs.existsSync(CLAIMS_FILE)) {
    fs.writeFileSync(CLAIMS_FILE, "[]", "utf8");
  }
}

function readClaims(): ClaimRecord[] {
  ensureStorage();

  try {
    const raw = fs.readFileSync(
      CLAIMS_FILE,
      "utf8"
    );

    const parsed = JSON.parse(raw);

    return Array.isArray(parsed)
      ? (parsed as ClaimRecord[])
      : [];
  } catch {
    return [];
  }
}

function saveClaims(claims: ClaimRecord[]) {
  ensureStorage();

  fs.writeFileSync(
    CLAIMS_FILE,
    JSON.stringify(claims, null, 2),
    "utf8"
  );
}

function updateClaim(
  claimId: string,
  updater: (claim: ClaimRecord) => void
) {
  const claims = readClaims();

  const claim = claims.find(
    (item) => item.id === claimId
  );

  if (!claim) {
    return false;
  }

  updater(claim);

  claim.updatedAt =
    new Date().toISOString();

  saveClaims(claims);

  return true;
}

async function runComputerVision(
  claimId: string,
  imagePaths: string[],
  vehicleSegment = "economy"
) {
  const response = await fetch(
    `${AI_API_URL}/analyze`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        claim_id: claimId,
        image_paths: imagePaths,
        vehicle_segment: vehicleSegment,
      }),
    }
  );

  const responseText =
    await response.text();

  let data: unknown = null;

  try {
    data = JSON.parse(responseText);
  } catch {
    data = {
      raw: responseText,
    };
  }

  if (!response.ok) {
    throw new Error(
      `AI service returned ${response.status}: ${JSON.stringify(
        data
      )}`
    );
  }

  return data as {
    success: boolean;
    models?: {
      damage: string;
      severity: string;
      parts: string;
    };
    result?: unknown;
  };
}

export async function POST(request: Request) {
  try {
    const formData =
      await request.formData();

    const claimRaw =
      formData.get("claim");

    if (typeof claimRaw !== "string") {
      return NextResponse.json(
        {
          error:
            "Claim information is missing.",
        },
        { status: 400 }
      );
    }

    let claimData: ClaimPayload;

    try {
      claimData =
        JSON.parse(claimRaw) as ClaimPayload;
    } catch {
      return NextResponse.json(
        {
          error:
            "Invalid claim information.",
        },
        { status: 400 }
      );
    }

    if (
      !claimData.registrationNumber ||
      !claimData.manufacturer ||
      !claimData.model ||
      !claimData.damageDescription
    ) {
      return NextResponse.json(
        {
          error:
            "Vehicle and damage information are required.",
        },
        { status: 400 }
      );
    }

    const claimId =
      `CLM-${randomUUID()
        .replaceAll("-", "")
        .slice(0, 10)
        .toUpperCase()}`;

    const claimDirectory =
      path.join(
        CLAIMS_DIR,
        claimId
      );

    fs.mkdirSync(
      claimDirectory,
      {
        recursive: true,
      }
    );

    const images: StoredImage[] =
      [];

    const uploadedImages =
      formData.getAll("images");

    for (const item of uploadedImages) {
      if (!(item instanceof File)) {
        continue;
      }

      if (
        !item.type.startsWith(
          "image/"
        )
      ) {
        continue;
      }

      const imageId =
        randomUUID();

      const extension =
        path.extname(item.name) ||
        ".jpg";

      const storedFileName =
        `${imageId}${extension}`;

      const imagePath =
        path.join(
          claimDirectory,
          storedFileName
        );

      const buffer =
        Buffer.from(
          await item.arrayBuffer()
        );

      fs.writeFileSync(
        imagePath,
        buffer
      );

      images.push({
        id: imageId,
        fileName: item.name,
        storedFileName,
        mimeType: item.type,
        size: item.size,
      });
    }

    if (images.length === 0) {
      return NextResponse.json(
        {
          error:
            "At least one vehicle damage image is required.",
        },
        { status: 400 }
      );
    }

    const now =
      new Date().toISOString();

    const claim: ClaimRecord = {
      id: claimId,

      status: "SUBMITTED",

      createdAt: now,
      updatedAt: now,

      customer: {
        registrationNumber:
          claimData.registrationNumber,
      },

      vehicle: {
        registrationNumber:
          claimData.registrationNumber,

        manufacturer:
          claimData.manufacturer,

        model:
          claimData.model,

        manufacturingYear:
          claimData.manufacturingYear,
      },

      incident: {
        accidentDate:
          claimData.accidentDate,

        accidentTime:
          claimData.accidentTime,

        location:
          claimData.location,

        incidentType:
          claimData.incidentType,

        damageDescription:
          claimData.damageDescription,

        incidentDetails:
          claimData.incidentDetails,
      },

      policy: {
        policyNumber:
          claimData.policyNumber,

        insuranceCompany:
          claimData.insuranceCompany,

        policyType:
          claimData.policyType,

        policyStartDate:
          claimData.policyStartDate,

        policyExpiryDate:
          claimData.policyExpiryDate,

        coverageType:
          claimData.coverageType,
      },

      additionalInformation: {
        injuries:
          claimData.injuries,

        policeReport:
          claimData.policeReport,

        notes:
          claimData.additionalInformation,
      },

      evidence: {
        images,
        imageCount:
          images.length,
      },

      aiAssessment: {
        status: "QUEUED",

        computerVision: {
          status: "PENDING",
        },

        nlp: {
          status: "PENDING",
        },

        evidenceComparison: {
          status: "PENDING",
        },

        missingEvidence: {
          status: "PENDING",
        },

        rag: {
          status: "PENDING",
        },

        llm: {
          status: "PENDING",
        },
      },

      review: {
        status:
          "WAITING_FOR_SERVICE_CENTER",

        reviewer: null,
        decision: null,
      },
    };

    // -----------------------------------------------------
    // Save claim before starting AI
    // -----------------------------------------------------

    const claims =
      readClaims();

    claims.push(claim);

    saveClaims(claims);

    // -----------------------------------------------------
    // Prepare absolute image paths
    // -----------------------------------------------------

    const imagePaths =
      images.map(
        (image) =>
          path.join(
            claimDirectory,
            image.storedFileName
          )
      );

    // -----------------------------------------------------
    // Run Computer Vision
    // -----------------------------------------------------

    updateClaim(
      claimId,
      (storedClaim) => {
        storedClaim.status =
          "ASSESSMENT_IN_PROGRESS";

        storedClaim.aiAssessment.status =
          "RUNNING";

        storedClaim.aiAssessment.computerVision.status =
          "RUNNING";
      }
    );

    try {
      const aiResponse =
        await runComputerVision(
          claimId,
          imagePaths,
          "economy"
        );

      updateClaim(
        claimId,
        (storedClaim) => {
          storedClaim.status =
            "AI_ASSESSMENT_COMPLETED";

          storedClaim.aiAssessment.status =
            "COMPLETED";

          storedClaim.aiAssessment.computerVision.status =
            "COMPLETED";

          storedClaim.aiAssessment.computerVision.models =
            aiResponse.models;

          storedClaim.aiAssessment.computerVision.result =
            aiResponse.result;
        }
      );
    } catch (aiError) {
      console.error(
        `AI analysis failed for ${claimId}:`,
        aiError
      );

      updateClaim(
        claimId,
        (storedClaim) => {
          storedClaim.status =
            "SUBMITTED";

          storedClaim.aiAssessment.status =
            "AI_SERVICE_UNAVAILABLE";

          storedClaim.aiAssessment.computerVision.status =
            "FAILED";

          storedClaim.aiAssessment.computerVision.error =
            aiError instanceof Error
              ? aiError.message
              : String(aiError);
        }
      );

      // Claim itself is still successfully submitted.
      return NextResponse.json(
        {
          success: true,
          claimId,
          status: "SUBMITTED",
          aiStatus:
            "AI_SERVICE_UNAVAILABLE",
          message:
            "Claim submitted successfully. AI assessment could not be completed.",
        },
        { status: 201 }
      );
    }

    // -----------------------------------------------------
    // Return successful submission
    // -----------------------------------------------------

    return NextResponse.json(
      {
        success: true,
        claimId,
        status:
          "AI_ASSESSMENT_COMPLETED",
        aiStatus: "COMPLETED",
        message:
          "Claim submitted and AI assessment completed.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Claim submission error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to submit the claim.",
      },
      { status: 500 }
    );
  }
}