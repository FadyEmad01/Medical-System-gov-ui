"use client";

import { useTranslations } from "next-intl";
import {
  Stepper,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from "@/components/ui/stepper";
import { cn } from "@/lib/utils";
import type { CardState } from "../../lib/card-status";

const STEP_NUMBERS = [1, 2, 3] as const;

/**
 * The three-step journey toward the insurance card: upload documents, get
 * Admin/Doctor approval, receive the card.
 *
 * Fully controlled: the active step mirrors backend reality (derived from the
 * application status + card history), so user interaction never changes it —
 * pass `value` only and leave `onValueChange` unwired.
 *
 * Phase colors encode progress semantics, mirroring the tracking timeline:
 * completed phases fill with success, the current phase carries primary (or
 * revoked when the card state needs attention), upcoming phases stay muted.
 */
export default function InsuranceCardStepper({ state }: { state: CardState }) {
  const t = useTranslations("insurance");
  const isAttention = state.kind === "attention";
  // The derived `step` marks where the journey IS; these overrides mark what
  // is already FINISHED beyond it: an approved application completes the
  // approval phase, and a valid card completes the whole journey.
  const finishedThrough =
    state.kind === "ready" ? 3 : state.kind === "awaiting-issuance" ? 2 : 0;

  return (
    <Stepper value={state.step}>
      {STEP_NUMBERS.map((step) => (
        <StepperItem
          className="not-last:flex-1 max-md:items-start"
          completed={step <= finishedThrough}
          key={step}
          step={step}
        >
          <StepperTrigger className="rounded max-md:flex-col">
            <StepperIndicator
              className={cn(
                // Completed: success fill — a finished phase, not just "passed".
                "data-[state=completed]:bg-success data-[state=completed]:text-card",
                // Current phase: primary, unless the card state flags a problem
                // (suspended/revoked/expired card) — then the phase itself
                // carries the revoked tone so the blocker is unmissable.
                isAttention &&
                  "data-[state=active]:bg-revoked data-[state=active]:text-card data-[state=active]:ring-4 data-[state=active]:ring-revoked/25",
              )}
            />
            <div className="text-center md:text-left">
              <StepperTitle className="group-data-[state=active]/step:font-semibold group-data-[state=inactive]/step:text-muted-foreground">
                {t(`card.steps.${step}.title`)}
              </StepperTitle>
              <StepperDescription className="max-sm:hidden">
                {t(`card.steps.${step}.description`)}
              </StepperDescription>
            </div>
          </StepperTrigger>
          {step < STEP_NUMBERS.length && (
            <StepperSeparator className="max-md:mt-3.5 md:mx-4 group-data-[state=completed]/step:bg-success/40" />
          )}
        </StepperItem>
      ))}
    </Stepper>
  );
}
