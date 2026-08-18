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
  /**
   * Data da última atualização conhecida do caso na Loft.
   *
   * Cálculo: MAIOR data entre os dados de pendência
   * (guarantor_portal_inadimplencia: criação, vencimento e pagamento) e a nota
   * (movimentação) mais recente do contrato em guarantor_portal_case_notes,
   * quando o índice de notas é passado para `buildPendenciaIndex`.
   * O indicador de "sem retorno da Loft (5+ dias)" depende deste campo.
   */
  ultimaAtualizacao: string | null;
}

export type PendenciaIndex = Map<string, PendenciaResumoContrato>;

/** Dias corridos entre uma data ISO e hoje. Retorna null quando não há data. */
export function diasDesde(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.floor((Date.now() - t) / 86_400_000));
}

const semAcento = (v: string) =>
  v.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

/** Caso em aberto (status não concluído) e sem atualização há N dias ou mais. */
export function estaParado(resumo: PendenciaResumoContrato | undefined, dias = 5): boolean {
  if (!resumo) return false;
  const status = semAcento(resumo.maisRecente.imob_status ?? "");
  if (/conclu/.test(status)) return false;
  const d = diasDesde(resumo.ultimaAtualizacao);
  return d !== null && d >= dias;
}

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

/** Maior data conhecida da pendência (criação, vencimento ou pagamento). */
const maiorData = (p: Pendencia): string | null => {
  const datas = [p.criado_em, p.data_pendencia, p.dt_vencimento, p.data_pagamento].filter(
    (d): d is string => !!d,
  );
  if (datas.length === 0) return null;
  return datas.reduce((a, b) => (new Date(a).getTime() >= new Date(b).getTime() ? a : b));
};

const maisRecenteDe = (a: string | null, b: string | null): string | null => {
  if (!a) return b;
  if (!b) return a;
  return new Date(a).getTime() >= new Date(b).getTime() ? a : b;
};

export function buildPendenciaIndex(
  rows: Pendencia[],
  /** Índice contrato normalizado → data da nota mais recente (opcional). */
  notas?: Map<string, string>,
): PendenciaIndex {
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
        ultimaAtualizacao: maiorData(p),
      });
      continue;
    }
    if (ordem(p) > ordem(atual.maisRecente)) atual.maisRecente = p;
    atual.ultimaAtualizacao = maisRecenteDe(atual.ultimaAtualizacao, maiorData(p));
    if (!p.data_pagamento) {
      atual.valorEmAberto += Number(p.valor_atual ?? 0);
      atual.qtdEmAberto += 1;
    }
    atual.total += 1;
  }
  if (notas) {
    for (const [key, data] of notas) {
      const atual = idx.get(key);
      if (atual) atual.ultimaAtualizacao = maisRecenteDe(atual.ultimaAtualizacao, data);
    }
  }
  return idx;
}

export function useInadimplenciaLoft(notas?: Map<string, string>) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [index, setIndex] = useState<PendenciaIndex>(new Map());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setIndex(buildPendenciaIndex(await fetchPendencias(), notas));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao carregar as pendências do Portal Loft.");
    } finally {
      setLoading(false);
    }
  }, [notas]);

  useEffect(() => {
    void load();
  }, [load]);

  return { loading, error, index, reload: () => void load() };
}
