import Papa from "papaparse";
import { supabase } from "@/integrations/supabase/client";

export const INADIMPLENCIA_CSV_HEADERS = [
  "contrato",
  "id",
  "imobstatus",
  "status",
  "contractstatus",
  "valor",
  "valoratual",
  "datapendencia",
  "criadoem",
  "datapagamento",
  "dtvencimento",
  "formapgtoinadimplencia",
  "expirationdays",
  "details_json",
] as const;

export class InadimplenciaHeaderError extends Error {
  constructor(public missing: string[], public extra: string[]) {
    const parts: string[] = [];
    if (missing.length) parts.push(`faltando: ${missing.join(", ")}`);
    if (extra.length) parts.push(`inesperadas: ${extra.join(", ")}`);
    super(`O cabeçalho do CSV de inadimplência não corresponde ao esperado (${parts.join(" | ")}).`);
    this.name = "InadimplenciaHeaderError";
  }
}

const txt = (raw?: string | null) => {
  const v = (raw ?? "").trim();
  return v === "" ? null : v;
};

/** "AAAA-MM-DD" (ou com hora) -> "AAAA-MM-DD"; vazio/inválido -> null. */
export function parseDateOnly(raw?: string | null): string | null {
  const v = (raw ?? "").trim();
  if (!v) return null;
  const iso = v.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const br = v.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (br) {
    const day = Number(br[1]);
    const month = Number(br[2]);
    if (day < 1 || day > 31 || month < 1 || month > 12) return null;
    return `${br[3]}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  return null;
}

/** "AAAA-MM-DD HH:MM:SS" -> ISO timestamptz; vazio/inválido -> null. */
export function parseTimestamp(raw?: string | null): string | null {
  const v = (raw ?? "").trim();
  if (!v) return null;
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6] ?? "00"}`;
  const d = parseDateOnly(v);
  return d ? `${d}T00:00:00` : null;
}

export function parseNumber(raw?: string | null): number | null {
  let v = (raw ?? "").trim();
  if (!v) return null;
  v = v.replace(/R\$/gi, "").replace(/\s/g, "");
  if (/,/.test(v)) v = v.replace(/\./g, "").replace(",", ".");
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function parseInt32(raw?: string | null): number | null {
  const n = parseNumber(raw);
  return n === null ? null : Math.trunc(n);
}

export interface PendenciaRow {
  contrato: string;
  pendencia_id: string;
  imob_status: string | null;
  status_codigo: string | null;
  contract_status_codigo: string | null;
  valor: number | null;
  valor_atual: number | null;
  data_pendencia: string | null;
  criado_em: string | null;
  data_pagamento: string | null;
  dt_vencimento: string | null;
  forma_pgto_codigo: string | null;
  expiration_days: number | null;
  details_json: unknown;
}

export interface InadimplenciaParseResult {
  rows: PendenciaRow[];
  totalLinhas: number;
  ignoradas: number;
  jsonInvalido: number;
}

export function parseInadimplenciaCsv(file: File): Promise<InadimplenciaParseResult> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: (h) => h.trim().replace(/^\uFEFF/, "").toLowerCase(),
      complete: (res) => {
        try {
          const found = (res.meta.fields ?? []).filter((f) => f !== "");
          const expected = [...INADIMPLENCIA_CSV_HEADERS] as string[];
          const missing = expected.filter((h) => !found.includes(h));
          const extra = found.filter((h) => !expected.includes(h));
          if (missing.length || extra.length) {
            reject(new InadimplenciaHeaderError(missing, extra));
            return;
          }

          const rows: PendenciaRow[] = [];
          const vistos = new Set<string>();
          let ignoradas = 0;
          let jsonInvalido = 0;

          for (const raw of res.data) {
            if (!raw) continue;
            const contrato = txt(raw.contrato);
            const pendencia = txt(raw.id);
            if (!contrato || !pendencia || vistos.has(pendencia)) {
              ignoradas += 1;
              continue;
            }
            vistos.add(pendencia);

            const detalhesRaw = (raw.details_json ?? "").trim();
            let details: unknown = [];
            if (detalhesRaw && detalhesRaw !== "[]") {
              try {
                details = JSON.parse(detalhesRaw);
              } catch {
                details = [];
                jsonInvalido += 1;
              }
            }

            rows.push({
              contrato,
              pendencia_id: pendencia,
              imob_status: txt(raw.imobstatus),
              status_codigo: txt(raw.status),
              contract_status_codigo: txt(raw.contractstatus),
              valor: parseNumber(raw.valor),
              valor_atual: parseNumber(raw.valoratual),
              data_pendencia: parseDateOnly(raw.datapendencia),
              criado_em: parseTimestamp(raw.criadoem),
              data_pagamento: parseDateOnly(raw.datapagamento),
              dt_vencimento: parseDateOnly(raw.dtvencimento),
              forma_pgto_codigo: txt(raw.formapgtoinadimplencia),
              expiration_days: parseInt32(raw.expirationdays),
              details_json: details,
            });
          }

          resolve({ rows, totalLinhas: rows.length + ignoradas, ignoradas, jsonInvalido });
        } catch (e) {
          reject(e instanceof Error ? e : new Error("Falha ao interpretar o CSV de inadimplência."));
        }
      },
      error: (err) =>
        reject(new Error(`Não foi possível ler o arquivo CSV: ${err.message ?? "erro desconhecido"}`)),
    });
  });
}

