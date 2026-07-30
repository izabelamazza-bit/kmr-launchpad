## Objetivo

Criar a tela "Portal Loft" (`/portal-loft`), independente da Auditoria, usando o importador CSV já implementado.

## Navegação

- Novo item no menu principal do Dashboard: **Portal Loft** (ícone `Building2`/`ShieldCheck`, descrição "Snapshots e movimentações do portal da garantidora Loft"), junto de Sinistros/Auditoria — visível nos ambientes Rotina/Alugar e oculto quando "Ideali" está selecionado (mesmo tratamento da Auditoria, via `RequireNotIdeali` na rota).
- Rota registrada em `App.tsx`.

## Estrutura da tela (de cima para baixo)

**1. Cabeçalho**
- Título + botão "Importar novo CSV" abrindo o `ImportLoftModal` já pronto.
- Ao lado: "Última importação: DD/MM/AAAA HH:mm por <nome>". O nome vem de `users_registry` (match por `user_id = importado_por`), com fallback para o e-mail ou "—" quando não houver registro.

**2. Cards de resumo** (baseados na importação mais recente)
- Total de contratos, Ativos, Cancelados, Exonerados (contagem por `status` dos snapshots do import atual).
- Casos novos: contratos do import atual ausentes no import anterior (comparação em memória dos dois conjuntos de `contrato`).
- Mudanças de status: linhas de `guarantor_portal_movements` do import atual onde `status_atual <> status_anterior`.

**3. Painel "Movimentações desta importação"**
- Tabela a partir de `guarantor_portal_movements` filtrada por `import_atual_id` = import mais recente, exibindo só linhas com alguma diferença (status, cancelamento de taxa ou pagamento suspenso).
- Colunas: contrato, inquilino, "status anterior → status atual" (com `ArrowRight`), badge de cancelamento de taxa quando mudou, badge de pagamento suspenso quando mudou.
- Estado vazio: "Nenhuma movimentação em relação à importação anterior."

**4. Tabela principal**
- Todos os contratos do import mais recente.
- Colunas: contrato, inquilino, CPF, plano, status (badge: verde Ativo / cinza Cancelado / vermelho Exonerado / neutro para outros), valor do aluguel (BRL), corretor, data de ativação, data de exoneração.
- Filtros (selects) por status, plano e corretor, populados dos valores presentes nos dados; busca por contrato, inquilino ou CPF (ignorando pontuação do CPF).
- Linha clicável.

**5. Drawer de histórico do contrato**
- `Sheet` lateral com todas as snapshots daquele `contrato` (todos os imports), ordenadas por `data_importacao` crescente/decrescente.
- Formato linha do tempo: cada ponto mostra data da importação, status e os campos que mudaram em relação à snapshot anterior, destacados como "campo: antes → depois". Snapshot sem mudanças aparece como "Sem alterações".
- Campos comparados: status, plano, valores (locatício, aluguel, condomínio, outras taxas, setup), cancelamento de taxa e previsão, pagamento suspenso, datas (ativação, exoneração, última renovação), corretor, inquilino, fiança, garantia, multiplicador, custo de saída, motivo de exoneração.

## Arquivos

- `src/pages/portal-loft/PortalLoft.tsx` — página e composição.
- `src/pages/portal-loft/lib/usePortalLoft.ts` — carrega último e penúltimo import, snapshots (paginação em blocos de 1000 para passar do limite do PostgREST), movimentações e KPIs.
- `src/pages/portal-loft/components/` — `ResumoCards.tsx`, `MovimentacoesPanel.tsx`, `ContratosTable.tsx`, `HistoricoDrawer.tsx`.
- Edições: `src/App.tsx` (rota) e `src/pages/Dashboard.tsx` (item de menu).

## Notas técnicas

- Componentes exclusivamente do design system em `/componentes` (Card, Table, Badge, Select, Input, Sheet, Button), paleta KMR e layout mobile-first.
- Nenhum vínculo com `audit_contracts`; nenhuma alteração de schema — as tabelas e a view já existem.
