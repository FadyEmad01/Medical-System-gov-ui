"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import type { AuthActionError } from "@/features/auth/lib/action-error";
import { useRouter } from "@/i18n/navigation";
import { handleSessionExpiry, isForbidden } from "../../../hooks/session-guard";
import { startEnrollmentAction } from "../../actions";
import { CURRENT_ENROLLMENT_QUERY_KEY } from "../../hooks/use-enrollment";
import type {
  EnrollmentResponseDto,
  InsuranceCategoryResponseDto,
} from "../../types";
import { CategoryCardBody } from "./category-card-body";

/**
 * One selectable insurance category on the landing page.
 *
 * The footer Select is the apply action: it offers the card's own category as
 * the single choice, and picking it starts the enrollment mutation for it.
 */
export function CategoryCard({
  category,
}: {
  category: InsuranceCategoryResponseDto;
}) {
  const t = useTranslations("insurance");
  const router = useRouter();
  const queryClient = useQueryClient();
  // Controlled Select value: stays empty between picks so re-selecting the
  // single option always fires onValueChange (Radix only reports a CHANGE,
  // never a re-pick of the current value).
  const [selected, setSelected] = useState("");

  const startMutation = useMutation<
    EnrollmentResponseDto,
    AuthActionError,
    string
  >({
    mutationFn: async (id) => {
      const res = await startEnrollmentAction(id);
      if (!res.ok) throw res.error;
      return res.data;
    },
    onSuccess: () => {
      toast.success(t("enrollment.started"));
      // The landing grid reads the current enrollment; refresh it so a
      // back-navigation cannot start a second enrollment against a stale
      // null cache.
      queryClient.invalidateQueries({
        queryKey: CURRENT_ENROLLMENT_QUERY_KEY,
      });
      router.push("/dashboard/insurance/apply");
    },
    onError: (error) => {
      // The id always comes from the card, so there are no field errors to
      // map into a form; a generic toast would double-surface them.
      if (
        error.kind === "validation" ||
        Object.keys(error.fieldErrors ?? {}).length > 0
      ) {
        return;
      }
      // 403: authenticated but lacking permission — keep the session and all
      // caches intact, just surface the localized forbidden message.
      if (isForbidden(error)) {
        toast.error(t("errors.forbidden"));
        return;
      }
      // The session cookie is already cleared server-side; drop the cached
      // identity and insurance data too so the next authenticated render
      // redirects to login instead of showing a ghost session.
      if (handleSessionExpiry(queryClient, error)) {
        toast.error(t("errors.sessionExpired"));
        return;
      }
      // 409: a non-terminal enrollment already exists — the contract says to
      // redirect into it rather than surface a raw error. The wizard resumes
      // from the refreshed current-enrollment cache.
      if (error.kind === "conflict") {
        queryClient.invalidateQueries({
          queryKey: CURRENT_ENROLLMENT_QUERY_KEY,
        });
        toast.info(t("enrollment.errors.alreadyExists"));
        router.push("/dashboard/insurance/apply");
        return;
      }
      if (error.kind === "notFound") {
        toast.error(t("errors.notFound"));
        return;
      }
      toast.error(t("errors.generic"));
    },
  });

  return (
    <Card className="flex flex-col">
      <CategoryCardBody
        category={category}
        pending={startMutation.isPending}
        selected={selected}
        onSelect={() => {
          // Reset before mutating: with the controlled value back to "",
          // the next pick re-fires onValueChange, so a failed start
          // (conflict/network) can be retried without a page reload.
          setSelected("");
          startMutation.mutate(category.id);
        }}
      />
    </Card>
  );
}
