import { UserRole, AccountStatus, SessionUser } from "@/types/auth";

/**
 * Checks if a session user has permission to access Service Center protected routes.
 * Strictly requires role === service_center AND status === approved.
 */
export function canAccessServiceCenter(user: SessionUser | null | undefined): boolean {
  if (!user) return false;
  return user.role === UserRole.SERVICE_CENTER && user.status === AccountStatus.APPROVED;
}

/**
 * Checks if a session user has permission to access Administrator protected routes.
 * Strictly requires role === admin AND status === approved.
 */
export function canAccessAdmin(user: SessionUser | null | undefined): boolean {
  if (!user) return false;
  return user.role === UserRole.ADMIN && user.status === AccountStatus.APPROVED;
}

/**
 * Checks if a session user has permission to access Customer routes.
 */
export function canAccessCustomer(user: SessionUser | null | undefined): boolean {
  if (!user) return false;
  return user.role === UserRole.CUSTOMER && user.status === AccountStatus.APPROVED;
}

/**
 * Determines where to redirect a user after successful authentication, based strictly
 * on their authenticated role and account status.
 */
export function getRedirectPathForUser(user: SessionUser): string {
  switch (user.role) {
    case UserRole.ADMIN:
      return "/admin";

    case UserRole.SERVICE_CENTER:
      if (user.status === AccountStatus.APPROVED) {
        return "/service-center";
      }
      if (user.status === AccountStatus.REJECTED) {
        return "/auth/rejected";
      }
      return "/auth/pending-approval";

    case UserRole.CUSTOMER:
    default:
      return "/";
  }
}
