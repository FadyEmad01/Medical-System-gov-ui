"use client";

import { ArrowRight, FileSearch } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMe } from "@/features/auth/hooks/use-me";
import { Link } from "@/i18n/navigation";

/**
 * Admin hub hero — same composition as the citizen welcome banner:
 * full-bleed photo plane, primary overlays, greeting + one CTA.
 */
export function AdminHomeHero() {
  const t = useTranslations("admin");
  const { data: user } = useMe();

  if (user === undefined) {
    return (
      <div className="relative flex min-h-[220px] w-full items-end overflow-hidden rounded-xl bg-muted shadow-md animate-pulse" />
    );
  }

  return (
    <div className="group relative flex min-h-[220px] w-full items-end overflow-hidden rounded-xl bg-slate-900 shadow-md">
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/p2.jpg')" }}
      />
      <div className="absolute inset-0 bg-linear-to-tr from-primary/90 via-primary/50 to-transparent" />
      <div className="absolute inset-0 bg-linear-to-t from-primary/80 via-transparent to-transparent" />

      <div className="relative z-10 flex w-full flex-col justify-end gap-4 p-6 sm:flex-row sm:items-end sm:justify-between sm:p-8">
        <div className="min-w-0 max-w-xl text-white">
          <h1 className="text-balance text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
            {t("home.greeting", { name: user?.fullName ?? "" })}
          </h1>
          <p className="mt-2 text-pretty text-sm leading-snug text-white/80 sm:text-base">
            {t("home.description")}
          </p>
          <Link
            href="/dashboard/admin/applications"
            className="mt-5 inline-flex items-center gap-1.5 rounded-md text-sm font-semibold text-white transition hover:text-white/80 underline-offset-4 hover:underline"
          >
            <FileSearch className="size-4" />
            {t("home.heroCta")}
            <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
