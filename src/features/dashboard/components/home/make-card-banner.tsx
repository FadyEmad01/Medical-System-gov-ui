"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { CreditCard, FileText, ShieldCheck, UploadCloud } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

export default function MakeCardBanner() {
  const t = useTranslations("dashboard");
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => (prev >= 2 ? 0 : prev + 1));
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const progress = step === 0 ? 0 : step === 1 ? 0.5 : 1;

  return (
    <div className="relative flex min-h-[220px] w-full flex-col overflow-hidden rounded-xl bg-sidebar-primary shadow-md">
      {/* Dotted grid — masked with a radial gradient so it fades toward the
          edges instead of ending in a hard rectangle */}
      {/* <div
        className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff14_1px,transparent_1px),linear-gradient(to_bottom,#ffffff14_1px,transparent_1px)] bg-[size:16px_16px]"
        style={{
          maskImage: "radial-gradient(ellipse at center, black 35%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 35%, transparent 80%)",
        }}
      /> */}

      {/* Same primary-tinted overlays as WelcomeBanner, so the two cards read
          as one family instead of two different components */}
      {/* <div className="absolute inset-0 bg-linear-to-tr from-primary/90 via-primary/40 to-transparent" />
      <div className="absolute inset-0 bg-linear-to-t from-primary/70 via-transparent to-transparent" /> */}

      {/* Dark fade behind the header so text stays legible over the grid */}
      {/* <div className="absolute top-0 left-0 z-10 h-28 w-full bg-linear-to-b from-slate-900/95 via-slate-900/70 to-transparent pointer-events-none" /> */}

      {/* Header */}
      <div className="relative z-20 px-6 pt-6 sm:px-8 sm:pt-8 text-start pointer-events-none">
        <h3 className="text-balance text-xl font-bold leading-tight tracking-tight text-white">
          {t("makeCard.title")}
        </h3>
        {/* <p className="mt-2 text-pretty text-sm leading-snug text-gray-300">
          Upload files, get authorized, and receive your card.
        </p> */}
      </div>

      {/* Flow */}
      <div className="relative z-10 flex flex-1 w-full items-center justify-center px-10 sm:px-12">
        <div className="relative h-10 w-full">
          <div className="absolute top-1/2 left-0 h-0 w-full -translate-y-1/2 border-t-2 border-dashed border-white/15" />

          <motion.div
            className="absolute top-1/2 left-0 h-[2px] w-full origin-left -translate-y-1/2 bg-white"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: progress }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          />

          <Node
            position="0%"
            active={step >= 0}
            current={step === 0}
            icon={UploadCloud}
            label={t("makeCard.steps.upload")}
          />
          <Node
            position="50%"
            active={step >= 1}
            current={step === 1}
            icon={ShieldCheck}
            label={t("makeCard.steps.authorize")}
          />
          <Node
            position="100%"
            active={step >= 2}
            current={step === 2}
            icon={CreditCard}
            label={t("makeCard.steps.finished")}
          />

          <motion.div
            className="absolute top-1/2 -mt-[72px] z-30 flex h-16 w-12 items-center justify-center"
            animate={{
              left: step === 0 ? "0%" : step === 1 ? "50%" : "100%",
              x: "-50%",
            }}
            transition={{ type: "spring", damping: 16, stiffness: 90 }}
          >
            <AnimatePresence mode="wait">
              {step < 2 ? (
                <motion.div
                  key="document"
                  initial={{ opacity: 0, scale: 0.5, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: [0, -6, 0] }}
                  exit={{ opacity: 0, scale: 0.5, rotate: 10 }}
                  transition={{
                    y: { repeat: Infinity, duration: 2, ease: "easeInOut" },
                    duration: 0.3,
                  }}
                  className="relative flex h-14 w-10 flex-col items-center justify-center overflow-hidden rounded border border-white/10 bg-white/95 shadow-md"
                >
                  <FileText className="mb-1.5 h-4 w-4 text-slate-500" />
                  <div className="h-0.5 w-6 rounded-full bg-slate-400/50" />
                  <div className="mt-1 h-0.5 w-4 rounded-full bg-slate-400/50" />

                  {step === 1 && (
                    <motion.div
                      className="absolute left-0 h-[2px] w-full bg-blue-500 shadow-[0_0_8px_1px_rgba(59,130,246,0.8)]"
                      animate={{ top: ["0%", "100%", "0%"] }}
                      transition={{
                        repeat: Infinity,
                        duration: 1.5,
                        ease: "linear",
                      }}
                    />
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="card"
                  initial={{ opacity: 0, scale: 0.5, rotateY: 90 }}
                  animate={{ opacity: 1, scale: 1, rotateY: 0, y: [0, -6, 0] }}
                  transition={{
                    y: { repeat: Infinity, duration: 2.5, ease: "easeInOut" },
                    type: "spring",
                    damping: 14,
                  }}
                  className="relative flex h-11 w-16 flex-col justify-between rounded-md border border-white/10 bg-linear-to-tr from-slate-100 to-white p-1.5 shadow-xl"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex h-2.5 w-3.5 items-center justify-center rounded-[2px] bg-yellow-400 opacity-90 shadow-sm">
                      <div className="h-px w-full bg-yellow-600/30" />
                    </div>
                    {/* <motion.div
                       animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
                       transition={{ repeat: Infinity, duration: 2, repeatDelay: 1 }}
                     >
                        <Sparkles className="h-3 w-3 text-yellow-500" />
                     </motion.div> */}
                  </div>
                  <div className="space-y-1">
                    <div className="h-1 w-full rounded-full bg-slate-900/10" />
                    <div className="h-1 w-2/3 rounded-full bg-slate-900/10" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function Node({
  position,
  active,
  current,
  icon: Icon,
  label,
}: {
  position: string;
  active: boolean;
  current: boolean;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <div
      className="absolute top-1/2 z-10 flex flex-col items-center justify-center"
      style={{ left: position, transform: "translate(-50%, -50%)" }}
    >
      <motion.div
        className={`relative flex h-8 w-8 items-center justify-center rounded-full border-2 backdrop-blur-sm transition-colors duration-500 ${
          active
            ? "border-white bg-white/10 text-white"
            : "border-white/20 bg-white/5 text-white/40"
        }`}
        animate={{ scale: active ? 1 : 0.9 }}
      >
        {current && (
          <motion.div
            className="absolute inset-0 rounded-full bg-white/30"
            initial={{ scale: 1, opacity: 1 }}
            animate={{ scale: 1.8, opacity: 0 }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
          />
        )}
        <Icon className="z-10 h-4 w-4" />
      </motion.div>

      <span
        className={`absolute top-10 text-[10px] font-medium transition-colors duration-500 ${
          active ? "text-white" : "text-white/40"
        }`}
      >
        {label}
      </span>
    </div>
  );
}
