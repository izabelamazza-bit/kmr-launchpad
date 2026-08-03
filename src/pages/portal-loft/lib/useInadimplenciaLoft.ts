import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Pendencia = Database["public"]["Tables"]["guarantor_portal_inadimplencia"]["Row"];

const PAGE = 1000;

/** Normaliza o código do contrato para cruzamento (sem espaços e zeros à esquerda). */
export const normContrato = (v: string | null | undefined) =>
  (v ?? "").trim().replace(/\s+/g, "").replace(/^0+/, "").toUpperCase();

export interface PendenciaResumoContrato {
  /** Pendência mais recente por criado_em (fallback: data_pendencia). */
  maisRecente: Pendencia;
  /** Soma de valor_atual das pendências sem data_pagamento. */
  valorEmAberto: number;
  /** Quantidade de pendências sem data_pagamento. */
  qtdEmAberto: number;
  total: number;
}

export type PendenciaIndex = Map<string, PendenciaResumoContrato>;

export async function fetchPendencias(contrato?: string): Promise<Pendencia[]> {
  const out: Pendencia[] = [];
  for (let from = 0; ; from += PAGE) {
    let q = supabase.from("guarantor_portal_inadimplencia").select("*");
    if (contrato) q = q.eq("contrato", contrato);
    const { data, error } = await q.range(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    out.push(...((data ?? []) as Pendencia[]));
    if (!data || data.length < PAGE) break;
  }
  return out;
}

const ordem = (p: Pendencia) => p.criado_em ?? p.data_pendencia ?? "";

export function buildPendenciaIndex(rows: Pendencia[]): PendenciaIndex {
  const idx: PendenciaIndex = new Map();
  for (const p of rows) {
    const key = normContrato(p.contrato);
    if (!key) continue;
    const atual = idx.get(key);
    if (!atual) {
      idx.set(key, {
        maisRecente: p,
        valorEmAberto: p.data_pagamento ? 0 : Number(p.valor_atual ?? 0),
        qtdEmAberto: p.data_pagamento ? 0 : 1,
        total: 1,
      });
      continue;
    }
    if (ordem(p) > ordem(atual.maisRecente)) atual.maisRecente = p;
    if (!p.data_pagamento) {
      atual.valorEmAberto += Number(p.valor_atual ?? 0);
      atual.qtdEmAberto += 1;
    }
    atual.total += 1;
  }
  return idx;
}

export function useInadimplenciaLoft() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [index, setIndex] = useState<PendenciaIndex>(new Map());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setIndex(buildPendenciaIndex(await fetchPendencias()));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao carregar as pendências do Portal Loft.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { loading, error, index, reload: () => void load() };
}
