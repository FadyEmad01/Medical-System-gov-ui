"use client";

import { BookOpen, Bot, CircleUser, Hospital, House, IdCard, Settings2, SquareTerminal } from "lucide-react";
import type * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Logo } from "./logo";
import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";

// This is sample data.
const data = {
  user: {
    name: "fady emad",
    email: "m@example.com",
    avatar: "https://i.pravatar.cc/300",
  },
  navMain: [
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
  ],
};

export function AppSidebar({ dir, ...props }: React.ComponentProps<typeof Sidebar>) {
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
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
