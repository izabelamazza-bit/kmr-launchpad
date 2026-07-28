## Objetivo

Adicionar, na mesma página `/carteira-ideali` (abaixo do botão de importação), um dashboard consolidado somente leitura, em 5 seções. Sem seletor de empresa e sem navegação para outras telas.

## Estado atual verificado

- `recharts` já está instalado (`^2.15.4`) e existe wrapper `src/components/ui/chart.tsx` — nada a instalar.
- Dados atuais: 181 contratos (Ativo 82, Pausado 80, Encerrado 13, Assinado 5, Aguardando Ativação 1) e 1.116 faturas (PE completas 80, PE com dado incompleto 76, PG 960).
- Garantidoras presentes: Sem seguro, CredPago, Pottencial, Porto Seguro, Outros, Eu Acerto, Tokio, Credaluga, Too.

## Arquivos

1. `src/pages/carteira-ideali/lib/useCarteiraIdeali.ts` — hook de carga e agregação
2. `src/pages/carteira-ideali/components/StatusCards.tsx` — Seção 1
3. `src/pages/carteira-ideali/components/FinanceiroCards.tsx` — Seção 2
4. `src/pages/carteira-ideali/components/PrazoSinistroTable.tsx` — Seção 3
5. `src/pages/carteira-ideali/components/GarantiaChart.tsx` — Seção 4
6. `src/pages/carteira-ideali/components/ContratosTable.tsx` — Seção 5
7. `src/pages/carteira-ideali/CarteiraIdeali.tsx` — monta as seções e mantém o estado de filtro por garantidora

## Carga de dados

Um único hook busca todos os contratos (`empresa = 'Ideali'`) e todas as faturas, paginando em blocos de 1000 para não esbarrar no limite padrão do PostgREST. A partir das faturas, monta-se por contrato: fatura PE mais antiga (menor `vencimento_fatura`, incluindo incompletas), soma de atraso e flag de dado incompleto. Recarrega automaticamente após uma importação bem-sucedida.

## Seção 1 — Status da carteira

Seis cards: Total, Ativo, Pausado, Encerrado, Assinado, Aguardando Ativação.

## Seção 2 — Financeiro

- **Valor em atraso**: soma de `valor_boleto - coalesce(valor_pago_fatura, 0)` apenas em faturas `PE` com `dado_incompleto = false`.
- **Contratos afetados**: contratos distintos com ao menos uma fatura `PE` completa, exibido como "X de 181".
- **Faturas com dado incompleto**: contagem, em card com cor de atenção (laranja/âmbar do design system) e texto "sem valor registrado — verificar manualmente". Nunca somado ao valor em atraso.
- **Carteira ativa/mês**: soma de `valor_aluguel` dos contratos com status `Ativo`.

## Seção 3 — Prazo de 60 dias

Só contratos com garantidora em CredPago, Credaluga, Eu Acerto e que tenham ao menos uma fatura PE. Para cada um, a partir da fatura PE mais antiga: dias em atraso, data limite (vencimento + 60 dias) e dias restantes. Tabela ordenada por dias restantes crescente, com colunas código, inquilino, garantidora, dias em atraso, dias restantes. Badge vermelho (≤15, inclui negativos), amarelo (16–30), verde (>30). Ícone de alerta com tooltip "valor não confirmado" quando a fatura mais antiga tiver `dado_incompleto = true`.

## Seção 4 — Gráfico por garantidora

Barras horizontais agrupadas (recharts, `layout="vertical"`), duas séries: Ativo e Encerrado. Clique em barra ou label define o filtro de garantidora da Seção 5; botão "Limpar filtro" aparece quando ativo.

## Seção 5 — Tabela de contratos

Colunas: código, inquilino, endereço concatenado (rua, número, bairro, cidade), status, tipo de garantia, garantidora, valor do aluguel, dias em atraso da fatura PE mais antiga ("Em dia" quando não houver) e indicador visual de dado incompleto. Filtros acima: select de status, select de garantidora (sincronizado com o clique no gráfico) e toggle "Somente contratos com atraso". Paginação client-side de 25 linhas.

## Detalhes técnicos

- Somente leitura: nenhum campo editável, nenhuma mutação.
- Cores via tokens do design system; layout mobile-first com cards empilhados e tabelas em scroll horizontal.
- Datas calculadas em UTC-neutro (comparação por data pura) para evitar erro de fuso.
