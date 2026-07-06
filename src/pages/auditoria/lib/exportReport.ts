import * as XLSX from "xlsx";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

export interface ExportRow {
  id: string;
  imoview_number: string;
  empresa: string | null;
  garantidora: string | null;
  locatarios: string | null;
  endereco_imovel: string | null;
  analyst_name: string | null;
  audit_status: string;
  total_items: number;
  ok_items: number;
  nok_items: number;
  risco_alto: boolean;
  updated_at: string;
  general_notes?: string | null;
}

const statusLabel = (s: string) => {
  if (s === "Nao iniciada") return "Não iniciada";
  if (s === "Em andamento") return "Em andamento";
  if (s === "Completa") return "Completa";
  return s;
};

const fmtDate = (d?: string | null) =>
  d ? format(new Date(d), "dd/MM/yyyy HH:mm") : "";

export async function exportAuditReport(rows: ExportRow[]) {
  const ids = rows.map((r) => r.id);

  // Fetch checklist items in batches of 500 contract_ids
  type ItemRow = {
    contract_id: string;
    item_label: string;
    status: string;
    verified_by_ai: boolean;
    updated_at: string;
  };
  const items: ItemRow[] = [];
  for (let i = 0; i < ids.length; i += 500) {
    const slice = ids.slice(i, i + 500);
    const { data, error } = await supabase
      .from("audit_checklist_items")
      .select("contract_id, item_label, status, verified_by_ai, updated_at")
      .in("contract_id", slice);
    if (error) throw error;
    items.push(...((data ?? []) as ItemRow[]));
  }

  // Need general_notes — not in rows; fetch it
  const notesMap = new Map<string, string | null>();
  for (let i = 0; i < ids.length; i += 500) {
    const slice = ids.slice(i, i + 500);
    const { data } = await supabase
      .from("audit_contracts")
      .select("id, general_notes")
      .in("id", slice);
    (data ?? []).forEach((c: any) => notesMap.set(c.id, c.general_notes));
  }

  // Group items by contract
  const grouped = new Map<
    string,
    { nokLabels: string[]; aiCount: number; firstFilled?: string; lastFilled?: string }
  >();
  for (const it of items) {
    let g = grouped.get(it.contract_id);
    if (!g) {
      g = { nokLabels: [], aiCount: 0 };
      grouped.set(it.contract_id, g);
    }
    if (it.status === "nok") g.nokLabels.push(it.item_label);
    if (it.verified_by_ai) g.aiCount += 1;
    if (it.status === "ok" || it.status === "nok") {
      if (!g.firstFilled || it.updated_at < g.firstFilled) g.firstFilled = it.updated_at;
      if (!g.lastFilled || it.updated_at > g.lastFilled) g.lastFilled = it.updated_at;
    }
  }

  const header = [
    "Código do contrato (Imoview)",
    "Empresa",
    "Garantidora",
    "Locatário",
    "Endereço do imóvel",
    "Analista responsável",
    "Status da auditoria",
    "Itens preenchidos",
    "% de conformidade",
    "Nível de risco",
    "Qtd itens NOK",
    "Itens NOK",
    "Itens verificados por IA",
    "Data de início da auditoria",
    "Data da última atualização",
    "Data de conclusão",
    "Observações do analista",
  ];

  const data = rows.map((r) => {
    const g = grouped.get(r.id);
    const risco = r.risco_alto ? "Alto" : r.nok_items > 0 ? "Médio" : "Baixo";
    const conformidade =
      r.total_items > 0
        ? `${((r.ok_items / r.total_items) * 100).toFixed(1)}%`
        : "-";
    const preenchidos = `${r.ok_items + r.nok_items}/${r.total_items}`;
    const dataConclusao =
      r.audit_status === "Completa" && g?.lastFilled ? fmtDate(g.lastFilled) : "";
    return [
      r.imoview_number,
      r.empresa ?? "",
      r.garantidora ?? "",
      r.locatarios ?? "",
      r.endereco_imovel ?? "",
      r.analyst_name ?? "",
      statusLabel(r.audit_status),
      preenchidos,
      conformidade,
      risco,
      r.nok_items,
      g?.nokLabels.join("; ") ?? "",
      g?.aiCount ?? 0,
      fmtDate(g?.firstFilled),
      fmtDate(r.updated_at),
      dataConclusao,
      notesMap.get(r.id) ?? "",
    ];
  });

  const ws = XLSX.utils.aoa_to_sheet([header, ...data]);

  // Column widths
  const widths = header.map((h, colIdx) => {
    let max = h.length;
    for (const row of data) {
      const v = row[colIdx];
      const len = v == null ? 0 : String(v).length;
      if (len > max) max = len;
    }
    return { wch: Math.min(60, Math.max(12, max + 2)) };
  });
  (ws as any)["!cols"] = widths;
  (ws as any)["!freeze"] = { xSplit: 0, ySplit: 1 };
  (ws as any)["!autofilter"] = { ref: XLSX.utils.encode_range({ s: { c: 0, r: 0 }, e: { c: header.length - 1, r: data.length } }) };

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Auditoria");

  const filename = `auditoria-contratos-${format(new Date(), "yyyy-MM-dd")}.xlsx`;
  XLSX.writeFile(wb, filename);
}