import { garantidoraColor } from "../lib/garantidoras";

export function GarantidoraBadge({ value }: { value: string | null | undefined }) {
  const c = garantidoraColor(value);
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ background: c.bg, color: c.text }}
    >
      {c.label}
    </span>
  );
}