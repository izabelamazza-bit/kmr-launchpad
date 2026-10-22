import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Status considerados "finalizados": sinistros com esses status NÃO entram
 * na contagem de meses em atraso do contrato. Quando forem criados status
 * como "concluido", "pago" ou "encerrado", inclua-os aqui.
 */
export const STATUS_FINALIZADOS: string[] = [];

/** Mapa único de status → rótulo legível. */
export const STATUS_SINISTRO_LABEL: Record<string, string> = {
  em_analise: "Em análise",
  pagamento: "Em pagamento",
  pago: "Pago",
  cancelado: "Cancelado",
};
export const statusSinistroLabel = (s: string) => {
  if (s === "rascunho" || s === "aberto") return STATUS_SINISTRO_LABEL.em_analise;
  return STATUS_SINISTRO_LABEL[s] ?? s;
};

export const GARANTIDORA_NAO_IDENTIFICADA = "Não identificada";
export const GARANTIDORAS_FILTRO = ["Loft", "Credaluga", "KMR", "Alerta", GARANTIDORA_NAO_IDENTIFICADA];

export interface SinistroBase {
  id: string;
  inquilino_nome: string;
  inquilino_cpf: string;
  codigo_contrato: string;
  status_imovel: string;
  status: string;
  created_at: string;
  empresa: string | null;
}
export interface ContratoAuditoria {
  imoview_number: string;
  empresa: string | null;
  garantidora: string | null;
}
export interface DebitoSinistro {
  id: string;
  sinistro_id: string;
  tipo: string;
  descricao: string | null;
  data_vencimento: string;
  valor: number;
  valor_total: number | null;
}
export interface SinistroEnriquecido extends SinistroBase {
  garantidora: string;
  debitos: DebitoSinistro[];
  vencimentos: string[];
  valor_total_sinistro: number;
  meses_em_atraso_contrato: number;
}

/** "2026-09-10" → chave ordenável "2026-09" (sem conversão de fuso). */
const mesChave = (d: string) => d.slice(0, 7);
const mesLabel = (k: string) => `${k.slice(5, 7)}/${k.slice(0, 4)}`;
const chaveContrato = (codigo: string, empresa: string | null) => `${empresa ?? ""}|${codigo}`;

export function enriquecerSinistros(
  sinistros: SinistroBase[],
  contratos: ContratoAuditoria[],
  debitos: DebitoSinistro[],
): SinistroEnriquecido[] {
  const garPorContrato = new Map<string, string>();
  for (const c of contratos) {
    if (c.garantidora) garPorContrato.set(chaveContrato(c.imoview_number, c.empresa), c.garantidora);
  }
  const debPorSinistro = new Map<string, DebitoSinistro[]>();
  for (const d of debitos) {
    const l = debPorSinistro.get(d.sinistro_id) ?? [];
    l.push(d);
    debPorSinistro.set(d.sinistro_id, l);
  }
  // meses de aluguel por contrato (apenas sinistros não finalizados)
  const mesesPorContrato = new Map<string, Set<string>>();
  for (const s of sinistros) {
    if (STATUS_FINALIZADOS.includes(s.status)) continue;
    const k = chaveContrato(s.codigo_contrato, s.empresa);
    const set = mesesPorContrato.get(k) ?? new Set<string>();
    for (const d of debPorSinistro.get(s.id) ?? []) {
      if (d.tipo === "aluguel") set.add(mesChave(d.data_vencimento));
    }
    mesesPorContrato.set(k, set);
  }

  return sinistros.map((s) => {
    const k = chaveContrato(s.codigo_contrato, s.empresa);
    const debs = debPorSinistro.get(s.id) ?? [];
    const meses = [...new Set(debs.map((d) => mesChave(d.data_vencimento)))].sort();
    return {
      ...s,
      garantidora: garPorContrato.get(k) ?? GARANTIDORA_NAO_IDENTIFICADA,
      debitos: debs,
      vencimentos: meses.map(mesLabel),
      valor_total_sinistro: debs.reduce((acc, d) => acc + Number(d.valor_total ?? d.valor ?? 0), 0),
      meses_em_atraso_contrato: mesesPorContrato.get(k)?.size ?? 0,
    };
  });
}

/** Ordenação padrão: contrato e, dentro dele, vencimento mais antigo. */
export function ordenarSinistros(lista: SinistroEnriquecido[]) {
  const primeiroVenc = (s: SinistroEnriquecido) =>
    s.debitos.map((d) => d.data_vencimento).sort()[0] ?? "9999";
  return [...lista].sort(
    (a, b) =>
      a.codigo_contrato.localeCompare(b.codigo_contrato, "pt-BR", { numeric: true }) ||
      primeiroVenc(a).localeCompare(primeiroVenc(b)) ||
      a.created_at.localeCompare(b.created_at),
  );
}

const chunk = <T,>(arr: T[], n = 150) => {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
};

export async function fetchSinistrosEnriquecidos(empresa: string): Promise<SinistroEnriquecido[]> {
  const { data: sin, error } = await supabase
    .from("sinistros")
    .select("id, inquilino_nome, inquilino_cpf, codigo_contrato, status_imovel, status, created_at, empresa")
    .eq("empresa", empresa);
  if (error) throw error;
  const sinistros = (sin ?? []) as SinistroBase[];
  if (!sinistros.length) return [];

  const numeros = [...new Set(sinistros.map((s) => s.codigo_contrato))];
  const ids = sinistros.map((s) => s.id);
  const [contratos, debitos] = await Promise.all([
    Promise.all(
      chunk(numeros).map((part) =>
        supabase
          .from("audit_contracts")
          .select("imoview_number, empresa, garantidora")
          .eq("empresa", empresa)
          .in("imoview_number", part),
      ),
    ),
    Promise.all(
      chunk(ids).map((part) =>
        supabase
          .from("sinistro_debitos")
          .select("id, sinistro_id, tipo, descricao, data_vencimento, valor, valor_total")
          .in("sinistro_id", part),
      ),
    ),
  ]);
  for (const r of [...contratos, ...debitos]) if (r.error) throw r.error;
  return ordenarSinistros(
    enriquecerSinistros(
      sinistros,
      contratos.flatMap((r) => (r.data ?? []) as ContratoAuditoria[]),
      debitos.flatMap((r) => (r.data ?? []) as DebitoSinistro[]),
    ),
  );
}

export function useSinistrosEnriquecidos(empresa: string) {
  const [data, setData] = useState<SinistroEnriquecido[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let vivo = true;
    setLoading(true);
    fetchSinistrosEnriquecidos(empresa)
      .then((r) => vivo && setData(r))
      .catch((e) => {
        console.error("Erro ao carregar sinistros", e);
        if (vivo) setData([]);
      })
      .finally(() => vivo && setLoading(false));
    return () => {
      vivo = false;
    };
  }, [empresa]);
  return { data, loading };
}
