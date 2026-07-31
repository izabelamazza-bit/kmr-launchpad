import { Card, CardContent } from "@/components/ui/card";

export function KpiCard({
  label,
  value,
  color,
  onClick,
}: {
  label: string;
  value: number;
  color: string;
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
        <div className="text-2xl font-bold mt-1" style={{ color }}>
          {value}
        </div>
      </CardContent>
    </Card>
  );
}

export default KpiCard;