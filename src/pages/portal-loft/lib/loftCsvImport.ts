import Papa from "papaparse";
import { supabase } from "@/integrations/supabase/client";

export const LOFT_CSV_HEADERS = [
  "contrato",
  "valor_locaticio",
  "valor_aluguel",
  "valor_condominio",
  "valor_outras_taxas",
  "cancelamento_taxa",
  "cancelamento_taxa_previsao",
  "pagamento_suspenso",
  "status",
  "valor_setup",
  "plano",
  "data_criacao",
  "data_ativacao",
  "data_exoneracao",
  "ultima_renovacao",
  "corretor",
  "inquilino",
  "inquilino_cpf",
  "cep",
  "endereco",
  "endereco_numero",
  "complemento",
  "bairro",
  "cidade",
  "uf",
  "fianca_total",
  "garantia",
  "multiplicador",
  "custo_saida",
  "motivo_exoneracao",
] as const;

const NUMERIC_FIELDS = [
  "valor_locaticio",
  "valor_aluguel",
  "valor_condominio",
  "valor_outras_taxas",
  "valor_setup",
  "fianca_total",
  "garantia",
  "multiplicador",
  "custo_saida",
] as const;

const DATE_FIELDS = [
  "cancelamento_taxa_previsao",
  "data_criacao",
  "data_ativacao",
  "data_exoneracao",
  "ultima_renovacao",
] as const;

const BOOL_FIELDS = ["cancelamento_taxa", "pagamento_suspenso"] as const;

const TEXT_FIELDS = [
  "contrato",
  "status",
  "plano",
  "corretor",
  "inquilino",
  "inquilino_cpf",
  "cep",
  "endereco",
  "endereco_numero",
  "complemento",
  "bairro",
  "cidade",
  "uf",
  "motivo_exoneracao",
] as const;

export type LoftSnapshotRow = Record<string, string | number | boolean | null>;

