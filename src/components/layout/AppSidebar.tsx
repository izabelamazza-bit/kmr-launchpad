import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  FileWarning,
  Building2,
  Users,
  MessageSquare,
  Bot,
  Headset,
  LayoutDashboard,
  Wallet,
  FolderCheck,
  LogOut,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import logoKMR from "@/assets/Logo_KMR.png";
import { supabase } from "@/integrations/supabase/client";
import { useEnvironment } from "@/contexts/EnvironmentContext";

const operacao = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Auditoria", url: "/auditoria", icon: ShieldCheck },
  { title: "Sinistros", url: "/sinistros", icon: FileWarning },
  { title: "Portal Loft", url: "/portal-loft", icon: Building2 },
];

const idealiItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Carteira", url: "/carteira-ideali", icon: Wallet },
  { title: "Documentação", url: "/documentacao-ideali", icon: FolderCheck },
];

const administracao = [
  { title: "Usuários", url: "/cadastros/usuarios", icon: Users },
  { title: "Leads", url: "/cadastros/leads", icon: MessageSquare },
  { title: "Agente de IA", url: "/agente", icon: Bot },
  { title: "Atendimento", url: "/atendimento", icon: Headset },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { environment } = useEnvironment();
  const isIdeali = environment === "Ideali";

  const isActive = (url: string) =>
    url === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(url);

  const mainItems = isIdeali ? idealiItems : operacao;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-16 justify-center px-3">
        <img
          src={logoKMR}
          alt="KMR"
          className={collapsed ? "h-6 w-auto mx-auto" : "h-8 w-auto"}
        />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Operação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <NavLink to={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="pb-3">
        {!isIdeali && (
          <SidebarGroup className="py-0">
            <SidebarGroupLabel className="text-[10px] uppercase tracking-wide">
              Administração
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {administracao.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      size="sm"
                      isActive={isActive(item.url)}
                      tooltip={item.title}
                    >
                      <NavLink to={item.url} className="flex items-center gap-2">
                        <item.icon className="h-3.5 w-3.5 opacity-70" />
                        <span className="text-xs font-normal text-muted-foreground">
                          {item.title}
                        </span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="sm" onClick={handleLogout} tooltip="Sair">
              <LogOut className="h-3.5 w-3.5 opacity-70" />
              <span className="text-xs font-normal text-muted-foreground">Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

export default AppSidebar;