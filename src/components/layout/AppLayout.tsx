import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";

const AppLayout = () => (
  <SidebarProvider>
    <div className="min-h-screen flex w-full bg-muted/40">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-10 flex items-center border-b bg-card px-2 sticky top-0 z-40">
          <SidebarTrigger />
        </div>
        <div className="flex-1 min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  </SidebarProvider>
);

export default AppLayout;