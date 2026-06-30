## Alterações em `src/pages/auditoria/Auditoria.tsx`

### 1. Corrigir coluna "Locatário"

Hoje a query lê `locatarios` da tabela `audit_contract_extracted_data` (Seção B — PDF). Como os contratos foram importados via planilha, esse campo está vazio. O dado correto está em `audit_contracts.locatario_nome` (Seção A).

- No `load()`, parar de mapear `locatarios` a partir de `extractedMap` e passar a usar `c.locatario_nome` diretamente do registro de `audit_contracts`.
- Como fallback, manter o valor extraído do PDF (`ex.locatarios`) apenas quando `locatario_nome` estiver vazio — assim contratos criados manualmente via PDF continuam exibindo o locatário.
- Aplicar a mesma lógica de fallback ao endereço (`c.endereco_imovel` → `ex.endereco_imovel`) para consistência da Seção A.
- A busca por texto (`search`) continua usando o mesmo campo `locatarios` já consolidado no row.

### 2. Remover coluna "Analista responsável"

Remover o bloco condicional que adiciona a coluna `analyst` ao final de `columns` quando `isSupervisorOrAdmin` é verdadeiro. O filtro de Analista no topo permanece (continua útil), apenas a coluna da tabela é removida.

### Fora de escopo

- Nenhuma mudança em schema, RLS, importador ou tela de detalhe do contrato.
- Nenhum reprocessamento de dados; é puramente leitura/exibição.
