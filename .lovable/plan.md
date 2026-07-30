## Objetivo

Criar a estrutura de banco para armazenar os dados do RPA da garantidora Loft (importações de CSV, snapshots por contrato e detecção de movimentações entre importações). Nenhuma tabela do módulo de Auditoria é alterada.

## O que será criado

### 1. Tabela `guarantor_portal_imports`
Uma linha por rodada de importação: garantidora (default `Loft`), nome do arquivo, data da importação, total de linhas e usuário que importou.

### 2. Tabela `guarantor_portal_snapshots`
Uma linha por contrato por importação, com todos os campos solicitados: valores (locatício, aluguel, condomínio, outras taxas, setup, fiança total, garantia, multiplicador, custo de saída), flags (cancelamento de taxa + previsão, pagamento suspenso), status, plano, datas (criação, ativação, exoneração, última renovação), corretor, inquilino e CPF, endereço completo (CEP, endereço, número, complemento, bairro, cidade, UF), motivo da exoneração e data do snapshot. Ligada à importação com exclusão em cascata.

Índices em `contrato` e em `import_id`.

### 3. Acesso (RLS)
RLS habilitado nas duas tabelas, seguindo exatamente o padrão já usado em `audit_contracts`: qualquer usuário autenticado pode consultar, criar, editar e excluir registros. Nenhum acesso para visitantes não autenticados.

### 4. View `guarantor_portal_movements`
Para cada contrato, compara o snapshot mais recente com o imediatamente anterior e expõe: contrato, inquilino, status atual/anterior, cancelamento de taxa atual/anterior, pagamento suspenso atual/anterior, IDs das importações atual e anterior, e a data da importação atual. Serve de base para telas de "o que mudou desde a última importação".

## Detalhes técnicos

- Grants explícitos em ambas as tabelas: `SELECT, INSERT, UPDATE, DELETE` para `authenticated` e `ALL` para `service_role` (sem `anon`).
- Policies nomeadas `guarantor_portal_imports_{select,insert,update,delete}` e equivalentes para snapshots, com predicado `auth.uid() IS NOT NULL` para o role `authenticated` — mesmo padrão verificado em `audit_contracts` (o predicado `auth.uid() IS NOT NULL` é a forma robusta equivalente a `auth.role() = 'authenticated'`).
- `importado_por uuid references auth.users(id)` (somente FK, sem trigger).
- A view usa CTE com `LAG(...) OVER (PARTITION BY contrato ORDER BY i.data_importacao)` sobre o join `guarantor_portal_snapshots s JOIN guarantor_portal_imports i ON i.id = s.import_id`, filtrando com `ROW_NUMBER() ... DESC = 1` para manter apenas a linha mais recente por contrato.
- A view é criada com `security_invoker = true`, para que o RLS das tabelas base continue valendo para quem consulta.
- Nada de código de frontend nesta etapa: apenas migração de banco. O importador de CSV e as telas ficam para um passo seguinte.
