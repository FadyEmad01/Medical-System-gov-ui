"use client";

import { CircleUser, Hospital, House, IdCard } from "lucide-react";
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
import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";

const navMain = [
  {
    title: "Home",
    url: "/dashboard",
    icon: House,
    isActive: true,
  },
  {
    title: "Hospitals",
    url: "#",
    icon: Hospital,
  },
  {
    title: "My insurance card",
    url: "/dashboard/insurance-card",
    icon: IdCard,
  },
  {
    title: "Profile",
    url: "#",
    icon: CircleUser,
  },
];

export function AppSidebar({
  dir,
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { data: user } = useMe();

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
        <NavMain items={navMain} />
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
