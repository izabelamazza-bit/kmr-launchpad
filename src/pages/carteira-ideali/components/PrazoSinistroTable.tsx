import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertTriangle } from "lucide-react";
import {
  GARANTIDORAS_SINISTRO,
  diasRestantesSinistro,
  type ContractAggregate,
} from "../lib/useCarteiraIdeali";

function badgeClass(dias: number): string {
  if (dias < 0) return "bg-destructive text-destructive-foreground";
  if (dias <= 14) return "bg-[#F2C94C] text-[#0F2A44]";
  return "bg-[#27AE60] text-white";
}

export function PrazoSinistroTable({ contracts }: { contracts: ContractAggregate[] }) {
  const rows = useMemo(() => {
    return contracts
      .filter((c) => c.oldestOpen && GARANTIDORAS_SINISTRO.includes(c.garantidora ?? ""))
      .map((c) => ({
        c,
        diasRestantes: diasRestantesSinistro(c.oldestOpen!.vencimento_fatura),
      }))
      .sort((a, b) => a.diasRestantes - b.diasRestantes);
  }, [contracts]);

  return (
    <section aria-labelledby="prazo-sinistro">
      <h2 id="prazo-sinistro" className="text-base font-semibold mb-1">
        Prazo de 60 dias para abertura de sinistro
      </h2>
      <p className="text-sm text-muted-foreground mb-3">
        Contratos com garantidora CredPago, Credaluga ou Eu Acerto e fatura em aberto.
      </p>
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground p-6 text-center">
              Nenhum contrato elegível com fatura em aberto.
            </p>
          ) : (
            <TooltipProvider>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contrato</TableHead>
                    <TableHead>Inquilino</TableHead>
                    <TableHead>Garantidora</TableHead>
                    <TableHead className="text-right">Dias em atraso</TableHead>
                    <TableHead className="text-right">Dias restantes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map(({ c, diasRestantes }) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium whitespace-nowrap">
                        <span className="inline-flex items-center gap-1">
                          {c.codigo_contrato}
                          {c.oldestOpen?.dado_incompleto && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <AlertTriangle className="h-3.5 w-3.5 text-[#F2994A]" />
                              </TooltipTrigger>
                              <TooltipContent>valor não confirmado</TooltipContent>
                            </Tooltip>
                          )}
                        </span>
                      </TableCell>
                      <TableCell>{c.nome_inquilino ?? "—"}</TableCell>
                      <TableCell>{c.garantidora ?? "—"}</TableCell>
                      <TableCell className="text-right">{c.diasEmAtraso}</TableCell>
                      <TableCell className="text-right">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${badgeClass(diasRestantes)}`}
                        >
                          {diasRestantes}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TooltipProvider>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
