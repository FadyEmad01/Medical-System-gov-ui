"use client";

import { useEffect } from "react";
import { useMe } from "@/features/auth/hooks/use-me";
import { dashboardHomePath } from "@/features/auth/lib/dashboard-home-path";
import { useRouter } from "@/i18n/navigation";

/**
 * Sends Admin/Doctor away from the citizen `/dashboard` shell to their desk.
 * Patients pass through unchanged.
 */
export function RoleHomeRedirect({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: user } = useMe();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    const home = dashboardHomePath(user.role);
    if (home !== "/dashboard") {
      router.replace(home);
    }
  }, [user, router]);

  if (user && dashboardHomePath(user.role) !== "/dashboard") {
    return (
      <div className="relative flex min-h-[220px] w-full items-end overflow-hidden rounded-xl bg-muted shadow-md animate-pulse" />
    );
  }

  return children;
}
