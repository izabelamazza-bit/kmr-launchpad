import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface IdealiResumo {
  contratosAtivos: number;
  valorCarteira: number;
  pendenciasDocumentacao: number;
  valorInadimplencia: number;
}

const PAGE = 1000;

async function fetchAll(table: string, columns: string): Promise<any[]> {
  const out: any[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from(table as any)
      .select(columns)
      .range(from, from + PAGE - 1);
    if (error) throw error;
    const rows = (data ?? []) as any[];
    out.push(...rows);
    if (rows.length < PAGE) break;
  }
  return out;
}

export function useIdealiResumo() {
  const [resumo, setResumo] = useState<IdealiResumo>({
    contratosAtivos: 0,
    valorCarteira: 0,
    pendenciasDocumentacao: 0,
    valorInadimplencia: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [contracts, docs, invoices] = await Promise.all([
          fetchAll("ideali_contracts", "status, valor_aluguel, empresa"),
          fetchAll("ideali_documentos", "status_documento_drive"),
          fetchAll("ideali_invoices", "status_fatura, dado_incompleto, valor_boleto"),
        ]);
        if (cancelled) return;

        const ativos = contracts.filter(
          (c) => c.status === "Ativo" && (c.empresa ?? "Ideali") === "Ideali",
        );
        setResumo({
          contratosAtivos: ativos.length,
          valorCarteira: ativos.reduce((s, c) => s + Number(c.valor_aluguel ?? 0), 0),
          pendenciasDocumentacao: docs.filter(
            (d) => d.status_documento_drive !== "Contrato assinado encontrado",
          ).length,
          valorInadimplencia: invoices
            .filter((i) => i.status_fatura === "PE" && !i.dado_incompleto)
            .reduce((s, i) => s + Number(i.valor_boleto ?? 0), 0),
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { resumo, loading };
}
