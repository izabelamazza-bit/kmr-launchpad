
## Problema

A Edge Function `supabase/functions/extract-contract/index.ts` retorna um objeto `extracted` **hardcoded** (contrato 206, Ivani dos Santos Simoes) — o `pdfPath` é recebido mas nunca é lido do Storage nem enviado à Anthropic. Por isso todo upload devolve os mesmos dados.

## Correções

### 1. Edge Function `extract-contract` — leitura real do PDF

Reescrever o handler para:

1. Validar body: `contractId` (uuid) e `pdfPath` (string) via Zod. Rejeitar se `ANTHROPIC_API_KEY` ausente.
2. Baixar o PDF exato que o usuário acabou de subir:
   - Usar client `service_role` (`SUPABASE_SERVICE_ROLE_KEY`) para `storage.from('audit-contracts').download(pdfPath)`.
   - Converter o `Blob` em base64 (chunked, para PDFs até 20MB, evitando stack overflow no `btoa`).
3. Chamar a Anthropic Messages API (`https://api.anthropic.com/v1/messages`) com:
   - `model: "claude-sonnet-4-5"` (fallback `claude-3-5-sonnet-latest`), `max_tokens: 4000`.
   - Um único `user` message com dois blocos: `{type:"document", source:{type:"base64", media_type:"application/pdf", data:<base64>}}` + `{type:"text", text:<prompt>}`.
   - Prompt em PT-BR pedindo **JSON estrito** com as chaves usadas hoje: `locadores[]`, `locatarios[]`, `cpf_locatarios[]`, `endereco_imovel`, `data_inicio` (dd/mm/aaaa), `data_termino` (dd/mm/aaaa), `prazo_meses`, `valor_aluguel` (number BRL), `indice_reajuste`, `dia_vencimento`, `garantidora_identificada`, `garantidora_normalizada` (um de: Loft, Credaluga, KMR, Quintocred, Outra, Não identificada), `clausula_garantia_trecho`, `contrato_assinado_digitalmente` (bool). Instruções: retorne APENAS o JSON, sem markdown, use `null` quando não identificado.
4. Parsear a resposta: concatenar `content[].text` onde `type==="text"`, extrair o primeiro bloco `{...}` via regex balanceado simples (ou `JSON.parse` direto após strip de fences ```json). Em erro de parse, retornar 502 com mensagem clara e não gravar nada.
5. Normalizar (`toIso` já existente, coerção de arrays→string separada por `;`, `garantidora_normalizada` restrita à lista) e `upsert` em `audit_contract_extracted_data` com `onConflict: 'contract_id'`, gravando `pdf_url: pdfPath` e `observacoes_extracao: "Extraído via Claude em <timestamp>"`.
6. **Remover completamente** o objeto `extracted` mock e o `setTimeout(2000)`.

Tratamento de erros retorna 4xx/5xx com `{ error }` e mantém `corsHeaders`.

### 2. Frontend — botão "Baixar contrato PDF"

Em `src/pages/auditoria/AuditoriaContrato.tsx`, dentro do card da Seção B, logo abaixo do grid de campos extraídos e antes do bloco de observações/alertas:

- Renderizar apenas quando `extracted?.pdf_url` existir.
- Botão `variant="outline"` com ícone `Download` (lucide) e texto "Baixar contrato PDF".
- `onClick`: `supabase.storage.from("audit-contracts").createSignedUrl(extracted.pdf_url, 60)` e abrir a URL em nova aba (`window.open(url, "_blank")`). Bucket é privado — usar signed URL, não `getPublicUrl`.
- Toast de erro se a signed URL falhar.

### 3. Sem migrações

Nenhuma mudança de schema. Colunas já existem.

## Verificação

Após deploy:
1. Fazer upload de dois PDFs distintos em contratos distintos e conferir que os campos da Seção B refletem cada arquivo.
2. Conferir `observacoes_extracao` com timestamp diferente a cada extração.
3. Clicar em "Baixar contrato PDF" e confirmar que o arquivo aberto é o mesmo que foi subido.
4. Testar PDF sem cláusula de garantia → campos devem vir `null`, sem crash.

## Arquivos tocados

- `supabase/functions/extract-contract/index.ts` (reescrita do handler, remoção do mock)
- `src/pages/auditoria/AuditoriaContrato.tsx` (botão de download na Seção B)