export interface ImportInadimplenciaResult {
  importId: string;
  totalLinhas: number;
  processados: number;
  novos: number;
  atualizados: number;
  ignoradas: number;
  jsonInvalido: number;
}

const BATCH = 500;

/** Consulta quais pendencia_id já existem, para separar novos de atualizados. */
async function existentes(ids: string[]): Promise<Set<string>> {
  const out = new Set<string>();
  for (let i = 0; i < ids.length; i += BATCH) {
    const chunk = ids.slice(i, i + BATCH);
    const { data, error } = await supabase
      .from("guarantor_portal_inadimplencia")
      .select("pendencia_id")
      .in("pendencia_id", chunk);
    if (error) throw new Error(error.message);
    (data ?? []).forEach((r) => out.add(r.pendencia_id));
  }
  return out;
}

export async function importInadimplenciaCsv(
  file: File,
  parsed: InadimplenciaParseResult,
  onProgress?: (feitos: number, total: number) => void,
): Promise<ImportInadimplenciaResult> {
  const { rows, totalLinhas, ignoradas, jsonInvalido } = parsed;
  if (rows.length === 0) throw new Error("Nenhuma linha válida encontrada no CSV.");

  const jaExistiam = await existentes(rows.map((r) => r.pendencia_id));

  const { data: auth } = await supabase.auth.getUser();
  const { data: imp, error: impErr } = await supabase
    .from("guarantor_portal_imports")
    .insert({
      garantidora: "Loft",
      tipo: "inadimplencia",
      nome_arquivo: file.name,
      total_linhas: totalLinhas,
      importado_por: auth?.user?.id ?? null,
    })
    .select("id")
    .single();
  if (impErr || !imp) {
    throw new Error(
      `Não foi possível registrar a importação: ${impErr?.message ?? "erro desconhecido"}`,
    );
  }

  const importId = imp.id as string;
  let processados = 0;
  onProgress?.(0, rows.length);

  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows
      .slice(i, i + BATCH)
      .map((r) => ({ ...r, import_id: importId, data_importacao: new Date().toISOString() }));
    const { error } = await supabase
      .from("guarantor_portal_inadimplencia")
      .upsert(batch as never, { onConflict: "pendencia_id" });
    if (error) {
      throw new Error(
        `A importação falhou no lote ${Math.floor(i / BATCH) + 1} (${error.message}). ` +
          `${processados} registro(s) já gravado(s) foram mantidos — reimporte o mesmo arquivo para concluir sem duplicar.`,
      );
    }
    processados += batch.length;
    onProgress?.(processados, rows.length);
  }

  const atualizados = rows.filter((r) => jaExistiam.has(r.pendencia_id)).length;
  return {
    importId,
    totalLinhas,
    processados,
    novos: processados - atualizados,
    atualizados,
    ignoradas,
    jsonInvalido,
  };
}
