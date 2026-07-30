## Objetivo

A empresa selecionada passa a ser **apenas um filtro de dados**. Estrutura de telas e menu lateral ficam idênticos para Rotina, Alugar e Ideali.

## 1. Menu lateral sempre igual

`AppSidebar.tsx`: remover o uso de `useEnvironment` e a lista `idealiItems`.

- **Operação:** Dashboard, Auditoria, Sinistros, Portal Loft
- **Administração (rodapé, discreto):** Usuários, Leads, Agente de IA, Atendimento — sempre visível
- Logo KMR no topo permanece fixo (já está correto, não muda por empresa)

## 2. Dropdown de empresa fixo no cabeçalho

`AppLayout.tsx`: a barra superior passa a ter, à direita, o `EnvironmentSelect` ("Empresa ativa") — presente em todas as telas autenticadas, inclusive Administração.

`EnvironmentSelect.tsx`: remover o `navigate("/dashboard")` ao trocar de empresa — o usuário permanece na tela atual, só os dados recarregam.

`Dashboard.tsx`: remover o header próprio duplicado (logo + seletor + Sair), já que sidebar e cabeçalho global cobrem isso; remover o bloco condicional `isIdeali` e os `idealiItems`. O dashboard mostra sempre: banner "Registrar novo sinistro" + resumos de Auditoria, Sinistros e Portal Loft.

## 3. Refiltro de dados por empresa

- **Auditoria** (`Auditoria.tsx`): o filtro "Empresa" deixa de ser um select local e passa a seguir a empresa ativa do cabeçalho; a lista e os KPIs recarregam ao trocar. Opções passam a incluir Ideali.
- **Sinistros e Portal Loft:** conforme confirmado, ficam sem filtro por empresa nesta etapa (as tabelas ainda não têm a coluna). O dropdown continua visível; a separação real vem junto com o RLS.

## 4. Remoção das telas Ideali da navegação

Conforme confirmado — **sem apagar código nem dados** (181 contratos, 1.116 faturas, 181 documentos, 82 itens da fila permanecem intactos no banco):

- Remover as rotas `/carteira-ideali` e `/documentacao-ideali` de `App.tsx`
- Remover os cards Ideali do Dashboard e os itens do menu
- Remover `RequireNotIdeali` (`App.tsx` e o arquivo), já que nenhuma tela é mais bloqueada por empresa
- Arquivos em `src/pages/carteira-ideali/` ficam no projeto, apenas desconectados das rotas

## 5. Verificação final

Abrir `/auditoria` no navegador e capturar screenshot mostrando o dropdown de empresa no topo e o menu lateral completo.

## Detalhes técnicos

Arquivos alterados: `src/App.tsx`, `src/components/layout/AppLayout.tsx`, `src/components/layout/AppSidebar.tsx`, `src/components/EnvironmentSelect.tsx`, `src/pages/Dashboard.tsx`, `src/pages/auditoria/Auditoria.tsx`. Arquivo removido: `src/components/RequireNotIdeali.tsx`. Nenhuma migration; nenhuma alteração de dados ou permissões.
