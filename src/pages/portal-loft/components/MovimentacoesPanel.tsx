import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowRight } from "lucide-react";
import { fmtBool, hasChange, type Movement } from "../lib/usePortalLoft";

export function MovimentacoesPanel({ movements }: { movements: Movement[] }) {
  const rows = movements.filter(hasChange);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Movimentações desta importação</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma movimentação em relação à importação anterior.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contrato</TableHead>
                  <TableHead>Inquilino</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Cancelamento de taxa</TableHead>
                  <TableHead>Pagamento suspenso</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((m) => (
                  <TableRow key={m.contrato}>
                    <TableCell className="font-medium">{m.contrato}</TableCell>
                    <TableCell className="max-w-[220px] truncate">{m.inquilino ?? "—"}</TableCell>
                    <TableCell>
                      {m.status_atual !== m.status_anterior ? (
                        <span className="inline-flex items-center gap-1.5 text-sm">
                          <span className="text-muted-foreground">{m.status_anterior ?? "—"}</span>
                          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-medium">{m.status_atual ?? "—"}</span>
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">{m.status_atual ?? "—"}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {m.cancelamento_taxa_atual !== m.cancelamento_taxa_anterior ? (
                        <Badge variant="destructive">
                          {fmtBool(m.cancelamento_taxa_anterior)} → {fmtBool(m.cancelamento_taxa_atual)}
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {m.pagamento_suspenso_atual !== m.pagamento_suspenso_anterior ? (
                        <Badge variant="destructive">
                          {fmtBool(m.pagamento_suspenso_anterior)} → {fmtBool(m.pagamento_suspenso_atual)}
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default MovimentacoesPanel;