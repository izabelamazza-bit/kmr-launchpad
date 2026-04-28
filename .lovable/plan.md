## Plano: Módulo de Registro de Sinistros (Inadimplência)

Novo módulo dentro do dashboard para cadastrar sinistros de inadimplência de aluguel, com fluxo multi-etapa, upload de documentos, débitos dinâmicos, checklist e tela de resumo.

### 1. Banco de dados (migration)

**Tabela `sinistros`** — registro principal:
```text
id uuid pk
inquilino_nome text not null
inquilino_cpf text not null
codigo_contrato text not null   -- código Imoview, usado em relatórios
status_imovel text not null     -- 'ocupado' | 'desocupado'
motivo_desocupacao text         -- só se desocupado
data_entrega_chaves date        -- só se desocupado
checklist jsonb default '[]'    -- itens marcados do checklist
observacoes text
status text default 'aberto'    -- 'rascunho' | 'aberto'
created_by uuid
created_at, updated_at
```

**Tabela `sinistro_debitos`** — débitos vinculados (aluguel + contas):
```text
id uuid pk
sinistro_id uuid fk -> sinistros (on delete cascade)
tipo text not null        -- 'aluguel' | 'consumo'
descricao text            -- ex: água, luz, condomínio (livre p/ consumo)
data_vencimento date not null
valor numeric(12,2) not null
boleto_path text          -- caminho no storage
created_at
```

**Tabela `sinistro_anexos`** — documentos extras do checklist:
```text
id uuid pk
sinistro_id uuid fk
nome text
tipo text       -- categoria (laudo, termo, etc.)
file_path text
created_at
```

RLS: todas com policies para `authenticated` (select/insert/update/delete) seguindo o padrão das demais tabelas.

**Storage bucket** `sinistros` (privado) com policies para `authenticated` ler/escrever no próprio path.

### 2. Rotas e navegação

- `/novo-sinistro` — formulário de cadastro (etapa 1)
- `/novo-sinistro/resumo/:id` — tela de resumo (etapa 2)
- `/sinistros` — listagem (para acessar resumos e futuros relatórios)

**Dashboard:** adicionar botão primário em destaque **"Registrar novo sinistro"** acima do grid de cards, e novo card "Sinistros" no menu apontando para `/sinistros`.

### 3. Página `NovoSinistro.tsx` (formulário)

Layout com header padrão (estilo `CrudLayout`), formulário centralizado em card com seções bem espaçadas.

**Seção 1 — Dados do inquilino:**
- Nome completo (Input)
- CPF (MaskedInput `999.999.999-99` + validação `validateCPF`)
- Código do contrato (Imoview)

**Seção 2 — Status do imóvel:**
- RadioGroup: Ocupado | Desocupado

**Seção 3 — Débito de aluguel** (sempre visível):
- Upload do boleto (input file com preview do nome)
- Data de vencimento (DatePicker shadcn)
- Valor original (input com formatação R$)

**Seção 4 — Contas de consumo (repetível):**
- Lista dinâmica com botão "+ Adicionar conta"
- Cada item: descrição, data vencimento, valor, upload boleto, botão remover

**Seção 5 — Campos extras (só se desocupado):**
- Motivo da desocupação (Textarea)
- Data de entrega das chaves (DatePicker)

**Seção 6 — Checklist de documentos:**
- Lista de Checkbox dinâmica conforme status:
  - Ocupado: Boleto aluguel vencido, Condomínio, Água, Lixo, IPTU, Apólice de seguro
  - Desocupado: todos acima + Laudo de vistoria de saída assinado, Demonstrativo de rescisão, Termo de entrega de chaves, E-mail de rescisão, Boletos dos débitos, Dois orçamentos
- Cada item marcado pode ter upload opcional de arquivo

**Validação (zod):** CPF válido, código de contrato obrigatório, pelo menos 1 débito, valores > 0, datas válidas, campos extras obrigatórios se desocupado.

**Botão "Continuar":** salva sinistro como `rascunho`, sobe arquivos para storage, persiste débitos/anexos e navega para `/novo-sinistro/resumo/:id`.

### 4. Página `ResumoSinistro.tsx`

Carrega o sinistro pelo `:id` e exibe:

- **Card Dados cadastrados:** nome, CPF, código contrato, status (badge)
- **Card Débitos:** tabela com tipo/descrição, vencimento, valor; total consolidado em destaque
- **Card Arquivos anexados:** lista com nome e link para baixar (signed URL do storage)
- **Card Observações:** Textarea editável (salva on blur)
- **Botão secundário "Adicionar mais inadimplências":** volta para `/novo-sinistro/:id` permitindo incluir novos débitos no mesmo sinistro
- **Botão primário "Abrir sinistro":** muda status para `aberto`, exibe toast e redireciona para `/sinistros`

### 5. Página `Sinistros.tsx` (listagem simples)

Reusa `CrudLayout` + `DataTable`: colunas inquilino, CPF, contrato, status imóvel, status, data; botão "Ver" abre o resumo. Botão "Novo" no header → `/novo-sinistro`.

### 6. Componentes reutilizáveis

- `FileUploadField` — input file com preview de nome, ícone, botão remover (estilo design system KMR)
- `CurrencyInput` — input com máscara R$ usando `Intl.NumberFormat` (formatador BRL)
- Todos usam tokens do tema (cores KMR), bordas arredondadas, sombras suaves, mobile-first

### Arquivos

```text
Criar:
  src/pages/sinistros/NovoSinistro.tsx
  src/pages/sinistros/ResumoSinistro.tsx
  src/pages/sinistros/Sinistros.tsx
  src/components/sinistros/FileUploadField.tsx
  src/components/sinistros/CurrencyInput.tsx
  supabase migration (3 tabelas + RLS + bucket storage + policies)

Editar:
  src/App.tsx                (rotas /novo-sinistro, /novo-sinistro/resumo/:id, /sinistros)
  src/pages/Dashboard.tsx    (botão destaque + card Sinistros)
```

LP pública não será alterada.
