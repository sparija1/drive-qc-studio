import { Outlet } from "react-router-dom";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Breadcrumbs } from "./Breadcrumbs";
export function DashboardLayout() {
  return <div className="flex min-h-screen w-full">
      <AppSidebar />
      <div className="flex-1 flex flex-col">
        <header className="h-16 flex items-center border-b border-border bg-card px-6 shadow-card">
          <SidebarTrigger className="mr-4" />
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
                
              </div>
              
            </div>
          </div>
          <div className="ml-auto">
            <Breadcrumbs />
          </div>
        </header>
        <main className="flex-1 p-6 bg-background">
          <Outlet />
        </main>
      </div>
    </div>;
}