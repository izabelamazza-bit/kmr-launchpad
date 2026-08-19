import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import {
  CONTRATOS_FIELDS,
  INADIMPLENCIA_FIELDS,
  MOVIMENTACOES_FIELDS,
  mapContrato,
  mapNota,
  mapPendencia,
  missingFields,
  type Row,
} from "./mappers.ts";

const BASE_URL = "https://lucoreia.com/api/v1/credpago";
const LIMIT = 500;
const BATCH = 500;
const MAX_RETRIES = 3;
const RETRY_WAIT_MS = 2000;

type Recurso = "contratos" | "inadimplencia" | "movimentacoes";
const RECURSOS: Recurso[] = ["contratos", "inadimplencia", "movimentacoes"];

/** Coluna única/estável usada para ordenar a paginação de cada recurso. */
const ORDER_BY: Record<Recurso, string> = {
  contratos: "contrato",
  inadimplencia: "id",
  movimentacoes: "id",
};

/**
 * Estilo de parâmetros de ordenação aceito pela API (descoberto via ?probe=1).
 * Sem ordenação determinística a paginação por offset pode duplicar E pular registros.
 */
const ORDER_STYLE: { by: string; dir: string; asc: string } = {
  by: "order_by",
  dir: "order_dir",
  asc: "ASC",
};

/** Chave única de cada item, para medir duplicados/pulos na leitura. */
function itemKey(recurso: Recurso, item: Row): string {
  return String(recurso === "contratos" ? item.contrato : item.id);
}

interface ResumoRecurso {
  recurso: Recurso;
  total_api: number | null;
  lidos: number;
  distintos: number;
  duplicados_descartados: number;
  paginacao_consistente: boolean;
  gravados: number;
  novos: number;
  atualizados: number;
  erros: string[];
}

/** Erro de token: aborta toda a execução. */
class TokenInvalidoError extends Error {}
/** Erro do recurso: pula o recurso e segue os demais. */
class RecursoError extends Error {}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const CONFIG = {
  contratos: { fields: CONTRATOS_FIELDS, tipo: "contrato" },
  inadimplencia: { fields: INADIMPLENCIA_FIELDS, tipo: "inadimplencia" },
  movimentacoes: { fields: MOVIMENTACOES_FIELDS, tipo: "movimentacao" },
} as const;

function extractItems(payload: unknown): { items: Row[]; total: number | null } {
  if (Array.isArray(payload)) return { items: payload as Row[], total: null };
  const p = (payload ?? {}) as Record<string, unknown>;
  const list =
    (Array.isArray(p.dados) && p.dados) ||
    (Array.isArray(p.data) && p.data) ||
    (Array.isArray(p.items) && p.items) ||
    (Array.isArray(p.results) && p.results) ||
    [];
  const totalRaw = p.total ?? p.count ?? null;
  const total = totalRaw === null || totalRaw === undefined ? null : Number(totalRaw);
  return { items: list as Row[], total: Number.isFinite(total as number) ? (total as number) : null };
}

/** Busca uma página com retry em erro 500. Nunca loga o token. */
async function fetchPagina(recurso: Recurso, offset: number, token: string) {
  const url =
    `${BASE_URL}/${recurso}?limit=${LIMIT}&offset=${offset}` +
    `&${ORDER_STYLE.by}=${encodeURIComponent(ORDER_BY[recurso])}&${ORDER_STYLE.dir}=${ORDER_STYLE.asc}`;
  for (let tentativa = 1; tentativa <= MAX_RETRIES; tentativa++) {
    let res: Response;
    try {
      res = await fetch(url, { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } });
    } catch (e) {
      console.error(`[${recurso}] falha de rede offset=${offset} tentativa=${tentativa}: ${(e as Error).message}`);
      if (tentativa === MAX_RETRIES) throw new RecursoError(`falha de rede ao buscar offset=${offset}`);
      await sleep(RETRY_WAIT_MS);
      continue;
    }

    console.log(`[${recurso}] GET offset=${offset} limit=${LIMIT} status=${res.status} tentativa=${tentativa}`);

    if (res.status === 401) {
      throw new TokenInvalidoError(
        "Token da API CredPago inválido ou expirado (401). Atualize o secret CREDPAGO_API_TOKEN.",
      );
    }
    if (res.status === 403) {
      throw new RecursoError(`sem permissão para o recurso '${recurso}' (403) — recurso ignorado`);
    }
    if (res.status === 404) {
      throw new RecursoError(`recurso '${recurso}' não encontrado na API (404)`);
    }
    if (res.status >= 500) {
      if (tentativa === MAX_RETRIES) {
        throw new RecursoError(`erro interno da API (${res.status}) em offset=${offset} após ${MAX_RETRIES} tentativas`);
      }
      await sleep(RETRY_WAIT_MS);
      continue;
    }
    if (!res.ok) {
      throw new RecursoError(`resposta inesperada da API (${res.status}) em offset=${offset}`);
    }

    const payload = await res.json();
    const { items, total } = extractItems(payload);
    console.log(`[${recurso}] offset=${offset} recebidos=${items.length} total=${total ?? "n/d"}`);
    return { items, total };
  }
  throw new RecursoError(`não foi possível buscar offset=${offset}`);
}

