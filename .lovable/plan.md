# Movimentações da Loft — tabela, aba no drawer e "última atualização"

## Verificações feitas antes do plano

- `guarantor_portal_case_notes` não existe hoje.
- `guarantor_portal_imports` **não** tem a coluna `origem` → precisa ser criada.
- O check de `tipo` já aceita `'movimentacao'` (junto com `contrato` e `inadimplencia`) → nada a fazer no item 3.
- O drawer de contrato tem hoje duas abas: Histórico e Pendências.
- `ultimaAtualizacao` em `useInadimplenciaLoft.ts` hoje considera só pendências, com o comentário de revisitar.

## Banco (migração, nada é apagado)

1. Nova tabela `public.guarantor_portal_case_notes` com os campos pedidos (`import_id` → `guarantor_portal_imports(id) on delete set null`, `contrato`, `nota_id`, `criado_em`, `operation_user_name`, `real_estate_user_name`, `id_blocklist_valor`, `descricao`, `data_importacao default now()`).
   - Índice único em `nota_id` (upsert sem duplicar) e índice em `contrato`.
   - GRANTs para `authenticated` e `service_role`, RLS habilitada com as 4 policies (select/insert/update/delete) para usuário autenticado — mesmo padrão das outras tabelas do Portal Loft.
2. `ALTER TABLE guarantor_portal_imports ADD COLUMN origem text NOT NULL DEFAULT 'manual'` com check em `('manual','rpa','api')`.
3. Nenhuma alteração no check de `tipo` (já contempla `movimentacao`).

## Frontend

4. Nova aba **"Movimentações"** no drawer de histórico do contrato, entre Histórico e Pendências:
   - lista as notas do contrato ordenadas por `criado_em` desc: data, autor (`operation_user_name` ou, se vazio, `real_estate_user_name`) e o texto da descrição;
   - vazio: "Sem movimentações registradas".

5. "Última atualização" passa a considerar a nota mais recente: `ultimaAtualizacao` = maior data entre a pendência mais recente e a nota mais recente do contrato. O indicador "sem retorno da Loft (5+ dias)" e o filtro do dropdown seguem funcionando sobre esse valor combinado.

## Detalhes técnicos

- `lib/useCaseNotes.ts` (novo): tipo `CaseNote`, `fetchCaseNotes(contrato?)` paginado (padrão de `fetchPendencias`), `buildNotaIndex()` → `Map<contratoNormalizado, ultimaNota>` e hook `useCaseNotesLoft()` para o índice global.
- `components/MovimentacoesTab.tsx` (novo): lista das notas em timeline/tabela simples, com estados de loading/erro/vazio.
- `components/HistoricoDrawer.tsx`: busca das notas por contrato + `TabsTrigger`/`TabsContent` "movimentacoes"; `abaInicial` passa a aceitar `"movimentacoes"`.
- `lib/useInadimplenciaLoft.ts`: `buildPendenciaIndex` ganha parâmetro opcional com o índice de notas para compor `ultimaAtualizacao`; o comentário existente é atualizado (deixa de ser "revisitar" e passa a descrever o cálculo combinado).
- `components/CobmaisLoftPanel.tsx`: carrega o índice de notas e o repassa; a aba inicial do drawer é "Pendências" quando há pendência, "Movimentações" quando há nota sem pendência, senão "Histórico".
- Importação do `movimentacoes.csv` (tela/parser) **não** faz parte deste passo — a tabela fica pronta para receber os dados via RPA/importação futura.
