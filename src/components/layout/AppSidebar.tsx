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
  LogOut,
  Wallet,
  FolderOpen,
  Receipt,
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

const dashboard = { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard };
const auditoria = { title: "Auditoria", url: "/auditoria", icon: ShieldCheck };
const sinistros = { title: "Sinistros", url: "/sinistros", icon: FileWarning };
const portalLoft = { title: "Portal Loft", url: "/portal-loft", icon: Building2 };
const carteira = { title: "Carteira", url: "/carteira-ideali", icon: Wallet };
const documentacao = { title: "Documentação", url: "/documentacao-ideali", icon: FolderOpen };
const cobmais = { title: "Cobmais", url: "/cobmais", icon: Receipt };

const operacaoPorEmpresa = {
  Rotina: [dashboard, auditoria, sinistros, portalLoft, cobmais],
  Alugar: [dashboard, auditoria, sinistros],
  Ideali: [dashboard, carteira, documentacao],
} as const;

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
  const operacaoItems = operacaoPorEmpresa[environment] ?? operacaoPorEmpresa.Rotina;

  const isActive = (url: string) =>
    url === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(url);

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
              {operacaoItems.map((item) => (
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