import { Stepper, StepperDescription, StepperIndicator, StepperItem, StepperSeparator, StepperTitle, StepperTrigger } from "@/components/ui/stepper";

const steps = [
    {
        description: "Upload the needed documents",
        step: 1,
        title: "Step One",
    },
    {
        description: "Review the submitted information",
        step: 2,
        title: "Step Two",
    },
    {
        description: "Information review completed",
        step: 3,
        title: "Step Three",
    },
];

export default function InsuranceStepper() {
    return (
        <div className="space-y-8 text-center">
            <Stepper defaultValue={2}>
                {steps.map(({ step, title, description }) => (
                    <StepperItem
                        className="not-last:flex-1 max-md:items-start"
                        key={step}
                        step={step}
                    >
                        <StepperTrigger className="rounded max-md:flex-col">
                            <StepperIndicator />
                            <div className="text-center md:text-left">
                                <StepperTitle>{title}</StepperTitle>
                                <StepperDescription className="max-sm:hidden">
                                    {description}
                                </StepperDescription>
                            </div>
                        </StepperTrigger>
                        {step < steps.length && (
                            <StepperSeparator className="max-md:mt-3.5 md:mx-4" />
                        )}
                    </StepperItem>
                ))}
            </Stepper>
        </div>
    )
}
