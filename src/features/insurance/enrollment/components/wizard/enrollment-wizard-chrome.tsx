"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import {
  type Dispatch,
  Fragment,
  type ReactNode,
  type SetStateAction,
} from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Stepper,
  StepperIndicator,
  StepperItem,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from "@/components/ui/stepper";
import { cn } from "@/lib/utils";
import type { WizardStep } from "../../lib/derive-wizard-step";

export const STEP_ORDER: readonly WizardStep[] = [
  "eligibility",
  "profile",
  "documents",
  "dependents",
  "review",
];

export function stepIndexOf(step: WizardStep): number {
  return STEP_ORDER.indexOf(step);
}

/**
 * Wizard chrome: title, application number, stepper, step body slot, and
 * back/next footer (hidden on the final review step).
 */
export function EnrollmentWizardChrome({
  applicationNumber,
  stepIndex,
  onStepIndexChange,
  children,
}: {
  applicationNumber: string;
  stepIndex: number;
  onStepIndexChange: Dispatch<SetStateAction<number>>;
  children: ReactNode;
}) {
  const t = useTranslations("insurance");
  const locale = useLocale();
  const ForwardIcon = locale === "ar" ? ArrowLeft : ArrowRight;

  return (
    <Card className="mx-auto w-full max-w-3xl">
      <CardHeader>
        <CardTitle>{t("enrollment.title")}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {t("enrollment.applicationNumber", {
            number: applicationNumber,
          })}
        </p>
      </CardHeader>

      <CardContent className="flex flex-col gap-6">
        <Stepper
          className="items-center"
          value={stepIndex}
          onValueChange={onStepIndexChange}
        >
          {STEP_ORDER.map((currentStep, index) => (
            <Fragment key={currentStep}>
              <StepperItem step={index}>
                <StepperTrigger className="rounded-full">
                  <StepperIndicator />
                  <div className="hidden flex-col items-start text-start sm:flex">
                    <StepperTitle>
                      {t(`enrollment.steps.${currentStep}`)}
                    </StepperTitle>
                  </div>
                </StepperTrigger>
              </StepperItem>
              {index < STEP_ORDER.length - 1 ? <StepperSeparator /> : null}
            </Fragment>
          ))}
        </Stepper>

        {children}

        <div
          className={cn(
            "flex items-center justify-between gap-2",
            stepIndex === STEP_ORDER.length - 1 &&
              "invisible pointer-events-none",
          )}
        >
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            disabled={stepIndex === 0}
            onClick={() => onStepIndexChange((index) => index - 1)}
          >
            {t("enrollment.back")}
          </Button>
          <Button
            type="button"
            className="w-full sm:w-auto"
            onClick={() => onStepIndexChange((index) => index + 1)}
          >
            {t("enrollment.next")}
            <ForwardIcon className="size-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
