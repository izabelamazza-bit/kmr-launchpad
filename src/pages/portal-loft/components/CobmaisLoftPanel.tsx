import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, FileUp, Loader2, Search } from "lucide-react";
import { CobmaisLoftTable, type SortKey } from "./CobmaisLoftTable";
import { HistoricoDrawer } from "./HistoricoDrawer";
import { fmtDateTime, fmtMoney } from "../lib/usePortalLoft";
import {
  FAIXAS,
  resumoCobmaisLoft,
  useCobmaisLoft,
  useCobmaisLoftFiltrado,
} from "../lib/useCobmaisLoft";
import { useInadimplenciaLoft } from "../lib/useInadimplenciaLoft";

interface Props {
  onImport: () => void;
}

export function CobmaisLoftPanel({ onImport }: Props) {
  const { loading, error, rows, ultimaImportacaoCobmais, ultimaImportacaoPortal } = useCobmaisLoft();
  const { index: pendencias } = useInadimplenciaLoft();
  const [faixa, setFaixa] = useState("0");
  const [busca, setBusca] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("risco");
  const [sortAsc, setSortAsc] = useState(false);
  const [contratoDrawer, setContratoDrawer] = useState<string | null>(null);
  const [abaDrawer, setAbaDrawer] = useState<"pendencias" | "historico">("historico");

  const { emAtraso, filtradas } = useCobmaisLoftFiltrado(rows, faixa, busca, pendencias);
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
            <Resumo label="Casos Loft em atraso" value={String(resumo.total)} />
            <Resumo label="Valor total em risco" value={fmtMoney(resumo.valorRisco)} />
            <Resumo label="CPF encontrado no Portal Loft" value={String(resumo.encontrados)} />
            <Resumo
              label="Sem registro no Portal Loft"
              value={String(resumo.semRegistro)}
              nota="Potencial sinistro não aberto"
              alerta
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Casos Cobmais × Portal Loft
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  {ordenadas.length} de {emAtraso.length}
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
              <CobmaisLoftTable
                rows={ordenadas}
                sortKey={sortKey}
                sortAsc={sortAsc}
                onSort={handleSort}
                pendencias={pendencias}
                onAbrirHistorico={(contrato, aba) => {
                  setAbaDrawer(aba);
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

function Resumo({
  label,
  value,
  nota,
  alerta,
}: {
  label: string;
  value: string;
  nota?: string;
  alerta?: boolean;
}) {
  return (
    <Card className={alerta ? "border-destructive/40" : undefined}>
      <CardContent className="p-5">
        <p className="text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
          {alerta && <AlertTriangle className="h-3.5 w-3.5 text-destructive" />}
          {label}
        </p>
        <p className={`text-2xl font-semibold mt-2 ${alerta ? "text-destructive" : "text-[#0F2A44]"}`}>
          {value}
        </p>
        {nota && <p className="text-xs text-muted-foreground mt-1">{nota}</p>}
      </CardContent>
    </Card>
  );
}

export default CobmaisLoftPanel;