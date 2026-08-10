import { ArrowRight } from "lucide-react";

export default function WelcomeBanner() {
  return (
    <div className="group relative flex min-h-[220px] w-full items-end overflow-hidden rounded-xl bg-slate-900 shadow-md">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/p2.jpg')" }}
      />

      {/* Gradient Overlays (Replicates the dark shading on the left & bottom of the image) */}
      <div className="absolute inset-0 bg-linear-to-tr from-primary/90 via-primary/50 to-transparent" />
      <div className="absolute inset-0 bg-linear-to-t from-primary/80 via-transparent to-transparent" />

      {/* Content Container */}
      <div className="relative z-10 flex w-full justify-between gap-4 p-6 sm:p-8 text-white">
        <div className="min-w-0 max-w-md">
          <h3 className="text-balance text-2xl font-bold leading-tight tracking-tight sm:text-3xl ">
            Welcome back, <span className="font-almarai">Fady Emad!</span>
          </h3>
          <p className="mt-2 text-pretty text-sm leading-snug text-gray-300 sm:text-base">
            You have 2 new messages and 1 unread notification.
          </p>

          {/* Action Link / Button */}
          <button
            type="button"
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-white transition-all hover:text-gray-300"
          >
            Explore odds
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );
}
