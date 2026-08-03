# Cobmais × Loft (sub-tela do Portal Loft)

Nova visão de cruzamento entre a inadimplência do Cobmais e os contratos do Portal Loft, dentro da tela Portal Loft (empresa Rotina). Nada existente é removido.

## Estrutura da tela

`/portal-loft` passa a ter duas abas no topo:
- **Portal Loft** — exatamente o conteúdo atual (resumo, movimentações, contratos).
- **Cobmais × Loft** — a nova visão.

Cabeçalho da nova aba: botão "Importar novo Cobmais" (reaproveita o modal de importação já implementado) e, lado a lado, as datas da última importação Cobmais e da última importação do Portal Loft.

## Cards de resumo

Base: snapshots da importação Cobmais mais recente com `garantidora_normalizada = 'Loft'`.

1. **Casos Loft em atraso** — registros com atraso > 0.
2. **Valor total em risco** — soma do campo risco desses casos.
3. **CPF encontrado no Portal Loft** — casos cujo CPF existe no snapshot mais recente do Portal Loft.
4. **Sem registro no Portal Loft** — potencial sinistro não aberto (destaque em alerta).

## Filtro e tabela

- Filtro de faixa de atraso: Todos (> 0, padrão), > 30, > 60, > 90 dias.
- Busca por CPF, cliente ou contrato.
- Ordenação por valor em risco, decrescente por padrão (colunas de atraso e valor clicáveis para inverter).
- Uma linha por CPF, colunas: CPF, cliente, contrato, dias de atraso, valor em risco (destacado), status no Cobmais, "Encontrado no Portal Loft", "Status de sinistro na Loft", "Valor já programado".

Regras de coluna:
- **Status no Cobmais**: derivado do texto de OBSERVAÇÃO (campo `status_cobranca`) — "Rescindido" quando o texto indicar rescisão, senão "Ativo"; texto original no tooltip.
- **Encontrado no Portal Loft**: badge Sim/Não pelo cruzamento de CPF; quando Sim, mostra o status do contrato lá (Ativo / Cancelado / Exonerado).
- **Status de sinistro na Loft**: badge cinza "Aguardando integração", tooltip "Ainda não há RPA de sinistros da Loft — este dado será preenchido quando disponível".
- **Valor já programado**: "—" com tooltip "Não disponível neste relatório".

## Detalhes técnicos

- Novo hook `src/pages/portal-loft/lib/useCobmaisLoft.ts`: lê `cobmais_latest_loft` (paginado em 1000) e os snapshots da importação mais recente do Portal Loft (`garantidora = 'Loft'`), monta um índice por CPF e devolve as linhas cruzadas + agregados.
- Os CPFs do Portal Loft estão mascarados (`000.383.301-13`) e o formato do Cobmais não é garantido — o cruzamento normaliza para apenas dígitos nos dois lados antes de comparar.
- Novos componentes em `src/pages/portal-loft/components/`: `CobmaisLoftPanel.tsx` (cabeçalho, filtros, cards), `CobmaisLoftTable.tsx` (tabela) e `SinistroLoftBadge.tsx` + `ValorProgramadoCell.tsx` — os dois últimos isolados justamente para que o RPA de sinistros futuro substitua só esses arquivos, sem redesenhar a tabela.
- `PortalLoft.tsx` ganha o `Tabs` do shadcn e passa a montar também o `ImportCobmaisModal` (já existente em `src/pages/cobmais/components/`), além do `ImportLoftModal`.
- Sem mudanças de banco: as tabelas, a view `cobmais_latest_loft` e o campo `inquilino_cpf` já atendem ao cruzamento.
- Ainda não há nenhuma importação Cobmais no banco, então a aba abre em estado vazio orientando a importar o relatório.