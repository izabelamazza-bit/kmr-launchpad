import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { EnvironmentSelect } from "@/components/EnvironmentSelect";

const AppLayout = () => (
  <SidebarProvider>
    <div className="min-h-screen flex w-full bg-muted/40">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 flex items-center justify-between border-b bg-card px-2 sm:px-4 sticky top-0 z-40">
          <SidebarTrigger />
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:inline">Empresa ativa</span>
            <EnvironmentSelect />
          </div>
        </header>
        <div className="flex-1 min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  </SidebarProvider>
);

export default AppLayout;