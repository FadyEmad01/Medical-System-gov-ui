"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useMe } from "@/features/auth/hooks/use-me";
import type { AuthActionError } from "@/features/auth/lib/action-error";
import { useActionQuery } from "@/features/insurance/hooks/use-action-query";
import { listAttachmentsAction, uploadAttachmentAction } from "../actions";
import { CLINICAL_API_AVAILABLE } from "../lib/clinical-availability";
import type { AttachmentMetaDto, UploadAttachmentInput } from "../types";
import {
  DOCTOR_ATTACHMENTS_KEY,
  DOCTOR_VISIT_KEY,
} from "./clinical-query-keys";
import { useClinicalMutationError } from "./use-clinical-patients";

/** GET /visits/{visitId}/attachments — append-only list. */
export function useAttachments(visitId: string) {
  const meQuery = useMe();
  const enabled =
    meQuery.data?.role === "Doctor" &&
    CLINICAL_API_AVAILABLE &&
    visitId.trim() !== "";

  return useActionQuery<AttachmentMetaDto[]>(
    DOCTOR_ATTACHMENTS_KEY(visitId),
    () => listAttachmentsAction(visitId),
    { enabled, staleTime: 30_000 },
  );
}

/** POST /visits/{visitId}/attachments — no progress events (plain fetch), no delete. */
export function useUploadAttachmentMutation(
  visitId: string,
  options: { onStorageUnavailable?: () => void } = {},
) {
  const t = useTranslations("doctor");
  const queryClient = useQueryClient();
  const onError = useClinicalMutationError();

  return useMutation<AttachmentMetaDto, AuthActionError, UploadAttachmentInput>(
    {
      mutationFn: async (input) => {
        const res = await uploadAttachmentAction(input);
        if (!res.ok) throw res.error;
        return res.data;
      },
      onSuccess: (attachment) => {
        toast.success(t("attachments.uploaded"));
        queryClient.setQueryData<AttachmentMetaDto[]>(
          DOCTOR_ATTACHMENTS_KEY(visitId),
          (rows) => [...(rows ?? []), attachment],
        );
        void queryClient.invalidateQueries({
          queryKey: DOCTOR_VISIT_KEY(visitId),
        });
      },
      onError: (error) => {
        if (error.kind === "server") {
          // 502 = attachment storage (Cloudinary) down — distinct, retry-safe.
          options.onStorageUnavailable?.();
          toast.error(t("attachments.errors.storageUnavailable"));
          return;
        }
        onError(error);
      },
    },
  );
}
