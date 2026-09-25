import { NextRequest, NextResponse } from "next/server";
import { userRepository } from "@/lib/auth/repository";
import { createSessionToken, setSessionCookieOnResponse } from "@/lib/auth/session";
import { SessionUser } from "@/types/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, phone } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const newUser = await userRepository.createCustomer({
      name,
      email,
      password,
      phone,
    });

    const sessionUser: SessionUser = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      status: newUser.status,
    };

    const token = await createSessionToken(sessionUser);
    const response = NextResponse.json({
      success: true,
      message: "Customer account created successfully",
      user: sessionUser,
      redirectUrl: "/",
    });

    setSessionCookieOnResponse(response, token);
    return response;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to create account";
    return NextResponse.json({ error: errorMsg }, { status: 400 });
  }
}
