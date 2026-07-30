import { Badge } from "@/components/ui/badge";

export function StatusBadge({ status }: { status: string | null }) {
  const s = (status ?? "").trim().toLowerCase();
  if (!s) return <span className="text-sm text-muted-foreground">—</span>;

  if (s === "ativo")
    return <Badge className="bg-[#27AE60] text-white hover:bg-[#27AE60]/90">{status}</Badge>;
  if (s === "exonerado") return <Badge variant="destructive">{status}</Badge>;
  if (s === "cancelado") return <Badge variant="secondary">{status}</Badge>;
  return <Badge variant="outline">{status}</Badge>;
}

export default StatusBadge;