# Paridade total do role `analista` no módulo Auditoria

## Diagnóstico

Após as rodadas anteriores, o único bloqueio remanescente para `analista` é **DELETE**. Está travado em 4 lugares — todos com a mesma checagem `is_supervisor_or_admin(auth.uid())`:

| Objeto | Policy | Restrição atual |
|---|---|---|
| `audit_contracts` | `audit_contracts_delete` | supervisor/admin |
| `audit_checklist_items` | `checklist_delete` | supervisor/admin |
| `audit_contract_extracted_data` | `extracted_data_delete` | supervisor/admin |
| `storage.objects` (bucket `audit-contracts`) | `audit_pdf_delete` | supervisor/admin |

INSERT/UPDATE/SELECT nas 3 tabelas e no bucket já estão liberados para qualquer autenticado, então o erro "apenas supervisor ou admin" que o usuário ainda vê só pode aparecer em fluxos que executam DELETE (apagar contrato de teste, remover/substituir PDF, limpar dados extraídos).

A edge function `extract-contract` **não faz checagem de role** — apenas valida sessão, posse via RLS de `audit_contracts` (já aberta para analista) e prefixo `${contractId}/`. Nenhuma alteração necessária lá.

Na UI, dois pontos ainda tratam analista como diferente:
- `AuditoriaContrato.tsx` — o select "Analista responsável" fica desabilitado para analista em contratos existentes.
- `Auditoria.tsx` — o filtro "Analista" na listagem só aparece para supervisor/admin.

## Alterações

### 1. Migração SQL — abrir DELETE para qualquer autenticado

Recriar as 4 policies de DELETE trocando `is_supervisor_or_admin(auth.uid())` por `auth.uid() IS NOT NULL`:

- `audit_contracts.audit_contracts_delete`
- `audit_checklist_items.checklist_delete`
- `audit_contract_extracted_data.extracted_data_delete`
- `storage.objects.audit_pdf_delete` (mantém `bucket_id = 'audit-contracts'`)

Todas as demais policies permanecem inalteradas.

### 2. UI — remover gates de role dentro da Auditoria

- `src/pages/auditoria/AuditoriaContrato.tsx`: remover `disabled={!isSupervisorOrAdmin && !isNew}` e ajustar o placeholder do select "Analista responsável" para sempre permitir reatribuição.
- `src/pages/auditoria/Auditoria.tsx`: exibir o filtro "Analista" e aplicar a lógica de filtragem por `analyst_id` para todos os usuários (remover o gate `isSupervisorOrAdmin`).

## Fora do escopo

- `user_roles`, `users_registry`, `agent_config`, secrets, `admin-create-user`, telas de Configurações/Usuários — continuam restritos a admin.
- Bucket `sinistros` e módulo de Sinistros — inalterados.
- Função `is_supervisor_or_admin` — mantida (ainda usada fora da Auditoria).
- Edge function `extract-contract` — já não gateia por role; nenhuma mudança.

## Validação

- `pg_policies` confirma as 4 novas expressões `auth.uid() IS NOT NULL`.
- Como analista: apagar um contrato de teste, deletar/substituir o PDF, reprocessar extração — todos sem erro de permissão.
- Como analista: filtro por analista aparece na listagem e o select de analista responsável fica editável.
