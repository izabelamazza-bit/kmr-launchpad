# Sinistros por empresa + acesso Ideali (Carteira e Documentação)

## 1. Sinistros por empresa

- Migração: adicionar `empresa text` em `sinistros` (mesmo padrão de `audit_contracts.empresa`), sem FK — a tabela `companies` está vazia hoje.
- Popular o único sinistro existente com `empresa = 'Rotina'`.
- Dashboard: os 5 cards de Sinistros (Total, Em análise, Em pagamento, Pago, Cancelado) passam a filtrar por `empresa = empresa ativa`. Com "Alugar" todos mostram 0; com "Ideali" a seção continua oculta.
- Formulário "Registrar novo sinistro": novo campo obrigatório "Empresa" (Rotina ou Alugar), pré-selecionado com a empresa ativa quando aplicável, salvo em `empresa`.

## 2. Restaurar acesso a Carteira e Documentação da Ideali

- Rotas reativadas apontando para os componentes já existentes (`CarteiraIdeali.tsx`, `DocumentacaoIdeali.tsx`), dentro do `AppLayout` — nada é recriado nem apagado.
  - `/carteira-ideali` e `/documentacao-ideali`
- Menu lateral: no grupo "Operação", os itens "Carteira" e "Documentação" aparecem somente quando a empresa ativa é "Ideali".
- Dashboard (Ideali): cards "Contratos ativos" e "Valor da carteira" clicáveis → Carteira; card "Documentação (pendências)" clicável → Documentação.
- Padronização de layout: as duas telas hoje têm cabeçalho próprio com botão de voltar (layout antigo). Remover esse cabeçalho isolado para que usem a sidebar fixa e o cabeçalho global com o seletor de empresa, como o resto do sistema. Conteúdo e lógica de dados intactos.

## Detalhes técnicos

- Migração: `ALTER TABLE public.sinistros ADD COLUMN empresa text;` + update do registro existente (via tool de dados).
- `useDashboardResumo.ts`: aplicar `.eq("empresa", empresa)` também na query de `sinistros`.
- `NovoSinistro.tsx`: adicionar Select de empresa ao passo inicial, validação obrigatória, incluir no insert.
- `AppSidebar.tsx`: usar `useEnvironment()` apenas para condicionar os 2 itens Ideali; o resto do menu segue igual para todas as empresas.
- `App.tsx`: registrar as 2 rotas dentro do `<Route element={<AppLayout />}>`.

## Verificação final

Screenshots de: Dashboard com Alugar (Sinistros zerado), menu lateral com Ideali (Carteira e Documentação visíveis) e navegação por clique de um card Ideali para a tela correspondente.
