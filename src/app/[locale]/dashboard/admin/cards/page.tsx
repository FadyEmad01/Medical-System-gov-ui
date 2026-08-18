import type { Metadata } from "next";
import { AdminGuard } from "@/components/role-guard";
import CardsLookupPage from "@/features/insurance/admin/cards/components/cards-lookup-page";

export const metadata: Metadata = {
  title: "Card management",
};

export default function Page() {
  return (
    <AdminGuard>
      <CardsLookupPage />
    </AdminGuard>
  );
}
