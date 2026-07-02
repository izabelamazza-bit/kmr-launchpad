import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ChecklistRow } from "./ChecklistItem";

const CRITICAL_ITEMS = [4, 5, 6, 7];
const CRITICAL_LABELS: Record<number, string> = {
  4: "nome do locatário divergente",
  5: "nome do locador divergente",
  6: "endereço divergente",
  7: "CPF do locatário divergente",
};

interface Props {
  checklist: ChecklistRow[];
  garantidoraForm: string | null;
  garantidoraExtraida: string | null;
}

export function ResultadoAuditoria({ checklist, garantidoraForm, garantidoraExtraida }: Props) {
  const total = checklist.length;
  const aprovados = checklist.filter((i) => i.status === "ok").length;
  const reprovados = checklist.filter((i) => i.status === "nok").length;
  const pendentes = checklist.filter((i) => i.status === "pending").length;
  const progressPct = total ? Math.round((aprovados / total) * 100) : 0;
  const pctPendentes = total ? pendentes / total : 0;

  const criticosReprovados = checklist.filter(
    (i) => CRITICAL_ITEMS.includes(i.item_number) && i.status === "nok"
  );
  const garantidoraDivergenteNaoTombada =
    !!garantidoraForm &&
    !!garantidoraExtraida &&
    garantidoraForm.toLowerCase() !== garantidoraExtraida.toLowerCase() &&
    !(garantidoraForm === "KMR" && garantidoraExtraida === "Quintocred");

  const criticalNok = criticosReprovados.length > 0 || garantidoraDivergenteNaoTombada;

  let risco: "Baixo" | "Médio" | "Alto";
  let riscoCor: string;
  let riscoEmoji: string;
  if (criticalNok) {
    risco = "Alto";
    riscoCor = "#EB5757";
    riscoEmoji = "🔴";
  } else if (reprovados > 0 || pctPendentes > 0.3) {
    risco = "Médio";
    riscoCor = "#F2C94C";
    riscoEmoji = "🟡";
  } else {
    risco = "Baixo";
    riscoCor = "#27AE60";
    riscoEmoji = "🟢";
  }

  let sintese: string;
  if (pendentes === total && total > 0) {
    sintese = `Auditoria não iniciada — ${total} itens pendentes de verificação.`;
  } else if (pendentes > 0) {
    const detalhesCriticos = criticosReprovados.length
      ? ` (${criticosReprovados.map((c) => CRITICAL_LABELS[c.item_number]).join(", ")})`
      : "";
    const alerta =
      risco === "Alto" ? " — revisar item crítico antes de prosseguir." : ".";
    sintese = `Auditoria em andamento — ${aprovados} ${aprovados === 1 ? "item aprovado" : "itens aprovados"}, ${reprovados} ${reprovados === 1 ? "reprovado" : "reprovados"}${detalhesCriticos}, ${pendentes} ${pendentes === 1 ? "pendente" : "pendentes"} de verificação manual. Risco ${risco.toLowerCase()}${alerta}`;
  } else {
    sintese = `Auditoria concluída — ${aprovados} aprovados, ${reprovados} reprovados. Risco ${risco.toLowerCase()}.`;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resultado da auditoria</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-muted-foreground">
              {progressPct}% aprovados ({aprovados} de {verificaveis} itens verificáveis)
            </span>
            {pendentes > 0 && (
              <span className="text-xs text-muted-foreground">
                {pendentes} ainda {pendentes === 1 ? "pendente" : "pendentes"}
              </span>
            )}
          </div>
          <Progress value={progressPct} className="h-2" />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-md border p-3 text-center">
            <div className="text-2xl font-semibold text-[#27AE60]">✅ {aprovados}</div>
            <div className="text-xs text-muted-foreground mt-1">Aprovados</div>
          </div>
          <div className="rounded-md border p-3 text-center">
            <div className="text-2xl font-semibold text-[#EB5757]">❌ {reprovados}</div>
            <div className="text-xs text-muted-foreground mt-1">Reprovados</div>
          </div>
          <div className="rounded-md border p-3 text-center">
            <div className="text-2xl font-semibold text-[#4F4F4F]">⬜ {pendentes}</div>
            <div className="text-xs text-muted-foreground mt-1">Pendentes</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Nível de risco:</span>
          <Badge
            className="text-sm font-semibold px-3 py-1"
            style={{ background: riscoCor, color: "#fff", borderColor: "transparent" }}
          >
            {riscoEmoji} {risco}
          </Badge>
        </div>

        <p className="text-sm text-foreground bg-muted/50 border rounded-md p-3 leading-relaxed">
          {sintese}
        </p>
      </CardContent>
    </Card>
  );
}