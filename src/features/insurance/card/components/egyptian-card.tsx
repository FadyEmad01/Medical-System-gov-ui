"use client";

import { format } from "date-fns";
import Image from "next/image";
import type { CardResponseDto, ProfileResponseDto } from "../../types";

interface EgyptianInsuranceCardProps {
  card: CardResponseDto;
  profile: ProfileResponseDto | null;
  beneficiaryType?: string | null;
}

/**
 * The Egyptian Universal Health Insurance card artwork.
 *
 * Fed by real backend data; the Arabic labels are intentionally hardcoded in
 * both locales (product decision). The primary-care unit field has no backend
 * source yet, so it shows a "قريباً" (coming soon) placeholder pill.
 */
export function EgyptianInsuranceCard({
  card,
  profile,
  beneficiaryType,
}: EgyptianInsuranceCardProps) {
  const name = card.holderFullName ?? profile?.fullName ?? "—";
  const nationalId = profile?.nationalId ?? "—";
  const insuranceNumber = card.cardNumber ?? "—";
  const issueDate = card.issuedAt
    ? (() => {
        const date = new Date(card.issuedAt);
        return Number.isNaN(date.getTime()) ? "—" : format(date, "yyyy/MM/dd");
      })()
    : "—";
  const governorate = profile?.governorate ?? "—";
  const resolvedBeneficiaryType = beneficiaryType?.trim() || "—";

  return (
    <div
      dir="rtl"
      className="relative w-full max-w-[440px] min-h-[260px] bg-card bg-gradient-to-br from-card via-card to-primary/5 rounded-2xl shadow-sm text-card-foreground p-4 sm:p-5 flex flex-col justify-between overflow-hidden font-sans border-2 border-primary/20 select-none"
    >
      {/* Background Decorative Ambient Effect (using theme primary color) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[radial-gradient(circle,_var(--color-primary)_0%,_transparent_70%)] opacity-5 pointer-events-none rounded-full" />
      <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-primary/10 rounded-full blur-xl pointer-events-none" />
      <div className="absolute -top-16 -left-16 w-40 h-40 bg-primary/10 rounded-full blur-lg pointer-events-none" />

      {/* Official Header Strip */}
      <div className="relative z-10 flex justify-between items-start gap-2 border-b border-border pb-2">
        <div className="flex flex-col items-start min-w-0">
          <span className="text-[0.58rem] font-bold text-muted-foreground tracking-wide">
            جمهورية مصر العربية
          </span>
          <span className="text-[0.65rem] font-extrabold text-primary mt-0.5">
            منظومة التأمين الصحي الشامل
          </span>
        </div>

        {/* National Crest Symbol */}
        <div className="flex flex-col items-center justify-center">
          <div className="size-8 flex items-center justify-center">
            <Image
              src="/images/logo-card.png"
              alt="مصر الرقمية"
              width={430}
              height={215}
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        <div className="flex flex-col items-end min-w-0">
          <span className="text-[0.55rem] font-bold text-muted-foreground">
            المحافظة
          </span>
          <span className="text-xs font-black text-foreground truncate max-w-full">
            {governorate}
          </span>
        </div>
      </div>

      {/* Card Core Demographics */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 my-auto pt-1">
        {/* Profile/Data Column */}
        <div className="flex flex-col gap-2">
          {/* Full Name */}
          <div className="flex flex-col">
            <span className="text-[0.58rem] text-primary font-black tracking-wide">
              اسم المنتفع
            </span>
            <span className="text-[1.1rem] font-black text-foreground leading-tight break-words">
              {name}
            </span>
          </div>

          {/* National Identity details */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col">
              <span className="text-[0.58rem] text-muted-foreground font-bold">
                الرقم القومي
              </span>
              <span className="text-[0.85rem] font-mono font-bold text-foreground tracking-wider text-right">
                {nationalId}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[0.58rem] text-muted-foreground font-bold">
                رقم التأمين
              </span>
              <span className="text-[0.85rem] font-mono font-bold text-foreground">
                {insuranceNumber}
              </span>
            </div>
          </div>

          {/* Dedicated Healthcare Unit */}
          <div className="flex flex-col">
            <span className="text-[0.58rem] text-muted-foreground font-bold">
              جهة الربط (مركز / وحدة الرعاية الأولية)
            </span>
            <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20 self-start">
              {"قريباً"}
            </span>
          </div>
        </div>

        {/* Small Verification Column Side */}
        <div className="flex flex-row items-center justify-between gap-3 border-t border-border py-2 sm:flex-col sm:items-center sm:justify-between sm:border-t-0 sm:border-r sm:pt-0 sm:pr-4">
          <div className="flex flex-col items-center">
            <span className="text-[0.52rem] text-muted-foreground font-bold mb-1">
              نوع المنتفع
            </span>
            <span className="bg-secondary text-secondary-foreground text-[0.6rem] font-extrabold px-2 py-0.5 rounded-md border border-border">
              {resolvedBeneficiaryType}
            </span>
          </div>

          {/* Simulated Chip/QR Identifier */}
          <div className="w-9 h-9 bg-muted rounded-md border border-border flex flex-wrap p-1 gap-0.5 items-center justify-center opacity-80">
            <div className="w-1.5 h-1.5 bg-foreground/70 rounded-sm" />
            <div className="w-1.5 h-1.5 bg-foreground/70 rounded-sm" />
            <div className="w-1.5 h-1.5 bg-foreground/70 rounded-sm" />
            <div className="w-1.5 h-1.5 bg-foreground/70 rounded-sm" />
          </div>
        </div>
      </div>

      {/* Footer / Authority Signatures & Official Hotline */}
      <div className="relative z-10 border-t border-border pt-1.5 flex justify-between items-center flex-wrap gap-2 text-[0.58rem] text-muted-foreground font-medium">
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          <span>
            تاريخ الإصدار:{" "}
            <strong className="text-foreground font-bold">{issueDate}</strong>
          </span>
          <span className="text-primary font-bold">
            الهيئة العامة للرعاية الصحية
          </span>
        </div>
        <div className="flex items-center gap-1 bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-bold">
          <span>الخط الساخن:</span>
          <span className="font-mono tracking-tight text-[0.65rem]">15344</span>
        </div>
      </div>
    </div>
  );
}
