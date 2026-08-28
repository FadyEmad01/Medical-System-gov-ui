/** Badge classNames for visit statuses (integration guide §11 color intent). */

import type { VisitStatus } from "../types";

export function visitStatusTone(status: VisitStatus): string {
  if (status === "Completed") return "bg-success/10 text-success";
  if (status === "InProgress") return "bg-warning/10 text-warning";
  if (status === "Scheduled") return "bg-info/10 text-info";
  return "bg-revoked/10 text-revoked";
}