interface Leitura {
  items: Row[];
  totalApi: number | null;
  distintos: number;
}

/** Lê todas as páginas do recurso, validando o schema no primeiro item. */
async function coletar(recurso: Recurso, token: string): Promise<Leitura> {
  const expected = CONFIG[recurso].fields;
  const todos: Row[] = [];
  let offset = 0;
  let total: number | null = null;
  let validado = false;

  while (true) {
    const pagina = await fetchPagina(recurso, offset, token);
    if (total === null) total = pagina.total;

    if (!validado && pagina.items.length > 0) {
      const faltando = missingFields(pagina.items[0], expected);
      if (faltando.length) {
        throw new RecursoError(
          `campo ${faltando.join(", ")} esperado não encontrado na resposta da API — schema pode ter mudado. ` +
            `Nada foi gravado para '${recurso}'.`,
        );
      }
      validado = true;
    }

    todos.push(...pagina.items);

    if (pagina.items.length === 0) break;
    offset += LIMIT;
    if (total !== null && offset >= total) break;
    if (total === null && pagina.items.length < LIMIT) break;
  }

  const distintos = new Set(todos.map((i) => itemKey(recurso, i))).size;
  console.log(
    `[${recurso}] leitura concluída: lidos=${todos.length} distintos=${distintos} total_api=${total ?? "n/d"}`,
  );
  return { items: todos, totalApi: total, distintos };
}

type Db = ReturnType<typeof createClient>;

async function criarImport(db: Db, tipo: string, totalLinhas: number): Promise<string> {
  const { data, error } = await db
    .from("guarantor_portal_imports")
    .insert({
      garantidora: "Loft",
      tipo,
      origem: "api",
      nome_arquivo: "API CredPago",
      total_linhas: totalLinhas,
    })
    .select("id")
    .single();
  if (error || !data) throw new RecursoError(`não foi possível registrar a importação: ${error?.message}`);
  return data.id as string;
}

async function idsExistentes(db: Db, table: string, coluna: string, ids: string[]): Promise<Set<string>> {
  const out = new Set<string>();
  for (let i = 0; i < ids.length; i += BATCH) {
    const { data, error } = await db.from(table).select(coluna).in(coluna, ids.slice(i, i + BATCH));
    if (error) throw new RecursoError(`falha ao consultar registros existentes: ${error.message}`);
    (data ?? []).forEach((r: Record<string, unknown>) => out.add(String(r[coluna])));
  }
  return out;
}

async function gravar(
  db: Db,
  table: string,
  rows: Row[],
  onConflict?: string,
): Promise<number> {
  let gravados = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const query = onConflict
      ? db.from(table).upsert(batch, { onConflict })
      : db.from(table).insert(batch);
    const { error } = await query;
    if (error) {
      throw new RecursoError(
        `falha ao gravar o lote ${Math.floor(i / BATCH) + 1} em ${table}: ${error.message} (${gravados} já gravados)`,
      );
    }
    gravados += batch.length;
  }
  return gravados;
}

