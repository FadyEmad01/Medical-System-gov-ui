import type { Metadata } from "next";
import { AdminGuard } from "@/components/role-guard";
import CategoriesPage from "@/features/insurance/admin/categories/components/categories-page";

export const metadata: Metadata = {
  title: "Insurance categories",
};

export default function Page() {
  return (
    <AdminGuard>
      <CategoriesPage />
    </AdminGuard>
  );
}
