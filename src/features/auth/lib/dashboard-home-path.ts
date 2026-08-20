import type { UserRole } from "@/types/enums";

/**
 * Post-login / "Home" destination by role.
 * Admin and Doctor land on their desks; patients on the citizen dashboard.
 */
export function dashboardHomePath(role: UserRole): string {
  switch (role) {
    case "Admin":
      return "/dashboard/admin";
    case "Doctor":
      return "/dashboard/doctor";
    default:
      return "/dashboard";
  }
}
