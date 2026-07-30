import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Building2, AlertTriangle, FileWarning, ShieldCheck, ArrowRight } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { KpiCard } from "@/components/KpiCard";
import { useDashboardResumo } from "@/hooks/useDashboardResumo";
import { usePortalLoft, useResumo } from "@/pages/portal-loft/lib/usePortalLoft";
import { ResumoCards } from "@/pages/portal-loft/components/ResumoCards";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { auditoria, sinistros } = useDashboardResumo();
  const loft = usePortalLoft();
  const loftResumo = useResumo(loft.snapshots, loft.movements);

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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-semibold text-foreground mb-2">Dashboard</h1>
        <p className="text-muted-foreground mb-8">
          Bem-vindo{displayName ? `, ${displayName}` : ""}. Painel administrativo da KMR.
        </p>

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

          <div className="space-y-8">
            <section>
              <SectionHeader
                icon={ShieldCheck}
                title="Auditoria"
                desc="Auditoria de contratos de garantidoras"
                onClick={() => navigate("/auditoria")}
              />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <KpiCard label="Total" value={auditoria.total} color="#0F2A44" />
                <KpiCard label="Auditoria completa" value={auditoria.completa} color="#27AE60" />
                <KpiCard label="Com pendências" value={auditoria.pendencia} color="#F2994A" />
                <KpiCard label="Com alerta" value={auditoria.alerta} color="#EB5757" />
              </div>
            </section>

            <section>
              <SectionHeader
                icon={FileWarning}
                title="Sinistros"
                desc="Acompanhar inadimplências registradas"
                onClick={() => navigate("/sinistros")}
              />
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <KpiCard label="Total" value={sinistros.total} color="#0F2A44" />
                <KpiCard label="Em análise" value={sinistros.emAnalise} color="#F2C94C" />
                <KpiCard label="Em pagamento" value={sinistros.pagamento} color="#2F80ED" />
                <KpiCard label="Pago" value={sinistros.pago} color="#27AE60" />
                <KpiCard label="Cancelado" value={sinistros.cancelado} color="#EB5757" />
              </div>
            </section>

            <section>
              <SectionHeader
                icon={Building2}
                title="Portal Loft"
                desc="Snapshots e movimentações do portal da garantidora Loft"
                onClick={() => navigate("/portal-loft")}
              />
              {loft.currentImport ? (
                <ResumoCards
                  total={loftResumo.total}
                  ativos={loftResumo.ativos}
                  cancelados={loftResumo.cancelados}
                  exonerados={loftResumo.exonerados}
                  novos={loft.novos}
                  mudancasStatus={loftResumo.mudancasStatus}
                  temAnterior={!!loft.previousImport}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  {loft.loading ? "Carregando..." : "Nenhuma importação registrada ainda."}
                </p>
              )}
            </section>
          </div>
      </main>
    </div>
  );
};

function SectionHeader({
  icon: Icon,
  title,
  desc,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between gap-3 mb-3 text-left group"
    >
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-primary" />
        <div>
          <p className="font-medium text-foreground">{title}</p>
          <p className="text-sm text-muted-foreground">{desc}</p>
        </div>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
    </button>
  );
}

export default Dashboard;
