import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const STATUS_LIST = [
  "Ativo",
  "Pausado",
  "Encerrado",
  "Assinado",
  "Aguardando Ativação",
] as const;

export const GARANTIDORAS_SINISTRO = ["CredPago", "Credaluga", "Eu Acerto"];

export interface ContractRow {
  id: string;
  codigo_contrato: string;
  status: string;
  garantidora: string | null;
  tipo_garantia: string | null;
  valor_aluguel: number | null;
  nome_inquilino: string | null;
  rua: string | null;
  numero: string | null;
  bairro: string | null;
  cidade: string | null;
}

export interface InvoiceRow {
  codigo_contrato: string;
  vencimento_fatura: string;
  status_fatura: string;
  dado_incompleto: boolean;
  valor_boleto: number | null;
  valor_pago_fatura: number | null;
}

export interface ContractAggregate extends ContractRow {
  oldestOpen: InvoiceRow | null;
  diasEmAtraso: number | null;
  hasIncomplete: boolean;
  valorEmAtraso: number;
}

export interface CarteiraData {
  contracts: ContractAggregate[];
  statusCounts: Record<string, number>;
  total: number;
  valorEmAtraso: number;
  contratosAfetados: number;
  faturasIncompletas: number;
  carteiraAtivaMes: number;
}

function todayUTC(): number {
  const n = new Date();
  return Date.UTC(n.getFullYear(), n.getMonth(), n.getDate());
}

function dateUTC(iso: string): number {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return Date.UTC(y, (m ?? 1) - 1, d ?? 1);
}

const DAY = 86400000;

export function diffDays(aMs: number, bMs: number): number {
  return Math.round((aMs - bMs) / DAY);
}

export function diasEmAtrasoDe(vencimento: string): number {
  return diffDays(todayUTC(), dateUTC(vencimento));
}

export function diasRestantesSinistro(vencimento: string): number {
  return diffDays(dateUTC(vencimento) + 60 * DAY, todayUTC());
}

async function fetchAll<T>(
  table: "ideali_contracts" | "ideali_invoices",
  columns: string,
  filter?: (q: any) => any,
): Promise<T[]> {
  const PAGE = 1000;
  const out: T[] = [];
  for (let from = 0; ; from += PAGE) {
    let q: any = supabase.from(table).select(columns).range(from, from + PAGE - 1);
    if (filter) q = filter(q);
    const { data, error } = await q;
    if (error) throw error;
    out.push(...((data ?? []) as T[]));
    if (!data || data.length < PAGE) break;
  }
  return out;
}

export function useCarteiraIdeali() {
  const [data, setData] = useState<CarteiraData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [contracts, invoices] = await Promise.all([
        fetchAll<ContractRow>(
          "ideali_contracts",
          "id,codigo_contrato,status,garantidora,tipo_garantia,valor_aluguel,nome_inquilino,rua,numero,bairro,cidade",
          (q) => q.eq("empresa", "Ideali").order("codigo_contrato"),
        ),
        fetchAll<InvoiceRow>(
          "ideali_invoices",
          "codigo_contrato,vencimento_fatura,status_fatura,dado_incompleto,valor_boleto,valor_pago_fatura",
        ),
      ]);

      const byContract = new Map<string, InvoiceRow[]>();
      for (const inv of invoices) {
        const list = byContract.get(inv.codigo_contrato);
        if (list) list.push(inv);
        else byContract.set(inv.codigo_contrato, [inv]);
      }

      let valorEmAtraso = 0;
      let faturasIncompletas = 0;
      const afetados = new Set<string>();
      for (const inv of invoices) {
        if (inv.dado_incompleto) faturasIncompletas += 1;
        if (inv.status_fatura === "PE" && !inv.dado_incompleto) {
          valorEmAtraso += inv.valor_boleto ?? 0;
          afetados.add(inv.codigo_contrato);
        }
      }

      const statusCounts: Record<string, number> = {};
      let carteiraAtivaMes = 0;

      const aggregated: ContractAggregate[] = contracts.map((c) => {
        statusCounts[c.status] = (statusCounts[c.status] ?? 0) + 1;
        if (c.status === "Ativo") carteiraAtivaMes += c.valor_aluguel ?? 0;

        const invs = byContract.get(c.codigo_contrato) ?? [];
        const open = invs.filter((i) => i.status_fatura === "PE");
        let oldest: InvoiceRow | null = null;
        for (const i of open) {
          if (!oldest || i.vencimento_fatura < oldest.vencimento_fatura) oldest = i;
        }
        const valor = open
          .filter((i) => !i.dado_incompleto)
          .reduce((s, i) => s + (i.valor_boleto ?? 0), 0);

        return {
          ...c,
          oldestOpen: oldest,
          diasEmAtraso: oldest ? diasEmAtrasoDe(oldest.vencimento_fatura) : null,
          hasIncomplete: invs.some((i) => i.dado_incompleto),
          valorEmAtraso: valor,
        };
      });

      setData({
        contracts: aggregated,
        statusCounts,
        total: contracts.length,
        valorEmAtraso,
        contratosAfetados: afetados.size,
        faturasIncompletas,
        carteiraAtivaMes,
      });
    } catch (e: any) {
      setError(e?.message ?? "Erro ao carregar dados da carteira.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, reload: load };
}

export function formatBRL(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
