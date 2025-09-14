import { Outlet } from "react-router-dom";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Breadcrumbs } from "./Breadcrumbs";
import { ThemeToggle } from "./ThemeToggle";
export function DashboardLayout() {
  return <div className="flex min-h-screen w-full">
      <AppSidebar />
      <div className="flex-1 flex flex-col">
        <header className="h-16 flex items-center border-b border-border bg-card px-6 shadow-card">
          <SidebarTrigger className="mr-4" />
          <div className="ml-auto flex items-center space-x-4">
            <Breadcrumbs />
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 p-6 bg-background">
          <Outlet />
        </main>
      </div>
    </div>;
}