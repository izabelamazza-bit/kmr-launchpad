import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Snapshot = Database["public"]["Tables"]["guarantor_portal_snapshots"]["Row"];
export type PortalImport = Database["public"]["Tables"]["guarantor_portal_imports"]["Row"];
export type Movement = Database["public"]["Views"]["guarantor_portal_movements"]["Row"];

const PAGE = 1000;

async function fetchSnapshotsByImport(importId: string): Promise<Snapshot[]> {
  const out: Snapshot[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("guarantor_portal_snapshots")
      .select("*")
      .eq("import_id", importId)
      .order("contrato", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    out.push(...((data ?? []) as Snapshot[]));
    if (!data || data.length < PAGE) break;
  }
  return out;
}

export interface UltimasImportacoes {
  contrato: string | null;
  movimentacao: string | null;
  inadimplencia: string | null;
}

export interface PortalLoftData {
  loading: boolean;
  error: string | null;
  currentImport: PortalImport | null;
  previousImport: PortalImport | null;
  importedByName: string | null;
  snapshots: Snapshot[];
  movements: Movement[];
  novos: number;
  ultimas: UltimasImportacoes;
  reload: () => void;
}

export function usePortalLoft(): PortalLoftData {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImport, setCurrentImport] = useState<PortalImport | null>(null);
  const [previousImport, setPreviousImport] = useState<PortalImport | null>(null);
  const [importedByName, setImportedByName] = useState<string | null>(null);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [novos, setNovos] = useState(0);
  const [ultimas, setUltimas] = useState<UltimasImportacoes>({
    contrato: null,
    movimentacao: null,
    inadimplencia: null,
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: imports, error: impErr } = await supabase
        .from("guarantor_portal_imports")
        .select("*")
        .eq("garantidora", "Loft")
        .eq("tipo", "contrato")
        .order("data_importacao", { ascending: false })
        .limit(2);
      if (impErr) throw new Error(impErr.message);

      const { data: todas, error: todasErr } = await supabase
        .from("guarantor_portal_imports")
        .select("tipo, data_importacao")
        .eq("garantidora", "Loft")
        .order("data_importacao", { ascending: false });
      if (todasErr) throw new Error(todasErr.message);
      const maisRecente = (tipo: string) =>
        (todas ?? []).find((r) => r.tipo === tipo)?.data_importacao ?? null;
      setUltimas({
        contrato: maisRecente("contrato"),
        movimentacao: maisRecente("movimentacao"),
        inadimplencia: maisRecente("inadimplencia"),
      });

      const atual = (imports?.[0] ?? null) as PortalImport | null;
      const anterior = (imports?.[1] ?? null) as PortalImport | null;
      setCurrentImport(atual);
      setPreviousImport(anterior);

      if (!atual) {
        setSnapshots([]);
        setMovements([]);
        setNovos(0);
        setImportedByName(null);
        return;
      }

      if (atual.importado_por) {
        const { data: reg } = await supabase
          .from("users_registry")
          .select("full_name, email")
          .eq("user_id", atual.importado_por)
          .maybeSingle();
        setImportedByName(reg?.full_name ?? reg?.email ?? null);
      } else {
        setImportedByName(null);
      }

      const atuais = await fetchSnapshotsByImport(atual.id);
      setSnapshots(atuais);

      if (anterior) {
        const anteriores = await fetchSnapshotsByImport(anterior.id);
        const antes = new Set(anteriores.map((s) => s.contrato));
        setNovos(atuais.filter((s) => !antes.has(s.contrato)).length);
      } else {
        setNovos(atuais.length);
      }

      const { data: movs, error: movErr } = await supabase
        .from("guarantor_portal_movements")
        .select("*")
        .eq("import_atual_id", atual.id);
      if (movErr) throw new Error(movErr.message);
      setMovements((movs ?? []) as Movement[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao carregar os dados do Portal Loft.");
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
    currentImport,
    previousImport,
    importedByName,
    snapshots,
    movements,
    novos,
    ultimas,
    reload: () => void load(),
  };
}

export function hasChange(m: Movement): boolean {
  return (
    m.import_anterior_id !== null &&
    (m.status_atual !== m.status_anterior ||
      m.cancelamento_taxa_atual !== m.cancelamento_taxa_anterior ||
      m.pagamento_suspenso_atual !== m.pagamento_suspenso_anterior)
  );
}

export function useResumo(snapshots: Snapshot[], movements: Movement[]) {
  return useMemo(() => {
    const byStatus = (s: string) =>
      snapshots.filter((r) => (r.status ?? "").trim().toLowerCase() === s).length;
    return {
      total: snapshots.length,
      ativos: byStatus("ativo"),
      cancelados: byStatus("cancelado"),
      exonerados: byStatus("exonerado"),
      mudancasStatus: movements.filter(
        (m) => m.import_anterior_id !== null && m.status_atual !== m.status_anterior,
      ).length,
    };
  }, [snapshots, movements]);
}

export const fmtMoney = (v: number | null) =>
  v === null || v === undefined
    ? "—"
    : v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const fmtDate = (v: string | null) => {
  if (!v) return "—";
  const [y, m, d] = v.slice(0, 10).split("-");
  return d ? `${d}/${m}/${y}` : v;
};

export const fmtDateTime = (v: string | null) => {
  if (!v) return "—";
  const dt = new Date(v);
  return Number.isNaN(dt.getTime())
    ? "—"
    : dt.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

export const fmtBool = (v: boolean | null) => (v === null ? "—" : v ? "Sim" : "Não");