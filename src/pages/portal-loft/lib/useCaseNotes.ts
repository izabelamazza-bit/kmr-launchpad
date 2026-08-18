import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { normContrato } from "./useInadimplenciaLoft";

export type CaseNote = Database["public"]["Tables"]["guarantor_portal_case_notes"]["Row"];

const PAGE = 1000;

/** Data considerada da nota (criação, com fallback na importação). */
export const dataNota = (n: CaseNote): string | null => n.criado_em ?? n.data_importacao ?? null;

/** Autor da movimentação: operação e, na falta, usuário da imobiliária. */
export const autorNota = (n: CaseNote): string =>
  n.operation_user_name?.trim() || n.real_estate_user_name?.trim() || "—";

export async function fetchCaseNotes(contrato?: string): Promise<CaseNote[]> {
  const out: CaseNote[] = [];
  for (let from = 0; ; from += PAGE) {
    let q = supabase.from("guarantor_portal_case_notes").select("*");
    if (contrato) q = q.eq("contrato", contrato);
    const { data, error } = await q.range(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    out.push(...((data ?? []) as CaseNote[]));
    if (!data || data.length < PAGE) break;
  }
  return out;
}

/** Índice contrato normalizado → data da nota mais recente. */
export type NotaIndex = Map<string, string>;

export function buildNotaIndex(rows: CaseNote[]): NotaIndex {
  const idx: NotaIndex = new Map();
  for (const n of rows) {
    const key = normContrato(n.contrato);
    const d = dataNota(n);
    if (!key || !d) continue;
    const atual = idx.get(key);
    if (!atual || new Date(d).getTime() > new Date(atual).getTime()) idx.set(key, d);
  }
  return idx;
}

export function useCaseNotesLoft() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [index, setIndex] = useState<NotaIndex>(new Map());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setIndex(buildNotaIndex(await fetchCaseNotes()));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao carregar as movimentações do Portal Loft.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { loading, error, index, reload: () => void load() };
}
