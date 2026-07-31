import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AuditoriaResumo {
  total: number;
  completa: number;
  pendencia: number;
  alerta: number;
}

export interface SinistrosResumo {
  total: number;
  emAnalise: number;
  pagamento: number;
  pago: number;
  cancelado: number;
}

export interface GarantidoraResumo {
  garantidora: string;
  count: number;
  valor: number;
}

const GARANTIDORAS_DASH = ["Loft", "Credaluga", "KMR"] as const;

export function useDashboardResumo(empresa?: string) {
  const [auditoria, setAuditoria] = useState<AuditoriaResumo>({
    total: 0,
    completa: 0,
    pendencia: 0,
    alerta: 0,
  });
  const [garantidoras, setGarantidoras] = useState<GarantidoraResumo[]>(
    GARANTIDORAS_DASH.map((g) => ({ garantidora: g, count: 0, valor: 0 })),
  );
  const [sinistros, setSinistros] = useState<SinistrosResumo>({
    total: 0,
    emAnalise: 0,
    pagamento: 0,
    pago: 0,
    cancelado: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      let contractsQuery = supabase
        .from("audit_contracts")
        .select("id, audit_status, garantidora, valor_aluguel, empresa");
      if (empresa) contractsQuery = contractsQuery.eq("empresa", empresa);
      let sinistrosQuery = supabase.from("sinistros").select("id, status, empresa");
      if (empresa) sinistrosQuery = sinistrosQuery.eq("empresa", empresa);
      const [contractsRes, progressRes, sinistrosRes] = await Promise.all([
        contractsQuery,
        supabase
          .from("audit_contract_progress" as any)
          .select("contract_id, nok_items, has_critical_nok"),
        sinistrosQuery,
      ]);
      if (cancelled) return;

      const contracts = (contractsRes.data ?? []) as any[];
      const progress = (progressRes.data ?? []) as any[];
      const progressMap = new Map<string, any>();
      progress.forEach((p) => progressMap.set(p.contract_id, p));

      const a: AuditoriaResumo = { total: contracts.length, completa: 0, pendencia: 0, alerta: 0 };
      const gMap = new Map<string, GarantidoraResumo>(
        GARANTIDORAS_DASH.map((g) => [g, { garantidora: g, count: 0, valor: 0 }]),
      );
      contracts.forEach((c) => {
        const p = progressMap.get(c.id);
        if (c.audit_status === "Completa") a.completa += 1;
        if ((p?.nok_items ?? 0) > 0) a.pendencia += 1;
        if (p?.has_critical_nok) a.alerta += 1;
        const g = gMap.get(c.garantidora ?? "");
        if (g) {
          g.count += 1;
          g.valor += Number(c.valor_aluguel ?? 0);
        }
      });

      const rows = (sinistrosRes.data ?? []) as any[];
      const s: SinistrosResumo = {
        total: rows.length,
        emAnalise: 0,
        pagamento: 0,
        pago: 0,
        cancelado: 0,
      };
      rows.forEach((r) => {
        const st = r.status === "rascunho" || r.status === "aberto" ? "em_analise" : r.status;
        if (st === "em_analise") s.emAnalise += 1;
        else if (st === "pagamento") s.pagamento += 1;
        else if (st === "pago") s.pago += 1;
        else if (st === "cancelado") s.cancelado += 1;
      });

      setAuditoria(a);
      setGarantidoras(GARANTIDORAS_DASH.map((g) => gMap.get(g)!));
      setSinistros(s);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [empresa]);

  return { auditoria, garantidoras, sinistros, loading };
}