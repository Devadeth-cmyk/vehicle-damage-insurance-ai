import { NextResponse } from "next/server";
import { clearSessionCookieOnResponse } from "@/lib/auth/session";

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: "Logged out successfully",
    redirectUrl: "/login",
  });

  clearSessionCookieOnResponse(response);
  return response;
}
