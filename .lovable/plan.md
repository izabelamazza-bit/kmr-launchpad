# Correção: "Encontrado no Portal Loft" voltou a mostrar "Não" para tudo

## Causa raiz (confirmada)

O cruzamento por CPF não mudou — a normalização de CPF (só dígitos) continua igual e não foi contaminada pela nova normalização de contrato.

O que quebrou foi a escolha de qual importação do Portal Loft é lida. A tela busca "a importação mais recente da Loft" e, desde a criação do tipo de importação, a mais recente passou a ser a de inadimplência:

```text
03/08 18:56  inadimplencia.csv    tipo = inadimplencia  (2536 pendências, 0 contratos)
03/08 17:25  relatorio_imoveis…   tipo = contrato       (2246 contratos)
30/07 relatorio_geral_base.csv    tipo = contrato       (2244 contratos)
```

Como a importação de inadimplência não tem contratos/CPFs, o índice de CPFs fica vazio e todas as linhas mostram "Não".

## Correção

Na busca da última importação do Portal Loft usada pelo cruzamento por CPF, considerar apenas importações de contratos (`tipo = 'contrato'`), como era antes de existirem outros tipos. Nada mais muda: mesma normalização de CPF, mesmo desempate de status, e a lógica de pendências ("Status de sinistro na Loft" e "Valor já programado") fica intocada.

Detalhe técnico: em `src/pages/portal-loft/lib/useCobmaisLoft.ts`, a consulta em `guarantor_portal_imports` ganha o filtro por `tipo = 'contrato'` (a data exibida no cabeçalho como última importação do Portal Loft passa a refletir a última importação de contratos, coerente com o dado cruzado).

## Auditoria dos outros pontos (nenhum precisou de correção)

1. **Cabeçalho do Portal Loft / importação atual e anterior** (`usePortalLoft.ts`): já filtra `tipo = 'contrato'` na busca das duas últimas importações, e as datas do cabeçalho são resolvidas por tipo separadamente (contrato, movimentação, inadimplência). Correto.
2. **Painel "Movimentações desta importação"**: usa a view `guarantor_portal_movements` filtrada pelo `id` da importação de contrato atual. A view compara snapshots entre si (`guarantor_portal_snapshots` join `imports`), e só importações de contrato geram snapshots — logo a comparação é sempre contrato × contrato. Correto.
3. **Drawer de histórico (aba "Histórico")**: lê `guarantor_portal_snapshots` por contrato com join na importação, sem depender de "a mais recente" — pela mesma razão acima, só entram importações de contrato. Correto.
4. **Pendências ("Status de sinistro na Loft" / "Valor já programado")**: consultam `guarantor_portal_inadimplencia` direto por contrato, sem passar por `guarantor_portal_imports`. Correto e intocado.

Conclusão: o único ponto com o padrão problemático é o já identificado em `useCobmaisLoft.ts`.

## Verificação

Abrir `/portal-loft` > aba "Cobmais × Loft" e confirmar que os mesmos CPFs da captura anterior voltam a mostrar "Sim" com o status do contrato (Ativo/Cancelado/Exonerado), incluindo o caso "Clara Cristina Freitas Bar…".