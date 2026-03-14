import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import logoKMR from "@/assets/Logo_KMR.png";
import { LogOut, Users, Building2, UserCircle, Package, MessageSquare } from "lucide-react";
import type { User } from "@supabase/supabase-js";

const menuItems = [
  { label: "Usuários", icon: Users, path: "/cadastros/usuarios", desc: "Gerenciar usuários do sistema" },
  { label: "Empresas", icon: Building2, path: "/cadastros/empresas", desc: "Gerenciar empresas cadastradas" },
  { label: "Pessoas", icon: UserCircle, path: "/cadastros/pessoas", desc: "Gerenciar pessoas cadastradas" },
  { label: "Produtos e Serviços", icon: Package, path: "/cadastros/produtos-servicos", desc: "Gerenciar produtos e serviços" },
  { label: "Leads", icon: MessageSquare, path: "/cadastros/leads", desc: "Leads qualificados pelo agente de IA" },
];

const Dashboard = () => {
  const navigate = useNavigate();
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

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="bg-card border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <img src={logoKMR} alt="KMR" className="h-8 w-auto" />
          <div className="flex items-center gap-4">
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

        <h2 className="text-lg font-medium text-foreground mb-4">Cadastros</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {menuItems.map((item) => (
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
