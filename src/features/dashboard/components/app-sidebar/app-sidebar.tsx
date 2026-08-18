"use client";

import {
  CalendarDays,
  CircleUser,
  FilePlus2,
  FileSearch,
  FolderCog,
  House,
  IdCard,
  ScanLine,
  Shield,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useMe } from "@/features/auth/hooks/use-me";
import { Logo } from "./logo";
import { type NavGroup, NavMain } from "./nav-main";
import { NavUser } from "./nav-user";

export function AppSidebar({
  dir,
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { data: user } = useMe();
  const t = useTranslations("common");

  const groups: NavGroup[] = [
    {
      label: t("nav.groups.platform"),
      items: [{ title: t("nav.home"), url: "/dashboard", icon: House }],
    },
    {
      label: t("nav.groups.insurance"),
      items: [
        {
          title: t("nav.profile"),
          url: "/dashboard/profile",
          icon: CircleUser,
        },
        {
          title: t("nav.insuranceCard"),
          url: "/dashboard/insurance-card",
          icon: IdCard,
        },
        {
          title: t("nav.apply"),
          url: "/dashboard/insurance",
          icon: FilePlus2,
        },
      ],
    },
    {
      label: t("nav.groups.appointments"),
      items: [
        {
          title: t("nav.appointments"),
          url: "/dashboard/appointments",
          icon: CalendarDays,
        },
      ],
    },
  ];

  if (user?.role === "Doctor") {
    groups.push({
      label: t("nav.groups.admin"),
      items: [
        {
          title: t("nav.adminVerification"),
          url: "/dashboard/admin/verification",
          icon: ScanLine,
        },
      ],
    });
  }

  // The admin area is gated by <AdminGuard> on the page; keep it out of the
  // sidebar entirely for everyone else.
  if (user?.role === "Admin") {
    groups.push({
      label: t("nav.groups.admin"),
      items: [
        { title: t("nav.admin"), url: "/dashboard/admin", icon: Shield },
        {
          title: t("nav.adminApplications"),
          url: "/dashboard/admin/applications",
          icon: FileSearch,
        },
        {
          title: t("nav.adminCategories"),
          url: "/dashboard/admin/categories",
          icon: FolderCog,
        },
        {
          title: t("nav.adminCards"),
          url: "/dashboard/admin/cards",
          icon: IdCard,
        },
        {
          title: t("nav.adminVerification"),
          url: "/dashboard/admin/verification",
          icon: ScanLine,
        },
      ],
    });
  }

  // The dashboard layout is wrapped in <AuthGuard>, which guarantees `user` is
  // non-null by the time this renders. While the query is hydrating on first
  // paint, we simply omit the footer to avoid a flash of empty initials.
  return (
    <Sidebar
      collapsible="icon"
      dir={dir}
      side={dir === "rtl" ? "right" : "left"}
      {...props}
    >
      <SidebarHeader>
        <Logo />
      </SidebarHeader>
      <SidebarContent>
        <NavMain groups={groups} />
      </SidebarContent>
      {user ? (
        <SidebarFooter>
          <NavUser user={user} />
        </SidebarFooter>
      ) : null}
      <SidebarRail />
    </Sidebar>
  );
}
