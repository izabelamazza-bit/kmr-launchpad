## Plano: Ajustes em Sinistros (desocupação, obras e listagem)

Ajustes pontuais — sem recriar o fluxo existente.

### 1. Banco de dados (migration)

Atualizar tabela `sinistros`:

- Adicionar coluna `possui_obras boolean not null default false`.
- Trocar status default de `'rascunho'` para `'em_analise'` (apenas o default; registros antigos seguem como estão).
- Status válidos passam a ser: `em_analise`, `pagamento`, `pago`, `cancelado` (sem CHECK constraint, validado via app — segue padrão atual).

Não há mudança de schema para anexos: o termo de chaves e os orçamentos de obras serão armazenados em `sinistro_anexos` com `tipo` específico (`"Termo de entrega de chaves"` e `"Orçamento de obras"`), reaproveitando o bucket `sinistros`.

### 2. `NovoSinistro.tsx` — bloco Desocupação

- Reorganizar o card "Informações da desocupação" em grid de 3 colunas em desktop (`sm:grid-cols-3`), mantendo motivo no topo em coluna inteira:
  - Linha: Data de entrega das chaves | Termo de entrega de chaves (upload) | (espaço da terceira coluna ocupado proporcionalmente)
  - Layout responsivo: empilha no mobile.
- Novo state `termoChaves: File | null`.
- Validação: se `statusImovel === "desocupado"`, `termoChaves` é obrigatório.
- No submit, fazer upload com prefixo `desocupacao` e inserir em `sinistro_anexos` com `tipo: "Termo de entrega de chaves"`.

### 3. `NovoSinistro.tsx` — novo bloco Obras

Novo `Card` logo abaixo do bloco de desocupação (visível independente do status do imóvel — confirmar abaixo).

- Campo "Imóvel possui obras?" com `RadioGroup` (Sim / Não), default Não.
- Se Sim: campo de upload múltiplo "Anexar orçamentos de obras" (mínimo 1 arquivo, obrigatório).
- States: `possuiObras: boolean`, `orcamentosObras: File[]`.
- No submit:
  - Validar: se Sim e lista vazia → toast de erro.
  - Persistir `possui_obras` na tabela `sinistros`.
  - Upload de cada arquivo em `sinistros/{id}/obras/...` e insert em `sinistro_anexos` com `tipo: "Orçamento de obras"`.

### 4. Componente novo: `MultiFileUploadField`

Em `src/components/sinistros/MultiFileUploadField.tsx`, baseado no `FileUploadField` existente:
- Aceita múltiplos arquivos (`multiple` no input).
- Lista arquivos selecionados com botão remover por item.
- API: `value: File[]`, `onChange: (files: File[]) => void`.

### 5. Status inicial do sinistro

- No insert em `NovoSinistro.tsx`, trocar `status: "rascunho"` → `status: "em_analise"`.
- Em `ResumoSinistro.tsx`, o botão "Abrir sinistro" mantém-se mas atualiza para `status: "em_analise"` (caso já não esteja) — o sinistro já nasce em análise; o botão passa a ser "Confirmar sinistro" e apenas redireciona/atualiza observações. Manter comportamento atual mas alinhar string para `em_analise`.

### 6. `Sinistros.tsx` — listagem

- Colunas exibidas: Inquilino | Contrato | Imóvel | Status | Criado em | Ações (CPF removido para dar espaço aos novos status).
- Mapear labels:
  - `status_imovel`: `ocupado` → "Ocupado", `desocupado` → "Rescindido".
  - `status` do sinistro:
    - `em_analise` → "Em análise" — badge amarelo
    - `pagamento` → "Em pagamento" — badge azul
    - `pago` → "Pago" — badge verde
    - `cancelado` → "Cancelado" — badge vermelho
- Helper `getStatusBadge(status)` retorna `{ label, className }` com classes Tailwind do design system (amarelo: `bg-yellow-100 text-yellow-800`, azul: `bg-blue-100 text-blue-800`, verde: `bg-green-100 text-green-800`, vermelho: `bg-red-100 text-red-800`).
- Compatibilidade com registros legados (`rascunho`, `aberto`): exibir como "Em análise".

### 7. `ResumoSinistro.tsx`

- Exibir card "Obras" quando `possui_obras = true`, listando os orçamentos (já vêm via `sinistro_anexos` com `tipo: "Orçamento de obras"`).
- Termo de chaves aparece automaticamente no card "Arquivos anexados" (via `sinistro_anexos`).

### Arquivos

```text
Criar:
  src/components/sinistros/MultiFileUploadField.tsx
  supabase migration (possui_obras + status default)

Editar:
  src/pages/sinistros/NovoSinistro.tsx
  src/pages/sinistros/Sinistros.tsx
  src/pages/sinistros/ResumoSinistro.tsx
```

### Pergunta de confirmação

O bloco "Imóvel possui obras?" deve aparecer **sempre** (ocupado e desocupado) ou **apenas quando desocupado**? Por padrão do plano vou deixar **sempre visível** já que o prompt diz "logo abaixo da seção de desocupação" sem condicionar — mas o card de desocupação só aparece quando o imóvel está desocupado, então na prática faz mais sentido o bloco Obras também só aparecer para **desocupado**. Vou implementar assim (apenas desocupado). Se preferir sempre visível, é só avisar antes de aprovar.
