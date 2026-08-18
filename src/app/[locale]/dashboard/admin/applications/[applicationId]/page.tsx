import type { Metadata } from "next";
import { AdminGuard } from "@/components/role-guard";
import ReviewPage from "@/features/insurance/admin/review/components/review/review-page";

export const metadata: Metadata = {
  title: "Review application",
};

/**
 * Deliberately a thin server shell: the review bundle is fetched ONLY inside
 * the client component, because the review GET auto-claims a Submitted
 * application — a server-rendered fetch would let <Link> prefetching
 * auto-claim on hover (plan §4, S2).
 */
export default function Page() {
  return (
    <AdminGuard>
      <ReviewPage />
    </AdminGuard>
  );
}
