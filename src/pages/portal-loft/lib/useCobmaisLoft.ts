import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { estaParado, normContrato, type PendenciaIndex } from "./useInadimplenciaLoft";

export type CobmaisLatestLoft = Database["public"]["Views"]["cobmais_latest_loft"]["Row"];
type PortalSnapshot = Database["public"]["Tables"]["guarantor_portal_snapshots"]["Row"];

const PAGE = 1000;

export const digits = (v: string | null | undefined) => (v ?? "").replace(/\D/g, "");

export type StatusCobmais = "Ativo" | "Rescindido" | "Não informado";

/**
 * Status no Cobmais derivado do texto de OBSERVAÇÃO.
 * Vazio ou texto não reconhecido NUNCA é assumido como "Ativo" — vira
 * "Não informado", para não esconder dado ausente numa tela de exposição.
 */
export function statusCobmais(observacao: string | null): StatusCobmais {
  const txt = (observacao ?? "").trim();
  if (!txt) return "Não informado";
  if (/rescind|encerrad|distrat|finalizad/i.test(txt)) return "Rescindido";
  if (/ativ|vigente|em vigor|em andamento/i.test(txt)) return "Ativo";
  return "Não informado";
}

export interface CobmaisLoftRow {
  id: string;
  cpf: string;
  cpfDigits: string;
  cliente: string | null;
  contrato: string | null;
  atraso: number;
  risco: number;
  observacao: string | null;
  statusCobmais: StatusCobmais;
  /** Contrato correspondente no snapshot mais recente do Portal Loft (por CPF). */
  portal: PortalSnapshot | null;
  /**
   * Código do contrato usado para buscar pendências da Loft: o contrato do
   * Portal Loft (encontrado por CPF), com fallback no contrato do Cobmais.
   */
  contratoLoft: string | null;
}

export interface CobmaisLoftData {
  loading: boolean;
  error: string | null;
  rows: CobmaisLoftRow[];
  ultimaImportacaoCobmais: string | null;
  ultimaImportacaoPortal: string | null;
  reload: () => void;
}

async function fetchLatestLoft(): Promise<CobmaisLatestLoft[]> {
  const out: CobmaisLatestLoft[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("cobmais_latest_loft")
      .select("*")
      .range(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    out.push(...((data ?? []) as CobmaisLatestLoft[]));
    if (!data || data.length < PAGE) break;
  }
  return out;
}

async function fetchPortalSnapshots(importId: string): Promise<PortalSnapshot[]> {
  const out: PortalSnapshot[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("guarantor_portal_snapshots")
      .select("*")
      .eq("import_id", importId)
      .range(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    out.push(...((data ?? []) as PortalSnapshot[]));
    if (!data || data.length < PAGE) break;
  }
  return out;
}

const STATUS_RANK: Record<string, number> = { ativo: 3, exonerado: 2, cancelado: 1 };

export function useCobmaisLoft(): CobmaisLoftData {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<CobmaisLoftRow[]>([]);
  const [dtCobmais, setDtCobmais] = useState<string | null>(null);
  const [dtPortal, setDtPortal] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [{ data: cobImp, error: cobErr }, { data: portImp, error: portErr }] = await Promise.all([
        supabase
          .from("cobmais_imports")
          .select("id, data_importacao")
          .order("data_importacao", { ascending: false })
          .limit(1),
        supabase
          .from("guarantor_portal_imports")
          .select("id, data_importacao")
          .eq("garantidora", "Loft")
          // Só importações de contrato têm snapshots com CPF — sem este filtro a
          // importação de inadimplência (mais recente) zerava o cruzamento.
          .eq("tipo", "contrato")
          .order("data_importacao", { ascending: false })
          .limit(1),
      ]);
      if (cobErr) throw new Error(cobErr.message);
      if (portErr) throw new Error(portErr.message);

      setDtCobmais(cobImp?.[0]?.data_importacao ?? null);
      setDtPortal(portImp?.[0]?.data_importacao ?? null);

      const portalImportId = portImp?.[0]?.id ?? null;
      const [cobmais, portal] = await Promise.all([
        fetchLatestLoft(),
        portalImportId ? fetchPortalSnapshots(portalImportId) : Promise.resolve([]),
      ]);

      // Índice por CPF (apenas dígitos) — mantém o contrato de status mais relevante.
      const porCpf = new Map<string, PortalSnapshot>();
      for (const s of portal) {
        const key = digits(s.inquilino_cpf);
        if (!key) continue;
        const atual = porCpf.get(key);
        if (!atual) {
          porCpf.set(key, s);
          continue;
        }
        const rankNovo = STATUS_RANK[(s.status ?? "").trim().toLowerCase()] ?? 0;
        const rankAtual = STATUS_RANK[(atual.status ?? "").trim().toLowerCase()] ?? 0;
        if (rankNovo > rankAtual) porCpf.set(key, s);
      }

      setRows(
        cobmais.map((c) => {
          const cpfDigits = digits(c.cpf_cnpj);
          const portal = cpfDigits ? porCpf.get(cpfDigits) ?? null : null;
          return {
            id: c.id ?? cpfDigits,
            cpf: c.cpf_cnpj ?? "—",
            cpfDigits,
            cliente: c.cliente,
            contrato: c.contrato,
            atraso: c.atraso ?? 0,
            risco: Number(c.risco ?? 0),
            observacao: c.status_cobranca,
            statusCobmais: statusCobmais(c.status_cobranca),
            portal,
            contratoLoft: portal?.contrato ?? c.contrato ?? null,
          };
        }),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao carregar o cruzamento Cobmais × Loft.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    loading,
    error,
    rows,
    ultimaImportacaoCobmais: dtCobmais,
    ultimaImportacaoPortal: dtPortal,
    reload: () => void load(),
  };
}

export const FAIXAS = [
  { value: "0", label: "Todos com atraso" },
  { value: "30", label: "Atraso > 30 dias" },
  { value: "60", label: "Atraso > 60 dias" },
  { value: "90", label: "Atraso > 90 dias" },
  { value: "sem-retorno", label: "Sem retorno da Loft (5+ dias)" },
] as const;

export function useCobmaisLoftFiltrado(
  rows: CobmaisLoftRow[],
  faixa: string,
  busca: string,
  pendencias?: PendenciaIndex,
) {
  return useMemo(() => {
    const semRetorno = faixa === "sem-retorno";
    const min = semRetorno ? 0 : Number(faixa) || 0;
    let emAtraso = rows.filter((r) => r.atraso > 0 && r.atraso > min);
    if (semRetorno) {
      emAtraso = emAtraso.filter((r) =>
        estaParado(pendencias?.get(normContrato(r.contratoLoft))),
      );
    }
    const q = busca.trim().toLowerCase();
    const qd = digits(busca);
    const filtradas = emAtraso.filter((r) => {
      if (!q) return true;
      const byText =
        (r.cliente ?? "").toLowerCase().includes(q) || (r.contrato ?? "").toLowerCase().includes(q);
      const byCpf = qd.length > 0 && r.cpfDigits.includes(qd);
      return byText || byCpf;
    });
    return { emAtraso, filtradas };
  }, [rows, faixa, busca, pendencias]);
}

export function resumoCobmaisLoft(emAtraso: CobmaisLoftRow[]) {
  const encontrados = emAtraso.filter((r) => r.portal !== null).length;
  return {
    total: emAtraso.length,
    valorRisco: emAtraso.reduce((acc, r) => acc + (r.risco || 0), 0),
    encontrados,
    semRegistro: emAtraso.length - encontrados,
  };
}