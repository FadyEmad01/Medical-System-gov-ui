import type { Metadata } from "next";
import { AdminGuard } from "@/components/role-guard";
import QueuePage from "@/features/insurance/admin/review/components/queue/queue-page";

export const metadata: Metadata = {
  title: "Application review",
};

export default function Page() {
  return (
    <AdminGuard>
      <QueuePage />
    </AdminGuard>
  );
}
