import { Badge } from "@/components/ui/badge";

type Cor = "verde" | "amarelo" | "vermelho" | "cinza";

const CLASSES: Record<Cor, string> = {
  verde: "border-[#27AE60]/40 text-[#27AE60] bg-[#27AE60]/5",
  amarelo: "border-amber-500/40 text-amber-600 bg-amber-500/5",
  vermelho: "border-destructive/40 text-destructive bg-destructive/5",
  cinza: "border-muted-foreground/30 text-muted-foreground",
};

const semAcento = (v: string) =>
  v.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

/** Cor do imob_status. Texto não reconhecido fica cinza — nunca é assumido como concluído. */
export function corImobStatus(status: string | null): Cor {
  const s = semAcento(status ?? "");
  if (!s) return "cinza";
  if (/conclu/.test(s)) return "verde";
  if (/devedor|pendencia aberta|acordo/.test(s)) return "amarelo";
  if (/negad/.test(s)) return "vermelho";
  return "cinza";
}

export function PendenciaStatusBadge({ status }: { status: string | null }) {
  const label = (status ?? "").trim() || "Status não informado";
  return (
    <Badge variant="outline" className={`font-normal whitespace-nowrap ${CLASSES[corImobStatus(status)]}`}>
      {label}
    </Badge>
  );
}

export default PendenciaStatusBadge;
