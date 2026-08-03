import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowDown, ArrowUp } from "lucide-react";
import { SinistroLoftBadge } from "./SinistroLoftBadge";
import { ValorProgramadoCell } from "./ValorProgramadoCell";
import { fmtMoney } from "../lib/usePortalLoft";
import type { CobmaisLoftRow } from "../lib/useCobmaisLoft";
import { normContrato, type PendenciaIndex } from "../lib/useInadimplenciaLoft";

export type SortKey = "risco" | "atraso";

interface Props {
  rows: CobmaisLoftRow[];
  sortKey: SortKey;
  sortAsc: boolean;
  onSort: (key: SortKey) => void;
  pendencias: PendenciaIndex;
}

function StatusPortal({ row }: { row: CobmaisLoftRow }) {
  if (!row.portal) {
    return (
      <Badge variant="outline" className="border-destructive/40 text-destructive font-normal">
        Não
      </Badge>
    );
  }
  const status = (row.portal.status ?? "").trim() || "Não informado";
  const s = status.toLowerCase();
  const cor =
    s === "ativo"
      ? "border-[#27AE60]/40 text-[#27AE60]"
      : s === "exonerado"
        ? "border-amber-500/40 text-amber-600"
        : "border-muted-foreground/30 text-muted-foreground";
  return (
    <div className="flex items-center gap-1.5 whitespace-nowrap">
      <Badge variant="outline" className="border-[#27AE60]/40 text-[#27AE60] font-normal">
        Sim
      </Badge>
      <Badge variant="outline" className={`font-normal ${cor}`}>
        {status}
      </Badge>
    </div>
  );
}

export function CobmaisLoftTable({ rows, sortKey, sortAsc, onSort, pendencias }: Props) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        Nenhum caso encontrado com os filtros atuais.
      </p>
    );
  }

  const SortHead = ({ k, children }: { k: SortKey; children: React.ReactNode }) => (
    <TableHead className="text-right">
      <button
        type="button"
        onClick={() => onSort(k)}
        className="inline-flex items-center gap-1 hover:text-foreground"
      >
        {children}
        {sortKey === k &&
          (sortAsc ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />)}
      </button>
    </TableHead>
  );

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>CPF</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Contrato</TableHead>
            <SortHead k="atraso">Atraso (dias)</SortHead>
            <SortHead k="risco">Valor em risco</SortHead>
            <TableHead>Status no Cobmais</TableHead>
            <TableHead>Encontrado no Portal Loft</TableHead>
            <TableHead>Status de sinistro na Loft</TableHead>
            <TableHead className="text-right">Valor já programado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => {
            const pend = pendencias.get(normContrato(r.contrato));
            return (
            <TableRow key={r.id}>
              <TableCell className="font-medium whitespace-nowrap">{r.cpf}</TableCell>
              <TableCell className="max-w-[220px] truncate">{r.cliente ?? "—"}</TableCell>
              <TableCell className="whitespace-nowrap">{r.contrato ?? "—"}</TableCell>
              <TableCell className="text-right">{r.atraso}</TableCell>
              <TableCell className="text-right font-semibold text-[#0F2A44] whitespace-nowrap">
                {fmtMoney(r.risco)}
              </TableCell>
              <TableCell>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      variant="outline"
                      className={`font-normal ${
                        r.statusCobmais === "Rescindido"
                          ? "border-amber-500/40 text-amber-600"
                          : r.statusCobmais === "Ativo"
                            ? "border-[#2F80ED]/40 text-[#2F80ED]"
                            : "border-muted-foreground/30 text-muted-foreground"
                      }`}
                    >
                      {r.statusCobmais}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    {r.statusCobmais === "Não informado"
                      ? r.observacao?.trim()
                        ? `Texto não reconhecido no relatório: "${r.observacao.trim()}"`
                        : "Sem observação no relatório Cobmais — status do contrato não informado"
                      : r.observacao?.trim() || "Sem observação no relatório"}
                  </TooltipContent>
                </Tooltip>
              </TableCell>
              <TableCell>
                <StatusPortal row={r} />
              </TableCell>
              <TableCell>
                <SinistroLoftBadge row={r} pendencia={pend} />
              </TableCell>
              <TableCell className="text-right">
                <ValorProgramadoCell row={r} pendencia={pend} />
              </TableCell>
            </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export default CobmaisLoftTable;