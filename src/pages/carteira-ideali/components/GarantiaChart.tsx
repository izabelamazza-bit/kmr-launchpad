import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ContractAggregate } from "../lib/useCarteiraIdeali";

interface Props {
  contracts: ContractAggregate[];
  selected: string | null;
  onSelect: (g: string | null) => void;
}

export function GarantiaChart({ contracts, selected, onSelect }: Props) {
  const data = useMemo(() => {
    const map = new Map<string, { garantidora: string; Contratos: number }>();
    for (const c of contracts) {
      const key = c.garantidora ?? "Não informada";
      const entry = map.get(key) ?? { garantidora: key, Contratos: 0 };
      entry.Contratos += 1;
      map.set(key, entry);
    }
    return [...map.values()].sort((a, b) => b.Contratos - a.Contratos);
  }, [contracts]);

  return (
    <section aria-labelledby="garantia-chart">
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <h2 id="garantia-chart" className="text-base font-semibold">
          Contratos por tipo de garantia
        </h2>
        {selected && (
          <Button variant="outline" size="sm" onClick={() => onSelect(null)}>
            <X className="h-4 w-4 mr-1" /> Limpar filtro: {selected}
          </Button>
        )}
      </div>
      <Card>
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground mb-2">
            Clique em uma barra para filtrar a tabela de contratos abaixo.
          </p>
          <div style={{ height: Math.max(220, data.length * 46 + 60) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} fontSize={12} />
                <YAxis type="category" dataKey="garantidora" width={110} fontSize={12} />
                <Tooltip cursor={{ fill: "hsl(var(--muted))" }} />
                <Legend />
                <Bar
                  dataKey="Contratos"
                  fill="#2F80ED"
                  radius={[0, 4, 4, 0]}
                  cursor="pointer"
                  onClick={(d: any) => onSelect(d?.garantidora ?? null)}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
