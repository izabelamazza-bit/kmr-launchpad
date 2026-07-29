## Objetivo

Separar a Documentação Ideali em página própria e limitar o ambiente Ideali a apenas dois destinos: Carteira e Documentação.

## 1. Nova página `/documentacao-ideali`

- Criar `src/pages/carteira-ideali/DocumentacaoIdeali.tsx`: página independente com cabeçalho próprio (voltar para `/dashboard`, título "Documentação Ideali"), guarda de sessão igual à da Carteira, botão "Importar auditoria de documentos" (`ImportDocumentosModal`) e o conteúdo completo da Seção 7 via `DocumentacaoSection` (4 cards + tabela "Situação dos documentos no Drive" + Fila do Analista).
- Reaproveitar o hook `useDocumentosIdeali` sem alterações (dados e tabelas permanecem exatamente como estão).
- Registrar a rota em `src/App.tsx`.

## 2. Limpar `/carteira-ideali`

- Remover de `CarteiraIdeali.tsx`: `DocumentacaoSection`, `ImportDocumentosModal`, o hook `useDocumentosIdeali` e o botão de importação de documentos (que passa para a nova página).
- O restante das seções 1–6 fica intacto.

## 3. Dashboard restrito no ambiente Ideali

Em `src/pages/Dashboard.tsx`, quando `environment === "Ideali"`:
- Exibir somente dois cards de navegação: **Carteira** (`/carteira-ideali`) e **Documentação** (`/documentacao-ideali`).
- Ocultar o bloco "Registrar novo sinistro" e todo o grupo "Cadastros" (Usuários, Leads, Agente de IA, Atendimento, Sinistros, Auditoria, Configurações).
- Ajustar o título da seção para "Ideali" em vez de "Cadastros" nesse contexto.

Em `Rotina` / `Alugar`, nada muda: o dashboard genérico completo continua aparecendo.

## 4. Seletor de ambiente

Em `src/components/EnvironmentSelect.tsx`, ao escolher "Ideali", navegar para `/dashboard` (menu com as duas opções) em vez de redirecionar direto para `/carteira-ideali`. Ao sair de Ideali, continua indo para `/dashboard`.

## Notas técnicas

- Nenhuma migração de banco; `ideali_documentos`, `ideali_fila_analista` e `useDocumentosIdeali` permanecem inalterados.
- `RequireNotIdeali` continua protegendo Auditoria; as rotas Ideali seguem acessíveis por URL direta.
- Verificação final: build/typecheck e navegação Ideali → Carteira / Documentação e volta para Rotina.
