import * as XLSX from "xlsx";

export const SHEET_CONTRATOS = "Contratos";
export const SHEET_FATURAS = "Histórico faturas";

export interface IdealiContract {
  codigo_contrato: string;
  codigo_legado: string | null;
  produto: string | null;
  status: string;
  pontualizado: string | null;
  cep: string | null;
  rua: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  data_inicio_contrato: string | null;
  meses_duracao_contrato: number | null;
  data_finalizacao_contrato: string | null;
  dia_vencimento: number | null;
  finalidade_contrato: string | null;
  valor_aluguel: number | null;
  nome_indice: string | null;
  data_ultimo_reajuste: string | null;
  data_proximo_reajuste: string | null;
  taxa_admin: number | null;
  taxa_admin_parc_up: number | null;
  taxa_admin_minima: number | null;
  multa_atraso: number | null;
  juros_atraso_dia: number | null;
  desconto_pontualidade: number | null;
  tipo_garantia: string | null;
  garantidora: string | null;
  despesa_bancaria: number | null;
  taxa_boleto: number | null;
  taxa_ted: number | null;
  gerar_notas_fiscais: boolean | null;
  nome_inquilino: string | null;
  documento_inquilino: string | null;
  telefone_inquilino: string | null;
  emails_inquilino: string | null;
  nome_proprietario: string | null;
  documento_proprietario: string | null;
  telefone_proprietario: string | null;
  emails_proprietario: string | null;
  repasse_proprietario_percentual: number | null;
  empresa: string;
}

export interface IdealiInvoice {
  codigo_contrato: string;
  id_fatura_origem: number;
  vencimento_fatura: string;
  pagamento_fatura: string | null;
  status_repasse_fatura: string | null;
  data_repasse_fatura: string | null;
  valor_boleto: number | null;
  valor_pago_fatura: number | null;
  status_fatura: string;
  adicional_fatura: string | null;
  dado_incompleto: boolean;
}

export interface IdealiParseResult {
  contracts: IdealiContract[];
  invoices: IdealiInvoice[];
  contratosRowsTotal: number;
  contratosDedupGroups: number; // códigos com mais de uma linha
  contratosIgnoradas: number; // linhas sem código
  faturasRowsTotal: number;
  faturasIgnoradas: number; // sem id_fatura / vencimento / status
  faturasIncompletas: number;
  faturasOrfas: number; // codigo_contrato ausente na aba Contratos
}

function normalizeHeader(h: string): string {
  return h
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "")
    .toLowerCase();
}

function normalizeSheetName(name: string): string {
  return name.trim().toLowerCase();
}

function get(row: Record<string, any>, key: string): any {
  return row[normalizeHeader(key)];
}

/** "\N", vazio, null => null */
function raw(v: any): any {
  if (v === null || v === undefined) return null;
  if (typeof v === "string") {
    const s = v.trim();
    if (s === "" || s === "\\N" || s === "\\n" || s.toUpperCase() === "NULL") return null;
    return s;
  }
  return v;
}

function str(v: any): string | null {
  const r = raw(v);
  return r === null ? null : String(r).trim() || null;
}

