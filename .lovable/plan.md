# Dashboard por empresa

O Dashboard passa a ter duas estruturas distintas, escolhidas pela empresa ativa no dropdown do cabeçalho, sem recarregar a página.

## Rotina e Alugar

1. **Auditoria** — mantém os 4 cards atuais (Total, Auditoria completa, Com pendências, Com alerta), agora filtrados por `empresa = empresa ativa`.
2. **Quebra por garantidora** (nova fileira abaixo dos 4 cards) — 3 cards: Loft, Credaluga, KMR. Cada um mostra a quantidade de contratos e a soma do valor de aluguel, filtrados por empresa ativa + garantidora, usando exatamente o mesmo critério de garantidora já aplicado na tela de Auditoria.
3. **Sinistros** — mantém os 5 cards atuais; renderizado só em Rotina/Alugar.
4. **Portal Loft** — renderizado só em Rotina. Oculto em Alugar e Ideali.
5. O banner "Registrar novo sinistro" continua em Rotina/Alugar e fica oculto em Ideali.

Observação sobre os dados atuais: hoje todos os 743 contratos de auditoria têm `empresa = 'Rotina'` (Loft 457, Credaluga 258, KMR 28). Com "Alugar" selecionado, os cards de auditoria aparecerão zerados — isso é o dado real, não um erro da tela.

## Ideali

Substitui todas as seções acima por uma única seção "Ideali" com 4 cards, lidos das tabelas `ideali_*` preservadas:

- **Contratos ativos** — contratos com status Ativo (hoje: 82)
- **Valor da carteira** — soma do aluguel dos contratos ativos (hoje: R$ 135.449,50)
- **Documentação** — número único agregado de pendências de documentação: contratos cujo status no Drive não é "Contrato assinado encontrado" (hoje: 129). Sem quebra em subcategorias.
- **Valor de inadimplência** — soma das faturas em aberto com valor confirmado (hoje: R$ 230.769,80)

## Item 3 do pedido

Não existe hoje nenhum card "Valor da carteira sob auditoria" no Dashboard — nada a remover. A quebra por garantidora do item 1b cobre essa necessidade.

## Detalhes técnicos

- `useDashboardResumo` passa a receber a empresa ativa: filtra `audit_contracts` por `empresa`, e devolve também o agregado por garantidora (contagem + soma de `valor_aluguel`).
- Novo hook enxuto para os 4 números da Ideali (contratos ativos, valor da carteira, pendências de documentação, inadimplência), reaproveitando as mesmas regras já usadas em `useCarteiraIdeali` / `useDocumentosIdeali`.
- `Dashboard.tsx` lê `useEnvironment()` e renderiza condicionalmente; a troca é reativa por estado do contexto (sem reload).
- Cards de valor usam um card de KPI monetário (formatação `formatBRL`), mantendo o `KpiCard` atual para contagens.
- Como as rotas `/carteira-ideali` e `/documentacao-ideali` foram retiradas da navegação, os cards da seção Ideali são apenas informativos (sem link) — me avise se quiser reativar essas rotas.

## Verificação final

Ao terminar, capturo o Dashboard nas 3 empresas (Rotina, Alugar, Ideali) para você conferir a estrutura de cada uma.
