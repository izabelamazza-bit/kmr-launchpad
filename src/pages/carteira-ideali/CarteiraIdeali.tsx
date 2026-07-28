import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, FileUp, Loader2 } from "lucide-react";
import { ImportIdealiModal } from "./components/ImportIdealiModal";
import { useCarteiraIdeali } from "./lib/useCarteiraIdeali";
import { StatusCards } from "./components/StatusCards";
import { FinanceiroCards } from "./components/FinanceiroCards";
import { PrazoSinistroTable } from "./components/PrazoSinistroTable";
import { GarantiaChart } from "./components/GarantiaChart";
import { InadimplenciaChart, type InadimplenciaFilter } from "./components/InadimplenciaChart";
import { ContratosTable } from "./components/ContratosTable";
import { EnvironmentSelect } from "@/components/EnvironmentSelect";

const CarteiraIdeali = () => {
  const navigate = useNavigate();
  const [importOpen, setImportOpen] = useState(false);
  const [garantidoraFilter, setGarantidoraFilter] = useState<string | null>(null);
  const [inadFilter, setInadFilter] = useState<InadimplenciaFilter | null>(null);
  const { data, loading, error, reload } = useCarteiraIdeali();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/login");
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="bg-card border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Carteira Ideali</h1>
          <div className="ml-auto">
            <EnvironmentSelect />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <Card>
          <CardContent className="p-6 space-y-4">
            <div>
              <h2 className="text-base font-semibold">Importar carteira Ideali</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Envie a planilha .xlsx com as abas "Contratos" e "Histórico faturas". Você verá um
                resumo antes de qualquer gravação no banco.
              </p>
            </div>
            <Button onClick={() => setImportOpen(true)}>
              <FileUp className="h-4 w-4 mr-2" />
              Importar carteira Ideali
            </Button>
          </CardContent>
        </Card>

        {loading && (
          <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
            <Loader2 className="h-5 w-5 animate-spin" /> Carregando carteira...
          </div>
        )}

        {!loading && error && (
          <Card>
            <CardContent className="p-6 text-sm text-destructive">{error}</CardContent>
          </Card>
        )}

        {!loading && !error && data && (
          <>
            <StatusCards total={data.total} statusCounts={data.statusCounts} />
            <FinanceiroCards
              valorEmAtraso={data.valorEmAtraso}
              contratosAfetados={data.contratosAfetados}
              total={data.total}
              faturasIncompletas={data.faturasIncompletas}
              carteiraAtivaMes={data.carteiraAtivaMes}
            />
            <PrazoSinistroTable contracts={data.contracts} />
            <GarantiaChart
              contracts={data.contracts}
              selected={garantidoraFilter}
              onSelect={(g) => {
                setGarantidoraFilter(g);
                if (g) setInadFilter(null);
              }}
            />
            <InadimplenciaChart
              contracts={data.contracts}
              selected={inadFilter}
              onSelect={(f) => {
                setInadFilter(f);
                if (f) setGarantidoraFilter(null);
              }}
            />
            <ContratosTable
              contracts={data.contracts}
              garantidoraFilter={garantidoraFilter}
              onGarantidoraFilterChange={(g) => {
                setGarantidoraFilter(g);
                if (g) setInadFilter(null);
              }}
              inadimplenciaFilter={inadFilter}
              onClearInadimplencia={() => setInadFilter(null)}
            />
          </>
        )}
      </main>

      <ImportIdealiModal open={importOpen} onOpenChange={setImportOpen} onDone={reload} />
    </div>
  );
};

export default CarteiraIdeali;