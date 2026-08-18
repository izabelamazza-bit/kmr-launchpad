import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { StatusBadge } from "./StatusBadge";
import { PendenciasTab } from "./PendenciasTab";
import { MovimentacoesTab } from "./MovimentacoesTab";
import { fetchPendencias, type Pendencia } from "../lib/useInadimplenciaLoft";
import { fetchCaseNotes, type CaseNote } from "../lib/useCaseNotes";
import { fmtBool, fmtDate, fmtDateTime, fmtMoney, type Snapshot } from "../lib/usePortalLoft";

type Kind = "text" | "money" | "date" | "bool" | "num";

const FIELDS: { key: keyof Snapshot; label: string; kind: Kind }[] = [
  { key: "status", label: "Status", kind: "text" },
  { key: "plano", label: "Plano", kind: "text" },
  { key: "valor_locaticio", label: "Valor locatício", kind: "money" },
  { key: "valor_aluguel", label: "Valor do aluguel", kind: "money" },
  { key: "valor_condominio", label: "Condomínio", kind: "money" },
  { key: "valor_outras_taxas", label: "Outras taxas", kind: "money" },
  { key: "valor_setup", label: "Setup", kind: "money" },
  { key: "cancelamento_taxa", label: "Cancelamento de taxa", kind: "bool" },
  { key: "cancelamento_taxa_previsao", label: "Previsão de cancelamento", kind: "date" },
  { key: "pagamento_suspenso", label: "Pagamento suspenso", kind: "bool" },
  { key: "data_ativacao", label: "Data de ativação", kind: "date" },
  { key: "data_exoneracao", label: "Data de exoneração", kind: "date" },
  { key: "ultima_renovacao", label: "Última renovação", kind: "date" },
  { key: "corretor", label: "Corretor", kind: "text" },
  { key: "inquilino", label: "Inquilino", kind: "text" },
  { key: "fianca_total", label: "Fiança total", kind: "money" },
  { key: "garantia", label: "Garantia", kind: "money" },
  { key: "multiplicador", label: "Multiplicador", kind: "num" },
  { key: "custo_saida", label: "Custo de saída", kind: "money" },
  { key: "motivo_exoneracao", label: "Motivo da exoneração", kind: "text" },
];

function show(value: unknown, kind: Kind): string {
  if (value === null || value === undefined || value === "") return "—";
  if (kind === "money") return fmtMoney(Number(value));
  if (kind === "date") return fmtDate(String(value));
  if (kind === "bool") return fmtBool(Boolean(value));
  if (kind === "num") return String(value);
  return String(value);
}

interface Props {
  contrato: string | null;
  /** Aba aberta ao montar o drawer. Padrão: "historico". */
  abaInicial?: "historico" | "movimentacoes" | "pendencias";
  onOpenChange: (open: boolean) => void;
}