/** "Sim" -> true, "Não" -> false, vazio -> null (tolerante a acento/caixa). */
export function parseBool(raw?: string | null): boolean | null {
  const v = (raw ?? "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (!v) return null;
  if (["sim", "s", "true", "1", "yes"].includes(v)) return true;
  if (["nao", "n", "false", "0", "no"].includes(v)) return false;
  return null;
}

/** "DD/MM/AAAA" -> "AAAA-MM-DD"; vazio ou inválido -> null. */
export function parseDate(raw?: string | null): string | null {
  const v = (raw ?? "").trim();
  if (!v) return null;
  const br = v.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (br) {
    const [, d, m, y] = br;
    const day = Number(d);
    const month = Number(m);
    if (day < 1 || day > 31 || month < 1 || month > 12) return null;
    return `${y}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  const iso = v.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  return null;
}

/** String com ponto decimal -> number; vazio -> null. */
export function parseNum(raw?: string | null): number | null {
  let v = (raw ?? "").trim();
  if (!v) return null;
  v = v.replace(/R\$/gi, "").replace(/\s/g, "");
  // Formato brasileiro (1.234,56) -> normaliza; caso padrão já usa ponto decimal.
  if (/,/.test(v)) v = v.replace(/\./g, "").replace(",", ".");
  else if ((v.match(/\./g) || []).length > 1) v = v.replace(/\./g, "");
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function text(raw?: string | null): string | null {
  const v = (raw ?? "").trim();
  return v === "" ? null : v;
}

export class HeaderMismatchError extends Error {
  constructor(public missing: string[], public extra: string[]) {
    const parts: string[] = [];
    if (missing.length) parts.push(`faltando: ${missing.join(", ")}`);
    if (extra.length) parts.push(`inesperadas: ${extra.join(", ")}`);
    super(`O cabeçalho do CSV não corresponde ao formato esperado (${parts.join(" | ")}).`);
    this.name = "HeaderMismatchError";
  }
}

export interface LoftParseResult {
  rows: LoftSnapshotRow[];
  totalLinhas: number;
  ignoradas: number;
}

/** Lê e valida o CSV no navegador. Lança erro sem tocar no banco. */
export function parseLoftCsv(file: File): Promise<LoftParseResult> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: (h) => h.trim().replace(/^\uFEFF/, "").toLowerCase(),
      complete: (res) => {
        try {
          const found = (res.meta.fields ?? []).filter((f) => f !== "");
          const expected = [...LOFT_CSV_HEADERS] as string[];
          const missing = expected.filter((h) => !found.includes(h));
          const extra = found.filter((h) => !expected.includes(h));
          if (missing.length || extra.length) {
            reject(new HeaderMismatchError(missing, extra));
            return;
          }

          const rows: LoftSnapshotRow[] = [];
          let ignoradas = 0;
          for (const raw of res.data) {
            if (!raw) continue;
            if (!text(raw.contrato)) {
              ignoradas += 1;
              continue;
            }
            const row: LoftSnapshotRow = { garantidora: "Loft" };
            TEXT_FIELDS.forEach((f) => (row[f] = text(raw[f])));
            NUMERIC_FIELDS.forEach((f) => (row[f] = parseNum(raw[f])));
            DATE_FIELDS.forEach((f) => (row[f] = parseDate(raw[f])));
            BOOL_FIELDS.forEach((f) => (row[f] = parseBool(raw[f])));
            rows.push(row);
          }

          resolve({ rows, totalLinhas: rows.length + ignoradas, ignoradas });
        } catch (e) {
          reject(e instanceof Error ? e : new Error("Falha ao interpretar o CSV."));
        }
      },
      error: (err) =>
        reject(new Error(`Não foi possível ler o arquivo CSV: ${err.message ?? "erro desconhecido"}`)),
    });
  });
}

export interface ImportLoftResult {
  importId: string;
  totalLinhas: number;
  inseridos: number;
  ignoradas: number;
}

const BATCH = 500;

/**
 * Cria o registro de importação e grava os snapshots em lotes de 500.
 * Em caso de falha, faz rollback dos dados já gravados para nunca deixar
 * uma importação parcialmente aplicada em silêncio.
 */
export async function importLoftCsv(
  file: File,
  parsed: LoftParseResult,
  onProgress?: (inseridos: number, total: number) => void,
): Promise<ImportLoftResult> {
  const { rows, totalLinhas, ignoradas } = parsed;
  if (rows.length === 0) throw new Error("Nenhuma linha válida encontrada no CSV.");

  const { data: auth } = await supabase.auth.getUser();

  const { data: imp, error: impErr } = await supabase
    .from("guarantor_portal_imports")
    .insert({
      garantidora: "Loft",
      nome_arquivo: file.name,
      total_linhas: totalLinhas,
      importado_por: auth?.user?.id ?? null,
    })
    .select("id")
    .single();

  if (impErr || !imp) {
    throw new Error(`Não foi possível registrar a importação: ${impErr?.message ?? "erro desconhecido"}`);
  }

  const importId = imp.id as string;
  let inseridos = 0;
  onProgress?.(0, rows.length);

  try {
    for (let i = 0; i < rows.length; i += BATCH) {
      const batch = rows.slice(i, i + BATCH).map((r) => ({ ...r, import_id: importId }));
      const { error } = await supabase.from("guarantor_portal_snapshots").insert(batch as never);
      if (error) throw new Error(error.message);
      inseridos += batch.length;
      onProgress?.(inseridos, rows.length);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "erro desconhecido";
    // Rollback: remove tudo que foi gravado nesta importação.
    const { error: delSnapErr } = await supabase
      .from("guarantor_portal_snapshots")
      .delete()
      .eq("import_id", importId);
    const { error: delImpErr } = await supabase
      .from("guarantor_portal_imports")
      .delete()
      .eq("id", importId);

    if (delSnapErr || delImpErr) {
      throw new Error(
        `A importação falhou (${msg}) e não foi possível desfazer os dados já gravados. ` +
          `A importação ${importId} pode estar incompleta no banco — avise o suporte antes de tentar novamente.`,
      );
    }
    throw new Error(`A importação falhou (${msg}). Nenhum dado foi mantido no banco.`);
  }

  return { importId, totalLinhas, inseridos, ignoradas };
}