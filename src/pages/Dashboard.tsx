import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Building2, AlertTriangle, FileWarning, ShieldCheck, ArrowRight, Briefcase } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { KpiCard } from "@/components/KpiCard";
import { ValueKpiCard } from "@/components/ValueKpiCard";
import { Card, CardContent } from "@/components/ui/card";
import { useDashboardResumo } from "@/hooks/useDashboardResumo";
import { useIdealiResumo } from "@/hooks/useIdealiResumo";
import { useEnvironment } from "@/contexts/EnvironmentContext";
import { garantidoraColor } from "@/pages/auditoria/lib/garantidoras";
import { formatBRL } from "@/pages/carteira-ideali/lib/useCarteiraIdeali";
import { usePortalLoft, useResumo } from "@/pages/portal-loft/lib/usePortalLoft";
import { ResumoCards } from "@/pages/portal-loft/components/ResumoCards";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { environment } = useEnvironment();
  const isIdeali = environment === "Ideali";
  const { auditoria, garantidoras, sinistros } = useDashboardResumo(environment);
  const { resumo: ideali, loading: idealiLoading } = useIdealiResumo();
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

        {!isIdeali && (
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
        )}

        {isIdeali ? (
          <section>
            <div className="flex items-center gap-3 mb-3">
              <Briefcase className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-foreground">Ideali</p>
                <p className="text-sm text-muted-foreground">
                  {idealiLoading ? "Carregando..." : "Carteira, documentação e inadimplência"}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <KpiCard
                label="Contratos ativos"
                value={ideali.contratosAtivos}
                color="#0F2A44"
                onClick={() => navigate("/carteira-ideali")}
              />
              <ValueKpiCard
                label="Valor da carteira"
                value={ideali.valorCarteira}
                color="#27AE60"
                onClick={() => navigate("/carteira-ideali")}
              />
              <KpiCard
                label="Documentação (pendências)"
                value={ideali.pendenciasDocumentacao}
                color="#F2994A"
                onClick={() => navigate("/documentacao-ideali")}
              />
              <ValueKpiCard
                label="Valor de inadimplência"
                value={ideali.valorInadimplencia}
                color="#EB5757"
              />
            </div>
          </section>
        ) : (
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                {garantidoras.map((g) => {
                  const c = garantidoraColor(g.garantidora);
                  return (
                    <Card key={g.garantidora}>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: c.bg }}
                          />
                          <span className="text-sm font-medium text-foreground">{c.label}</span>
                        </div>
                        <div className="mt-2 flex items-baseline gap-2">
                          <span className="text-2xl font-bold text-foreground">{g.count}</span>
                          <span className="text-xs text-muted-foreground">contratos</span>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {formatBRL(g.valor)} em aluguéis
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
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

            {environment === "Rotina" && (
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
            )}
          </div>
        )}
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
