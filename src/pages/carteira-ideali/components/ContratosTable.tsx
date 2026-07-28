import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertTriangle } from "lucide-react";
import { STATUS_LIST, formatBRL, type ContractAggregate } from "../lib/useCarteiraIdeali";

const PAGE_SIZE = 25;
const ALL = "__all__";

interface Props {
  contracts: ContractAggregate[];
  garantidoraFilter: string | null;
  onGarantidoraFilterChange: (g: string | null) => void;
}

export function ContratosTable({ contracts, garantidoraFilter, onGarantidoraFilterChange }: Props) {
  const [status, setStatus] = useState<string>(ALL);
  const [onlyLate, setOnlyLate] = useState(false);
  const [page, setPage] = useState(1);

  const garantidoras = useMemo(
    () =>
      [...new Set(contracts.map((c) => c.garantidora ?? "Não informada"))].sort((a, b) =>
        a.localeCompare(b, "pt-BR"),
      ),
    [contracts],
  );

  const filtered = useMemo(() => {
    return contracts.filter((c) => {
      if (status !== ALL && c.status !== status) return false;
      if (garantidoraFilter && (c.garantidora ?? "Não informada") !== garantidoraFilter) return false;
      if (onlyLate && !c.oldestOpen) return false;
      return true;
    });
  }, [contracts, status, garantidoraFilter, onlyLate]);

  useEffect(() => {
    setPage(1);
  }, [status, garantidoraFilter, onlyLate]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const endereco = (c: ContractAggregate) =>
    [c.rua, c.numero, c.bairro, c.cidade].filter(Boolean).join(", ") || "—";

  return (
    <section aria-labelledby="contratos-tabela">
      <h2 id="contratos-tabela" className="text-base font-semibold mb-3">
        Contratos ({filtered.length})
      </h2>

      <div className="flex flex-col sm:flex-row sm:items-end gap-3 mb-3">
        <div className="sm:w-52">
          <Label className="text-xs">Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos os status</SelectItem>
              {STATUS_LIST.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="sm:w-52">
          <Label className="text-xs">Garantidora</Label>
          <Select
            value={garantidoraFilter ?? ALL}
            onValueChange={(v) => onGarantidoraFilterChange(v === ALL ? null : v)}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todas as garantidoras</SelectItem>
              {garantidoras.map((g) => (
                <SelectItem key={g} value={g}>{g}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 pb-2">
          <Switch id="only-late" checked={onlyLate} onCheckedChange={setOnlyLate} />
          <Label htmlFor="only-late" className="text-sm">Somente contratos com atraso</Label>
        </div>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {pageRows.length === 0 ? (
            <p className="text-sm text-muted-foreground p-6 text-center">
              Nenhum contrato encontrado para os filtros selecionados.
            </p>
          ) : (
            <TooltipProvider>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contrato</TableHead>
                    <TableHead>Inquilino</TableHead>
                    <TableHead>Endereço</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tipo de garantia</TableHead>
                    <TableHead>Garantidora</TableHead>
                    <TableHead className="text-right">Aluguel</TableHead>
                    <TableHead className="text-right">Atraso</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageRows.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium whitespace-nowrap">
                        <span className="inline-flex items-center gap-1">
                          {c.codigo_contrato}
                          {c.hasIncomplete && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <AlertTriangle className="h-3.5 w-3.5 text-[#F2994A]" />
                              </TooltipTrigger>
                              <TooltipContent>
                                possui fatura sem valor registrado — verificar manualmente
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </span>
                      </TableCell>
                      <TableCell>{c.nome_inquilino ?? "—"}</TableCell>
                      <TableCell className="max-w-[260px] truncate" title={endereco(c)}>
                        {endereco(c)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{c.status}</TableCell>
                      <TableCell>{c.tipo_garantia ?? "—"}</TableCell>
                      <TableCell>{c.garantidora ?? "—"}</TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        {c.valor_aluguel === null ? "—" : formatBRL(c.valor_aluguel)}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        {c.diasEmAtraso === null ? (
                          <span className="text-[#27AE60] font-medium">Em dia</span>
                        ) : (
                          <span className="text-destructive font-medium">{c.diasEmAtraso} dias</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TooltipProvider>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3">
          <p className="text-sm text-muted-foreground">
            Página {page} de {totalPages}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
