import type { Metadata } from "next";
import { DoctorGuard } from "@/components/role-guard";
import { PatientChart } from "@/features/doctor/components/patient-chart";

export const metadata: Metadata = {
  title: "Patient chart",
};

export default function Page() {
  return (
    <DoctorGuard>
      <PatientChart />
    </DoctorGuard>
  );
}
