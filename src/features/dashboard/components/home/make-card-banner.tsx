// "use client";

// import React, { useEffect, useState } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { 
//   UploadCloud, 
//   ShieldCheck, 
//   CreditCard, 
//   FileText, 
//   Sparkles 
// } from "lucide-react";

// export default function MakeCardBanner() {
//   const [step, setStep] = useState(0);

//   // Auto-play the illustration steps continuously
//   useEffect(() => {
//     const timer = setInterval(() => {
//       setStep((prev) => (prev >= 2 ? 0 : prev + 1));
//     }, 3000);
//     return () => clearInterval(timer);
//   }, []);

//   // Calculate the progress line width (0% -> 50% -> 100%)
//   const progress = step === 0 ? 0 : step === 1 ? 0.5 : 1;

//   return (
//     <div className="relative w-full max-w-[400px] h-[340px] mx-auto rounded-2xl border bg-card shadow-sm overflow-hidden flex flex-col">
//       {/* --- BACKGROUND GRID --- */}
//       <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:16px_16px]" />
      
//       {/* Fade Gradient behind text for readability */}
//       <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-card via-card/90 to-transparent z-10 pointer-events-none" />

//       {/* --- FRONT TEXT OVERLAY --- */}
//       <div className="relative z-20 pt-8 px-6 text-center pointer-events-none">
//         <h2 className="text-xl font-bold tracking-tight text-foreground">
//           Get your card in a few steps
//         </h2>
//         <p className="text-[13px] text-muted-foreground mt-1">
//           Upload files, get authorized, and receive your card.
//         </p>
//       </div>

//       {/* --- HORIZONTAL ANIMATION FLOW --- */}
//       <div className="relative z-10 flex-1 w-full px-12 flex items-center justify-center mt-6">
//         <div className="relative w-full h-10">
          
//           {/* Dashed Background Track Line */}
//           <div className="absolute top-1/2 left-0 w-full h-0 border-t-2 border-dashed border-muted -translate-y-1/2" />
          
//           {/* Animated Solid Progress Line */}
//           <motion.div 
//             className="absolute top-1/2 left-0 w-full h-[2px] bg-primary -translate-y-1/2 origin-left"
//             initial={{ scaleX: 0 }}
//             animate={{ scaleX: progress }}
//             transition={{ duration: 0.6, ease: "easeInOut" }}
//           />

//           {/* Flow Nodes */}
//           <Node position="0%" active={step >= 0} current={step === 0} icon={UploadCloud} label="Upload" />
//           <Node position="50%" active={step >= 1} current={step === 1} icon={ShieldCheck} label="Authorize" />
//           <Node position="100%" active={step >= 2} current={step === 2} icon={CreditCard} label="Finished" />

//           {/* Floating Payload (The File transforming into the Card) */}
//           <motion.div
//             className="absolute top-1/2 -mt-[72px] w-12 h-16 flex items-center justify-center z-30"
//             animate={{ 
//               left: step === 0 ? "0%" : step === 1 ? "50%" : "100%", 
//               x: "-50%" 
//             }}
//             transition={{ type: "spring", damping: 16, stiffness: 90 }}
//           >
//             <AnimatePresence mode="wait">
//               {step < 2 ? (
//                 // Step 0 & 1: The Document
//                 <motion.div
//                   key="document"
//                   initial={{ opacity: 0, scale: 0.5, y: 10 }}
//                   animate={{ opacity: 1, scale: 1, y: [0, -6, 0] }}
//                   exit={{ opacity: 0, scale: 0.5, rotate: 10 }}
//                   transition={{ 
//                      y: { repeat: Infinity, duration: 2, ease: "easeInOut" },
//                      duration: 0.3
//                   }}
//                   className="relative w-10 h-14 bg-background border border-border rounded shadow-md flex flex-col items-center justify-center overflow-hidden"
//                 >
//                   <FileText className="w-4 h-4 text-muted-foreground mb-1.5" />
//                   <div className="w-6 h-0.5 bg-muted-foreground/30 rounded-full" />
//                   <div className="w-4 h-0.5 bg-muted-foreground/30 rounded-full mt-1" />

