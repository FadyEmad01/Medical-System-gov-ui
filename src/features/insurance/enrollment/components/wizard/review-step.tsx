"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  READINESS_QUERY_KEY,
  useSubmitEnrollment,
  useSummary,
} from "../../hooks/use-enrollment";
import type { EnrollmentReadinessResponseDto } from "../../types";
import { ReviewSummaryCard } from "./review-summary-card";

/**
 * Step 5 — review + submit. Renders the full enrollment summary in sections
 * (category, profile, eligibility, dependents, documents) and gates the
 * submit button on the readiness snapshot. A submit that the server rejects
 * with a validation error invalidates readiness so this step re-reads the
 * refreshed missing-requirements list and renders it verbatim.
 */
export function ReviewStep({
  readiness,
  applicationCreatedAt,
  onBack,
}: {
  readiness: EnrollmentReadinessResponseDto;
  applicationCreatedAt: string;
  onBack: () => void;
}) {
  const t = useTranslations("insurance");
  const queryClient = useQueryClient();
  const summaryQuery = useSummary();
  const submit = useSubmitEnrollment();
  const [submitFailed, setSubmitFailed] = useState(false);

  const summary = summaryQuery.data;
  const submitting = submit.isPending;

  const handleSubmit = () => {
    setSubmitFailed(false);
    submit.mutate(undefined, {
      onError: (error) => {
        if (error.kind !== "validation") return;
        setSubmitFailed(true);
        // Re-read the gate so the inline alert below shows the fresh
        // missing requirements the server just rejected with.
        queryClient.invalidateQueries({ queryKey: READINESS_QUERY_KEY });
      },
    });
  };

  if (!summary) {
    return (
      <div className="flex min-h-40 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <ReviewSummaryCard
        summary={summary}
        applicationCreatedAt={applicationCreatedAt}
      />

      {submitFailed ? (
        <Alert variant="destructive">
          <AlertTitle>{t("enrollment.submitFailed")}</AlertTitle>
          {readiness.missingRequirements.length > 0 ? (
            <AlertDescription>
              <ul className="ms-4 flex list-disc flex-col gap-1">
                {readiness.missingRequirements.map((requirement) => (
                  <li key={requirement}>{requirement}</li>
                ))}
              </ul>
            </AlertDescription>
          ) : null}
        </Alert>
      ) : !readiness.isReady ? (
        <p className="text-sm text-muted-foreground">
          {t("review.submitDisabledHint")}
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-2">
        <Button type="button" variant="outline" onClick={onBack}>
          {t("enrollment.back")}
        </Button>
        <Button
          type="button"
          disabled={!readiness.isReady || submitting}
          onClick={handleSubmit}
        >
          {submitting ? <Spinner data-icon="inline-start" /> : null}
          {submitting ? t("review.submitting") : t("review.submit")}
        </Button>
      </div>
    </div>
  );
}
