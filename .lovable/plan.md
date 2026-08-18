# Sincronização CredPago via API (Edge Function)

Nova função de backend `sync-credpago-api` que busca os dados na API CredPago e grava direto no banco, substituindo o upload manual de CSVs do Portal Loft. Nada muda nas telas nesta entrega.

## Como vai funcionar

- Recursos suportados: `contratos`, `inadimplencia`, `movimentacoes`. Sem parâmetro, processa os três em sequência.
- Paginação: `limit=500`, `offset` incremental até atingir o `total` informado pela API.
- Os registros são gravados com `garantidora = 'Loft'` e `origem = 'api'`, aparecendo nas telas Portal Loft e Cobmais × Loft como as importações manuais.
- Ao final retorna um resumo em JSON por recurso: total lido, gravados, novos, atualizados e erros.

## Segurança

- Token da API lido do secret `CREDPAGO_API_TOKEN` (nunca no código, nunca em log).
- Acesso à função aceito de duas formas independentes:
  1. JWT de usuário autenticado (padrão do app);
  2. header `x-sync-secret` conferido contra o secret `SYNC_INTERNAL_SECRET` (uso do cron).
  Se nenhuma validar, retorna 401. Os dois secrets têm propósitos distintos e não se misturam.

## Tratamento de erros da API

- **401**: token inválido — para toda a execução e retorna erro claro, sem novas tentativas.
- **403**: sem permissão naquele recurso — pula o recurso, segue os demais e registra no resumo.
- **404**: tratado como erro do recurso, registrado no resumo.
- **500**: repete a mesma página até 3 vezes com 2s de espera antes de desistir.

## Detalhes técnicos

- Arquivos:
  - `supabase/functions/sync-credpago-api/index.ts` — auth, roteamento por recurso, paginação, retry, resumo.
  - `supabase/functions/sync-credpago-api/mappers.ts` — conversores de tipo e mapeamento campo→coluna.
- Conversores portados de `src/pages/portal-loft/lib/inadimplenciaCsvImport.ts` e `loftCsvImport.ts` (`parseDateOnly`, `parseTimestamp`, `parseNumber`, `parseInt32`, booleanos, texto vazio → null), adaptados para consumir JSON em vez de CSV. Os módulos do frontend permanecem intactos (código de `src/` não é deployável em funções).
- Gravação em lotes de 500 usando o service role:
  - `contratos`: cria um registro em `guarantor_portal_imports` (`tipo='contrato'`, `origem='api'`, `nome_arquivo='API CredPago'`) e insere todos os snapshots em `guarantor_portal_snapshots` com esse `import_id`.
  - `inadimplencia`: import com `tipo='inadimplencia'` + upsert em `guarantor_portal_inadimplencia` por `pendencia_id` (campo `id` da API); `details_json` normalizado para array/objeto.
  - `movimentacoes`: import com `tipo='movimentacao'` + upsert em `guarantor_portal_case_notes` por `nota_id` (campo `id` da API).
- Contagem de novos vs atualizados: consulta prévia dos ids existentes (em blocos de 500) antes do upsert.
- Logs por recurso: página, offset, total, quantidade recebida, código HTTP e tentativa de retry — sem nunca imprimir tokens.
- Pré-requisito: preciso cadastrar os secrets `CREDPAGO_API_TOKEN` e `SYNC_INTERNAL_SECRET` (vou pedir os valores na execução).

## Como testar depois

Entrego o comando `curl`/`fetch` pronto (com `x-sync-secret` e com `?recurso=contratos`) para você validar antes de agendar o cron.
