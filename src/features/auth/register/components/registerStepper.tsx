"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Stepper,
  StepperIndicator,
  StepperItem,
  StepperTrigger,
} from "@/components/ui/stepper";

const steps = [1, 2, 3, 4];

export default function RegisterStepper() {
  const [currentStep, setCurrentStep] = useState(2);

  return (
    <div className="mx-auto max-w-xl space-y-8 text-center w-full mt-2">
      <div className="flex items-center gap-2">

        <Stepper
          className="gap-1"
          onValueChange={setCurrentStep}
          value={currentStep}
        >
          {steps.map((step) => (
            <StepperItem className="flex-1" key={step} step={step}>
              <StepperTrigger
                asChild
                className="w-full flex-col items-start gap-2"
              >
                <StepperIndicator asChild className="h-1 w-full bg-border">
                  <span className="sr-only">{step}</span>
                </StepperIndicator>
              </StepperTrigger>
            </StepperItem>
          ))}
        </Stepper>
      </div>
    </div>
  );
}
