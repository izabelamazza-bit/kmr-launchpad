# Importações do relatório Cobmais (Rotina Recebíveis)

Criação da estrutura de dados para receber importações recorrentes do relatório Cobmais, seguindo exatamente o mesmo padrão já usado no Portal Loft (tabela de importação + tabela de snapshots por linha).

Nenhuma tabela existente é alterada (auditoria, portal das garantidoras e sinistros ficam intactos).

## O que será criado

**Registro de importações (`cobmais_imports`)**
- Nome do arquivo, data da importação, total de linhas e quem importou.

**Snapshots por registro (`cobmais_snapshots`)**
- Uma linha por registro da aba "Cobrança" do Excel, vinculada à importação.
- Campos: CPF/CNPJ, cliente, credor, contrato, atraso (dias), produto, garantidora normalizada, status de cobrança, risco, marcador e data do snapshot.
- Ao excluir uma importação, seus snapshots são removidos junto.

**Consulta consolidada (`cobmais_latest_loft`)**
- Traz apenas o registro mais recente de cada CPF/CNPJ cuja garantidora é Loft, considerando a importação mais nova.

**Regras de acesso**
- Qualquer usuário autenticado pode consultar, criar, editar e excluir os dados, igual às demais tabelas do sistema.

## Detalhes técnicos

- `cobmais_imports`: `id uuid pk default gen_random_uuid()`, `nome_arquivo text`, `data_importacao timestamptz not null default now()`, `total_linhas integer`, `importado_por uuid references auth.users(id)`.
- `cobmais_snapshots`: `id uuid pk`, `import_id uuid not null references cobmais_imports(id) on delete cascade`, `cpf_cnpj text`, `cliente text`, `credor text`, `contrato text`, `atraso integer`, `produto text`, `garantidora_normalizada text`, `status_cobranca text`, `risco numeric`, `marcador text`, `data_snapshot timestamptz not null default now()`.
- Índices: `cobmais_snapshots(cpf_cnpj)`, `cobmais_snapshots(contrato)`, `cobmais_snapshots(import_id)`.
- GRANTs para `authenticated` (SELECT/INSERT/UPDATE/DELETE) e `ALL` para `service_role`; RLS habilitado com 4 policies por tabela usando `auth.uid() IS NOT NULL`, mesmo padrão de `guarantor_portal_snapshots`.
- View `cobmais_latest_loft` com `security_invoker = true`, usando `DISTINCT ON (s.cpf_cnpj)` em join com `cobmais_imports`, filtrando `garantidora_normalizada = 'Loft'` e ordenando por `cpf_cnpj, i.data_importacao DESC, s.data_snapshot DESC`.

Escopo: apenas banco de dados nesta etapa — a tela de importação e o dashboard do Cobmais podem ser feitos em seguida.
