import MakeCardBanner from "@/features/dashboard/components/home/make-card-banner";
import WelcomeBanner from "@/features/dashboard/components/home/welcome-banner";

export default function page() {
  return (
    <div className="w-full grid lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2">
        <WelcomeBanner />
      </div>
      <div>
        <MakeCardBanner />
      </div>
    </div>
  );
}
