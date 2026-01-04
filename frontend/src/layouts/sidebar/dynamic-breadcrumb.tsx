import React, { useMemo } from "react";
import { useLocation, Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from "@/components/ui/breadcrumb";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const routeLabels: Record<string, string> = {
  dashboard: "Dashboard",
  account: "Account",
  billing: "Billing & Invoices",
  admin: "Admin",
  users: "User Management",
  settings: "Settings",
  projects: "Projects",
  reports: "Reports",
  documents: "Documents",
  teams: "Teams",
  chat: "Chat",
};

const ITEMS_TO_SHOW = 3;
const MAX_CRUMB_LENGTH = 25;

export function DynamicBreadcrumb({ className }: { className?: string }) {
  const location = useLocation();

  const crumbs = useMemo(() => {
    const pathSegments = location.pathname.split("/").filter(Boolean);

    return pathSegments.map((segment, index) => {
      const href = "/" + pathSegments.slice(0, index + 1).join("/");

      let title = routeLabels[segment];
      const isId = segment.length > 20 && /\d/.test(segment);

      if (!title) {
        title = isId
          ? `${segment.slice(0, 8)}...`
          : segment
              .replace(/-/g, " ")
              .replace(/_/g, " ")
              .replace(/\b\w/g, c => c.toUpperCase());
      }

      // Truncate long titles
      if (title.length > MAX_CRUMB_LENGTH) {
        title = title.slice(0, MAX_CRUMB_LENGTH) + "...";
      }

      return { href, title, segment };
    });
  }, [location.pathname]);

  if (!crumbs.length) return null;

  const shouldCollapse = crumbs.length > ITEMS_TO_SHOW;
  const visibleFromIndex = shouldCollapse ? crumbs.length - 2 : 0;

  const collapsedItems = shouldCollapse
    ? crumbs.slice(0, visibleFromIndex)
    : [];

  const activeItems = crumbs.slice(visibleFromIndex);

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList className='flex-wrap'>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link
              to='/dashboard'
              className='flex items-center gap-1.5 text-sm transition-colors hover:text-foreground'
              aria-label='Home'
            >
              <Home className='h-4 w-4' />
              <span className='sr-only'>Home</span>
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {crumbs.length > 0 && (
          <BreadcrumbSeparator>
            <ChevronRight className='h-4 w-4' />
          </BreadcrumbSeparator>
        )}

        {shouldCollapse && (
          <>
            <BreadcrumbItem>
              <DropdownMenu>
                <DropdownMenuTrigger
                  className='flex items-center gap-1 rounded-md px-2 py-1 hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors'
                  aria-label='Show hidden breadcrumbs'
                >
                  <BreadcrumbEllipsis className='h-4 w-4' />
                </DropdownMenuTrigger>

                <DropdownMenuContent align='start' className='w-56'>
                  {collapsedItems.map(crumb => (
                    <DropdownMenuItem key={crumb.href} asChild>
                      <Link
                        to={crumb.href}
                        className='flex w-full cursor-pointer items-center gap-2 px-2 py-1.5'
                      >
                        <span className='truncate'>{crumb.title}</span>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </BreadcrumbItem>

            <BreadcrumbSeparator>
              <ChevronRight className='h-4 w-4' />
            </BreadcrumbSeparator>
          </>
        )}

        {activeItems.map((crumb, index) => {
          const isLast = index === activeItems.length - 1;

          return (
            <React.Fragment key={crumb.href}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage className='max-w-[180px] truncate font-semibold text-sm text-foreground'>
                    {crumb.title}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link
                      to={crumb.href}
                      className='max-w-[150px] truncate text-sm transition-colors hover:text-foreground'
                    >
                      {crumb.title}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>

              {!isLast && (
                <BreadcrumbSeparator>
                  <ChevronRight className='h-4 w-4' />
                </BreadcrumbSeparator>
              )}
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
