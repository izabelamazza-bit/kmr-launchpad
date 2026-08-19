import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, ArrowLeft, FileUp, Loader2 } from "lucide-react";
import { ImportLoftModal } from "./components/ImportLoftModal";
import { ImportInadimplenciaModal } from "./components/ImportInadimplenciaModal";
import { ImportCobmaisModal } from "@/pages/cobmais/components/ImportCobmaisModal";
import { CobmaisLoftPanel } from "./components/CobmaisLoftPanel";
import { ResumoCards } from "./components/ResumoCards";
import { MovimentacoesPanel } from "./components/MovimentacoesPanel";
import { ContratosTable } from "./components/ContratosTable";
import { HistoricoDrawer } from "./components/HistoricoDrawer";
import {
  fmtDateTime,
  recursosAtrasados,
  rotuloOrigem,
  rotuloTipo,
  usePortalLoft,
  useResumo,
  type TipoImportacao,
  type UltimaImportacao,
} from "./lib/usePortalLoft";

const LinhaSincronizacao = ({ tipo, info }: { tipo: TipoImportacao; info: UltimaImportacao }) => (
  <p>
    {rotuloTipo[tipo]}: {fmtDateTime(info.data)}
    {info.data && (
      <span className="ml-1 text-xs uppercase tracking-wide">({rotuloOrigem(info.origem)})</span>
    )}
  </p>
);

const PortalLoft = () => {
  const navigate = useNavigate();
  const [importOpen, setImportOpen] = useState(false);
  const [inadOpen, setInadOpen] = useState(false);
  const [cobmaisOpen, setCobmaisOpen] = useState(false);
  const [cobmaisKey, setCobmaisKey] = useState(0);
  const [contrato, setContrato] = useState<string | null>(null);
  const {
    loading,
    error,
    currentImport,
    previousImport,
    importedByName,
    snapshots,
    movements,
    novos,
    ultimas,
    reload,
  } = usePortalLoft();
  const resumo = useResumo(snapshots, movements);
  const atrasados = loading ? [] : recursosAtrasados(ultimas);

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
          <h1 className="text-lg font-semibold">Portal Loft</h1>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {atrasados.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Sincronização atrasada</AlertTitle>
            <AlertDescription>
              Sem sincronização automática nas últimas 30 horas para:{" "}
              {atrasados
                .map(
                  (t) =>
                    `${rotuloTipo[t]} (${ultimas[t].dataApi ? `última em ${fmtDateTime(ultimas[t].dataApi)}` : "nunca sincronizado"})`,
                )
                .join(", ")}
              .
            </AlertDescription>
          </Alert>
        )}
        <Tabs defaultValue="portal" className="space-y-6">
          <TabsList>
            <TabsTrigger value="portal">Portal Loft</TabsTrigger>
            <TabsTrigger value="cobmais">Cobmais × Loft</TabsTrigger>
          </TabsList>

          <TabsContent value="portal" className="space-y-6 mt-0">
            <Card>
          <CardContent className="p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold">Snapshots do portal da garantidora</h2>
              <div className="mt-2 space-y-0.5 text-sm text-muted-foreground">
                <LinhaSincronizacao tipo="contrato" info={ultimas.contrato} />
                <LinhaSincronizacao tipo="movimentacao" info={ultimas.movimentacao} />
                <LinhaSincronizacao tipo="inadimplencia" info={ultimas.inadimplencia} />
              </div>
              {currentImport && (
                <p className="text-xs text-muted-foreground mt-2">
                  Última de contratos por {importedByName ?? "usuário não identificado"}
                  {currentImport.nome_arquivo ? ` — ${currentImport.nome_arquivo}` : ""}
                </p>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={() => setImportOpen(true)} className="w-full sm:w-auto">
                <FileUp className="h-4 w-4 mr-2" />
                Importar novo CSV
              </Button>
              <Button variant="outline" onClick={() => setInadOpen(true)} className="w-full sm:w-auto">
                <FileUp className="h-4 w-4 mr-2" />
                Importar inadimplência
              </Button>
            </div>
          </CardContent>
            </Card>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-10">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando dados do Portal Loft...
          </div>
        ) : error ? (
          <Card>
            <CardContent className="p-6 text-sm text-destructive">{error}</CardContent>
          </Card>
        ) : !currentImport ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              Importe o CSV gerado pelo RPA da Loft para ver o resumo, as movimentações e o histórico
              dos contratos.
            </CardContent>
          </Card>
        ) : (
          <>
            <ResumoCards
              total={resumo.total}
              ativos={resumo.ativos}
              cancelados={resumo.cancelados}
              exonerados={resumo.exonerados}
              novos={novos}
              mudancasStatus={resumo.mudancasStatus}
              temAnterior={!!previousImport}
            />
            <MovimentacoesPanel movements={movements} />
            <ContratosTable snapshots={snapshots} onSelect={setContrato} />
          </>
        )}
          </TabsContent>

          <TabsContent value="cobmais" className="mt-0">
            <CobmaisLoftPanel key={cobmaisKey} onImport={() => setCobmaisOpen(true)} />
          </TabsContent>
        </Tabs>
      </main>

      <ImportLoftModal open={importOpen} onOpenChange={setImportOpen} onDone={reload} />
      <ImportInadimplenciaModal
        open={inadOpen}
        onOpenChange={setInadOpen}
        onDone={() => {
          reload();
          setCobmaisKey((k) => k + 1);
        }}
      />
      <ImportCobmaisModal
        open={cobmaisOpen}
        onOpenChange={setCobmaisOpen}
        onDone={() => setCobmaisKey((k) => k + 1)}
      />
      <HistoricoDrawer contrato={contrato} onOpenChange={(o) => !o && setContrato(null)} />
    </div>
  );
};

export default PortalLoft;