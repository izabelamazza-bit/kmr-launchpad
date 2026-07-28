import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { getGarantidoraExibicao, type ContractAggregate } from "../lib/useCarteiraIdeali";

interface Props {
  contracts: ContractAggregate[];
  selected: string | null;
  onSelect: (g: string | null) => void;
}

const COLORS = ["#2F80ED", "#0F2A44", "#27AE60", "#F2C94C", "#F2994A", "#56CCF2", "#9B51E0", "#EB5757"];

export function GarantiaChart({ contracts, selected, onSelect }: Props) {
  const data = useMemo(() => {
    const map = new Map<string, { garantidora: string; Contratos: number }>();
    for (const c of contracts) {
      if (c.status !== "Ativo") continue;
      const key = getGarantidoraExibicao(c);
      const entry = map.get(key) ?? { garantidora: key, Contratos: 0 };
      entry.Contratos += 1;
      map.set(key, entry);
    }
    return [...map.values()].sort((a, b) => b.Contratos - a.Contratos);
  }, [contracts]);

  const total = useMemo(() => data.reduce((s, d) => s + d.Contratos, 0), [data]);
  const pct = (v: number) => (total ? ((v / total) * 100).toFixed(1) : "0");

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
            Composição da carteira ativa por garantidora. Clique em uma fatia para filtrar a tabela
            de contratos abaixo.
          </p>
          <div className="h-[380px] sm:h-[420px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="Contratos"
                  nameKey="garantidora"
                  cx="50%"
                  cy="42%"
                  innerRadius="45%"
                  outerRadius="72%"
                  paddingAngle={1}
                  cursor="pointer"
                  onClick={(d: any) => onSelect(d?.garantidora ?? d?.payload?.garantidora ?? null)}
                  label={({ value }: any) => `${value} (${pct(value)}%)`}
                  labelLine={false}
                  fontSize={11}
                >
                  {data.map((d, i) => (
                    <Cell
                      key={d.garantidora}
                      fill={COLORS[i % COLORS.length]}
                      opacity={selected && selected !== d.garantidora ? 0.35 : 1}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: any, n: any) => [`${v} contratos (${pct(Number(v))}%)`, n]}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  wrapperStyle={{ fontSize: 12 }}
                  formatter={(value: any, entry: any) => {
                    const v = entry?.payload?.Contratos ?? 0;
                    return `${value} — ${v} (${pct(v)}%)`;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
