import type { Metadata } from "next";
import { DoctorGuard } from "@/components/role-guard";
import { NewVisitForm } from "@/features/doctor/components/new-visit-form";

export const metadata: Metadata = {
  title: "New visit",
};

export default function Page() {
  return (
    <DoctorGuard>
      <NewVisitForm />
    </DoctorGuard>
  );
}
