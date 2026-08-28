"use client";

import { useTranslations } from "next-intl";
import { PatientSearchCard } from "./patient-search-card";
import { RosterCard } from "./roster-card";
import { ScanCardPanel } from "./scan-card-panel";

/**
 * Doctor workspace landing: exact-match patient search + my-patients roster
 * + the point-of-care card scan. Clinical sections render their target UI
 * with pending-backend notices until the endpoints ship.
 */
export function WorkspaceHome() {
  const t = useTranslations("doctor");

  return (
    <div className="flex flex-1 flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h1 className="text-lg font-medium">{t("home.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("home.description")}</p>
      </header>

      <div className="grid flex-1 gap-4 xl:grid-cols-3">
        <PatientSearchCard />
        <ScanCardPanel />
        <RosterCard />
      </div>
    </div>
  );
}
