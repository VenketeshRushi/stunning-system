import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { AppSidebar } from "@/layouts/sidebar/app-sidebar";
import { DynamicBreadcrumb } from "@/layouts/sidebar/dynamic-breadcrumb";
import { ThemeToggle } from "./ThemeToggle";
import { Spinner } from "@/components/ui/spinner";

export default function PrivateLayout() {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "18rem",
          "--sidebar-width-mobile": "18rem",
        } as React.CSSProperties
      }
    >
      <AppSidebar />

      <SidebarInset className='flex flex-col h-screen overflow-hidden'>
        <header className='sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur-md supports-backdrop-filter:bg-background/60'>
          <div className='flex items-center gap-2'>
            <SidebarTrigger className='-ml-1' />
            <Separator orientation='vertical' className='mr-2 h-4' />
            <DynamicBreadcrumb />
          </div>

          <div className='ml-auto flex items-center gap-2'>
            <ThemeToggle className='shrink-0' />
          </div>
        </header>
        <main className='flex-1 p-4 w-full h-full max-h-full overflow-y-auto overflow-x-hidden bg-gradient-to-b from-background via-background to-muted/20'>
          <Suspense
            fallback={
              <div className='flex h-[50vh] w-full items-center justify-center'>
                <Spinner className='text-primary/50' />
              </div>
            }
          >
            <div className='flex h-full w-full'>
              <Outlet />
            </div>
          </Suspense>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
