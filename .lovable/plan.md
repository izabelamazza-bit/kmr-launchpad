## Objetivo
Mover os dados vindos da planilha Imoview para a Seção A do contrato. Deixar a Seção B exclusivamente para os dados extraídos do PDF pela IA — vazia e bloqueada até o upload.

## 1. Banco de dados (migration)
Adicionar à tabela `audit_contracts` os campos que hoje só existem na tabela de extração:
- `locatario_nome text`
- `locatario_cpf text`
- `locador_nome text` (em branco — preenchimento manual)
- `endereco_imovel text`

Os outros campos já existem em `audit_contracts`: `valor_aluguel`, `data_inicio`, `data_fim`, `data_proximo_reajuste`, `indice_reajuste`, `empresa`.

Limpeza pontual: remover linhas de `audit_contract_extracted_data` criadas pela importação anterior (linhas cujo contrato tem `import_batch_id` e `pdf_url IS NULL`), para que a Seção B fique vazia até o upload real do PDF.

## 2. Importação (`ImportImoviewModal.tsx` + `imoviewImport.ts`)
- O parser permanece como está (já extrai todos os campos da planilha).
- No `insert` em `audit_contracts`, passar também: `locatario_nome`, `locatario_cpf`, `endereco_imovel`. `locador_nome` fica `null`.
- Remover por completo o `upsert` em `audit_contract_extracted_data`. A importação não toca mais a Seção B em hipótese alguma.

## 3. Tela de contrato (`AuditoriaContrato.tsx`)
Seção A passa a conter os novos campos editáveis (sempre editáveis, mesmo para contratos novos):

```text
[ Nº do Imoview * ]   [ Garantidora * ]
[ Empresa ]           [ Situação ]
[ Status contrato ]   [ Analista ]
[ Nome do locatário ]            [ CPF do locatário ]
[ Nome do locador (manual) ]     [ Valor atual do aluguel ]
[ Data início ]                  [ Data fim ]
[ Data próximo reajuste ]        [ Índice de reajuste ]
[ Endereço do imóvel (textarea, full width) ]
[ Observações gerais (textarea, full width) ]
```

- Estado `form` ganha os novos campos; `load()` os carrega de `audit_contracts`; `saveSectionA()` e `handleSaveAndBack()` os gravam em `audit_contracts`.
- `empresa` no formulário (Rotina/Alugar) — hoje só vem da importação; permitir edição manual.

Seção B continua existindo, mas:
- Renderiza apenas quando existe linha em `audit_contract_extracted_data` (ou seja, após upload + extração). Antes disso, mostrar apenas o uploader + mensagem "A leitura automática preenche esta seção após o envio do PDF."
- Continua editável após extração (sem mudança no comportamento atual de debounce/salvamento).
- Não é tocada pela importação.

## 4. Tipos
Após a migration aprovada, os tipos do Supabase serão regerados automaticamente para incluir os novos campos.

## Fora do escopo
- Sem mudanças no edge function `extract-contract`, no checklist, nos alertas, no upload de PDF, ou na lista/filtros da tela principal de Auditoria.
- Sem migração de dados retroativa dos campos já gravados em `audit_contract_extracted_data` para `audit_contracts` (apenas remoção das linhas órfãs de extração para a Seção B ficar vazia).
