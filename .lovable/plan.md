## Nova aba: Auditoria de Contratos de Garantidoras

Adiciono uma seção completa de Auditoria ao painel: dashboard com KPIs, lista filtrada, cadastro/edição de contrato em 4 seções, upload de PDF com **extração mockada** (placeholder pronto para trocar pela API real depois) e checklist interativo com auto-save.

### 1. Banco de dados (Lovable Cloud)

Três tabelas + bucket de storage privado `audit-contracts`:

- **`audit_contracts`** — nº Imoview (único), garantidora, ocupação, status_contrato, analyst_id, observações, audit_status calculado, timestamps.
- **`audit_contract_extracted_data`** — 1:1 com contrato; todos os campos do JSON de extração + `pdf_url` + `extracted_at`.
- **`audit_checklist_items`** — item_number, item_label, section, status (`pending`/`ok`/`nok`), observation, updated_by, updated_at.

**Perfis e RLS:**
- Enum `app_role` (`admin`, `supervisor`, `analista`) + tabela `user_roles` + função security-definer `has_role` (padrão obrigatório do projeto).
- Analista: vê/edita só onde `analyst_id = auth.uid()`. Supervisor/Admin: tudo.
- Trigger recalcula `audit_status` automaticamente conforme estados do checklist mudam.
- Trigger no insert de contrato popula os 22 itens base do checklist; quando garantidora vira "Loft" adiciona itens 23/24 (e remove se ainda pending ao trocar para outra).
- Primeiro usuário (`FIRST_USER_EMAIL`) recebe role `admin`; novos usuários entram como `analista`.

### 2. Extração por IA — MOCK primeiro

Conforme a Seção 7 do briefing: **sem chamada à Anthropic agora**.

A edge function `extract-contract`:
- Recebe `{ contractId, pdfPath }`, valida JWT, confirma que o PDF está no bucket.
- Aguarda 2 s simulando processamento.
- Retorna o JSON fixo de exemplo do briefing (Maria Ana / Ivani / Credpago → Loft, prazo expirado etc.).
- Faz upsert do JSON em `audit_contract_extracted_data` para o front renderizar tudo (alertas inclusos: Credpago normalizado, prazo expirado).
- Bloco do mock fica isolado com comentário exato pedido:
  ```
  // MOCK: substituir este bloco pela chamada real à API da Anthropic quando a chave estiver disponível
  // Modelo: claude-sonnet-4-6
  // Endpoint: https://api.anthropic.com/v1/messages
  ```
- Quando a chave existir, troca-se só esse bloco — schema do banco, UI, alertas e fluxo de upload continuam idênticos.

### 3. Frontend — rotas e navegação

Novas rotas em `App.tsx`:
- `/auditoria` — Dashboard + Lista
- `/auditoria/novo` — Novo contrato
- `/auditoria/:id` — Edição do contrato

Novo item "Auditoria" no menu lateral (DashboardLayout existente), com ícone de escudo/check.

### 4. Tela `/auditoria` — Dashboard + Lista

**Cards superiores:** Total, Auditoria completa, Com pendências, Com alerta, e breakdown por garantidora (Loft/Credaluga/KMR).

**Tabela (DataTable existente):** Nº Imoview · Locatário · Endereço · Garantidora (badge colorido) · Ocupação · Status · Progresso (`X/Y` + mini barra) · Última atualização · Analista (só supervisor/admin) · Ação "Abrir".

**Filtros:** Garantidora · Status · Ocupação · Progresso (Completo/Incompleto/Com alerta) · Analista (só supervisor/admin).

Botão "+ Novo contrato" no header.

### 5. Tela `/auditoria/:id` (e `/auditoria/novo`)

Layout em 4 seções (accordion em mobile, expandidas em desktop):

**Seção A — Dados manuais:** Nº Imoview (validação de unicidade), Garantidora, Ocupação, Status, Analista (select de `users_registry`), Observações. Em "novo", salva A para gerar `id` e liberar B/C.

**Seção B — Upload + extração (mock):**
- Dropzone PDF (≤20 MB) → upload ao bucket → chama `extract-contract` → overlay "Analisando contrato com IA…" por ~2 s.
- Após retorno: campos editáveis (locadores, locatários, CPFs, endereço, datas, prazo, valor, índice, dia vencimento) + read-only (garantidora_identificada raw, normalizada como badge, trecho da cláusula, assinatura digital, observações de extração).
- Botão "Reanalisar PDF".

**Bloco de Alertas** (entre B e C, derivado do JSON extraído + Seção A):
- 🔴 Quintocred detectada
- 🟠 "Outra" / "Não identificada"
- 🟡 Divergência manual × extraída
- 🟡 Prazo expirado
- 🔵 Vencendo em ≤90 dias

**Seção C — Checklist:**
- Barra de progresso + "X de Y verificados".
- Itens agrupados nas 6 seções.
- Cada item: 3 botões (⬜ ✅ ❌) + textarea de observação (auto-abre em NOK; botão "Adicionar observação" em OK).
- **Auto-save** a cada mudança (upsert imediato; debounce 500 ms para texto livre), com indicador "Salvo".
- Itens 23/24 só visíveis quando garantidora = Loft.

**Seção D — Metadados:** Data cadastro, última atualização, último editor, badge do `audit_status` geral.

### 6. Componentes e branding

Reaproveita `DataTable`, `FormSheet`, `MaskedInput` (CPF), `CurrencyInput`, `Badge`, Accordion do design system em `/componentes`. Cores KMR (azul profundo, azul tech, verde aprovação, cinza). Badges de garantidora: Loft azul `#2F80ED`, Credaluga verde `#27AE60`, KMR amarelo, Quintocred/alerta vermelho.

### 7. Fora do escopo

Sem integração Imoview/garantidoras, sem cobrança/inadimplência, sem e-mails, sem exportação, sem chamada real à Anthropic (mock por enquanto).

---

### Detalhes técnicos

**Arquivos novos:**
- `supabase/migrations/<ts>_audit_contracts.sql` — enum role, `user_roles`, `has_role`, três tabelas com grants, RLS por role, triggers de seed/recalcular status, seed do admin.
- `supabase/functions/extract-contract/index.ts` — mock com bloco comentado pronto para virar chamada Anthropic.
- `src/pages/auditoria/Auditoria.tsx` — dashboard + lista.
- `src/pages/auditoria/AuditoriaContrato.tsx` — edição com 4 seções.
- `src/pages/auditoria/components/{SecaoDadosManuais,SecaoUploadExtracao,SecaoChecklist,SecaoMetadados,AlertasExtracao,GarantidoraBadge}.tsx`
- `src/pages/auditoria/lib/checklistItems.ts` — definição dos 24 itens.
- `src/pages/auditoria/lib/useAuditoria.ts` — hooks React Query (lista, KPIs, contrato, checklist, upload).
- `src/hooks/useUserRole.ts` — lê role do usuário logado.

**Arquivos editados:**
- `src/App.tsx` — 3 rotas novas.
- Componente de menu do DashboardLayout — item "Auditoria".

**Storage:** bucket privado `audit-contracts` + policies (analista lê/escreve só seus PDFs via prefixo `<contractId>/`; supervisor/admin leem tudo).

**Pendente para virar produção real (quando a chave Anthropic vier):** trocar o bloco mock na edge function pela chamada `https://api.anthropic.com/v1/messages` com o prompt já especificado — todo o resto (UI, schema, alertas) continua sem mexer.
