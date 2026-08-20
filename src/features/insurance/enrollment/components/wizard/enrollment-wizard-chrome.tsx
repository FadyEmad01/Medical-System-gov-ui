"use client";

import { useTranslations } from "next-intl";
import {
  Fragment,
  type Dispatch,
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

        {stepIndex < STEP_ORDER.length - 1 ? (
          <div className="flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={stepIndex === 0}
              onClick={() => onStepIndexChange((index) => index - 1)}
            >
              {t("enrollment.back")}
            </Button>
            <Button
              type="button"
              onClick={() => onStepIndexChange((index) => index + 1)}
            >
              {t("enrollment.next")}
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
