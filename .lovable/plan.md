## Objetivo

Criar a lógica de importação do CSV do RPA da garantidora Loft, pronta para ser usada na tela "Portal Loft" (a ser criada no próximo prompt).

## O que será construído

### 1. Dependência
- Instalar `papaparse` + `@types/papaparse` (hoje só existe `xlsx` no projeto).

### 2. Parser e conversores — `src/pages/portal-loft/lib/loftCsvImport.ts`
- Constante com os 30 cabeçalhos esperados, na ordem exata informada.
- Validação: se o conjunto de colunas não for exatamente o esperado, aborta antes de qualquer insert e retorna a lista de colunas faltantes/extras para exibir no erro.
- Conversores:
  - `parseBool`: "Sim" → true, "Não" → false (case/acento tolerantes), vazio → null.
  - `parseDate`: "DD/MM/AAAA" → "AAAA-MM-DD"; vazio/inválido → null.
  - `parseNum`: string com ponto decimal → number; vazio → null (remove separadores de milhar e "R$" por segurança).
- Linhas sem `contrato` são descartadas e contabilizadas como ignoradas.

### 3. Fluxo de importação (função `importLoftCsv`)
1. Parse local com papaparse (`header: true`, `skipEmptyLines: true`).
2. Valida cabeçalho → erro claro se divergir.
3. Cria 1 registro em `guarantor_portal_imports` (garantidora `Loft`, `nome_arquivo`, `total_linhas`, `importado_por` = usuário logado).
4. Insere as linhas convertidas em `guarantor_portal_snapshots` com o `import_id`, em lotes de 500.
5. Callback de progresso por lote (`onProgress(inseridos, total)`).
6. **Rollback em falha:** se algum lote falhar, apaga os snapshots já inseridos daquele `import_id` e o próprio registro de import, garantindo que nada fique parcialmente aplicado; se o rollback também falhar, o erro exibido avisa explicitamente que o import ficou incompleto e informa o `import_id`.

### 4. Componente `ImportLoftModal.tsx`
- Seguindo o padrão visual já usado em `ImportImoviewModal` / `ImportDocumentosModal` (componentes de /componentes).
- Input de arquivo `.csv`, botão "Importar", `Progress` durante a execução.
- Resumo final: total de linhas do CSV, importadas com sucesso, ignoradas, e erros — via toast + bloco de resumo no modal.
- Estados de erro com mensagem legível (cabeçalho inválido, falha de rede, parsing).

## Notas técnicas
- Sem mudanças nas tabelas: `guarantor_portal_imports` / `guarantor_portal_snapshots` já existem com RLS para usuário autenticado.
- O modal será exportado e plugado na tela "Portal Loft" no próximo prompt; nesta etapa ele não é montado em nenhuma rota nova.
