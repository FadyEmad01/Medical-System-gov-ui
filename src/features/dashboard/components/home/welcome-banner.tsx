// "use client";

// import { ArrowRight } from "lucide-react";
// import Image from "next/image";
// import { useTranslations } from "next-intl";
// import { useMe } from "@/features/auth/hooks/use-me";
// import { useProfile } from "@/features/insurance/hooks/use-profile";
// import { computeProfileCompleteness } from "@/features/insurance/lib/completeness";
// import { Link } from "@/i18n/navigation";

// export default function WelcomeBanner() {
//   const t = useTranslations("dashboard");
//   const { data: user } = useMe();
//   const { data: profile } = useProfile();

//   if (user === undefined) {
//     return (
//       <div className="relative flex min-h-[220px] w-full items-end overflow-hidden rounded-xl bg-muted shadow-md animate-pulse" />
//     );
//   }

//   const completeness = computeProfileCompleteness(profile);

//   const hasProfile = profile != null;
//   const isComplete = completeness.level === "high";
//   const hasCard = hasProfile && isComplete;

//   const description = hasProfile
//     ? isComplete
//       ? t("welcome.profileComplete")
//       : t("welcome.profileNudge", { level: completeness.level })
//     : null;

//   const ctaHref = hasCard ? "/dashboard/insurance" : "/dashboard/profile";
//   const ctaLabel = hasCard
//     ? t("welcome.viewCard")
//     : t("welcome.cta");

//   return (
//     <div className="group relative flex min-h-[220px] w-full items-end overflow-hidden rounded-xl bg-slate-900 shadow-md">
//       <div
//         className="absolute inset-0 bg-cover bg-center bg-no-repeat"
//         style={{ backgroundImage: "url('/images/p2.jpg')" }}
//       />

//       <div className="absolute inset-0 bg-linear-to-tr from-primary/90 via-primary/50 to-transparent" />
//       <div className="absolute inset-0 bg-linear-to-t from-primary/80 via-transparent to-transparent" />

//       <div className="relative z-10 flex w-full justify-between gap-4 p-6 sm:p-8 text-white">
//         <div className="min-w-0 max-w-md">
//           <h3 className="text-balance text-2xl font-bold leading-tight tracking-tight sm:text-3xl line-clamp-1">
//             {t("welcome.greeting", { name: user?.fullName ?? "" })}
//           </h3>
//           {description && (
//             <p className="mt-2 text-pretty text-sm leading-snug text-gray-300 sm:text-base">
//               {description}
//             </p>
//           )}

//           <Link
//             href={ctaHref}
//             className="mt-5 inline-flex items-center gap-1.5 rounded-md text-sm font-semibold text-white hover:text-gray-300 transition underline-offset-4 hover:underline"
//           >
//             {ctaLabel}
//             <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
//           </Link>
//         </div>
//       </div>
//     </div>
//   );
// }

"use client";

import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useMe } from "@/features/auth/hooks/use-me";
import { useProfile } from "@/features/insurance/hooks/use-profile";
import { computeProfileCompleteness } from "@/features/insurance/lib/completeness";
import { Link } from "@/i18n/navigation";

export default function WelcomeBanner() {
  const t = useTranslations("dashboard");
  const { data: user } = useMe();
  const isPatient = user?.role === "Patient";
  const { data: profile } = useProfile({ enabled: isPatient });

  if (user === undefined) {
    return (
      <div className="relative flex min-h-[220px] w-full items-end overflow-hidden rounded-xl bg-muted shadow-md animate-pulse" />
    );
  }

  if (user === null) {
    return null;
  }

  const isAdmin = user.role === "Admin";
  const isDoctor = user.role === "Doctor";

  // Standard patient logic — skipped for staff (no citizen profile).
  const completeness = computeProfileCompleteness(profile);
  const hasProfile = profile != null;
  const isComplete = completeness.level === "high";
  const hasCard = hasProfile && isComplete;

  const description = isAdmin
    ? t("welcome.adminDescription")
    : isDoctor
      ? t("welcome.doctorDescription")
      : t("welcome.generalWelcome");

  const ctaHref = isAdmin
    ? "/dashboard/admin"
    : isDoctor
      ? "/dashboard/doctor"
      : hasCard
        ? "/dashboard/insurance-card"
        : "/dashboard/profile";

  const ctaLabel = isAdmin
    ? t("welcome.adminCta")
    : isDoctor
      ? t("welcome.doctorCta")
      : hasCard
        ? t("welcome.viewCard")
        : t("welcome.cta");

  return (
    <div className="group relative flex min-h-[220px] w-full items-end overflow-hidden rounded-xl bg-slate-900 shadow-md">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ 
          // You can also dynamically change the image if they are an admin
          backgroundImage: "url('/images/p2.jpg')" 
        }}
      />

      <div className="absolute inset-0 bg-linear-to-tr from-primary/90 via-primary/50 to-transparent" />
      <div className="absolute inset-0 bg-linear-to-t from-primary/80 via-transparent to-transparent" />

      <div className="relative z-10 flex w-full justify-between gap-4 p-6 sm:p-8 text-white">
        <div className="min-w-0 max-w-md">
          <h3 className="text-balance text-2xl font-bold leading-tight tracking-tight sm:text-3xl line-clamp-1">
            {t("welcome.greeting", { name: user?.fullName ?? "" })}
          </h3>
          
          {description && (
            <p className="mt-2 text-pretty text-sm leading-snug text-gray-300 sm:text-base">
              {description}
            </p>
          )}

          <Link
            href={ctaHref}
            className="mt-5 inline-flex items-center gap-1.5 rounded-md text-sm font-semibold text-white hover:text-gray-300 transition underline-offset-4 hover:underline"
          >
            {ctaLabel}
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}