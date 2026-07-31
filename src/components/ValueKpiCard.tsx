import { Card, CardContent } from "@/components/ui/card";
import { formatBRL } from "@/pages/carteira-ideali/lib/useCarteiraIdeali";

export function ValueKpiCard({
  label,
  value,
  hint,
  color,
  onClick,
}: {
  label: string;
  value: number;
  hint?: string;
  color?: string;
  onClick?: () => void;
}) {
  return (
    <Card
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => (e.key === "Enter" || e.key === " ") && onClick() : undefined}
      className={onClick ? "cursor-pointer transition-shadow hover:shadow-md" : undefined}
    >
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
