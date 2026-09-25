import { NextRequest, NextResponse } from "next/server";
import { userRepository } from "@/lib/auth/repository";
import { verifyPassword } from "@/lib/auth/password";
import { createSessionToken, setSessionCookieOnResponse } from "@/lib/auth/session";
import { getRedirectPathForUser } from "@/lib/auth/authorization";
import { SessionUser } from "@/types/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = await userRepository.findByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const isValidPassword = verifyPassword(password, user.passwordHash, user.passwordSalt);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const sessionUser: SessionUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      serviceCenterName: user.serviceCenterProfile?.serviceCenterName,
    };

    const token = await createSessionToken(sessionUser);
    const redirectUrl = getRedirectPathForUser(sessionUser);

    const response = NextResponse.json({
      success: true,
      message: "Authenticated successfully",
      user: sessionUser,
      redirectUrl,
    });

    setSessionCookieOnResponse(response, token);
    return response;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal authentication error";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
