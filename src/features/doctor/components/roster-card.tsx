"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRouter } from "@/i18n/navigation";
import { useMyPatients } from "../hooks/use-clinical-patients";
import { PendingBackendNotice } from "./pending-backend-notice";

/** GET /doctors/{doctorId}/patients — assigned ∪ visit-derived roster. */
export function RosterCard() {
  const t = useTranslations("doctor");
  const router = useRouter();
  const roster = useMyPatients();

  return (
    <Card className="flex flex-col py-0">
      <CardHeader className="border-b border-border px-4 py-3">
        <CardTitle className="text-sm font-medium">
          {t("home.roster.title")}
        </CardTitle>
        <CardDescription className="text-xs">
          {t("home.roster.hint")}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3 p-4">
        <PendingBackendNotice />
        {roster.data && roster.data.length > 0 ? (
          <Table>
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead className="text-xs font-medium">
                  {t("home.roster.patient")}
                </TableHead>
                <TableHead className="text-xs font-medium">
                  {t("home.roster.relationship")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roster.data.map((entry) => (
                <TableRow
                  className="cursor-pointer"
                  key={entry.patientId}
                  onClick={() =>
                    router.push(`/dashboard/doctor/patients/${entry.patientId}`)
                  }
                >
                  <TableCell className="text-sm">
                    {entry.fullName ??
                      t("home.roster.unnamed", { id: entry.patientId })}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {t(
                      entry.assignedAt === null
                        ? "home.roster.relationships.visitDerived"
                        : "home.roster.relationships.assigned",
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : roster.data ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center">
            <p className="text-sm text-muted-foreground">
              {t("home.roster.empty")}
            </p>
            <Button
              onClick={() => router.push("/dashboard/doctor")}
              size="sm"
              type="button"
              variant="outline"
            >
              {t("home.roster.searchCta")}
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
