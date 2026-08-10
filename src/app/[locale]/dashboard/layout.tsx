import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import AppHeader from "@/features/dashboard/components/app-header/app-header";
import { AppSidebar } from "@/features/dashboard/components/app-sidebar/app-sidebar";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function DashboardLayout({ children, params }: Props) {
  const { locale } = await params;
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <SidebarProvider dir={dir}>
      <AppSidebar dir={dir} />
      <SidebarInset>
        <AppHeader />
        <div className="flex flex-1 flex-col gap-4 p-4">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
