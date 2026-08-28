import type { Metadata } from "next";
import { DoctorGuard } from "@/components/role-guard";
import { VisitDetail } from "@/features/doctor/components/visit-detail";

export const metadata: Metadata = {
  title: "Visit",
};

export default function Page() {
  return (
    <DoctorGuard>
      <VisitDetail />
    </DoctorGuard>
  );
}
