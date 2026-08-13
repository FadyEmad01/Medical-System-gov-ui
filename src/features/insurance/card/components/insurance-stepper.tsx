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
import type { CardState } from "../../lib/card-status";

const STEP_NUMBERS = [1, 2, 3] as const;

/**
 * The three-step journey toward the insurance card: upload documents, get
 * Admin/Doctor approval, receive the card.
 *
 * Fully controlled: the active step mirrors backend reality (derived from the
 * application status + card history), so user interaction never changes it —
 * pass `value` only and leave `onValueChange` unwired.
 */
export default function InsuranceCardStepper({ state }: { state: CardState }) {
  const t = useTranslations("insurance");

  return (
    <Stepper value={state.step}>
      {STEP_NUMBERS.map((step) => (
        <StepperItem
          className="not-last:flex-1 max-md:items-start"
          key={step}
          step={step}
        >
          <StepperTrigger className="rounded max-md:flex-col">
            <StepperIndicator />
            <div className="text-center md:text-left">
              <StepperTitle>{t(`card.steps.${step}.title`)}</StepperTitle>
              <StepperDescription className="max-sm:hidden">
                {t(`card.steps.${step}.description`)}
              </StepperDescription>
            </div>
          </StepperTrigger>
          {step < STEP_NUMBERS.length && (
            <StepperSeparator className="max-md:mt-3.5 md:mx-4" />
          )}
        </StepperItem>
      ))}
    </Stepper>
  );
}
