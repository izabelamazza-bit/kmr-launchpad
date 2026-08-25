import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, FileUp, Loader2, RotateCcw, Search, X } from "lucide-react";
import { CobmaisLoftTable, type SortKey } from "./CobmaisLoftTable";
import { HistoricoDrawer } from "./HistoricoDrawer";
import { fmtDateTime, fmtMoney } from "../lib/usePortalLoft";
import {
  FAIXAS,
  resumoCobmaisLoft,
  useCobmaisLoft,
  useCobmaisLoftFiltrado,
  type FiltroExtra,
} from "../lib/useCobmaisLoft";
import { useInadimplenciaLoft } from "../lib/useInadimplenciaLoft";
import { useCaseNotesLoft } from "../lib/useCaseNotes";
import { normContrato } from "../lib/useInadimplenciaLoft";

interface Props {
  onImport: () => void;
}

const LABEL_EXTRA: Record<Exclude<FiltroExtra, "todos">, string> = {
  "sem-registro": "sem registro no Portal Loft",
  encontrados: "CPF encontrado no Portal Loft",
};

export function CobmaisLoftPanel({ onImport }: Props) {
  const { loading, error, rows, ultimaImportacaoCobmais, ultimaImportacaoPortal } = useCobmaisLoft();
  const { index: notas } = useCaseNotesLoft();
  const { index: pendencias } = useInadimplenciaLoft(notas);
  const [faixa, setFaixa] = useState("0");
  const [extra, setExtra] = useState<FiltroExtra>("todos");
  const [busca, setBusca] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("risco");
  const [sortAsc, setSortAsc] = useState(false);
  const [contratoDrawer, setContratoDrawer] = useState<string | null>(null);
  const [abaDrawer, setAbaDrawer] = useState<"pendencias" | "movimentacoes" | "historico">(
    "historico",
  );

  const { emAtraso, filtradas } = useCobmaisLoftFiltrado(rows, faixa, busca, pendencias, extra);
  // Cards sempre calculados sobre a faixa de atraso inteira — nunca sobre o
  // subconjunto do filtro extra (intencional, para servirem de referência geral).
  const resumo = useMemo(() => resumoCobmaisLoft(emAtraso), [emAtraso]);

  const ordenadas = useMemo(() => {
    const arr = [...filtradas];
    arr.sort((a, b) => (sortAsc ? a[sortKey] - b[sortKey] : b[sortKey] - a[sortKey]));
    return arr;
  }, [filtradas, sortKey, sortAsc]);

  const handleSort = (k: SortKey) => {
    if (k === sortKey) setSortAsc((v) => !v);
    else {
      setSortKey(k);
      setSortAsc(false);
    }
  };

  const faixaLabel = FAIXAS.find((f) => f.value === faixa)?.label ?? "";
  const fora = rows.filter((r) => r.atraso > 0).length - emAtraso.length;
  const detalheContagem =
    extra !== "todos"
      ? `filtrado por: ${LABEL_EXTRA[extra]}`
      : fora > 0
        ? `${fora} fora da faixa`
        : null;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-6">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Última importação Cobmais
              </p>
              <p className="text-sm font-medium mt-1">{fmtDateTime(ultimaImportacaoCobmais)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Última importação Portal Loft
              </p>
              <p className="text-sm font-medium mt-1">{fmtDateTime(ultimaImportacaoPortal)}</p>
            </div>
          </div>
          <Button onClick={onImport} className="w-full lg:w-auto">
            <FileUp className="h-4 w-4 mr-2" />
            Importar novo Cobmais
          </Button>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-10">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cruzando Cobmais com o Portal Loft...
        </div>
      ) : error ? (
        <Card>
          <CardContent className="p-6 text-sm text-destructive">{error}</CardContent>
        </Card>
      ) : rows.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Nenhum caso Loft encontrado no Cobmais. Importe o relatório Cobmais para ver o cruzamento
            com os contratos do Portal Loft.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Resumo
              label="Casos Loft em atraso"
              value={String(resumo.total)}
              modo="reset"
              ativo={extra === "todos"}
              onClick={() => setExtra("todos")}
            />
            <Resumo
              label="Valor total em risco"
              value={fmtMoney(resumo.valorRisco)}
              modo="reset"
              ativo={extra === "todos"}
              onClick={() => setExtra("todos")}
            />
            <Resumo
              label="CPF encontrado no Portal Loft"
              value={String(resumo.encontrados)}
              modo="filtro"
              ativo={extra === "encontrados"}
              onClick={() => setExtra((v) => (v === "encontrados" ? "todos" : "encontrados"))}
            />
            <Resumo
              label="Sem registro no Portal Loft"
              value={String(resumo.semRegistro)}
              nota="Potencial sinistro não aberto"
              alerta
              modo="filtro"
              ativo={extra === "sem-registro"}
              onClick={() => setExtra((v) => (v === "sem-registro" ? "todos" : "sem-registro"))}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Casos Cobmais × Portal Loft
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  {ordenadas.length} de {rows.filter((r) => r.atraso > 0).length}
                  {detalheContagem ? ` — ${detalheContagem}` : ""}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="relative sm:col-span-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Buscar por CPF, cliente ou contrato"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                  />
                </div>
                <Select value={faixa} onValueChange={setFaixa}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FAIXAS.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(faixa !== "0" || extra !== "todos") && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted-foreground">Filtros ativos:</span>
                  {faixa !== "0" && (
                    <ChipFiltro label={faixaLabel} onRemove={() => setFaixa("0")} />
                  )}
                  {extra !== "todos" && (
                    <ChipFiltro
                      label={`Filtro: ${LABEL_EXTRA[extra]}`}
                      onRemove={() => setExtra("todos")}
                    />
                  )}
                </div>
              )}

              <CobmaisLoftTable
                rows={ordenadas}
                sortKey={sortKey}
                sortAsc={sortAsc}
                onSort={handleSort}
                pendencias={pendencias}
                onAbrirHistorico={(contrato, aba) => {
                  const key = normContrato(contrato);
                  setAbaDrawer(
                    aba === "pendencias" ? "pendencias" : notas.has(key) ? "movimentacoes" : aba,
                  );
                  setContratoDrawer(contrato);
                }}
              />
            </CardContent>
          </Card>
        </>
      )}

      <HistoricoDrawer
        contrato={contratoDrawer}
        abaInicial={abaDrawer}
        onOpenChange={(open) => {
          if (!open) setContratoDrawer(null);
        }}
      />
    </div>
  );
}

