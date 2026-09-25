import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { canAccessServiceCenter } from "@/lib/auth/authorization";
import { assessmentRepository } from "@/lib/assessment/repository";
import { getStoredEvidenceFilePath } from "@/lib/assessment/storage";
import fs from "fs";
import path from "path";

interface RouteParams {
  params: Promise<{
    id: string;
    imageId: string;
  }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id: assessmentId, imageId } = await params;

    // 1. Authentication and Authorization Check
    const user = await getCurrentUser();
    if (!user || (!canAccessServiceCenter(user) && user.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized access to evidence." }, { status: 401 });
    }

    // 2. Fetch assessment record and check ownership
    const record = await assessmentRepository.findById(assessmentId);
    if (!record || (user.role !== "admin" && record.serviceCenterId !== user.id)) {
      return NextResponse.json({ error: "Assessment evidence not found or access denied." }, { status: 404 });
    }

    // 3. Find matching image evidence
    const imageEvidence = record.images?.find((img) => img.id === imageId);
    if (!imageEvidence) {
      return NextResponse.json({ error: "Image record not found." }, { status: 404 });
    }

    // 4. Retrieve local persistent file
    const filePath = getStoredEvidenceFilePath(assessmentId, imageEvidence.storedFileName);
    if (!filePath || !fs.existsSync(filePath)) {
      return NextResponse.json({ error: "File not found on storage." }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);
    const ext = path.extname(imageEvidence.fileName).toLowerCase();
    let contentType = "image/jpeg";
    if (ext === ".png") contentType = "image/png";
    if (ext === ".webp") contentType = "image/webp";

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=86400",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: `Failed to load image: ${error.message}` }, { status: 500 });
  }
}
