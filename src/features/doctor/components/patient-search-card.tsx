"use client";

import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { parsePatientId } from "@/features/insurance/lib/parse-patient-id";
import { useRouter } from "@/i18n/navigation";
import { usePatientSearchMutation } from "../hooks/use-clinical-patients";
import { CLINICAL_API_AVAILABLE } from "../lib/clinical-availability";
import { parseNationalId } from "../lib/parse-national-id";
import { PendingBackendNotice } from "./pending-backend-notice";

const NATIONAL_ID_LENGTH = 14;

/**
 * Exact-match National ID search (no typeahead — backend contract §7.12).
 * Until the clinical endpoints ship, a temporary numeric patient-ID input
 * keeps the wired insurance point-of-care panels reachable.
 */
export function PatientSearchCard() {
  const t = useTranslations("doctor");
  const router = useRouter();
  const [nationalId, setNationalId] = useState("");
  const [patientId, setPatientId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const search = usePatientSearchMutation();

  const digitCount = nationalId.trim().length;
  const validNationalId = parseNationalId(nationalId) !== null;

  const onSearch = () => {
    const id = parseNationalId(nationalId);
    if (!CLINICAL_API_AVAILABLE) {
      setError(t("errors.pendingBackend"));
      return;
    }
    if (id === null) {
      setError(t("errors.invalidNationalId"));
      return;
    }
    setError(null);
    search.mutate(id, {
      onSuccess: (patient) => {
        // Not found and no-access are the same neutral result (§9 privacy rule).
        if (patient === null) {
          setError(t("errors.notFound"));
          return;
        }
        router.push(`/dashboard/doctor/patients/${patient.id}`);
      },
    });
  };

  const onOpenById = () => {
    const id = parsePatientId(patientId);
    if (id === null) {
      setError(t("home.invalidPatientId"));
      return;
    }
    setError(null);
    router.push(`/dashboard/doctor/patients/${id}`);
  };

  return (
    <Card className="flex flex-col py-0">
      <CardHeader className="border-b border-border px-4 py-3">
        <CardTitle className="text-sm font-medium">
          {t("home.search.title")}
        </CardTitle>
        <CardDescription className="text-xs">
          {t("home.search.hint")}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <label className="text-xs font-medium" htmlFor="doctor-national-id">
            {t("home.search.nationalId")}
          </label>
          <div className="mt-1.5 flex items-center gap-2">
            <Input
              className="font-mono"
              disabled={!CLINICAL_API_AVAILABLE}
              id="doctor-national-id"
              inputMode="numeric"
              maxLength={NATIONAL_ID_LENGTH}
              onChange={(event) => setNationalId(event.target.value)}
              placeholder="29801011234567"
              value={nationalId}
            />
            <span className="w-10 shrink-0 text-end font-mono text-xs text-muted-foreground tabular-nums">
              {digitCount}/{NATIONAL_ID_LENGTH}
            </span>
          </div>
          <Button
            className="mt-2 w-full"
            disabled={search.isPending || !validNationalId || digitCount === 0}
            onClick={onSearch}
            type="button"
          >
            <Search aria-hidden className="size-4" />
            {search.isPending
              ? t("home.search.searching")
              : t("home.search.action")}
          </Button>
        </div>

        <PendingBackendNotice />

        <Separator />

        <div>
          <p className="text-xs font-medium">{t("home.openById.title")}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t("home.openById.hint")}
          </p>
          <div className="mt-1.5 flex items-center gap-2">
            <Input
              className="font-mono"
              id="doctor-patient-id"
              inputMode="numeric"
              onChange={(event) => setPatientId(event.target.value)}
              placeholder="1"
              value={patientId}
            />
            <Button
              disabled={parsePatientId(patientId) === null}
              onClick={onOpenById}
              size="sm"
              type="button"
              variant="outline"
            >
              {t("home.openById.action")}
            </Button>
          </div>
        </div>

        {error ? <p className="text-xs text-destructive">{error}</p> : null}
      </CardContent>
    </Card>
  );
}
