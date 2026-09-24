import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileUp, Loader2, Search } from "lucide-react";
import { ImportCobmaisModal } from "./components/ImportCobmaisModal";
import { fmtDateTime, useCobmais } from "./lib/useCobmais";
import { useEnvironment } from "@/contexts/EnvironmentContext";
import { GARANTIDORAS_RASTREADAS } from "./lib/cobmaisXlsxImport";

const Cobmais = () => {
  const navigate = useNavigate();
  const [importOpen, setImportOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [garantidora, setGarantidora] = useState("todas");
  const { environment: empresa } = useEnvironment();
  const [histKey, setHistKey] = useState(0);
  const { loading, error, currentImport, importedByName, snapshots, contagens, reload } =
    useCobmais(empresa);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/login");
    });
  }, [navigate]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return snapshots.filter((s) => {
      if (garantidora !== "todas") {
        if (garantidora === "outros") {
          if (
            GARANTIDORAS_RASTREADAS.includes(
              (s.garantidora_normalizada ?? "") as (typeof GARANTIDORAS_RASTREADAS)[number],
            )
          )
            return false;
        } else if (s.garantidora_normalizada !== garantidora) return false;
      }
      if (!q) return true;
      return [s.cpf_cnpj, s.cliente, s.contrato].some((v) => (v ?? "").toLowerCase().includes(q));
    });
  }, [snapshots, search, garantidora]);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Cobmais</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Relatório de cobrança — {empresa}
        </p>
      </div>

      <Card>
        <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold">Última importação</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {currentImport
                ? `${fmtDateTime(currentImport.data_importacao)} · ${currentImport.empresa} por ${
                    importedByName ?? "usuário não identificado"
                  }${currentImport.nome_arquivo ? ` — ${currentImport.nome_arquivo}` : ""}`
                : "Nenhuma importação registrada ainda."}
            </p>
          </div>
          <Button onClick={() => setImportOpen(true)} className="w-full sm:w-auto">
            <FileUp className="h-4 w-4 mr-1" />
            Importar relatório Cobmais
          </Button>
        </CardContent>
      </Card>

      {currentImport && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Kpi label="Registros" value={snapshots.length} />
          {GARANTIDORAS_RASTREADAS.map((g) => (
            <Kpi key={g} label={g} value={contagens[g] ?? 0} />
          ))}
        </div>
      )}

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Buscar por CPF/CNPJ, cliente ou contrato"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={garantidora} onValueChange={setGarantidora}>
              <SelectTrigger className="sm:w-56">
                <SelectValue placeholder="Garantidora" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as garantidoras</SelectItem>
                {GARANTIDORAS_RASTREADAS.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
                <SelectItem value="outros">Outros produtos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando registros...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>CPF/CNPJ</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Contrato</TableHead>
                    <TableHead className="text-right">Atraso</TableHead>
                    <TableHead>Garantidora</TableHead>
                    <TableHead>Observação</TableHead>
                    <TableHead className="text-right">Risco</TableHead>
                    <TableHead>Marcador</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        Nenhum registro encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.slice(0, 300).map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-mono text-xs">{s.cpf_cnpj ?? "—"}</TableCell>
                        <TableCell>{s.cliente ?? "—"}</TableCell>
                        <TableCell className="font-mono text-xs">{s.contrato ?? "—"}</TableCell>
                        <TableCell className="text-right">{s.atraso ?? "—"}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{s.garantidora_normalizada ?? "—"}</Badge>
                        </TableCell>
                        <TableCell className="max-w-[220px] truncate">
                          {s.status_cobranca ?? "—"}
                        </TableCell>
                        <TableCell className="text-right">{s.risco ?? "—"}</TableCell>
                        <TableCell>{s.marcador ?? "—"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              {filtered.length > 300 && (
                <p className="text-xs text-muted-foreground mt-3">
                  Exibindo os primeiros 300 de {filtered.length} registros. Refine a busca para ver
                  outros.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <HistoricoImportacoes refreshKey={histKey} />

      <ImportCobmaisModal open={importOpen} onOpenChange={setImportOpen} onDone={() => {
          reload();
          setHistKey((k) => k + 1);
        }}
      />
    </main>
  );
};

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold mt-1">{value}</p>
      </CardContent>
    </Card>
  );
}

export default Cobmais;
interface HistRow {
  id: string;
  data_importacao: string;
  empresa: string;
  nome_arquivo: string | null;
  total_linhas: number | null;
  quem: string | null;
}

function HistoricoImportacoes({ refreshKey }: { refreshKey: number }) {
  const [rows, setRows] = useState<HistRow[] | null>(null);
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("cobmais_imports")
        .select("id, data_importacao, empresa, nome_arquivo, total_linhas, importado_por")
        .order("data_importacao", { ascending: false })
        .limit(10);
      const ids = [...new Set((data ?? []).map((d) => d.importado_por).filter(Boolean))] as string[];
      const nomes: Record<string, string> = {};
      if (ids.length) {
        const { data: regs } = await supabase
          .from("users_registry")
          .select("user_id, full_name")
          .in("user_id", ids);
        (regs ?? []).forEach((r) => r.user_id && (nomes[r.user_id] = r.full_name));
      }
      setRows(
        (data ?? []).map((d) => ({
          ...d,
          quem: d.importado_por ? nomes[d.importado_por] ?? null : null,
        })),
      );
    })();
  }, [refreshKey]);

  return (
    <Card>
      <CardContent className="p-6 space-y-3">
        <h2 className="text-base font-semibold">Histórico de importações</h2>
        {rows === null ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma importação registrada.</p>
        ) : (
          <ul className="divide-y">
            {rows.map((r) => (
              <li key={r.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-sm">
                <span className="shrink-0">{fmtDateTime(r.data_importacao)}</span>
                <Badge variant={r.empresa === "Alugar" ? "default" : "secondary"} className="w-fit">
                  {r.empresa}
                </Badge>
                <span className="truncate flex-1 text-muted-foreground">{r.nome_arquivo ?? "—"}</span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {r.total_linhas ?? 0} linhas · {r.quem ?? "usuário não identificado"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
