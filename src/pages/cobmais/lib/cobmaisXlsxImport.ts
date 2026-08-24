import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";

export const COBMAIS_SHEET = "Cobrança";

export const COBMAIS_CPF_HEADER = "CPF/CNPJ";

const HEADERS_A = [
  "CPF/CNPJ",
  "CLIENTE",
  "CREDOR",
  "CONTRATO",
  "ATRASO",
  "PRODUTO",
  "OBSERVAÇÃO",
  "RISCO",
  "MARCADOR",
] as const;

const HEADERS_B = [
  "CPF/CNPJ",
  "CLIENTE",
  "CREDOR",
  "CONTRATO",
  "ATRASO",
  "PRODUTO",
  "OBSERVAÇÃO",
  "ACORDO",
  "RISCO",
  "ULTIMO EVENTO",
  "ULTIMO CONTATO",
  "MARCADOR",
] as const;

export type CobmaisFormatName = "A" | "B";

export interface CobmaisFormat {
  nome: CobmaisFormatName;
  headers: readonly string[];
}

/** Formatos aceitos do relatório Cobmais (ordem exata de colunas). */
export const COBMAIS_FORMATS: readonly CobmaisFormat[] = [
  { nome: "A", headers: HEADERS_A },
  { nome: "B", headers: HEADERS_B },
];


export type CobmaisSnapshotRow = {
  cpf_cnpj: string | null;
  cliente: string | null;
  credor: string | null;
  contrato: string | null;
  atraso: number | null;
  produto: string | null;
  garantidora_normalizada: string | null;
  status_cobranca: string | null;
  acordo: boolean | null;
  risco: number | null;
  ultimo_evento: string | null;
  ultimo_contato: string | null;
  marcador: string | null;
};

/** Remove acentos, colapsa espaços e underscores e normaliza a caixa. */
function key(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_\s]+/g, " ")
    .trim()
    .toLowerCase();
}

const PRODUTO_MAP: Record<string, string> = {
  "loft": "Loft",
  "credpago - garantia inteligente": "Loft",
  "credaluga": "Credaluga",
  "credaluga - garantia inteligente": "Credaluga",
  "kmr": "KMR",
  "kmr basic": "KMR",
  "quintocred": "KMR",
};

/** Garantidoras rastreadas pelo sistema. */
export const GARANTIDORAS_RASTREADAS = ["Loft", "KMR", "Credaluga"] as const;

/**
 * Normaliza o PRODUTO em garantidora. Valores que não são garantidoras
 * rastreadas (Fiador, Caução, Sem garantia, ...) mantêm o texto original.
 */
export function normalizeProduto(raw?: string | null): string | null {
  const original = (raw ?? "").trim();
  if (!original) return null;
  return PRODUTO_MAP[key(original)] ?? original;
}

function text(raw: unknown): string | null {
  const v = String(raw ?? "").trim();
  return v === "" ? null : v;
}

/** Aceita "1.234,56", "1234.56" e "12%"; vazio ou inválido -> null. */
export function parseNum(raw: unknown): number | null {
  let v = String(raw ?? "").trim();
  if (!v) return null;
  v = v.replace(/R\$/gi, "").replace(/%/g, "").replace(/\s/g, "");
  if (/,/.test(v)) v = v.replace(/\./g, "").replace(",", ".");
  else if ((v.match(/\./g) || []).length > 1) v = v.replace(/\./g, "");
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function parseInt0(raw: unknown): number | null {
  const n = parseNum(raw);
  return n === null ? null : Math.trunc(n);
}

/** "SIM"/"S"/"TRUE"/"1" -> true; "NÃO"/"N"/"FALSE"/"0" -> false; vazio/desconhecido -> null. */
export function parseBoolSimNao(raw: unknown): boolean | null {
  const v = key(String(raw ?? ""));
  if (!v) return null;
  if (["sim", "s", "true", "1", "verdadeiro"].includes(v)) return true;
  if (["nao", "n", "false", "0", "falso"].includes(v)) return false;
  return null;
}

/**
 * Converte "DD/MM/AAAA HH:MM:SS" (hora opcional) em ISO.
 * Também aceita datas já em ISO. Vazio ou inválido -> null (nunca lança).
 */
export function parseDateTimeBR(raw: unknown): string | null {
  const v = String(raw ?? "").trim();
  if (!v) return null;
  const m = v.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[\sT]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/,
  );
  if (m) {
    const [, d, mo, y, hh = "0", mi = "0", ss = "0"] = m;
    const dt = new Date(
      Number(y), Number(mo) - 1, Number(d), Number(hh), Number(mi), Number(ss),
    );
    if (Number.isNaN(dt.getTime()) || dt.getMonth() !== Number(mo) - 1) return null;
    return dt.toISOString();
  }
  const iso = new Date(v);
  return Number.isNaN(iso.getTime()) ? null : iso.toISOString();
}