export function HistoricoDrawer({ contrato, abaInicial = "historico", onOpenChange }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<(Snapshot & { data_importacao: string | null })[]>([]);
  const [pendencias, setPendencias] = useState<Pendencia[]>([]);
  const [pendLoading, setPendLoading] = useState(false);
  const [pendError, setPendError] = useState<string | null>(null);
  const [notas, setNotas] = useState<CaseNote[]>([]);
  const [notasLoading, setNotasLoading] = useState(false);
  const [notasError, setNotasError] = useState<string | null>(null);

  useEffect(() => {
    if (!contrato) return;
    let cancelled = false;
    setNotasLoading(true);
    setNotasError(null);
    fetchCaseNotes(contrato)
      .then((res) => {
        if (!cancelled) setNotas(res);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setNotas([]);
          setNotasError(e instanceof Error ? e.message : "Falha ao carregar as movimentações.");
        }
      })
      .finally(() => {
        if (!cancelled) setNotasLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [contrato]);

  useEffect(() => {
    if (!contrato) return;
    let cancelled = false;
    setPendLoading(true);
    setPendError(null);
    fetchPendencias(contrato)
      .then((res) => {
        if (!cancelled) setPendencias(res);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setPendencias([]);
          setPendError(e instanceof Error ? e.message : "Falha ao carregar as pendências.");
        }
      })
      .finally(() => {
        if (!cancelled) setPendLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [contrato]);

  useEffect(() => {
    if (!contrato) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      const { data, error: err } = await supabase
        .from("guarantor_portal_snapshots")
        .select("*, guarantor_portal_imports!inner(data_importacao)")
        .eq("contrato", contrato);
      if (cancelled) return;
      if (err) {
        setError(err.message);
        setRows([]);
      } else {
        const mapped = (data ?? []).map((r) => {
          const { guarantor_portal_imports: imp, ...snap } = r as Snapshot & {
            guarantor_portal_imports: { data_importacao: string } | null;
          };
          return { ...snap, data_importacao: imp?.data_importacao ?? snap.data_snapshot };
        });
        mapped.sort((a, b) => (a.data_importacao ?? "").localeCompare(b.data_importacao ?? ""));
        setRows(mapped);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [contrato]);

  return (
    <Sheet open={!!contrato} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Histórico do contrato {contrato}</SheetTitle>
          <SheetDescription>
            Todas as importações do portal da Loft para este contrato, da mais antiga para a mais
            recente.
          </SheetDescription>
        </SheetHeader>

        <Tabs key={`${contrato}-${abaInicial}`} defaultValue={abaInicial} className="mt-6">
          <TabsList>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
            <TabsTrigger value="movimentacoes">Movimentações</TabsTrigger>
            <TabsTrigger value="pendencias">Pendências</TabsTrigger>
          </TabsList>

          <TabsContent value="historico" className="mt-0">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-8">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando histórico...
          </div>
        ) : error ? (
          <p className="text-sm text-destructive py-8">{error}</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8">Nenhuma snapshot encontrada.</p>
        ) : (
          <ol className="mt-6 space-y-6 border-l pl-6">
            {rows.map((row, i) => {
              const prev = i > 0 ? rows[i - 1] : null;
              const changes = prev
                ? FIELDS.filter((f) => row[f.key] !== prev[f.key])
                : [];
              return (
                <li key={row.id} className="relative">
                  <span className="absolute -left-[31px] top-1.5 h-2.5 w-2.5 rounded-full bg-[#2F80ED]" />
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">{fmtDateTime(row.data_importacao)}</p>
                    <StatusBadge status={row.status} />
                    {!prev && <Badge variant="outline">1ª importação</Badge>}
                  </div>

                  {!prev ? (
                    <div className="mt-2 space-y-1 text-sm">
                      {FIELDS.filter((f) => row[f.key] !== null && row[f.key] !== "").map((f) => (
                        <div key={String(f.key)} className="flex justify-between gap-3">
                          <span className="text-muted-foreground">{f.label}</span>
                          <span className="text-right">{show(row[f.key], f.kind)}</span>
                        </div>
                      ))}
                    </div>
                  ) : changes.length === 0 ? (
                    <p className="mt-1.5 text-sm text-muted-foreground">Sem alterações.</p>
                  ) : (
                    <div className="mt-2 space-y-1.5 text-sm">
                      {changes.map((f) => (
                        <div key={String(f.key)} className="rounded-md bg-muted/60 px-3 py-2">
                          <p className="text-xs text-muted-foreground">{f.label}</p>
                          <p className="flex items-center gap-2 flex-wrap">
                            <span className="text-muted-foreground line-through">
                              {show(prev[f.key], f.kind)}
                            </span>
                            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="font-medium">{show(row[f.key], f.kind)}</span>
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        )}
          </TabsContent>

          <TabsContent value="movimentacoes" className="mt-0">
            <MovimentacoesTab rows={notas} loading={notasLoading} error={notasError} />
          </TabsContent>

          <TabsContent value="pendencias" className="mt-0">
            <PendenciasTab rows={pendencias} loading={pendLoading} error={pendError} />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

export default HistoricoDrawer;