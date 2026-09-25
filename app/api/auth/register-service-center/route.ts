import { NextRequest, NextResponse } from "next/server";
import { userRepository } from "@/lib/auth/repository";
import { createSessionToken, setSessionCookieOnResponse } from "@/lib/auth/session";
import { SessionUser } from "@/types/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      serviceCenterName,
      contactPerson,
      businessEmail,
      phone,
      address,
      registrationNumber,
      supportingDocumentName,
      supportingDocumentData,
      password,
    } = body;

    // Validation
    if (
      !serviceCenterName ||
      !contactPerson ||
      !businessEmail ||
      !phone ||
      !address ||
      !registrationNumber ||
      !password
    ) {
      return NextResponse.json(
        { error: "All required registration fields must be provided" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    const newUser = await userRepository.createServiceCenterRequest({
      serviceCenterName,
      contactPerson,
      businessEmail,
      phone,
      address,
      registrationNumber,
      supportingDocumentName: supportingDocumentName || "business_registration_doc.pdf",
      supportingDocumentData,
      password,
    });

    const sessionUser: SessionUser = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      status: newUser.status, // Strictly PENDING
      serviceCenterName: newUser.serviceCenterProfile?.serviceCenterName,
    };

    const token = await createSessionToken(sessionUser);
    const response = NextResponse.json({
      success: true,
      message: "Service Center registration request submitted successfully and is pending administrator review.",
      user: sessionUser,
      redirectUrl: "/auth/pending-approval",
    });

    setSessionCookieOnResponse(response, token);
    return response;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to submit service center application";
    return NextResponse.json({ error: errorMsg }, { status: 400 });
  }
}
