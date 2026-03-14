

## Plano: Módulos completos de CRUD (Usuários, Empresas, Pessoas, Produtos/Serviços)

### 1. Criar tabelas no banco de dados (migration)

4 tabelas com RLS policies para usuários autenticados:

**`users_registry`** — id, full_name, username (unique), email, phone, access_profile, status, created_at, updated_at

**`companies`** — id, razao_social, nome_fantasia, cnpj (unique), email, phone, cep, logradouro, numero, complemento, bairro, cidade, estado, status, created_at, updated_at

**`people`** — id, full_name, cpf (unique), email, phone, birth_date, cep, logradouro, numero, complemento, bairro, cidade, estado, status, created_at, updated_at

**`products_services`** — id, type (produto/serviço), name (unique), description, category, price, status, created_at, updated_at

Todas com RLS: authenticated users can SELECT, INSERT, UPDATE, DELETE.

### 2. Criar componentes compartilhados de CRUD

**`src/components/crud/CrudLayout.tsx`** — Layout padrão com header, busca, botão "Novo", conteúdo. Reutilizado em todos os módulos.

**`src/components/crud/DataTable.tsx`** — Tabela responsiva que vira cards em mobile. Recebe colunas e dados por props. Inclui estado vazio e busca sem resultados.

**`src/components/crud/DeleteDialog.tsx`** — Modal de confirmação de exclusão reutilizável. Recebe nome do registro e callbacks.

**`src/components/crud/FormSheet.tsx`** — Sheet lateral para formulários de novo/editar. Título dinâmico, área de conteúdo e botões salvar/cancelar.

### 3. Criar os 4 módulos de cadastro

Cada módulo terá uma pasta em `src/pages/cadastros/`:

**Usuários** (`src/pages/cadastros/Users.tsx`)
- Listagem com DataTable (nome, username, email, perfil, status)
- FormSheet com campos: nome, username, email, telefone (máscara), perfil (SearchableSelect), status, senha/confirmar senha
- Validação com zod: username único, email válido, senhas coincidem, telefone válido
- DeleteDialog para exclusão

**Empresas** (`src/pages/cadastros/Companies.tsx`)
- Listagem: razão social, nome fantasia, CNPJ, telefone, cidade, status
- FormSheet com campos: razão social, nome fantasia, CNPJ (máscara), email, telefone (máscara), CEP (máscara), endereço completo, status
- Validação: CNPJ único e válido, campos obrigatórios

**Pessoas** (`src/pages/cadastros/People.tsx`)
- Listagem: nome, CPF, email, telefone, cidade, status
- FormSheet com campos: nome, CPF (máscara), email, telefone (máscara), data nascimento, CEP (máscara), endereço, status
- Validação: CPF único e válido, campos obrigatórios

**Produtos/Serviços** (`src/pages/cadastros/ProductsServices.tsx`)
- Listagem: tipo, nome, categoria, valor, status
- FormSheet com campos: tipo (select), nome, descrição, categoria (SearchableSelect), valor, status
- Validação: nome único, valor positivo

### 4. Criar navegação no Dashboard

Adicionar menu lateral ou cards de navegação no Dashboard com links para cada módulo de cadastro.

### 5. Atualizar rotas em App.tsx

Adicionar rotas:
- `/cadastros/usuarios`
- `/cadastros/empresas`
- `/cadastros/pessoas`
- `/cadastros/produtos-servicos`

### 6. Validações e duplicidade

- Cada formulário usa `zod` para validação client-side
- Antes de salvar, consulta o banco para verificar duplicidade (username, CPF, CNPJ, nome do produto)
- Exibe mensagens amigáveis em português

### 7. Responsividade

- DataTable renderiza como cards em telas < 768px
- FormSheet usa `side="bottom"` em mobile e `side="right"` em desktop
- Campos empilham em coluna única em mobile, grid 2 colunas em desktop
- Botões com min-height 44px para toque confortável

### Resumo de arquivos

```text
src/
├── components/crud/
│   ├── CrudLayout.tsx
│   ├── DataTable.tsx
│   ├── DeleteDialog.tsx
│   └── FormSheet.tsx
├── pages/cadastros/
│   ├── Users.tsx
│   ├── Companies.tsx
│   ├── People.tsx
│   └── ProductsServices.tsx
├── pages/Dashboard.tsx  (atualizado com nav)
└── App.tsx              (novas rotas)

Migration: 1 SQL com 4 tabelas + RLS
```

