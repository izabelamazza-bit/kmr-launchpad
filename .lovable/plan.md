## Objetivo

Reestruturar a seção **Pessoas** (`/cadastros/pessoas`) para representar contratos de garantia locatícia da KMR, com lista, tela de detalhe, formulário de cadastro e popular o banco com os 44 registros fornecidos.

## Decisão de modelagem

A tabela `people` atual é orientada a "pessoa física" (CPF, endereço da pessoa, etc.) e não comporta os campos de contrato (código, valor de aluguel, datas, situação, aviso de desocupação). Para evitar quebrar quaisquer referências futuras à entidade "pessoa", vou **criar uma nova tabela `contratos_pessoas`** e apontar a rota `/cadastros/pessoas` para ela. O CRUD atual de `people` (CPF/endereço) sairá do menu mas o arquivo permanece intocado para histórico.

### Nova tabela `contratos_pessoas`

| Campo | Tipo | Obs |
|---|---|---|
| id | uuid PK | |
| codigo | text UNIQUE | código do contrato |
| nome | text | locatário |
| telefone1 | text | |
| telefone2 | text nullable | |
| email | text | |
| valor_aluguel | numeric(10,2) | |
| endereco | text | |
| situacao | text | `saudavel` \| `atrasado` |
| data_inicio | date | |
| data_fim | date | |
| proximo_reajuste | date | |
| dia_vencimento | int | 1–31 |
| aviso_desocupacao | bool | default false |
| data_aviso_desocupacao | date nullable | |
| created_at / updated_at | timestamptz | |

RLS: SELECT/INSERT/UPDATE/DELETE para `authenticated` (mesmo padrão das outras tabelas do CRM).

## Implementação

### 1. Migração + seed
- Migration cria a tabela, RLS, trigger `update_updated_at_column`.
- Seed (`supabase--insert`) popula os 44 contratos.

### 2. Tela de lista — `src/pages/cadastros/People.tsx` (substituída)
- Reaproveita `CrudLayout` + `DataTable`.
- Colunas: **Código**, **Locatário**, **Situação** (badge verde `Saudável` / vermelho `Atrasado`), **Vencimento** (`Dia XX de cada mês`).
- Busca por nome ou código.
- Filtro por situação: `Todos / Saudável / Atrasado` (Tabs ou Select acima da tabela).
- Botão **+ Nova Pessoa** no header (já existe via `CrudLayout`).
- Click na linha → navega para `/cadastros/pessoas/:id`.

### 3. Tela de detalhe — `src/pages/cadastros/PessoaDetalhe.tsx` (nova rota)
4 blocos em cards:
1. **Identificação**: código, nome, badge de situação.
2. **Contato**: telefone1, telefone2 (se houver), e-mail.
3. **Contrato**: data início, data fim, `Todo dia XX`, próximo reajuste, aviso de desocupação (`Sim — DD/MM/AAAA` ou `Não`).
4. **Imóvel**: endereço, valor formatado `R$ 1.234,56`.

Botão **← Voltar para lista** no topo. Botões **Editar** e **Excluir** secundários.

### 4. Formulário — Nova/Editar (`FormSheet`)
Campos na ordem solicitada, com validação Zod-like inline (mesmo padrão de `People.tsx` atual):
- Código (obrigatório, único — checagem antes do insert)
- Nome, Telefone 1 (mask `(99) 99999-9999`), Telefone 2 (opcional, mesma mask), E-mail
- Valor do aluguel (`CurrencyInput` já existente)
- Endereço (textarea)
- Situação (`SearchableSelect`: Saudável / Atrasado)
- Data início, Data fim, Próximo reajuste (`<Input type="date">`)
- Dia de vencimento (number 1–31)
- Aviso de desocupação (`Switch`)
- Data do aviso (condicional ao Switch)

Botões **Cancelar** / **Salvar** já vêm do `FormSheet`.

### 5. Roteamento
`src/App.tsx`: adicionar `<Route path="/cadastros/pessoas/:id" element={<PessoaDetalhe />} />`.

## Detalhes técnicos

- Tipos do Supabase regenerados automaticamente após a migration.
- `CurrencyInput` existente em `src/components/sinistros/CurrencyInput.tsx` será reutilizado.
- Formatadores: `Intl.NumberFormat('pt-BR', {style:'currency', currency:'BRL'})` e `date-fns/format` com `dd/MM/yyyy`.
- Badges: usar tokens `--primary` (verde de aprovação `#27AE60` já no design system) e `destructive` para atrasado.

## Arquivos
- ➕ migration `contratos_pessoas`
- ➕ seed (44 inserts)
- ✏️ `src/pages/cadastros/People.tsx` — reescrita para contratos
- ➕ `src/pages/cadastros/PessoaDetalhe.tsx`
- ✏️ `src/App.tsx` — rota de detalhe
