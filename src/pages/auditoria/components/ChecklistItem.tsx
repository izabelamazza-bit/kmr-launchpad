import { useEffect, useState } from "react";
import { Check, X, Circle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

const BADGE_PREFIX = "@@badge:";
const BADGE_STYLES: Record<string, { bg: string; fg: string }> = {
  green: { bg: "#E8F7EE", fg: "#1E7F3E" },
  gray: { bg: "#EEF1F5", fg: "#4F4F4F" },
  red: { bg: "#FDECEC", fg: "#B93030" },
  yellow: { bg: "#FFF6D6", fg: "#8A6D00" },
  orange: { bg: "#FFE7CF", fg: "#A8500C" },
};

function parseBadge(obs: string | null): { color: string; text: string } | null {
  if (!obs || !obs.startsWith(BADGE_PREFIX)) return null;
  const rest = obs.slice(BADGE_PREFIX.length);
  const idx = rest.indexOf(":");
  if (idx < 0) return null;
  const color = rest.slice(0, idx);
  const text = rest.slice(idx + 1);
  if (!BADGE_STYLES[color]) return null;
  return { color, text };
}

export interface ChecklistRow {
  id: string;
  item_number: number;
  section: string;
  item_label: string;
  status: "pending" | "ok" | "nok";
  observation: string | null;
  verified_by_ai?: boolean;
}

interface Props {
  item: ChecklistRow;
  onChange: (id: string, patch: Partial<ChecklistRow>) => void;
}

export function ChecklistItem({ item, onChange }: Props) {
  const badge = parseBadge(item.observation);
  const [obs, setObs] = useState(badge ? "" : item.observation ?? "");
  const [showObs, setShowObs] = useState(!badge && (!!item.observation || item.status === "nok"));

  useEffect(() => {
    const b = parseBadge(item.observation);
    setObs(b ? "" : item.observation ?? "");
    if (item.status === "nok") setShowObs(true);
  }, [item.observation, item.status]);

  useEffect(() => {
    const t = setTimeout(() => {
      const b = parseBadge(item.observation);
      const current = b ? "" : item.observation ?? "";
      if (current !== obs) {
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
          <div className="text-sm font-medium text-foreground flex items-center gap-2 flex-wrap">
            <span>
              {item.item_number}. {item.item_label}
            </span>
            {badge && (
              <Badge
                className="text-[11px] font-medium px-2 py-0.5"
                style={{
                  background: BADGE_STYLES[badge.color].bg,
                  color: BADGE_STYLES[badge.color].fg,
                  borderColor: "transparent",
                }}
              >
                {badge.text}
              </Badge>
            )}
            {item.verified_by_ai && (
              <Badge
                className="text-[10px] font-medium px-2 py-0.5"
                style={{ background: "#8B5CF6", color: "#fff", borderColor: "transparent" }}
              >
                <Sparkles className="h-3 w-3 mr-1" /> Verificado pela IA
              </Badge>
            )}
          </div>
          {!badge && !showObs && item.status === "ok" && (
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-primary mt-1"
              onClick={() => setShowObs(true)}
            >
              + Adicionar observação
            </button>
          )}
          {!badge && showObs && (
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