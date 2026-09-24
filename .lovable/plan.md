# Correções no histórico de importações Cobmais

## Contexto
O card "Histórico de importações" existe e renderiza na /cobmais, mas tem dois problemas práticos: fica escondido no fim da página (depois da tabela de até 300 linhas) e não filtra pela empresa ativa — misturaria Rotina e Alugar na lista.

## Mudanças (apenas src/pages/cobmais/Cobmais.tsx)

1. **Filtrar o histórico pela empresa ativa**
   - Passar a `empresa` (do `useEnvironment`) para `HistoricoImportacoes` e adicionar `.eq("empresa", empresa)` na consulta, recarregando quando a empresa mudar (incluir `empresa` nas dependências do `useEffect`).

2. **Mover o histórico para cima da tabela**
   - Renderizar `<HistoricoImportacoes />` logo após os cards de KPI (Registros/Loft/KMR/Credaluga) e antes do card da tabela, para que fique visível sem rolar 300 linhas.

3. **Mostrar o número de linhas na linha "Última importação"**
   - Incluir `currentImport.total_linhas` no texto (ex.: "03/09/2026, 19:08:25 · Rotina · 837 linhas · por usuário não identificado — arquivo.xlsx").

## Verificação
- Typecheck/build OK.
- Playwright em /cobmais: confirmar que o histórico aparece acima da tabela, mostra só importações da empresa ativa e exibe o número de linhas na "Última importação".

## Fora de escopo
- Nenhuma mudança em dados, importação ou na tela /portal-loft.
- O teste com arquivo real da Alugar continua pendente (aguardando o usuário).
