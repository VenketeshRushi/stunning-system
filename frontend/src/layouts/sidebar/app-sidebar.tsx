import React from "react";
import {
  BadgeCheck,
  LayoutDashboard,
  LayoutTemplate,
  MessageSquare,
  UserCheck2Icon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenuButton,
  SidebarRail,
} from "@/components/ui/sidebar";
import GenieLogo from "../GenieLogo";
import { Link } from "react-router-dom";
import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { NavigationGroup } from "@/types/navigation";

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const navigationGroups: NavigationGroup[] = [
    {
      id: "main",
      label: "Main",
      items: [
        {
          id: "dashboard",
          name: "Dashboard",
          url: "/dashboard",
          icon: LayoutDashboard,
          description: "Overview and analytics",
        },
        {
          id: "chat",
          name: "AI Chatbot",
          url: "/chat",
          icon: MessageSquare,
          badge: "3",
          description: "Communication hub",
        },
      ],
    },
    // {
    //   id: "workspace",
    //   label: "Workspace",
    //   items: [
    //     {
    //       id: "projects",
    //       name: "Projects",
    //       url: "/projects",
    //       icon: FolderKanban,
    //       description: "Manage your projects",
    //     },
    //     {
    //       id: "reports",
    //       name: "Reports",
    //       url: "/reports",
    //       icon: BarChart3,
    //       description: "Analytics and insights",
    //     },
    //     {
    //       id: "documents",
    //       name: "Documents",
    //       url: "/documents",
    //       icon: FileText,
    //       description: "File management",
    //     },
    //   ],
    // },
    {
      id: "administration",
      label: "Administration",
      items: [
        {
          id: "users",
          name: "User Management",
          url: "/admin/users",
          icon: UserCheck2Icon,
          description: "Manage team members",
          roles: ["admin"],
        },
        {
          id: "admin-dashboard",
          name: "Admin Dashboard",
          url: "/admin/dashboard",
          icon: LayoutTemplate,
          description: "Admin Dashboard",
          roles: ["admin"],
        },
      ],
    },
    {
      id: "settings",
      label: "Settings",
      items: [
        {
          id: "account",
          name: "Account",
          url: "/account",
          icon: BadgeCheck,
          description: "Personal settings",
        },
      ],
    },
  ];

  return (
    <Sidebar variant='sidebar' side='left' collapsible='icon' {...props}>
      <SidebarHeader>
        <SidebarMenuButton
          size='lg'
          className='shadow-sm data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-sidebar-accent/50 transition-colors'
          asChild
        >
          <Link
            to='/dashboard'
            className='flex w-full items-center gap-3'
            aria-label='Navigate to dashboard'
          >
            <div className='flex aspect-square size-8 items-center justify-center rounded-lg'>
              <GenieLogo size={32} />
            </div>
            <div className='grid flex-1 text-left text-sm leading-tight'>
              <span className='truncate font-semibold text-base'>Genie</span>
              <span className='truncate text-xs text-muted-foreground'>
                AI Platform
              </span>
            </div>
          </Link>
        </SidebarMenuButton>
      </SidebarHeader>
      <SidebarContent>
        <ScrollArea className='h-full'>
          <NavMain navigationGroups={navigationGroups} />
        </ScrollArea>
      </SidebarContent>

      <SidebarFooter className='border-t p-2'>
        <NavUser />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
