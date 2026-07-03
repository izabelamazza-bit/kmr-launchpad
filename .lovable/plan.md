## Objetivo
Liberar operação completa (INSERT/UPDATE) das 3 tabelas de auditoria para qualquer usuário autenticado, mantendo DELETE restrito a supervisor/admin.

## Migração de RLS

**audit_contracts**
- `UPDATE`: substituir a checagem por `auth.uid() IS NOT NULL` (USING + WITH CHECK).
- `INSERT`: manter `created_by = auth.uid()` (rastreia autor, sem bloquear analista).
- `SELECT` e `DELETE`: sem alteração.

**audit_checklist_items**
- `INSERT` e `UPDATE`: trocar o `EXISTS (... created_by/analyst_id ...)` por `EXISTS (SELECT 1 FROM audit_contracts c WHERE c.id = contract_id)` — qualquer autenticado pode operar checklist de qualquer contrato existente.
- `DELETE`: reduzir para apenas `is_supervisor_or_admin(auth.uid())`.
- `SELECT`: sem alteração.

**audit_contract_extracted_data**
- Mesmas mudanças de checklist: `INSERT`/`UPDATE` liberados para qualquer autenticado desde que o contrato exista; `DELETE` apenas supervisor/admin.

## Fora do escopo
`user_roles`, `users_registry`, `agent_config`, secrets e configurações continuam como estão.

## Validação
Após aplicar, consultar `pg_policies` para confirmar as novas expressões e simular via `set local role authenticated` + `set_config('request.jwt.claims',...)` que INSERT/UPDATE passam e DELETE falha para um uid sem role admin/supervisor.
