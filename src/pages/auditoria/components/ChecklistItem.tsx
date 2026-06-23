import { useEffect, useState } from "react";
import { Check, X, Circle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export interface ChecklistRow {
  id: string;
  item_number: number;
  section: string;
  item_label: string;
  status: "pending" | "ok" | "nok";
  observation: string | null;
}

interface Props {
  item: ChecklistRow;
  onChange: (id: string, patch: Partial<ChecklistRow>) => void;
}

export function ChecklistItem({ item, onChange }: Props) {
  const [obs, setObs] = useState(item.observation ?? "");
  const [showObs, setShowObs] = useState(!!item.observation || item.status === "nok");

  useEffect(() => {
    setObs(item.observation ?? "");
    if (item.status === "nok") setShowObs(true);
  }, [item.observation, item.status]);

  useEffect(() => {
    const t = setTimeout(() => {
      if ((item.observation ?? "") !== obs) {
        onChange(item.id, { observation: obs });
      }
    }, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [obs]);

  const btn = (
    s: "pending" | "ok" | "nok",
    Icon: any,
    bg: string,
    activeBg: string
  ) => (
    <button
      type="button"
      onClick={() => onChange(item.id, { status: s })}
      className="h-9 w-9 rounded-md flex items-center justify-center border transition-all"
      style={{
        background: item.status === s ? activeBg : bg,
        borderColor: item.status === s ? activeBg : "#E8EDF2",
        color: item.status === s ? "#fff" : "#4F4F4F",
      }}
      title={s}
    >
      <Icon className="h-4 w-4" />
    </button>
  );

  return (
    <div className="border rounded-md p-3 bg-card">
      <div className="flex items-start gap-3">
        <div className="flex gap-1 shrink-0">
          {btn("pending", Circle, "#fff", "#9CA3AF")}
          {btn("ok", Check, "#fff", "#27AE60")}
          {btn("nok", X, "#fff", "#EB5757")}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-foreground">
            {item.item_number}. {item.item_label}
          </div>
          {!showObs && item.status === "ok" && (
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-primary mt-1"
              onClick={() => setShowObs(true)}
            >
              + Adicionar observação
            </button>
          )}
          {showObs && (
            <Textarea
              className="mt-2 text-sm"
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              placeholder="Observação do item..."
              rows={2}
            />
          )}
        </div>
      </div>
    </div>
  );
}