function num(v: any): number | null {
  const r = raw(v);
  if (r === null) return null;
  if (typeof r === "number") return isNaN(r) ? null : r;
  const s = String(r).replace(/[R$\s%]/g, "");
  const cleaned = s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : s;
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

function int(v: any): number | null {
  const n = num(v);
  return n === null ? null : Math.round(n);
}

function bool(v: any): boolean | null {
  const r = raw(v);
  if (r === null) return null;
  if (typeof r === "boolean") return r;
  if (typeof r === "number") return r !== 0;
  const s = String(r).trim().toLowerCase();
  if (["sim", "s", "true", "t", "1", "yes", "y"].includes(s)) return true;
  if (["nao", "não", "n", "false", "f", "0", "no"].includes(s)) return false;
  return null;
}

function date(v: any): string | null {
  const r = raw(v);
  if (r === null) return null;
  if (r instanceof Date) {
    const y = r.getFullYear();
    const m = String(r.getMonth() + 1).padStart(2, "0");
    const d = String(r.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  if (typeof r === "number") {
    const d = XLSX.SSF.parse_date_code(r);
    if (!d) return null;
    return `${String(d.y).padStart(4, "0")}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
  }
  const s = String(r).trim();
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const br = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (br) {
    let yy = br[3];
    if (yy.length === 2) yy = "20" + yy;
    return `${yy}-${br[2].padStart(2, "0")}-${br[1].padStart(2, "0")}`;
  }
  return null;
}

function sheetRows(wb: XLSX.WorkBook, name: string): Record<string, any>[] {
  const sheet = wb.Sheets[name];
  const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: true });
  return rows.map((r) => {
    const out: Record<string, any> = {};
    Object.entries(r).forEach(([k, v]) => {
      out[normalizeHeader(String(k))] = v;
    });
    return out;
  });
}

function mapContract(row: Record<string, any>): IdealiContract {
  return {
    codigo_contrato: String(str(get(row, "codigo_contrato")) ?? "").trim(),
    codigo_legado: str(get(row, "codigo_legado")),
    produto: str(get(row, "fk_id_produtos_up")),
    status: str(get(row, "name_status")) ?? "Indefinido",
    pontualizado: str(get(row, "pontualizado")),
    cep: str(get(row, "cep_end")),
    rua: str(get(row, "rua_end")),
    numero: str(get(row, "numero_end")),
    complemento: str(get(row, "complemento_end")),
    bairro: str(get(row, "bairro_end")),
    cidade: str(get(row, "cidade_end")),
    data_inicio_contrato: date(get(row, "date_inicio_contrato")),
    meses_duracao_contrato: int(get(row, "meses_duracao_contrato")),
    data_finalizacao_contrato: date(get(row, "date_finalizacao_contrato")),
    dia_vencimento: int(get(row, "dia_vencimento_contrato")),
    finalidade_contrato: str(get(row, "finalidade_contrato")),
    valor_aluguel: num(get(row, "valor_aluguel_contrato")),
    nome_indice: str(get(row, "nome_indice")),
    data_ultimo_reajuste: date(get(row, "data_ultimo_reajuste_contrato")),
    data_proximo_reajuste: date(get(row, "data_proximo_reajuste")),
    taxa_admin: num(get(row, "taxa_admin_contrato")),
    taxa_admin_parc_up: num(get(row, "taxa_admin_parc_up_contrato")),
    taxa_admin_minima: num(get(row, "taxa_admin_minima_contrato")),
    multa_atraso: num(get(row, "multa_atraso_contato")),
    juros_atraso_dia: num(get(row, "juros_atraso_ao_dia_contrato")),
    desconto_pontualidade: num(get(row, "desconto_pontualidade_pagamento")),
    tipo_garantia: str(get(row, "fk_garantia_locaticia")),
    garantidora: str(get(row, "fk_id_seguradora_seguradoras")),
    despesa_bancaria: num(get(row, "despesa_bancaria")),
    taxa_boleto: num(get(row, "taxa_boleto_contrato")),
    taxa_ted: num(get(row, "taxa_ted_contrato")),
    gerar_notas_fiscais: bool(get(row, "gerar_notas_fiscais")),
    nome_inquilino: str(get(row, "nome_inquilino")),
    documento_inquilino: str(get(row, "documento_inquilino")),
    telefone_inquilino: str(get(row, "telefone_inquilino")),
    emails_inquilino: str(get(row, "emails_inquilino")),
    nome_proprietario: str(get(row, "nome_prop")),
    documento_proprietario: str(get(row, "documento_prop")),
    telefone_proprietario: str(get(row, "telefone_prop")),
    emails_proprietario: str(get(row, "emails_prop")),
    repasse_proprietario_percentual: num(get(row, "repasse_prop_cp")),
    empresa: "Ideali",
  };
}

export async function parseIdealiFile(file: File): Promise<IdealiParseResult> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array", cellDates: true });

  const sheetMap = new Map(wb.SheetNames.map((n) => [normalizeSheetName(n), n]));

  const required = [
    { key: "contratos", label: SHEET_CONTRATOS },
    { key: "histórico faturas", label: SHEET_FATURAS },
  ];
  const missing = required.filter((r) => !sheetMap.has(r.key));
  if (missing.length) {
    throw new Error(
      `A planilha precisa ter as abas "${SHEET_CONTRATOS}" e "${SHEET_FATURAS}". Não encontrada(s): ${missing
        .map((m) => `"${m.label}"`)
        .join(", ")}. Abas do arquivo: ${wb.SheetNames.join(", ") || "nenhuma"}.`
    );
  }

  const contratosSheet = sheetMap.get("contratos")!;
  const faturasSheet = sheetMap.get("histórico faturas")!;

  // ---------- Contratos ----------
  const cRows = sheetRows(wb, contratosSheet);
  const groups = new Map<string, Record<string, any>[]>();
  let contratosIgnoradas = 0;
  for (const row of cRows) {
    const codigo = str(get(row, "codigo_contrato"));
    if (!codigo) {
      contratosIgnoradas += 1;
      continue;
    }
    const list = groups.get(codigo);
    if (list) list.push(row);
    else groups.set(codigo, [row]);
  }

  const contracts: IdealiContract[] = [];
  let contratosDedupGroups = 0;
  for (const [, rows] of groups) {
    if (rows.length > 1) contratosDedupGroups += 1;
    const principal =
      rows.find((r) => (str(get(r, "inquilino_principal")) ?? "").toLowerCase() === "sim") ?? rows[0];
    contracts.push(mapContract(principal));
  }

  // ---------- Faturas ----------
  const fRows = sheetRows(wb, faturasSheet);
  const seen = new Set<number>();
  const invoices: IdealiInvoice[] = [];
  let faturasIgnoradas = 0;
  let faturasIncompletas = 0;

  for (const row of fRows) {
    const idFatura = int(get(row, "id_fatura"));
    const codigo = str(get(row, "codigo_contrato"));
    const vencimento = date(get(row, "vencimento_fatura"));
    const statusFatura = str(get(row, "status_fatura"));
    if (idFatura === null || !codigo || !vencimento || !statusFatura) {
      faturasIgnoradas += 1;
      continue;
    }
    if (seen.has(idFatura)) continue;
    seen.add(idFatura);

    const valorBoleto = num(get(row, "valor_boleto"));
    const valorPago = num(get(row, "valor_pago_fatura"));
    const incompleto = statusFatura === "PE" && valorBoleto === null;
    if (incompleto) faturasIncompletas += 1;

    invoices.push({
      codigo_contrato: codigo,
      id_fatura_origem: idFatura,
      vencimento_fatura: vencimento,
      pagamento_fatura: date(get(row, "pagamento_fatura")),
      status_repasse_fatura: str(get(row, "status_repasse_fatura")),
      data_repasse_fatura: date(get(row, "data_repasse_fatura")),
      valor_boleto: valorBoleto,
      valor_pago_fatura: valorPago,
      status_fatura: statusFatura,
      adicional_fatura: str(get(row, "adicional_fatura")),
      dado_incompleto: incompleto,
    });
  }

  return {
    contracts,
    invoices,
    contratosRowsTotal: cRows.length,
    contratosDedupGroups,
    contratosIgnoradas,
    faturasRowsTotal: fRows.length,
    faturasIgnoradas,
    faturasIncompletas,
    faturasOrfas: 0,
  };
}