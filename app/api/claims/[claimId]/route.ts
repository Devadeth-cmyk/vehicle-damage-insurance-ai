import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

const DATA_DIR = path.join(process.cwd(), "data");
const CLAIMS_FILE = path.join(DATA_DIR, "claims.json");

export async function GET(
  _request: Request,
  context: {
    params: Promise<{
      claimId: string;
    }>;
  }
) {
  try {
    const { claimId } = await context.params;

    if (!fs.existsSync(CLAIMS_FILE)) {
      return NextResponse.json(
        {
          error: "Claims database not found.",
        },
        { status: 404 }
      );
    }

    const raw = fs.readFileSync(
      CLAIMS_FILE,
      "utf8"
    );

    const claims = JSON.parse(raw);

    if (!Array.isArray(claims)) {
      return NextResponse.json(
        {
          error: "Invalid claims database.",
        },
        { status: 500 }
      );
    }

    const claim = claims.find(
      (item) => item?.id === claimId
    );

    if (!claim) {
      return NextResponse.json(
        {
          error: "Claim not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      claim,
    });
  } catch (error) {
    console.error(
      "Claim retrieval error:",
      error
    );

    return NextResponse.json(
      {
        error: "Unable to retrieve claim.",
      },
      { status: 500 }
    );
  }
}