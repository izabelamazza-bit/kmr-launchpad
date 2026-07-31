import { Card, CardContent } from "@/components/ui/card";
import { formatBRL } from "@/pages/carteira-ideali/lib/useCarteiraIdeali";

export function ValueKpiCard({
  label,
  value,
  hint,
  color,
}: {
  label: string;
  value: number;
  hint?: string;
  color?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-2xl font-bold mt-1" style={color ? { color } : undefined}>
          {formatBRL(value)}
        </div>
        {hint ? <div className="text-xs text-muted-foreground mt-1">{hint}</div> : null}
      </CardContent>
    </Card>
  );
}

export default ValueKpiCard;
