import { Card, CardContent } from "@/components/ui/card";

interface Props {
  total: number;
  ativos: number;
  cancelados: number;
  exonerados: number;
  novos: number;
  mudancasStatus: number;
  temAnterior: boolean;
}

export function ResumoCards({
  total,
  ativos,
  cancelados,
  exonerados,
  novos,
  mudancasStatus,
  temAnterior,
}: Props) {
  const cards = [
    { label: "Total de contratos", value: total, color: "" },
    { label: "Ativos", value: ativos, color: "text-[#27AE60]" },
    { label: "Cancelados", value: cancelados, color: "text-muted-foreground" },
    { label: "Exonerados", value: exonerados, color: "text-destructive" },
    {
      label: temAnterior ? "Casos novos desde a última importação" : "Contratos nesta 1ª importação",
      value: novos,
      color: "text-[#2F80ED]",
    },
    { label: "Mudanças de status nesta importação", value: mudancasStatus, color: "text-[#2F80ED]" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((c) => (
        <Card key={c.label}>
          <CardContent className="p-4">
            <p className={`text-2xl font-semibold ${c.color}`}>{c.value}</p>
            <p className="text-xs text-muted-foreground mt-1 leading-snug">{c.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default ResumoCards;