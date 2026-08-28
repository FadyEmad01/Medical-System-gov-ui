"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useMe } from "@/features/auth/hooks/use-me";
import {
  useActionQuery,
  useSessionExpiryGuard,
} from "@/features/insurance/hooks/use-action-query";
import { getVisitAction } from "../actions";
import { CLINICAL_API_AVAILABLE } from "../lib/clinical-availability";
import type { VisitDetailDto } from "../types";
import { DOCTOR_VISIT_KEY } from "./clinical-query-keys";

/** GET /visits/{visitId} — the full encounter with medications + attachments. */
export function useVisit(visitId: string) {
  const meQuery = useMe();
  const enabled =
    meQuery.data?.role === "Doctor" &&
    CLINICAL_API_AVAILABLE &&
    visitId.trim() !== "";
  const queryClient = useQueryClient();

  const query = useActionQuery<VisitDetailDto>(
    DOCTOR_VISIT_KEY(visitId),
    () => getVisitAction(visitId),
    { enabled, staleTime: 15_000 },
  );
  useSessionExpiryGuard(queryClient, query.error);
  return query;
}
