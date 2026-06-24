import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import logoKMR from "@/assets/Logo_KMR.png";
import { LogOut, Plus, Search, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export interface CrudLayoutProps {
  title: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onNewClick?: () => void;
  newLabel?: string;
  extraActions?: ReactNode;
  children: ReactNode;
}

const CrudLayout = ({
  title,
  searchValue,
  onSearchChange,
  onNewClick,
  newLabel = "Novo cadastro",
  extraActions,
  children,
}: CrudLayoutProps) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="bg-card border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <img src={logoKMR} alt="KMR" className="h-8 w-auto hidden sm:block" />
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-1" />
            Sair
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">{title}</h1>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {extraActions}
            {onNewClick && newLabel && (
              <Button onClick={onNewClick} className="min-h-[44px] w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-1" />
                {newLabel}
              </Button>
            )}
          </div>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 min-h-[44px]"
          />
        </div>

        {children}
      </main>
    </div>
  );
};

export default CrudLayout;
