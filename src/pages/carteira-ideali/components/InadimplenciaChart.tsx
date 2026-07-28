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
import { getGarantidoraExibicao, type ContractAggregate } from "../lib/useCarteiraIdeali";

export interface InadimplenciaFilter {
  garantidora: string;
  status: string;
}

const SERIES = [
  { key: "Ativo", color: "#2F80ED" },
  { key: "Pausado", color: "#F2994A" },
  { key: "Encerrado", color: "#EB5757" },
] as const;

interface Props {
  contracts: ContractAggregate[];
  selected: InadimplenciaFilter | null;
  onSelect: (f: InadimplenciaFilter | null) => void;
}

export function InadimplenciaChart({ contracts, selected, onSelect }: Props) {
  const data = useMemo(() => {
    const map = new Map<string, Record<string, any>>();
    for (const c of contracts) {
      if (!c.oldestOpen) continue;
      if (c.status !== "Ativo" && c.status !== "Pausado" && c.status !== "Encerrado") continue;
      const key = getGarantidoraExibicao(c);
      const entry = map.get(key) ?? { garantidora: key, Ativo: 0, Pausado: 0, Encerrado: 0 };
      entry[c.status] += 1;
      map.set(key, entry);
    }
    return [...map.values()].sort(
      (a, b) =>
        b.Ativo + b.Pausado + b.Encerrado - (a.Ativo + a.Pausado + a.Encerrado),
    );
  }, [contracts]);

  return (
    <section aria-labelledby="inadimplencia-chart">
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <h2 id="inadimplencia-chart" className="text-base font-semibold">
          Inadimplência por tipo de garantia
        </h2>
        {selected && (
          <Button variant="outline" size="sm" onClick={() => onSelect(null)}>
            <X className="h-4 w-4 mr-1" /> Limpar filtro: {selected.garantidora} · {selected.status}
          </Button>
        )}
      </div>
      <Card>
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground mb-2">
            Contratos com pelo menos uma fatura em aberto, por garantidora e situação do contrato.
          </p>
          {data.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Nenhum contrato inadimplente encontrado.
            </p>
          ) : (
            <div style={{ height: Math.max(240, data.length * 64 + 60) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} fontSize={12} />
                  <YAxis type="category" dataKey="garantidora" width={110} fontSize={12} />
                  <Tooltip cursor={{ fill: "hsl(var(--muted))" }} />
                  <Legend />
                  {SERIES.map((s) => (
                    <Bar
                      key={s.key}
                      dataKey={s.key}
                      fill={s.color}
                      radius={[0, 4, 4, 0]}
                      cursor="pointer"
                      onClick={(d: any) =>
                        d?.garantidora ? onSelect({ garantidora: d.garantidora, status: s.key }) : null
                      }
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}