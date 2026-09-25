import { getCurrentUser } from "@/lib/auth/session";
import { ScNavbar } from "@/components/service-center/sc-navbar";

export default async function ServiceCenterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Read the session once at layout level and pass user down to the client nav component.
  // Route protection is already enforced by middleware.ts — this is display only.
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <ScNavbar user={user} />
      <div className="flex-1 flex flex-col">{children}</div>
    </div>
  );
}
