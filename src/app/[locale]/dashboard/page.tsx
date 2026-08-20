import MakeCardBanner from "@/features/dashboard/components/home/make-card-banner";
import { QuickActions } from "@/features/dashboard/components/home/quick-actions";
import { RoleHomeRedirect } from "@/features/dashboard/components/home/role-home-redirect";
import { StatusCards } from "@/features/dashboard/components/home/status-cards";
import WelcomeBanner from "@/features/dashboard/components/home/welcome-banner";

export default function page() {
  return (
    <RoleHomeRedirect>
      <div className="w-full grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <WelcomeBanner />
        </div>
        <div>
          <MakeCardBanner />
        </div>
      </div>
      <StatusCards />
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-start-3">
          <QuickActions />
        </div>
      </div>
    </RoleHomeRedirect>
  );
}
