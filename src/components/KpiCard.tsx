import { Card, CardContent } from "@/components/ui/card";

export function KpiCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Card>
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