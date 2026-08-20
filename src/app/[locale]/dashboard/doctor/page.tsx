import type { Metadata } from "next";
import { Suspense } from "react";
import { DoctorGuard } from "@/components/role-guard";
import { Spinner } from "@/components/ui/spinner";
import { PointOfCarePage } from "@/features/doctor/components/point-of-care-page";

export const metadata: Metadata = {
  title: "Point of care",
};

export default function Page() {
  return (
    <DoctorGuard>
      <Suspense
        fallback={
          <div className="flex flex-1 items-center justify-center" aria-busy>
            <Spinner className="text-primary" />
          </div>
        }
      >
        <PointOfCarePage />
      </Suspense>
    </DoctorGuard>
  );
}
