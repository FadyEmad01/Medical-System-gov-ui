import { AdminGuard } from "@/components/role-guard";
import { AdminHomeContent } from "@/features/admin/components/admin-home-content";

export default function AdminHomePage() {
  return (
    <AdminGuard>
      <AdminHomeContent />
    </AdminGuard>
  );
}
