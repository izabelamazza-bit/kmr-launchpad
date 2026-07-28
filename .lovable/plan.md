## Objetivo

Criar duas tabelas no banco para a carteira de contratos da Ideali, apenas estrutura e regras de acesso — nenhuma tela, componente ou importação.

## O que será criado

**1. `ideali_contracts`** — um registro por contrato, com `codigo_contrato` como chave de negócio única. Inclui todos os campos solicitados: endereço, datas e prazos do contrato, valores e reajuste, taxas e encargos, garantia/garantidora, dados de inquilino e proprietário, repasse e empresa (padrão `Ideali`).

**2. `ideali_invoices`** — um registro por fatura, ligada ao contrato por `codigo_contrato` (exclusão em cascata) e com `id_fatura_origem` único. Sem detalhamento por rubrica. Inclui o marcador `dado_incompleto` (padrão falso) para faturas pendentes que chegarem sem valor, para sinalizar verificação manual sem tratar como zero.

## Detalhes técnicos

- Índices: `status`, `garantidora` e `empresa` em contratos; `codigo_contrato`, `status_fatura` e `vencimento_fatura` em faturas.
- Chave estrangeira exige índice único em `ideali_contracts.codigo_contrato` — já garantido pela restrição UNIQUE.
- Permissões (GRANT) para o papel autenticado nas duas tabelas, mais acesso administrativo de serviço; sem acesso anônimo.
- RLS habilitado nas duas tabelas com quatro políticas (leitura, criação, edição, exclusão) para qualquer usuário autenticado — mesmo padrão já usado em `audit_contracts` (`auth.uid() IS NOT NULL`, `TO authenticated`), sem diferenciação de perfil.
- Gatilho de `updated_at` em `ideali_contracts` reutilizando a função existente `update_updated_at_column`.
- Tudo em uma única migração.

## Fora de escopo

Nenhuma tela, componente, rota ou lógica de importação será criada agora.
