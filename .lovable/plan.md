## Objetivo

Reenviar a mesma planilha do Imoview no modo **merge**: em vez de pular contratos duplicados, atualizar apenas os campos vazios dos registros já existentes — sem mexer em checklist, audit_status, histórico, dados extraídos do PDF (Seção B) ou anotações manuais. Também passar a extrair **nome e CPF do locador** do campo `Imoveis`.

## 1. Banco — nova coluna

Migration adicionando `locador_cpf text` em `audit_contracts` (nullable, sem constraint). Nenhum outro schema muda.

## 2. Parser (`src/pages/auditoria/lib/imoviewImport.ts`)

- Adicionar `locador_nome` e `locador_cpf` em `ParsedRow`.
- Nova função `extractLocador(imoveis)` que isola o primeiro par de parênteses e roda regex:
  - Nome: `/Locador\s+([^|)]+?)\s*(?:\||CPF|\))/i`
  - CPF: `/CPF[:\s]*([\d.\-]{11,14})/i` (normaliza para `XXX.XXX.XXX-XX`)
- `parseImoviewFile` retorna os dois novos campos por linha. Endereço continua extraído como hoje.

## 3. Importador (`ImportImoviewModal.tsx`)

Trocar o bloco "se duplicado, pula" por um **merge condicional**:

- Buscar os existentes com `select("id, locador_nome, locador_cpf, locatario_nome, locatario_cpf, endereco_imovel, valor_aluguel, data_inicio, data_fim, data_proximo_reajuste, indice_reajuste, empresa, analyst_name")` em vez de só `imoview_number`.
- Para cada linha da planilha:
  - Se **não existe**: `insert` como hoje (agora incluindo `locador_nome`, `locador_cpf`).
  - Se **existe**: montar um patch só com as chaves cujo valor atual no banco é `null`/`""` **e** cuja linha da planilha traz valor. Se o patch ficar vazio → contar como "sem alterações". Caso contrário `update().eq("id", existing.id)` e contar como "atualizado".
- Campos elegíveis para merge (todos da Seção A): `locador_nome`, `locador_cpf`, `locatario_nome`, `locatario_cpf`, `endereco_imovel`, `valor_aluguel`, `data_inicio`, `data_fim`, `data_proximo_reajuste`, `indice_reajuste`, `empresa`, `analyst_name`.
- **Nunca** sobrescrever valores já preenchidos. **Nunca** tocar em `audit_status`, `garantidora`, `ocupacao`, `status_contrato`, `general_notes`, checklist, extracted_data, histórico, `created_by`, `created_at`.

## 4. Resumo do modal

Trocar a linha "Ignorados (já existentes)" por duas:
- **Atualizados (campos preenchidos)**: nº de updates aplicados
- **Já completos (sem alterações)**: nº de existentes que não precisaram de patch

Manter `Importados com sucesso`, `Ignorados (sem código)`, `Ignorados (status fora de Saudável/Atrasado)` e `Erros`.

## 5. UI da Seção A (`AuditoriaContrato.tsx`)

Adicionar o input "CPF do locador" ao lado de "Nome do locador" (usar `MaskedInput` máscara CPF, igual ao locatário). Incluir `locador_cpf` em `Contract`, `form` state, `load` e payloads de `save` / `handleSaveAndBack`.

## Detalhes técnicos

- Regex roda só no primeiro par de parênteses (`imoveis.match(/\(([^)]*)\)/)`) para evitar pegar o bloco "(Captador ...)".
- CPF inválido (não bater 11 dígitos após limpar) → grava `null`.
- Update do supabase respeita RLS existente (`is_supervisor_or_admin OR analyst_id OR created_by`); contratos criados pelo próprio usuário continuam editáveis.
- Sem alteração em edge functions, sem alteração no trigger `seed_audit_checklist` (só roda em insert, então merge não dispara).