async function processar(db: Db, recurso: Recurso, token: string): Promise<ResumoRecurso> {
  const resumo: ResumoRecurso = { recurso, lidos: 0, gravados: 0, novos: 0, atualizados: 0, erros: [] };

  const items = await coletar(recurso, token);
  resumo.lidos = items.length;
  if (items.length === 0) return resumo;

  const agora = new Date().toISOString();

  if (recurso === "contratos") {
    // A API pode devolver o mesmo contrato repetido entre páginas — 1 linha por contrato.
    const rows = dedup(items.map(mapContrato).filter((r): r is Row => r !== null), "contrato");
    const importId = await criarImport(db, "contrato", items.length);
    resumo.gravados = await gravar(
      db,
      "guarantor_portal_snapshots",
      rows.map((r) => ({ ...r, import_id: importId, data_snapshot: agora })),
    );
    resumo.novos = resumo.gravados;
    return resumo;
  }

  if (recurso === "inadimplencia") {
    const rows = dedup(items.map(mapPendencia).filter((r): r is Row => r !== null), "pendencia_id");
    const jaExistiam = await idsExistentes(
      db,
      "guarantor_portal_inadimplencia",
      "pendencia_id",
      rows.map((r) => String(r.pendencia_id)),
    );
    const importId = await criarImport(db, "inadimplencia", items.length);
    resumo.gravados = await gravar(
      db,
      "guarantor_portal_inadimplencia",
      rows.map((r) => ({ ...r, import_id: importId, data_importacao: agora })),
      "pendencia_id",
    );
    resumo.atualizados = rows.filter((r) => jaExistiam.has(String(r.pendencia_id))).length;
    resumo.novos = resumo.gravados - resumo.atualizados;
    return resumo;
  }

  const rows = dedup(items.map(mapNota).filter((r): r is Row => r !== null), "nota_id");
  const jaExistiam = await idsExistentes(
    db,
    "guarantor_portal_case_notes",
    "nota_id",
    rows.map((r) => String(r.nota_id)),
  );
  const importId = await criarImport(db, "movimentacao", items.length);
  resumo.gravados = await gravar(
    db,
    "guarantor_portal_case_notes",
    rows.map((r) => ({ ...r, import_id: importId, data_importacao: agora })),
    "nota_id",
  );
  resumo.atualizados = rows.filter((r) => jaExistiam.has(String(r.nota_id))).length;
  resumo.novos = resumo.gravados - resumo.atualizados;
  return resumo;
}

function dedup(rows: Row[], key: string): Row[] {
  const seen = new Set<string>();
  const out: Row[] = [];
  for (const r of rows) {
    const k = String(r[key]);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(r);
  }
  return out;
}

async function autorizado(req: Request): Promise<boolean> {
  const syncSecret = Deno.env.get("SYNC_INTERNAL_SECRET");
  const header = req.headers.get("x-sync-secret");
  if (syncSecret && header && header === syncSecret) return true;

  const auth = req.headers.get("Authorization");
  const jwt = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!jwt) return false;
  const client = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
  const { data, error } = await client.auth.getUser(jwt);
  return !error && !!data.user;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!(await autorizado(req))) {
      return json({ error: "Não autorizado. Envie um JWT de usuário válido ou o header x-sync-secret." }, 401);
    }

    const token = Deno.env.get("CREDPAGO_API_TOKEN");
    if (!token) return json({ error: "Secret CREDPAGO_API_TOKEN não configurado." }, 500);

    const url = new URL(req.url);
    let recursoParam = url.searchParams.get("recurso");
    if (!recursoParam && req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      recursoParam = (body as { recurso?: string }).recurso ?? null;
    }

    let alvos: Recurso[];
    if (!recursoParam) {
      alvos = RECURSOS;
    } else if (RECURSOS.includes(recursoParam as Recurso)) {
      alvos = [recursoParam as Recurso];
    } else {
      return json({ error: `Recurso inválido: '${recursoParam}'. Use contratos, inadimplencia ou movimentacoes.` }, 400);
    }

    const db = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    const resumos: ResumoRecurso[] = [];
    for (const recurso of alvos) {
      console.log(`[${recurso}] iniciando sincronização`);
      try {
        resumos.push(await processar(db, recurso, token));
      } catch (e) {
        if (e instanceof TokenInvalidoError) {
          console.error(`[${recurso}] token inválido — execução abortada`);
          return json(
            { error: e.message, recursos: [...resumos, { recurso, lidos: 0, gravados: 0, novos: 0, atualizados: 0, erros: [e.message] }] },
            401,
          );
        }
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`[${recurso}] erro: ${msg}`);
        resumos.push({ recurso, lidos: 0, gravados: 0, novos: 0, atualizados: 0, erros: [msg] });
      }
    }

    const totalErros = resumos.reduce((s, r) => s + r.erros.length, 0);
    return json({
      ok: totalErros === 0,
      executado_em: new Date().toISOString(),
      recursos: resumos,
      totais: {
        lidos: resumos.reduce((s, r) => s + r.lidos, 0),
        gravados: resumos.reduce((s, r) => s + r.gravados, 0),
        novos: resumos.reduce((s, r) => s + r.novos, 0),
        atualizados: resumos.reduce((s, r) => s + r.atualizados, 0),
        erros: totalErros,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`erro inesperado: ${msg}`);
    return json({ error: msg }, 500);
  }
});