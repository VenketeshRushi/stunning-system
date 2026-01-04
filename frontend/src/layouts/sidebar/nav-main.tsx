import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "react-router-dom";
import { type NavigationGroup } from "@/types/navigation";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";

interface NavMainProps {
  navigationGroups: NavigationGroup[];
}

export function NavMain({ navigationGroups }: NavMainProps) {
  const location = useLocation();
  const isMobile = useIsMobile();

  return (
    <TooltipProvider delayDuration={0}>
      <div className={cn(isMobile && "space-y-4 py-2 animate-out")}>
        {navigationGroups.map(group => (
          <SidebarGroup key={group.id}>
            <SidebarGroupLabel
              className={cn(
                "px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider"
              )}
            >
              {group.label}
            </SidebarGroupLabel>

            <SidebarMenu className='space-y-1'>
              {group.items.map(item => {
                const isActive =
                  location.pathname === item.url ||
                  location.pathname.startsWith(item.url + "/");

                const Icon = item.icon;

                return (
                  <SidebarMenuItem key={item.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          className={cn(
                            "group relative w-full justify-start gap-3 px-3 py-2.5 text-sm font-medium transition-all",
                            "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                            isActive &&
                              "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                          )}
                        >
                          <Link
                            to={item.url}
                            className='flex items-center gap-3 flex-1 min-w-0'
                          >
                            {Icon && (
                              <Icon
                                className={cn(
                                  "size-4 shrink-0 transition-transform group-hover:scale-110",
                                  isActive && "stroke-primary font-bold"
                                )}
                              />
                            )}
                            <span className='truncate flex-1'>{item.name}</span>
                            {/* {item.badge && (
                              <Badge
                                variant='secondary'
                                className={cn(
                                  "ml-auto shrink-0 h-5 min-w-5 px-1.5 text-xs font-semibold",
                                  isActive &&
                                    "bg-primary text-primary-foreground"
                                )}
                              >
                                {item.badge}
                              </Badge>
                            )} */}
                          </Link>
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      <TooltipContent
                        side='right'
                        className='flex flex-col gap-1'
                        sideOffset={8}
                      >
                        <p className='font-semibold'>{item.name}</p>
                      </TooltipContent>
                    </Tooltip>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </div>
    </TooltipProvider>
  );
}