function ChipFiltro({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <Badge variant="secondary" className="font-normal gap-1 pr-1.5">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remover filtro: ${label}`}
        className="rounded-sm hover:bg-background/60 p-0.5"
      >
        <X className="h-3 w-3" />
      </button>
    </Badge>
  );
}

function Resumo({
  label,
  value,
  nota,
  alerta,
  modo,
  ativo,
  onClick,
}: {
  label: string;
  value: string;
  nota?: string;
  alerta?: boolean;
  /** "filtro" filtra a tabela; "reset" apenas limpa o filtro extra. */
  modo: "filtro" | "reset";
  ativo: boolean;
  onClick: () => void;
}) {
  const destaque =
    modo === "filtro" && ativo
      ? alerta
        ? "ring-2 ring-destructive/50"
        : "ring-2 ring-[#2F80ED]/50"
      : "";
  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={`text-left transition-all ${
        modo === "filtro"
          ? "cursor-pointer hover:shadow-md hover:border-[#2F80ED]/40"
          : "cursor-default hover:bg-muted/40"
      } ${alerta ? "border-destructive/40" : ""} ${destaque}`}
    >
      <CardContent className="p-5">
        <p className="text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
          {alerta && <AlertTriangle className="h-3.5 w-3.5 text-destructive" />}
          {label}
        </p>
        <p className={`text-2xl font-semibold mt-2 ${alerta ? "text-destructive" : "text-[#0F2A44]"}`}>
          {value}
        </p>
        {nota && <p className="text-xs text-muted-foreground mt-1">{nota}</p>}
        {modo === "filtro" ? (
          <p className="text-xs text-[#2F80ED] mt-1 opacity-0 hover:opacity-100 transition-opacity">
            {ativo ? "Clique para remover o filtro" : "Clique para filtrar a tabela"}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <RotateCcw className="h-3 w-3" />
            Limpar filtro extra
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default CobmaisLoftPanel;
