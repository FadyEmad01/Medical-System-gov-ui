import { Card, CardContent } from "@/components/ui/card";
import InsuranceStepper from "@/features/insurance-card/components/insurance-stepper-to-get-card";

export default function page() {
  return (
    <div>
      <Card>
        <CardContent>
          <InsuranceStepper />
        </CardContent>

      </Card>

    </div>
  )
}