//                   {/* Step 1: Scanner effect over the document */}
//                   {step === 1 && (
//                     <motion.div 
//                       className="absolute left-0 w-full h-[2px] bg-blue-500 shadow-[0_0_8px_1px_rgba(59,130,246,0.8)]"
//                       animate={{ top: ["0%", "100%", "0%"] }}
//                       transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
//                     />
//                   )}
//                 </motion.div>
//               ) : (
//                 // Step 2: The Finished Card
//                 <motion.div
//                   key="card"
//                   initial={{ opacity: 0, scale: 0.5, rotateY: 90 }}
//                   animate={{ opacity: 1, scale: 1, rotateY: 0, y: [0, -6, 0] }}
//                   transition={{ 
//                     y: { repeat: Infinity, duration: 2.5, ease: "easeInOut" },
//                     type: "spring", damping: 14
//                   }}
//                   className="relative w-16 h-11 bg-gradient-to-tr from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 rounded-md shadow-xl border border-white/10 dark:border-black/10 flex flex-col justify-between p-1.5"
//                 >
//                    <div className="flex justify-between items-start">
//                      <div className="w-3.5 h-2.5 bg-yellow-400 rounded-[2px] opacity-90 shadow-sm flex items-center justify-center">
//                         <div className="w-full h-px bg-yellow-600/30" />
//                      </div>
//                      <motion.div
//                        animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
//                        transition={{ repeat: Infinity, duration: 2, repeatDelay: 1 }}
//                      >
//                         <Sparkles className="w-3 h-3 text-yellow-400" />
//                      </motion.div>
//                    </div>
//                    <div className="space-y-1">
//                      <div className="h-1 w-full bg-white/20 dark:bg-black/10 rounded-full" />
//                      <div className="h-1 w-2/3 bg-white/20 dark:bg-black/10 rounded-full" />
//                    </div>
//                 </motion.div>
//               )}
//             </AnimatePresence>
//           </motion.div>
//         </div>
//       </div>
//     </div>
//   );
// }

// // ==========================================
// // Individual Node Component
// // ==========================================

// function Node({ position, active, current, icon: Icon, label }: { position: string, active: boolean, current: boolean, icon: any, label: string }) {
//   return (
//     <div 
//       className="absolute top-1/2 flex flex-col items-center justify-center z-10"
//       style={{ left: position, transform: "translate(-50%, -50%)" }}
//     >
//       {/* Node Circle */}
//       <motion.div 
//         className={`relative w-8 h-8 rounded-full border-2 flex items-center justify-center bg-card transition-colors duration-500 ${
//           active ? "border-primary text-primary" : "border-muted text-muted-foreground/50"
//         }`}
//         animate={{ scale: active ? 1 : 0.9 }}
//       >
//         {/* Pulsing glow ring when current */}
//         {current && (
//            <motion.div 
//              className="absolute inset-0 rounded-full bg-primary/30"
//              initial={{ scale: 1, opacity: 1 }}
//              animate={{ scale: 1.8, opacity: 0 }}
//              transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
//            />
//         )}
//         <Icon className="w-4 h-4 z-10" />
//       </motion.div>

//       {/* Label under node */}
//       <span 
//         className={`absolute top-10 text-[10px] font-medium transition-colors duration-500 ${
//           active ? "text-foreground" : "text-muted-foreground/50"
//         }`}
//       >
//         {label}
//       </span>
//     </div>
//   );
// }

"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  UploadCloud, 
  ShieldCheck, 
  CreditCard, 
  FileText, 
  Sparkles 
} from "lucide-react";

export default function MakeCardBanner() {
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
          Get your card in a few steps
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

          <Node position="0%" active={step >= 0} current={step === 0} icon={UploadCloud} label="Upload" />
          <Node position="50%" active={step >= 1} current={step === 1} icon={ShieldCheck} label="Authorize" />
          <Node position="100%" active={step >= 2} current={step === 2} icon={CreditCard} label="Finished" />

          <motion.div
            className="absolute top-1/2 -mt-[72px] z-30 flex h-16 w-12 items-center justify-center"
            animate={{ 
              left: step === 0 ? "0%" : step === 1 ? "50%" : "100%", 
              x: "-50%" 
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
                     duration: 0.3
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
                      transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
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
                    type: "spring", damping: 14
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

function Node({ position, active, current, icon: Icon, label }: { position: string, active: boolean, current: boolean, icon: any, label: string }) {
  return (
    <div 
      className="absolute top-1/2 z-10 flex flex-col items-center justify-center"
      style={{ left: position, transform: "translate(-50%, -50%)" }}
    >
      <motion.div 
        className={`relative flex h-8 w-8 items-center justify-center rounded-full border-2 backdrop-blur-sm transition-colors duration-500 ${
          active ? "border-white bg-white/10 text-white" : "border-white/20 bg-white/5 text-white/40"
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