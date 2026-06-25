import * as XLSX from "xlsx";

export type Empresa = "Rotina" | "Alugar";

export interface ParsedRow {
  imoview_number: string;
  locatario_nome: string | null;
  locatario_cpf: string | null;
  valor_aluguel: number | null;
  ocupacao: "Ocupado" | "Desocupado" | null;
  status_contrato: "Saudavel" | "Inadimplente";
  data_inicio: string | null; // ISO date
  data_fim: string | null;
  data_proximo_reajuste: string | null;
  indice_reajuste: string | null;
  garantidora: "Loft" | "Credaluga" | "KMR" | "Alerta";
  garantidora_raw: string | null;
  endereco_imovel: string | null;
  locador_nome: string | null;
  locador_cpf: string | null;
  analista_nome: string | null;
}

export interface ParseResult {
  total: number;
  valid: ParsedRow[];
  ignoredStatus: string[]; // contract numbers
  ignoredInvalid: number; // sem Codigo
}

function normalizeHeader(h: string): string {
  return h
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "")
    .toLowerCase();
}

function pick(row: Record<string, any>, ...candidates: string[]): any {
  for (const c of candidates) {
    const key = normalizeHeader(c);
    if (key in row) return row[key];
  }
  return undefined;
}

function parseValor(v: any): number | null {
  if (v == null || v === "") return null;
  if (typeof v === "number") return v;
  const s = String(v).replace(/[R$\s]/g, "").replace(/\./g, "").replace(",", ".");
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

function parseDate(v: any): string | null {
  if (v == null || v === "") return null;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "number") {
    // Excel serial date
    const d = XLSX.SSF.parse_date_code(v);
    if (!d) return null;
    const iso = `${String(d.y).padStart(4, "0")}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
    return iso;
  }
  const s = String(v).trim();
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (m) {
    const dd = m[1].padStart(2, "0");
    const mm = m[2].padStart(2, "0");
    let yy = m[3];
    if (yy.length === 2) yy = "20" + yy;
    return `${yy}-${mm}-${dd}`;
  }
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  return null;
}

function normalizeGarantidora(raw: any): { value: ParsedRow["garantidora"]; raw: string | null } {
  const s = (raw ?? "").toString().trim();
  if (!s) return { value: "Alerta", raw: null };
  const low = s.toLowerCase().replace(/\s+/g, "");
  if (low.includes("credpago") || low.includes("loft")) return { value: "Loft", raw: s };
  if (low.includes("credaluga")) return { value: "Credaluga", raw: s };
  if (low === "kmr" || low.includes("kmr")) return { value: "KMR", raw: s };
  return { value: "Alerta", raw: s };
}

const ENDERECO_RE =
  /((?:R\.|Rua|Av\.|Avenida|Trav\.|Travessa|Al\.|Alameda|Pç\.|Praça|Estrada|Rod\.|Rodovia)[^\n]*?CEP\s*\d{5}-?\d{3})/i;

function extractEndereco(imoveis: any): string | null {
  if (!imoveis) return null;
  const s = String(imoveis);
  const m = s.match(ENDERECO_RE);
  if (m) return m[1].trim().replace(/\s+/g, " ");
  // fallback: first line
  const first = s.split(/\n|;/)[0]?.trim();
  return first || null;
}

function formatCpf(digits: string): string | null {
  const d = digits.replace(/\D/g, "");
  if (d.length !== 11) return null;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function extractLocador(imoveis: any): { nome: string | null; cpf: string | null } {
  if (!imoveis) return { nome: null, cpf: null };
  const s = String(imoveis);
  // Isolate first parenthesised block — Locador info lives there; later (Captador ...) is ignored
  const paren = s.match(/\(([^)]*)\)/);
  if (!paren) return { nome: null, cpf: null };
  const block = paren[1];
  const nomeM = block.match(/Locador\s+([^|)]+?)\s*(?:\||CPF|$)/i);
  const cpfM = block.match(/CPF[:\s]*([\d.\-]{11,14})/i);
  const nome = nomeM ? nomeM[1].trim().replace(/\s+/g, " ") : null;
  const cpf = cpfM ? formatCpf(cpfM[1]) : null;
  return { nome: nome || null, cpf };
}

function normalizeStatus(v: any): "Saudavel" | "Inadimplente" | null {
  const s = (v ?? "").toString().trim().toLowerCase();
  if (!s) return null;
  if (s.startsWith("saud")) return "Saudavel";
  if (s.startsWith("atras") || s.includes("inadimpl")) return "Inadimplente";
  return null;
}

export async function parseImoviewFile(file: File): Promise<ParseResult> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array", cellDates: true });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const raw: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: true });

  const valid: ParsedRow[] = [];
  const ignoredStatus: string[] = [];
  let ignoredInvalid = 0;

  for (const r of raw) {
    // normalize header keys
    const row: Record<string, any> = {};
    Object.entries(r).forEach(([k, v]) => {
      row[normalizeHeader(String(k))] = v;
    });

    const codigo = pick(row, "Codigo");
    if (!codigo || String(codigo).trim() === "") {
      ignoredInvalid += 1;
      continue;
    }
    const statusNorm = normalizeStatus(pick(row, "Status"));
    if (!statusNorm) {
      ignoredStatus.push(String(codigo));
      continue;
    }

    const gar = normalizeGarantidora(pick(row, "FormaGarantia"));
    const situacao = (pick(row, "Situacao") ?? "").toString().trim().toLowerCase();
    const ocup: ParsedRow["ocupacao"] =
      situacao === "ativo" || situacao === "ocupado" ? "Ocupado" : situacao ? "Desocupado" : null;

    const imoveisRaw = pick(row, "Imoveis");
    const locador = extractLocador(imoveisRaw);

    valid.push({
      imoview_number: String(codigo).trim(),
      locatario_nome: (pick(row, "LocatarioNome") ?? "").toString().trim() || null,
      locatario_cpf: (pick(row, "LocatarioCpf") ?? "").toString().trim() || null,
      valor_aluguel: parseValor(pick(row, "Valor")),
      ocupacao: ocup,
      status_contrato: statusNorm,
      data_inicio: parseDate(pick(row, "DataInicio")),
      data_fim: parseDate(pick(row, "DataFim")),
      data_proximo_reajuste: parseDate(pick(row, "DataProximoReajuste")),
      indice_reajuste: (pick(row, "IndiceReajuste") ?? "").toString().trim() || null,
      garantidora: gar.value,
      garantidora_raw: gar.raw,
      endereco_imovel: extractEndereco(imoveisRaw),
      locador_nome: locador.nome,
      locador_cpf: locador.cpf,
      analista_nome: (pick(row, "Responsavel") ?? "").toString().trim() || null,
    });
  }

  return { total: raw.length, valid, ignoredStatus, ignoredInvalid };
}