export class SheetNotFoundError extends Error {
  constructor(public sheets: string[]) {
    super(
      `A aba "${COBMAIS_SHEET}" não foi encontrada no arquivo. ` +
        `Abas disponíveis: ${sheets.length ? sheets.join(", ") : "nenhuma"}.`,
    );
    this.name = "SheetNotFoundError";
  }
}

/** Falta a coluna crítica de cruzamento — bloqueia a importação inteira. */
export class MissingCpfColumnError extends Error {
  constructor(public found: string[]) {
    super(
      `A coluna "${COBMAIS_CPF_HEADER}" não foi encontrada na aba "${COBMAIS_SHEET}". ` +
        `Ela é obrigatória: todo o cruzamento com o Portal Loft é feito por CPF/CNPJ, ` +
        `então a importação foi bloqueada e nada foi gravado. ` +
        `Colunas encontradas: ${found.length ? found.join(", ") : "nenhuma"}.`,
    );
    this.name = "MissingCpfColumnError";
  }
}

export interface FormatDiff {
  nome: CobmaisFormatName;
  missing: string[];
  extra: string[];
}

export class HeaderMismatchError extends Error {
  constructor(public diffs: FormatDiff[]) {
    const describe = (d: FormatDiff) => {
      const parts: string[] = [];
      if (d.missing.length) parts.push(`faltando: ${d.missing.join(", ")}`);
      if (d.extra.length) parts.push(`inesperadas: ${d.extra.join(", ")}`);
      const cols = COBMAIS_FORMATS.find((f) => f.nome === d.nome)?.headers ?? [];
      return (
        `Formato ${d.nome} (${cols.length} colunas: ${cols.join(", ")}) — ${parts.join(" | ")}`
      );
    };
    super(
      `O cabeçalho da aba "${COBMAIS_SHEET}" não corresponde a nenhum dos formatos aceitos. ` +
        diffs.map(describe).join(" ;; "),
    );
    this.name = "HeaderMismatchError";
  }
}

export interface CobmaisParseResult {
  rows: CobmaisSnapshotRow[];
  totalLinhas: number;
  ignoradas: number;
  porGarantidora: Record<string, number>;
  formato: CobmaisFormatName;
}

/**
 * Detecta o formato do cabeçalho comparando com cada lista aceita,
 * exigindo a ordem exata de colunas. Retorna null se não bater com nenhum.
 */
export function detectFormat(headerRow: string[]): CobmaisFormat | null {
  const found = headerRow.map(key);
  return (
    COBMAIS_FORMATS.find(
      (f) =>
        f.headers.length === found.length &&
        f.headers.every((h, i) => key(h) === found[i]),
    ) ?? null
  );
}

function diffAgainstFormats(headerRow: string[]): FormatDiff[] {
  const found = headerRow.map(key);
  return COBMAIS_FORMATS.map((f) => ({
    nome: f.nome,
    missing: f.headers.filter((h) => !found.includes(key(h))),
    extra: headerRow.filter((h) => !f.headers.some((e) => key(e) === key(h))),
  }));
}


function contarGarantidoras(rows: CobmaisSnapshotRow[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of rows) {
    const g = r.garantidora_normalizada ?? "Não informado";
    out[g] = (out[g] ?? 0) + 1;
  }
  return out;
}

