import { AlertTriangle, AlertCircle, Calendar, Clock } from "lucide-react";

interface Props {
  garantidoraManual: string | null;
  extracted: {
    garantidora_normalizada: string | null;
    data_termino: string | null;
  } | null;
}

export function AlertasExtracao({ garantidoraManual, extracted }: Props) {
  if (!extracted) return null;

  const alerts: { color: string; bg: string; border: string; icon: any; text: string }[] = [];
  const g = extracted.garantidora_normalizada;

  if (g === "Quintocred") {
    alerts.push({
      color: "#9B1C1C",
      bg: "#FEE2E2",
      border: "#EB5757",
      icon: AlertTriangle,
      text: "⚠️ Atenção: este contrato menciona a Quintocred, que não é uma garantidora parceira ativa. Verifique antes de prosseguir.",
    });
  }
  if (g === "Outra" || g === "Não identificada") {
    alerts.push({
      color: "#7C2D12",
      bg: "#FFEDD5",
      border: "#F2994A",
      icon: AlertCircle,
      text: "Garantidora não reconhecida — revise manualmente.",
    });
  }
  if (g && garantidoraManual && g !== garantidoraManual && g !== "Quintocred" && g !== "Outra" && g !== "Não identificada") {
    alerts.push({
      color: "#854D0E",
      bg: "#FEF9C3",
      border: "#F2C94C",
      icon: AlertCircle,
      text: `A garantidora selecionada manualmente (${garantidoraManual}) difere da identificada no contrato (${g}). Confira.`,
    });
  }

  if (extracted.data_termino) {
    const end = new Date(extracted.data_termino + "T00:00:00");
    const now = new Date();
    const days = Math.floor((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (days < 0) {
      alerts.push({
        color: "#854D0E",
        bg: "#FEF9C3",
        border: "#F2C94C",
        icon: Clock,
        text: "Contrato com prazo expirado. Verificar renovação.",
      });
    } else if (days <= 90) {
      alerts.push({
        color: "#1E40AF",
        bg: "#DBEAFE",
        border: "#2F80ED",
        icon: Calendar,
        text: `Contrato vencendo em breve (${days} dias).`,
      });
    }
  }

  if (!alerts.length) return null;

  return (
    <div className="space-y-2">
      {alerts.map((a, i) => {
        const Icon = a.icon;
        return (
          <div
            key={i}
            className="flex items-start gap-3 p-3 rounded-md border-l-4"
            style={{ background: a.bg, borderLeftColor: a.border, color: a.color }}
          >
            <Icon className="h-5 w-5 mt-0.5 shrink-0" />
            <p className="text-sm font-medium">{a.text}</p>
          </div>
        );
      })}
    </div>
  );
}