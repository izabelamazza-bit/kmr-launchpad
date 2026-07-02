import { supabase } from "@/integrations/supabase/client";

export interface ContractSectionA {
  garantidora: string | null;
  locatario_nome: string | null;
  locador_nome: string | null;
  endereco_imovel: string | null;
  indice_reajuste: string | null;
}

export interface ExtractedSectionB {
  locadores: string | null;
  locatarios: string | null;
  endereco_imovel: string | null;
  indice_reajuste: string | null;
  garantidora_normalizada: string | null;
}

export interface ChecklistLite {
  id: string;
  item_number: number;
  status: "pending" | "ok" | "nok";
  observation: string | null;
  verified_by_ai?: boolean;
}

export interface AutoPatch {
  id: string;
  item_number: number;
  status: "ok" | "nok";
  observation: string | null;
  verified_by_ai: true;
}

const norm = (s: string | null | undefined) =>
  (s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

export const normAddress = (s: string | null | undefined) =>
  (s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([,\-])\s*/g, "$1")
    .replace(/\.+/g, "")
    .trim();

const splitMulti = (s: string | null | undefined) =>
  (s ?? "")
    .split(/[;\n]/)
    .map((x) => x.trim())
    .filter(Boolean);

const setEqualIgnoreOrder = (a: string[], b: string[]) => {
  if (!a.length || !b.length) return null;
  const na = a.map(norm).sort();
  const nb = b.map(norm).sort();
  // Considera OK se todos os itens de A aparecem em B (subconjunto)
  return na.every((x) => nb.includes(x));
};

function cmpSingle(a: string | null, b: string | null): boolean | null {
  if (!a || !b) return null;
  return norm(a) === norm(b);
}

function cmpAddress(a: string | null, b: string | null): boolean | null {
  if (!a || !b) return null;
  return normAddress(a) === normAddress(b);
}

function cmpMulti(a: string | null, b: string | null): boolean | null {
  const aa = splitMulti(a);
  const bb = splitMulti(b);
  if (!aa.length || !bb.length) return null;
  return setEqualIgnoreOrder(aa, bb);
}

function mkObs(label: string, a: string | null, b: string | null) {
  return `IA: Imoview = "${a ?? "—"}" · Contrato = "${b ?? "—"}"`;
}

export function buildAutoPatches(
  contract: ContractSectionA,
  extracted: ExtractedSectionB,
  checklist: ChecklistLite[]
): AutoPatch[] {
  const byNum = new Map(checklist.map((i) => [i.item_number, i]));
  const patches: AutoPatch[] = [];

  const push = (
    itemNumber: number,
    result: boolean | null,
    label: string,
    a: string | null,
    b: string | null
  ) => {
    if (result === null) return;
    const item = byNum.get(itemNumber);
    if (!item) return;
    patches.push({
      id: item.id,
      item_number: itemNumber,
      status: result ? "ok" : "nok",
      observation: result ? null : mkObs(label, a, b),
      verified_by_ai: true,
    });
  };

  // Item 4 — locatário
  push(4, cmpMulti(contract.locatario_nome, extracted.locatarios), "Locatário", contract.locatario_nome, extracted.locatarios);
  // Item 5 — locador
  push(5, cmpMulti(contract.locador_nome, extracted.locadores), "Locador", contract.locador_nome, extracted.locadores);
  // Item 6 — endereço (normalização tolerante a espaços/pontuação)
  push(6, cmpAddress(contract.endereco_imovel, extracted.endereco_imovel), "Endereço", contract.endereco_imovel, extracted.endereco_imovel);
  // Item 25 — índice de reajuste
  push(25, cmpSingle(contract.indice_reajuste, extracted.indice_reajuste), "Índice", contract.indice_reajuste, extracted.indice_reajuste);

  // Item 26 — garantidora (com exceção KMR × Quintocred)
  const gA = contract.garantidora;
  const gB = extracted.garantidora_normalizada;
  if (gA && gB) {
    const item = byNum.get(26);
    if (item) {
      if (gA === "KMR" && gB === "Quintocred") {
        patches.push({
          id: item.id,
          item_number: 26,
          status: "ok",
          observation: "Contrato tombado Quintocred",
          verified_by_ai: true,
        });
      } else {
        const ok = norm(gA) === norm(gB);
        patches.push({
          id: item.id,
          item_number: 26,
          status: ok ? "ok" : "nok",
          observation: ok ? null : mkObs("Garantidora", gA, gB),
          verified_by_ai: true,
        });
      }
    }
  }

  return patches;
}

export async function applyAutoComparison(
  contract: ContractSectionA,
  extracted: ExtractedSectionB,
  checklist: ChecklistLite[]
): Promise<AutoPatch[]> {
  const patches = buildAutoPatches(contract, extracted, checklist);
  if (!patches.length) return [];
  const { data: userRes } = await supabase.auth.getUser();
  const uid = userRes.user?.id ?? null;
  await Promise.all(
    patches.map((p) =>
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
  return patches;
}

export function isTombadoQuintocred(
  garantidoraA: string | null,
  garantidoraB: string | null
) {
  return garantidoraA === "KMR" && garantidoraB === "Quintocred";
}