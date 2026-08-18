import type { Metadata } from "next";
import { StaffGuard } from "@/components/role-guard";
import VerificationPage from "@/features/insurance/admin/verification/components/verification-page";

export const metadata: Metadata = {
  title: "Verification",
};

export default function Page() {
  return (
    <StaffGuard>
      <VerificationPage />
    </StaffGuard>
  );
}
