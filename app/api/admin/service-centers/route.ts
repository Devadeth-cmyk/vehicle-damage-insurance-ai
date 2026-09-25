import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { userRepository } from "@/lib/auth/repository";
import { UserRole, AccountStatus } from "@/types/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    // Strict Admin authorization check
    if (!user || user.role !== UserRole.ADMIN || user.status !== AccountStatus.APPROVED) {
      return NextResponse.json(
        { error: "Unauthorized: Administrator access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status") as AccountStatus | null;

    let filter: AccountStatus | undefined;
    if (statusParam && Object.values(AccountStatus).includes(statusParam)) {
      filter = statusParam;
    }

    const serviceCenters = await userRepository.listServiceCenters(filter);

    // Strip out sensitive password hashes before returning
    const safeServiceCenters = serviceCenters.map((sc) => {
      const copy = { ...sc };
      delete (copy as { passwordHash?: string }).passwordHash;
      delete (copy as { passwordSalt?: string }).passwordSalt;
      return copy;
    });

    return NextResponse.json({
      success: true,
      serviceCenters: safeServiceCenters,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to retrieve service centers";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
