import { supabase } from "@/integrations/supabase/client";

export interface ImoviewSectionA {
  ocupacao: string | null;
  status_contrato: string | null;
  data_proximo_reajuste: string | null;
}

export interface ChecklistLite {
  id: string;
  item_number: number;
  status: "pending" | "ok" | "nok";
  observation: string | null;
  verified_by_ai?: boolean;
}

export interface ImoviewPatch {
  id: string;
  item_number: number;
  status: "ok" | "nok";
  observation: string;
  verified_by_ai: true;
}

export const BADGE_PREFIX = "@@badge:";

function mkBadge(color: string, text: string) {
  return `${BADGE_PREFIX}${color}:${text}`;
}

function fmtBR(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function daysUntil(iso: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [y, m, d] = iso.split("-").map(Number);
  const target = new Date(y, (m ?? 1) - 1, d ?? 1);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

export function buildImoviewPatches(
  contract: ImoviewSectionA,
  checklist: ChecklistLite[]
): ImoviewPatch[] {
  const byNum = new Map(checklist.map((i) => [i.item_number, i]));
  const patches: ImoviewPatch[] = [];

  // Item 1 — Ocupação
  const it1 = byNum.get(1);
  if (it1 && contract.ocupacao) {
    const color = contract.ocupacao === "Ocupado" ? "green" : "gray";
    patches.push({
      id: it1.id,
      item_number: 1,
      status: "ok",
      observation: mkBadge(color, contract.ocupacao),
      verified_by_ai: true,
    });
  }

  // Item 2 — Status contrato
  const it2 = byNum.get(2);
  if (it2 && contract.status_contrato) {
    const isSaudavel = contract.status_contrato === "Saudavel";
    patches.push({
      id: it2.id,
      item_number: 2,
      status: "ok",
      observation: mkBadge(isSaudavel ? "green" : "red", isSaudavel ? "Saudável" : "Inadimplente"),
      verified_by_ai: true,
    });
  }

  // Item 3 — Prazo (data_proximo_reajuste)
  const it3 = byNum.get(3);
  if (it3 && contract.data_proximo_reajuste) {
    const iso = contract.data_proximo_reajuste;
    const diff = daysUntil(iso);
    const br = fmtBR(iso);
    let color: string;
    let text: string;
    let status: "ok" | "nok";
    if (diff > 90) {
      color = "green";
      text = `Próximo reajuste em ${br} · ${diff} dias`;
      status = "ok";
    } else if (diff > 30) {
      color = "yellow";
      text = `Reajuste se aproximando · ${br} · ${diff} dias`;
      status = "ok";
    } else if (diff > 0) {
      color = "orange";
      text = `Reajuste iminente · ${br} · ${diff} dias`;
      status = "nok";
    } else {
      color = "red";
      text = `Reajuste em atraso desde ${br}`;
      status = "nok";
    }
    patches.push({
      id: it3.id,
      item_number: 3,
      status,
      observation: mkBadge(color, text),
      verified_by_ai: true,
    });
  }

  return patches;
}

export async function applyImoviewChecklist(
  contract: ImoviewSectionA,
  checklist: ChecklistLite[]
): Promise<ImoviewPatch[]> {
  const patches = buildImoviewPatches(contract, checklist);
  const byNum = new Map(checklist.map((i) => [i.item_number, i]));
  // Idempotência: só grava itens que mudaram
  const changed = patches.filter((p) => {
    const current = byNum.get(p.item_number);
    if (!current) return false;
    return (
      current.status !== p.status ||
      (current.observation ?? "") !== p.observation ||
      current.verified_by_ai !== true
    );
  });
  if (!changed.length) return [];
  const { data: userRes } = await supabase.auth.getUser();
  const uid = userRes.user?.id ?? null;
  await Promise.all(
    changed.map((p) =>
      supabase
        .from("audit_checklist_items")
        .update({
          status: p.status,
          observation: p.observation,
          verified_by_ai: true,
          updated_by: uid,
        })
        .eq("id", p.id)
    )
  );
  return changed;
}