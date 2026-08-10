"use client";

import {
  Stepper,
  StepperIndicator,
  StepperItem,
  StepperTrigger,
} from "@/components/ui/stepper";

const steps = [0, 1, 2];

function RegisterStepper({
  value,
  onValueChange,
}: {
  value: number;
  onValueChange: (step: number) => void;
}) {
  return (
    <Stepper value={value} onValueChange={onValueChange} className="mt-2 gap-1">
      {steps.map((step) => (
        <StepperItem key={step} step={step} className="flex-1">
          <StepperTrigger className="w-full">
            <StepperIndicator asChild className="h-1 w-full bg-border">
              <span className="sr-only">{step + 1}</span>
            </StepperIndicator>
          </StepperTrigger>
        </StepperItem>
      ))}
    </Stepper>
  );
}

export default RegisterStepper;
