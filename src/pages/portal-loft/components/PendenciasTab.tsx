import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PendenciaStatusBadge } from "./PendenciaStatusBadge";
import { fmtDate, fmtMoney } from "../lib/usePortalLoft";
import type { Pendencia } from "../lib/useInadimplenciaLoft";

export function PendenciasTab({ rows, loading, error }: { rows: Pendencia[]; loading: boolean; error: string | null }) {
  if (loading) return <p className="text-sm text-muted-foreground py-8">Carregando pendências...</p>;
  if (error) return <p className="text-sm text-destructive py-8">{error}</p>;
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8">
        Nenhuma pendência de inadimplência importada para este contrato.
      </p>
    );
  }

  const ordenadas = [...rows].sort((a, b) =>
    (b.data_pendencia ?? "").localeCompare(a.data_pendencia ?? ""),
  );

  return (
    <div className="mt-4 overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Pendência</TableHead>
            <TableHead className="text-right">Valor atualizado</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Pagamento</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ordenadas.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="whitespace-nowrap">{fmtDate(p.data_pendencia)}</TableCell>
              <TableCell className="text-right font-medium whitespace-nowrap">
                {fmtMoney(p.valor_atual === null ? null : Number(p.valor_atual))}
              </TableCell>
              <TableCell>
                <PendenciaStatusBadge status={p.imob_status} />
              </TableCell>
              <TableCell className="whitespace-nowrap text-sm">
                {p.data_pagamento ? (
                  <span className="text-[#27AE60] font-medium">Pago em {fmtDate(p.data_pagamento)}</span>
                ) : p.dt_vencimento ? (
                  <span className="text-muted-foreground">Previsto para {fmtDate(p.dt_vencimento)}</span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default PendenciasTab;
