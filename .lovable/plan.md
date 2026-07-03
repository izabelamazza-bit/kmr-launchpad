## Objetivo
Liberar upload/download de PDFs da Seção B (bucket `audit-contracts`) para qualquer usuário autenticado, mantendo DELETE só para supervisor/admin.

## Causa
As policies de `storage.objects` para o bucket `audit-contracts` ainda exigem que o usuário seja `analyst_id`/`created_by` do contrato (ou supervisor/admin). Como agora qualquer analista pode operar qualquer contrato (RLS de `audit_contracts` já liberada), o Storage ficou defasado e bloqueia o upload.

## Migração
Recriar as 4 policies do bucket `audit-contracts` em `storage.objects`:

- `audit_pdf_insert` (INSERT): `bucket_id = 'audit-contracts' AND auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM audit_contracts c WHERE c.id::text = (storage.foldername(name))[1])` — mantém a amarração ao `${contractId}/` já validada pela edge function, mas sem exigir posse.
- `audit_pdf_update` (UPDATE): mesma expressão em USING e WITH CHECK.
- `audit_pdf_read` (SELECT): `bucket_id = 'audit-contracts' AND auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM audit_contracts c WHERE c.id::text = (storage.foldername(name))[1])` — qualquer autenticado que já pode ler o contrato pode baixar o PDF.
- `audit_pdf_delete` (DELETE): inalterada — `bucket_id = 'audit-contracts' AND is_supervisor_or_admin(auth.uid())`.

## Fora do escopo
Bucket `sinistros`, tabelas de usuários/roles, edge function `extract-contract` (mantém a checagem de posse via RLS + prefixo `${contractId}/`).

## Validação
Consultar `pg_policies` para confirmar as novas expressões e testar upload como analista pela UI da Seção B; confirmar que DELETE direto no Storage segue bloqueado para esse role.
