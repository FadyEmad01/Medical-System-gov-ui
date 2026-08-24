import { cookies } from "next/headers";

import { AuthGuard } from "@/components/auth-guard";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import AppHeader from "@/features/dashboard/components/app-header/app-header";
import { AppSidebar } from "@/features/dashboard/components/app-sidebar/app-sidebar";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function DashboardLayout({ children, params }: Props) {
  const { locale } = await params;
  const dir = locale === "ar" ? "rtl" : "ltr";

  // Restore last sidebar open/collapsed choice (cookie written by ui/sidebar.tsx on every toggle).
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";

  return (
    <AuthGuard>
      <SidebarProvider dir={dir} defaultOpen={defaultOpen}>
        <AppSidebar dir={dir} />
        <SidebarInset>
          <AppHeader />
          <div className="flex flex-1 flex-col gap-4 p-4">{children}</div>
          <Toaster theme="system" dir={dir} />
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}
