import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

// =============================================================
// Edge Function: extract-contract
// Recebe { contractId, pdfPath }, baixa o PDF do Storage, envia para
// a API da Anthropic (Claude) e popula audit_contract_extracted_data
// com os dados reais daquele contrato.
// =============================================================

const GARANTIDORAS_VALIDAS = ['Loft', 'Credaluga', 'KMR', 'Quintocred', 'Outra', 'Não identificada'] as const;

function blobToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk) as unknown as number[]);
  }
  return btoa(binary);
}

function extractJson(text: string): any {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = (fenced ? fenced[1] : text).trim();
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('Resposta da IA sem JSON.');
  return JSON.parse(raw.slice(start, end + 1));
}

const toIso = (s: unknown): string | null => {
  if (typeof s !== 'string') return null;
  const m1 = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s.trim());
  if (m1) return `${m1[3]}-${m1[2]}-${m1[1]}`;
  const m2 = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
  if (m2) return s.trim();
  return null;
};

const asArrayStr = (v: unknown): string | null => {
  if (v == null) return null;
  if (Array.isArray(v)) return v.filter(Boolean).map((x) => String(x)).join('; ') || null;
  return String(v) || null;
};

const asNumber = (v: unknown): number | null => {
  if (v == null || v === '') return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const s = String(v).replace(/[^\d,.-]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.');
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
};

const asInt = (v: unknown): number | null => {
  const n = asNumber(v);
  return n == null ? null : Math.trunc(n);
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => ({}));
    const contractId = String(body?.contractId ?? '');
    const pdfPath = String(body?.pdfPath ?? '');
    if (!contractId || !pdfPath) {
      return new Response(JSON.stringify({ error: 'contractId and pdfPath required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const anthropicKey = (Deno.env.get('ANTHROPIC_API_KEY') ?? '').trim();
    if (!anthropicKey) {
      return new Response(
        JSON.stringify({ error: 'ANTHROPIC_API_KEY não configurada. Configure em Configurações → Integrações de IA.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Baixa o PDF exato enviado pelo usuário (bucket privado → service role)
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    const { data: fileBlob, error: dlErr } = await admin.storage
      .from('audit-contracts')
      .download(pdfPath);
    if (dlErr || !fileBlob) {
      return new Response(JSON.stringify({ error: `Falha ao baixar PDF: ${dlErr?.message ?? 'arquivo não encontrado'}` }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const bytes = new Uint8Array(await fileBlob.arrayBuffer());
    const pdfBase64 = blobToBase64(bytes);

    // Chamada Anthropic
    const prompt = `Você é um assistente que extrai dados estruturados de contratos de locação residencial em português.

Leia o PDF anexado e retorne APENAS um JSON válido (sem markdown, sem comentários) com estas chaves:

{
  "locadores": [string],
  "locatarios": [string],
  "cpf_locatarios": [string],
  "endereco_imovel": string,
  "data_inicio": "dd/mm/aaaa",
  "data_termino": "dd/mm/aaaa",
  "prazo_meses": number,
  "valor_aluguel": number,
  "indice_reajuste": string,
  "dia_vencimento": number,
  "garantidora_identificada": string,
  "garantidora_normalizada": "Loft" | "Credaluga" | "KMR" | "Quintocred" | "Outra" | "Não identificada",
  "clausula_garantia_trecho": string,
  "contrato_assinado_digitalmente": boolean
}

Regras:
- Use null quando o dado não estiver presente no contrato.
- valor_aluguel deve ser o valor em reais (número, sem R$ nem pontos de milhar).
- garantidora_normalizada: mapeie "CredPago"/"Loft Cobrança" → "Loft", "CredAlugar"/"Credaluga" → "Credaluga", "KMR" → "KMR", "Quintocred"/"Quinto Andar" → "Quintocred". Se identificar alguma outra empresa, use "Outra". Se não houver garantidora no contrato, use "Não identificada".
- clausula_garantia_trecho: transcreva literalmente o trecho do contrato que menciona a garantidora.
- Retorne SOMENTE o JSON.`;

    const aiResp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 8192,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: pdfBase64 } },
              { type: 'text', text: prompt },
            ],
          },
        ],
      }),
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      return new Response(JSON.stringify({ error: `Anthropic ${aiResp.status}: ${errText.slice(0, 500)}` }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const aiJson = await aiResp.json();
    const text = (aiJson?.content ?? [])
      .filter((b: any) => b?.type === 'text')
      .map((b: any) => b.text)
      .join('\n');

    let extracted: any;
    try {
      extracted = extractJson(text);
    } catch (e) {
      return new Response(JSON.stringify({ error: `Falha ao parsear resposta da IA: ${String(e)}`, raw: text.slice(0, 800) }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const garantidoraNorm =
      typeof extracted.garantidora_normalizada === 'string' &&
      (GARANTIDORAS_VALIDAS as readonly string[]).includes(extracted.garantidora_normalizada)
        ? extracted.garantidora_normalizada
        : 'Não identificada';

    const payload = {
      contract_id: contractId,
      locadores: asArrayStr(extracted.locadores),
      locatarios: asArrayStr(extracted.locatarios),
      cpf_locatarios: asArrayStr(extracted.cpf_locatarios),
      endereco_imovel: extracted.endereco_imovel ?? null,
      data_inicio: toIso(extracted.data_inicio),
      data_termino: toIso(extracted.data_termino),
      prazo_meses: asInt(extracted.prazo_meses),
      valor_aluguel: asNumber(extracted.valor_aluguel),
      indice_reajuste: extracted.indice_reajuste ?? null,
      dia_vencimento: asInt(extracted.dia_vencimento),
      garantidora_identificada_raw: extracted.garantidora_identificada ?? null,
      garantidora_normalizada: garantidoraNorm,
      clausula_garantia_trecho: extracted.clausula_garantia_trecho ?? null,
      assinatura_digital: Boolean(extracted.contrato_assinado_digitalmente),
      observacoes_extracao: `Extraído via Claude em ${new Date().toISOString()}`,
      pdf_url: pdfPath,
      extracted_at: new Date().toISOString(),
    };

    const { data: upserted, error: upsertErr } = await supabase
      .from('audit_contract_extracted_data')
      .upsert(payload, { onConflict: 'contract_id' })
      .select()
      .single();

    if (upsertErr) {
      return new Response(JSON.stringify({ error: upsertErr.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ extracted: upserted }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});