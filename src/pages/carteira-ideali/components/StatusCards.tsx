import { Card, CardContent } from "@/components/ui/card";
import { STATUS_LIST } from "../lib/useCarteiraIdeali";

interface Props {
  total: number;
  statusCounts: Record<string, number>;
}

export function StatusCards({ total, statusCounts }: Props) {
  const items = [
    { label: "Total de contratos", value: total, emphasis: true },
    ...STATUS_LIST.map((s) => ({ label: s, value: statusCounts[s] ?? 0, emphasis: false })),
  ];

  return (
    <section aria-labelledby="status-carteira">
      <h2 id="status-carteira" className="text-base font-semibold mb-3">
        Status da carteira
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {items.map((i) => (
          <Card key={i.label} className={i.emphasis ? "border-primary/40" : undefined}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground leading-tight">{i.label}</p>
              <p className="text-2xl font-bold mt-1">{i.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
