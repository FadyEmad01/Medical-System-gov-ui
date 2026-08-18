import type { Metadata } from "next";
import { AdminGuard } from "@/components/role-guard";
import CardsPage from "@/features/insurance/admin/cards/components/cards-page";

export const metadata: Metadata = {
  title: "Card management",
};

export default function Page() {
  return (
    <AdminGuard>
      <CardsPage />
    </AdminGuard>
  );
}
