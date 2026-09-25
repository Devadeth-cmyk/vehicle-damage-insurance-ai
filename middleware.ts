import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { UserRole, AccountStatus } from "@/types/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isServiceCenterRoute = pathname.startsWith("/service-center");
  const isAdminRoute = pathname.startsWith("/admin");
  const isPendingStatusRoute = pathname.startsWith("/auth/pending-approval");
  const isRejectedStatusRoute = pathname.startsWith("/auth/rejected");

  // Only protect service-center, admin, and status routes
  if (!isServiceCenterRoute && !isAdminRoute && !isPendingStatusRoute && !isRejectedStatusRoute) {
    return NextResponse.next();
  }

  const session = await getSessionFromRequest(request);
  const user = session?.user;

  // 1. Unauthenticated users trying to access protected routes
  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Service Center Protected Routes (/service-center, /service-center/*)
  if (isServiceCenterRoute) {
    // If not a service_center account (e.g. customer)
    if (user.role === UserRole.CUSTOMER) {
      // Customer is denied access and redirected to customer home UI
      const homeUrl = new URL("/", request.url);
      homeUrl.searchParams.set("access_denied", "service_center_only");
      return NextResponse.redirect(homeUrl);
    }

    if (user.role === UserRole.ADMIN) {
      // Admin should go to admin dashboard
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    // Role is service_center - check approval status
    if (user.role === UserRole.SERVICE_CENTER) {
      if (user.status === AccountStatus.PENDING) {
        return NextResponse.redirect(new URL("/auth/pending-approval", request.url));
      }
      if (user.status === AccountStatus.REJECTED) {
        return NextResponse.redirect(new URL("/auth/rejected", request.url));
      }
      if (user.status === AccountStatus.APPROVED) {
        return NextResponse.next();
      }
    }

    // Fallback redirect
    return NextResponse.redirect(new URL("/", request.url));
  }

  // 3. Admin Protected Routes (/admin, /admin/*)
  if (isAdminRoute) {
    if (user.role !== UserRole.ADMIN || user.status !== AccountStatus.APPROVED) {
      // Non-admin attempting to access admin route
      const homeUrl = new URL("/", request.url);
      homeUrl.searchParams.set("access_denied", "admin_only");
      return NextResponse.redirect(homeUrl);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/service-center/:path*",
    "/admin/:path*",
    "/auth/pending-approval",
    "/auth/rejected",
  ],
};
