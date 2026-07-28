## 1. Gráfico "Contratos por tipo de garantia" (/carteira-ideali)

- Considerar somente contratos com `status === "Ativo"` na montagem dos dados da rosca (contagem, percentuais e legenda passam a refletir só a carteira ativa).
- Trocar o texto de apoio acima do gráfico por: "Composição da carteira ativa por garantidora."
- O clique na fatia continua filtrando a tabela da Seção 5, que segue mostrando todos os status.
- Nenhuma outra seção muda.

## 2. Seletor de ambiente no cabeçalho

Hoje o app não tem um menu lateral: a navegação é a grade de cards do Dashboard, e cada tela tem seu próprio cabeçalho (Dashboard e `CrudLayout`).

**Novo contexto de ambiente**
- Criar `EnvironmentProvider` + hook `useEnvironment`, com valores `Rotina | Alugar | Ideali`.
- Persistência em `localStorage` (chave `kmr:environment`), default `Rotina` quando não houver nada salvo.
- Provider montado no `App.tsx`, dentro do `BrowserRouter`.

**Componente `EnvironmentSelect`**
- Dropdown (Select do shadcn) com as três opções, colocado no cabeçalho ao lado do nome do usuário / botão "Sair".
- Inserido no cabeçalho do Dashboard e no cabeçalho compartilhado `CrudLayout` (cobre Usuários, Leads, Auditoria, Sinistros e demais telas CRUD), além do cabeçalho da página `/carteira-ideali`.

**Comportamento na troca**
- Ao escolher **Ideali**: navegar para `/carteira-ideali`.
- Ao sair de Ideali para **Rotina** ou **Alugar**: navegar para `/dashboard`.
- Selecionar Rotina/Alugar não altera nenhuma outra lógica existente (o filtro de empresa dentro da Auditoria continua igual).

**Ocultação condicional de menu**
- No Dashboard, quando o ambiente for `Ideali`, remover o card "Auditoria" da grade e exibir um card "Carteira Ideali" apontando para `/carteira-ideali`. Os demais itens (Usuários, Leads, Agente, Atendimento, Sinistros, Configurações) permanecem.
- Guarda de rota leve: se o ambiente for `Ideali` e o usuário abrir `/auditoria` diretamente, redirecionar para `/carteira-ideali`.

Sem alterações de banco, RLS ou dados para Rotina/Alugar — apenas navegação, persistência e visibilidade de menu.

## Detalhes técnicos

- Arquivos novos: `src/contexts/EnvironmentContext.tsx`, `src/components/EnvironmentSelect.tsx`.
- Arquivos alterados: `src/App.tsx`, `src/pages/Dashboard.tsx`, `src/components/crud/CrudLayout.tsx`, `src/pages/carteira-ideali/CarteiraIdeali.tsx`, `src/pages/carteira-ideali/components/GarantiaChart.tsx`.