/** Lê e valida o .xlsx no navegador. Lança erro sem tocar no banco. */
export async function parseCobmaisXlsx(file: File): Promise<CobmaisParseResult> {
  let matrix: unknown[][];
  let sheetNames: string[] = [];
  try {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    sheetNames = wb.SheetNames ?? [];
    const name = sheetNames.find((s) => key(s) === key(COBMAIS_SHEET));
    if (!name) throw new SheetNotFoundError(sheetNames);
    const sheet = wb.Sheets[name];
    matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      raw: false,
      defval: "",
      blankrows: false,
    });
  } catch (e) {
    if (e instanceof SheetNotFoundError) throw e;
    throw new Error(
      `Não foi possível ler o arquivo Excel: ${e instanceof Error ? e.message : "erro desconhecido"}`,
    );
  }

  const headerRow = (matrix[0] ?? []).map((c) => String(c ?? "").trim()).filter((c) => c !== "");
  const foundKeys = headerRow.map(key);
  // CPF/CNPJ é a coluna crítica do cruzamento: erro dedicado antes de qualquer outro.
  if (!foundKeys.includes(key(COBMAIS_CPF_HEADER))) throw new MissingCpfColumnError(headerRow);
  const formato = detectFormat(headerRow);
  if (!formato) throw new HeaderMismatchError(diffAgainstFormats(headerRow));
  const temExtras = formato.nome === "B";

  const idx = (h: string) => foundKeys.indexOf(key(h));
  const col = {
    cpf: idx("CPF/CNPJ"),
    cliente: idx("CLIENTE"),
    credor: idx("CREDOR"),
    contrato: idx("CONTRATO"),
    atraso: idx("ATRASO"),
    produto: idx("PRODUTO"),
    observacao: idx("OBSERVAÇÃO"),
    acordo: idx("ACORDO"),
    risco: idx("RISCO"),
    ultimoEvento: idx("ULTIMO EVENTO"),
    ultimoContato: idx("ULTIMO CONTATO"),
    marcador: idx("MARCADOR"),
  };

  const rows: CobmaisSnapshotRow[] = [];
  let ignoradas = 0;
  for (let i = 1; i < matrix.length; i += 1) {
    const raw = matrix[i] ?? [];
    const cpf = text(raw[col.cpf]);
    const cliente = text(raw[col.cliente]);
    if (!cpf && !cliente) {
      ignoradas += 1;
      continue;
    }
    if (!cpf) {
      ignoradas += 1;
      continue;
    }
    const produto = text(raw[col.produto]);
    rows.push({
      cpf_cnpj: cpf,
      cliente,
      credor: text(raw[col.credor]),
      contrato: text(raw[col.contrato]),
      atraso: parseInt0(raw[col.atraso]),
      produto,
      garantidora_normalizada: normalizeProduto(produto),
      status_cobranca: text(raw[col.observacao]),
      acordo: temExtras ? parseBoolSimNao(raw[col.acordo]) : null,
      risco: parseNum(raw[col.risco]),
      ultimo_evento: temExtras ? text(raw[col.ultimoEvento]) : null,
      ultimo_contato: temExtras ? parseDateTimeBR(raw[col.ultimoContato]) : null,
      marcador: text(raw[col.marcador]),
    });
  }

  return {
    rows,
    totalLinhas: rows.length + ignoradas,
    ignoradas,
    porGarantidora: contarGarantidoras(rows),
    formato: formato.nome,
  };

}

export interface ImportCobmaisResult {
  importId: string;
  totalLinhas: number;
  inseridos: number;
  ignoradas: number;
  porGarantidora: Record<string, number>;
}

const BATCH = 500;

/**
 * Cria o registro de importação e grava os snapshots em lotes de 500.
 * Em caso de falha, desfaz tudo o que já foi gravado para nunca deixar
 * uma importação parcial em silêncio.
 */
export async function importCobmaisXlsx(
  file: File,
  parsed: CobmaisParseResult,
  onProgress?: (inseridos: number, total: number) => void,
): Promise<ImportCobmaisResult> {
  const { rows, totalLinhas, ignoradas, porGarantidora } = parsed;
  if (rows.length === 0) throw new Error("Nenhuma linha válida encontrada na aba Cobrança.");

  const { data: auth } = await supabase.auth.getUser();

  const { data: imp, error: impErr } = await supabase
    .from("cobmais_imports")
    .insert({
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
  let inseridos = 0;
  onProgress?.(0, rows.length);

  try {
    for (let i = 0; i < rows.length; i += BATCH) {
      const batch = rows.slice(i, i + BATCH).map((r) => ({ ...r, import_id: importId }));
      const { error } = await supabase.from("cobmais_snapshots").insert(batch);
      if (error) throw new Error(error.message);
      inseridos += batch.length;
      onProgress?.(inseridos, rows.length);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "erro desconhecido";
    const { error: delSnapErr } = await supabase
      .from("cobmais_snapshots")
      .delete()
      .eq("import_id", importId);
    const { error: delImpErr } = await supabase
      .from("cobmais_imports")
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

  return { importId, totalLinhas, inseridos, ignoradas, porGarantidora };
}