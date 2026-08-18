import type { Metadata } from "next";
import { AdminGuard } from "@/components/role-guard";
import CategoryDetailPage from "@/features/insurance/admin/categories/components/category-detail-page";

export const metadata: Metadata = {
  title: "Category configuration",
};

export default function Page() {
  return (
    <AdminGuard>
      <CategoryDetailPage />
    </AdminGuard>
  );
}
