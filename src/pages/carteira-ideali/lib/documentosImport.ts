import * as XLSX from "xlsx";

export const SHEET_CRUZAMENTO = "Cruzamento Completo";
export const SHEET_FILA = "Fila do Analista";

export const DRIVE_STATUS = [
  "Não existe no Drive",
  "Pasta existe, sem contrato de locação",
  "Só versão não assinada",
  "Contrato assinado encontrado",
] as const;
export type DriveStatus = (typeof DRIVE_STATUS)[number];

export const STATUS_FILA = ["Pendente", "Em andamento", "Resolvido", "Sem ação possível"] as const;
export type StatusFila = (typeof STATUS_FILA)[number];

export interface DocumentoRow {
  codigo_contrato: string;
  inquilino: string | null;
  endereco: string | null;
  status_contrato: string | null;
  garantidora: string | null;
  prioritario: boolean;
  contrato_locacao: boolean;
  apolice_garantia: boolean;
  pasta_encontrada_drive: boolean;
  status_documento_drive: DriveStatus;
  tem_doc_garantia_drive: boolean;
  n_arquivos_drive: number;
  nome_pasta_drive: string | null;
}

export interface FilaRow {
  codigo_contrato: string;
  inquilino: string | null;
  endereco: string | null;
  status_contrato: string | null;
  garantidora: string | null;
  status_documento_drive: DriveStatus;
  localizacao_documento: string;
  status_loft_seguradora: string;
  clausula_garantidora_presente: string;
  nome_inquilino_confere: string;
  endereco_confere: string;
  observacoes: string | null;
  ordem: number;
}

export interface DocumentosParseResult {
  documentos: DocumentoRow[];
  fila: FilaRow[];
  documentosIgnorados: number;
  filaIgnorada: number;
  porStatus: Record<string, number>;
}

const txt = (v: unknown): string | null => {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === "" || s.toLowerCase() === "nan" ? null : s;
};

const bool = (v: unknown): boolean => {
  if (typeof v === "boolean") return v;
  const s = txt(v)?.toLowerCase();
  if (!s) return false;
  return ["1", "true", "sim", "verdadeiro", "yes"].includes(s);
};

const num = (v: unknown): number => {
  const s = txt(v);
  if (!s) return 0;
  const n = Number(s.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};

const driveStatus = (v: unknown): DriveStatus => {
  const s = txt(v);
  const found = DRIVE_STATUS.find((d) => d === s);
  return found ?? "Não existe no Drive";
};

/** Localiza a linha de cabeçalho procurando a coluna "Código Contrato". */
function sheetToRows(ws: XLSX.WorkSheet): Record<string, unknown>[] {
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, blankrows: false });
  const headerIdx = matrix.findIndex((row) =>
    (row ?? []).some((c) => typeof c === "string" && c.trim().toLowerCase() === "código contrato")
  );
  if (headerIdx === -1) return [];
  const headers = (matrix[headerIdx] as unknown[]).map((h) => String(h ?? "").trim());
  return matrix.slice(headerIdx + 1).map((row) => {
    const obj: Record<string, unknown> = {};
    headers.forEach((h, i) => {
      if (h) obj[h] = (row as unknown[])?.[i];
    });
    return obj;
  });
}

export async function parseDocumentosFile(file: File): Promise<DocumentosParseResult> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });

  const wsDocs = wb.Sheets[SHEET_CRUZAMENTO];
  if (!wsDocs) throw new Error(`Aba "${SHEET_CRUZAMENTO}" não encontrada na planilha.`);
  const wsFila = wb.Sheets[SHEET_FILA];
  if (!wsFila) throw new Error(`Aba "${SHEET_FILA}" não encontrada na planilha.`);

  const documentos: DocumentoRow[] = [];
  let documentosIgnorados = 0;
  const porStatus: Record<string, number> = {};

  for (const r of sheetToRows(wsDocs)) {
    const codigo = txt(r["Código Contrato"]);
    if (!codigo) {
      documentosIgnorados++;
      continue;
    }
    const status = driveStatus(r["Status do Documento no Drive"]);
    porStatus[status] = (porStatus[status] ?? 0) + 1;
    documentos.push({
      codigo_contrato: codigo,
      inquilino: txt(r["Inquilino"]),
      endereco: txt(r["Endereço"]),
      status_contrato: txt(r["Status Contrato"]),
      garantidora: txt(r["Garantidora/Tipo Garantia"]),
      // Vem direto da planilha — nunca recalculado no código.
      prioritario: bool(r["Prioritário"]),
      contrato_locacao: bool(r["Planilha: Contrato Locação (Sim/Não)"]),
      apolice_garantia: bool(r["Planilha: Apólice Garantia (Sim/Não)"]),
      pasta_encontrada_drive: bool(r["Pasta encontrada no Drive"]),
      status_documento_drive: status,
      tem_doc_garantia_drive: bool(r["Tem doc. de garantia no Drive"]),
      n_arquivos_drive: num(r["Nº arquivos na pasta"]),
      nome_pasta_drive: txt(r["Nome da pasta no Drive"]),
    });
  }

  const fila: FilaRow[] = [];
  let filaIgnorada = 0;
  let ordem = 0;
  for (const r of sheetToRows(wsFila)) {
    const codigo = txt(r["Código Contrato"]);
    if (!codigo) {
      filaIgnorada++;
      continue;
    }
    ordem += 1;
    fila.push({
      codigo_contrato: codigo,
      inquilino: txt(r["Inquilino"]),
      endereco: txt(r["Endereço"]),
      status_contrato: txt(r["Status Contrato"]),
      garantidora: txt(r["Garantidora/Tipo Garantia"]),
      status_documento_drive: driveStatus(r["Status do Documento no Drive"]),
      localizacao_documento: txt(r["Localização do documento"]) ?? "Pendente",
      status_loft_seguradora: txt(r["Status na Loft/Seguradora"]) ?? "Pendente",
      clausula_garantidora_presente: txt(r["Cláusula garantidora presente"]) ?? "Não verificado",
      nome_inquilino_confere: txt(r["Nome inquilino confere"]) ?? "Não verificado",
      endereco_confere: txt(r["Endereço confere"]) ?? "Não verificado",
      observacoes: txt(r["Observações"]),
      ordem,
    });
  }

  return { documentos, fila, documentosIgnorados, filaIgnorada, porStatus };
}