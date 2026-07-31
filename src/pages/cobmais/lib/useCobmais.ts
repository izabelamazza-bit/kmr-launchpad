import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type CobmaisSnapshot = Database["public"]["Tables"]["cobmais_snapshots"]["Row"];
export type CobmaisImport = Database["public"]["Tables"]["cobmais_imports"]["Row"];

const PAGE = 1000;

async function fetchSnapshots(importId: string): Promise<CobmaisSnapshot[]> {
  const out: CobmaisSnapshot[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("cobmais_snapshots")
      .select("*")
      .eq("import_id", importId)
      .order("cliente", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    out.push(...((data ?? []) as CobmaisSnapshot[]));
    if (!data || data.length < PAGE) break;
  }
  return out;
}

export function fmtDateTime(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("pt-BR");
}

export function useCobmais() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImport, setCurrentImport] = useState<CobmaisImport | null>(null);
  const [importedByName, setImportedByName] = useState<string | null>(null);
  const [snapshots, setSnapshots] = useState<CobmaisSnapshot[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: imports, error: impErr } = await supabase
        .from("cobmais_imports")
        .select("*")
        .order("data_importacao", { ascending: false })
        .limit(1);
      if (impErr) throw new Error(impErr.message);

      const current = (imports ?? [])[0] as CobmaisImport | undefined;
      setCurrentImport(current ?? null);

      if (!current) {
        setSnapshots([]);
        setImportedByName(null);
        return;
      }

      if (current.importado_por) {
        const { data: reg } = await supabase
          .from("users_registry")
          .select("full_name")
          .eq("user_id", current.importado_por)
          .maybeSingle();
        setImportedByName(reg?.full_name ?? null);
      } else {
        setImportedByName(null);
      }

      setSnapshots(await fetchSnapshots(current.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao carregar os dados do Cobmais.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const contagens = useMemo(() => {
    const out: Record<string, number> = {};
    for (const s of snapshots) {
      const g = s.garantidora_normalizada ?? "Não informado";
      out[g] = (out[g] ?? 0) + 1;
    }
    return out;
  }, [snapshots]);

  return { loading, error, currentImport, importedByName, snapshots, contagens, reload: load };
}