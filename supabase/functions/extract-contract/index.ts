import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

// =============================================================
// Edge Function: extract-contract
// Recebe { contractId, pdfPath } e popula audit_contract_extracted_data.
// =============================================================

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

    // ============================================================
    // MOCK: substituir este bloco pela chamada real à API da Anthropic quando a chave estiver disponível
    // Modelo: claude-sonnet-4-6
    // Endpoint: https://api.anthropic.com/v1/messages
    // ============================================================
    await new Promise((r) => setTimeout(r, 2000));
    const extracted = {
      locadores: ['MARIA ANA DA SILVA'],
      locatarios: ['IVANI DOS SANTOS SIMOES', 'ROSELI ANTUNES SIMOES'],
      cpf_locatarios: ['452.980.509-30', '110.794.966-10'],
      endereco_imovel: 'Rua Pedro Jose Samora, Nº 593, Bairro Santa Monica, Uberlândia/MG',
      data_inicio: '28/03/2022',
      data_termino: '27/03/2023',
      prazo_meses: 12,
      valor_aluguel: 1610.38,
      indice_reajuste: 'IGP-DI (FGV)',
      dia_vencimento: 10,
      garantidora_identificada: 'CREDPAGO SERVIÇOS DE COBRANÇA S/A',
      garantidora_normalizada: 'Loft',
      clausula_garantia_trecho:
        'O Locatário realizou a contratação da CREDPAGO SERVIÇOS DE COBRANÇA S/A, a qual se compromete a efetuar o pagamento de eventuais débitos relativos ao aluguel e demais encargos da presente locação.',
      contrato_assinado_digitalmente: true,
      observacoes_extracao:
        'Contrato assinado via DocuSign. Garantidora identificada como Credpago — normalizada para Loft. Prazo original encerrado em 27/03/2023, verificar renovação.',
    };
    // ============================================================
    // FIM DO MOCK
    // ============================================================

    const toIso = (s: string) => {
      const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s);
      return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
    };

    const payload = {
      contract_id: contractId,
      locadores: extracted.locadores.join('; '),
      locatarios: extracted.locatarios.join('; '),
      cpf_locatarios: extracted.cpf_locatarios.join('; '),
      endereco_imovel: extracted.endereco_imovel,
      data_inicio: toIso(extracted.data_inicio),
      data_termino: toIso(extracted.data_termino),
      prazo_meses: extracted.prazo_meses,
      valor_aluguel: extracted.valor_aluguel,
      indice_reajuste: extracted.indice_reajuste,
      dia_vencimento: extracted.dia_vencimento,
      garantidora_identificada_raw: extracted.garantidora_identificada,
      garantidora_normalizada: extracted.garantidora_normalizada,
      clausula_garantia_trecho: extracted.clausula_garantia_trecho,
      assinatura_digital: extracted.contrato_assinado_digitalmente,
      observacoes_extracao: extracted.observacoes_extracao,
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