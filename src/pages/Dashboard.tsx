import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import logoKMR from "@/assets/Logo_KMR.png";
import { LogOut, Users, Building2, UserCircle, Package, MessageSquare, Bot, Headset, AlertTriangle, FileWarning, ShieldCheck, Settings } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { EnvironmentSelect } from "@/components/EnvironmentSelect";
import { useEnvironment } from "@/contexts/EnvironmentContext";
import { Wallet } from "lucide-react";

const menuItems = [
  { label: "Usuários", icon: Users, path: "/cadastros/usuarios", desc: "Gerenciar usuários do sistema" },
  { label: "Leads", icon: MessageSquare, path: "/cadastros/leads", desc: "Leads qualificados pelo agente de IA" },
  { label: "Agente de IA", icon: Bot, path: "/agente", desc: "Configure e treine o assistente virtual" },
  { label: "Atendimento", icon: Headset, path: "/atendimento", desc: "Acompanhe e gerencie conversas em tempo real" },
  { label: "Sinistros", icon: FileWarning, path: "/sinistros", desc: "Acompanhar inadimplências registradas" },
  { label: "Auditoria", icon: ShieldCheck, path: "/auditoria", desc: "Auditoria de contratos de garantidoras" },
  { label: "Configurações", icon: Settings, path: "/configuracoes", desc: "Integrações de IA e chaves de API" },
];

const carteiraIdealiItem = {
  label: "Carteira Ideali",
  icon: Wallet,
  path: "/carteira-ideali",
  desc: "Dashboard e importação da carteira Ideali",
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { environment } = useEnvironment();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) { navigate("/login"); return; }
      setUser(session.user);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { navigate("/login"); return; }
      setUser(session.user);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/40">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  const displayName = user?.user_metadata?.full_name || user?.email || "";

  const visibleItems =
    environment === "Ideali"
      ? [...menuItems.filter((i) => i.path !== "/auditoria"), carteiraIdealiItem]
      : menuItems;

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="bg-card border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <img src={logoKMR} alt="KMR" className="h-8 w-auto" />
          <div className="flex items-center gap-4">
            <EnvironmentSelect />
            <span className="text-sm text-muted-foreground hidden sm:inline">
              Olá, <strong className="text-foreground">{displayName}</strong>
            </span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-1" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-semibold text-foreground mb-2">Dashboard</h1>
        <p className="text-muted-foreground mb-8">Bem-vindo ao painel administrativo da KMR.</p>

        <div className="mb-8 bg-card border rounded-lg p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="bg-primary/10 rounded-md p-2">
              <AlertTriangle className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Registrar novo sinistro</p>
              <p className="text-sm text-muted-foreground">
                Cadastre uma nova inadimplência de aluguel com débitos e documentos.
              </p>
            </div>
          </div>
          <Button
            onClick={() => navigate("/novo-sinistro")}
            className="min-h-[44px] w-full sm:w-auto"
          >
            Registrar novo sinistro
          </Button>
        </div>

        <h2 className="text-lg font-medium text-foreground mb-4">Cadastros</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {visibleItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="bg-card rounded-lg border shadow-sm p-6 text-left hover:border-primary/50 hover:shadow-md transition-all group"
            >
              <item.icon className="h-8 w-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
              <p className="font-medium text-foreground">{item.label}</p>
              <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
