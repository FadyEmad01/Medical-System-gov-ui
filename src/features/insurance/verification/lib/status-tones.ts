/** Badge classNames for eligibility / verification statuses (UI-only helpers). */

export function eligibilityTone(status: string | undefined): string {
  if (status === "Eligible") return "bg-success/10 text-success";
  if (status === "PendingReview") return "bg-warning/10 text-warning";
  if (
    status === "NotEligible" ||
    status === "Suspended" ||
    status === "Expired"
  ) {
    return "bg-destructive/10 text-destructive";
  }
  return "bg-muted text-muted-foreground";
}

export function verificationStatusTone(status: string): string {
  if (status === "Verified") return "bg-success/10 text-success";
  if (status === "Pending") return "bg-warning/10 text-warning";
  return "bg-destructive/10 text-destructive";
}

export function coverageValidTone(valid: boolean): string {
  return valid
    ? "bg-success/10 text-success"
    : "bg-muted text-muted-foreground";
}
