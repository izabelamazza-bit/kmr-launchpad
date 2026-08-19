// =============================================================================
// ATENÇÃO: esta lógica de conversão de tipos existe DUPLICADA em
//   src/pages/portal-loft/lib/loftCsvImport.ts
//   src/pages/portal-loft/lib/inadimplenciaCsvImport.ts
// (Edge Functions não podem importar código de src/.)
// Se alterar uma, altere a outra.
// =============================================================================

export type Row = Record<string, unknown>;

export function text(raw: unknown): string | null {
  if (raw === null || raw === undefined) return null;
  const v = String(raw).trim();
  return v === "" ? null : v;
}

/** ISO 8601 ou DD/MM/AAAA -> "AAAA-MM-DD"; vazio/inválido -> null. */
export function parseDateOnly(raw: unknown): string | null {
  const v = text(raw);
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

/** ISO 8601 -> timestamptz; vazio/inválido -> null. */
export function parseTimestamp(raw: unknown): string | null {
  const v = text(raw);
  if (!v) return null;
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (m) {
    const tz = v.match(/(Z|[+-]\d{2}:?\d{2})$/)?.[1] ?? "";
    return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6] ?? "00"}${tz}`;
  }
  const d = parseDateOnly(v);
  return d ? `${d}T00:00:00` : null;
}

export function parseNumber(raw: unknown): number | null {
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
  let v = text(raw);
  if (!v) return null;
  v = v.replace(/R\$/gi, "").replace(/\s/g, "");
  if (/,/.test(v)) v = v.replace(/\./g, "").replace(",", ".");
  else if ((v.match(/\./g) || []).length > 1) v = v.replace(/\./g, "");
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function parseInt32(raw: unknown): number | null {
  const n = parseNumber(raw);
  return n === null ? null : Math.trunc(n);
}

export function parseBool(raw: unknown): boolean | null {
  if (typeof raw === "boolean") return raw;
  const v = text(raw)?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (!v) return null;
  if (["sim", "s", "true", "1", "yes"].includes(v)) return true;
  if (["nao", "n", "false", "0", "no"].includes(v)) return false;
  return null;
}

// ---------------------------------------------------------------------------
// Campos esperados da API (validados contra o primeiro item de cada recurso)
// ---------------------------------------------------------------------------

export const CONTRATOS_FIELDS = [
  "id",
  "carga_em",
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

export const INADIMPLENCIA_FIELDS = [
  "id",
  "carga_em",
  "contrato",
  "id_inadimplencia",
  "imob_status",
  "status",
  "contract_status",
  "valor",
  "valor_atual",
  "data_pendencia",
  "criado_em",
  "data_pagamento",
  "dt_vencimento",
  "forma_pgto_inadimplencia",
  "expiration_days",
  "details_json",
] as const;

export const MOVIMENTACOES_FIELDS = [
  "id",
  "carga_em",
  "contrato",
  "id_movimentacao",
  "criado_em",
  "operation_user_name",
  "real_estate_user_name",
  "id_blocklist_valor",
  "descricao",
] as const;

/** Retorna a lista de campos esperados ausentes no item de amostra. */
export function missingFields(sample: Row, expected: readonly string[]): string[] {
  return expected.filter((f) => !(f in sample));
}

// ---------------------------------------------------------------------------
// Mapeamento campo da API -> coluna do banco
// ---------------------------------------------------------------------------

const CONTRATO_TEXT = [
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

const CONTRATO_NUM = [
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

const CONTRATO_DATE = [
  "cancelamento_taxa_previsao",
  "data_criacao",
  "data_ativacao",
  "data_exoneracao",
  "ultima_renovacao",
] as const;

const CONTRATO_BOOL = ["cancelamento_taxa", "pagamento_suspenso"] as const;

export function mapContrato(item: Row): Row | null {
  if (!text(item.contrato)) return null;
  const row: Row = { garantidora: "Loft" };
  CONTRATO_TEXT.forEach((f) => (row[f] = text(item[f])));
  CONTRATO_NUM.forEach((f) => (row[f] = parseNumber(item[f])));
  CONTRATO_DATE.forEach((f) => (row[f] = parseDateOnly(item[f])));
  CONTRATO_BOOL.forEach((f) => (row[f] = parseBool(item[f])));
  return row;
}

function normalizeDetails(raw: unknown): unknown {
  if (raw === null || raw === undefined || raw === "") return [];
  if (typeof raw === "object") return raw;
  const v = String(raw).trim();
  if (!v || v === "[]") return [];
  try {
    return JSON.parse(v);
  } catch {
    return [];
  }
}

export function mapPendencia(item: Row): Row | null {
  const contrato = text(item.contrato);
  const pendencia = text(item.id_inadimplencia);
  if (!contrato || !pendencia) return null;
  return {
    contrato,
    pendencia_id: pendencia,
    imob_status: text(item.imob_status),
    status_codigo: text(item.status),
    contract_status_codigo: text(item.contract_status),
    valor: parseNumber(item.valor),
    valor_atual: parseNumber(item.valor_atual),
    data_pendencia: parseDateOnly(item.data_pendencia),
    criado_em: parseTimestamp(item.criado_em),
    data_pagamento: parseDateOnly(item.data_pagamento),
    dt_vencimento: parseDateOnly(item.dt_vencimento),
    forma_pgto_codigo: text(item.forma_pgto_inadimplencia),
    expiration_days: parseInt32(item.expiration_days),
    details_json: normalizeDetails(item.details_json),
  };
}

export function mapNota(item: Row): Row | null {
  const contrato = text(item.contrato);
  const nota = text(item.id_movimentacao);
  if (!contrato || !nota) return null;
  return {
    contrato,
    nota_id: nota,
    criado_em: parseTimestamp(item.criado_em),
    operation_user_name: text(item.operation_user_name),
    real_estate_user_name: text(item.real_estate_user_name),
    id_blocklist_valor: text(item.id_blocklist_valor),
    descricao: text(item.descricao),
  };
}