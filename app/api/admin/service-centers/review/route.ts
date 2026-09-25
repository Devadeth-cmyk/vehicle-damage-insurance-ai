import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { userRepository } from "@/lib/auth/repository";
import { UserRole, AccountStatus } from "@/types/auth";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    // Strict Admin authorization check
    if (!user || user.role !== UserRole.ADMIN || user.status !== AccountStatus.APPROVED) {
      return NextResponse.json(
        { error: "Unauthorized: Administrator access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, status, rejectionReason } = body;

    if (!userId || !status) {
      return NextResponse.json(
        { error: "User ID and status (approved/rejected) are required" },
        { status: 400 }
      );
    }

    if (status !== AccountStatus.APPROVED && status !== AccountStatus.REJECTED) {
      return NextResponse.json(
        { error: "Invalid status. Must be 'approved' or 'rejected'" },
        { status: 400 }
      );
    }

    const updatedUser = await userRepository.updateServiceCenterStatus(
      userId,
      status,
      user.id,
      rejectionReason
    );

    if (!updatedUser) {
      return NextResponse.json(
        { error: "Service center account not found" },
        { status: 404 }
      );
    }

    const safeUser = { ...updatedUser };
    delete (safeUser as { passwordHash?: string }).passwordHash;
    delete (safeUser as { passwordSalt?: string }).passwordSalt;

    return NextResponse.json({
      success: true,
      message: `Service center request has been ${status}`,
      user: safeUser,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to update service center status";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
