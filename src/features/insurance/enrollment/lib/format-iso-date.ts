import { format } from "date-fns";
import { arSA, enUS } from "date-fns/locale";

/** Format an ISO timestamp for tracking UI; em-dash when invalid. */
export function formatIsoDate(iso: string, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return format(date, "PPP", { locale: locale === "ar" ? arSA : enUS });
}
