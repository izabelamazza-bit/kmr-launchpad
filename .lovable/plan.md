## Objetivo
Inserir um novo card de "% de Inadimplência" na seção 2. Financeiro da página `/carteira-ideali`, ao lado do card "Contratos afetados", reaproveitando as mesmas variáveis já existentes.

## Estado atual confirmado
- `useCarteiraIdeali.ts` calcula `contratosAfetados` contando **qualquer** contrato com fatura `PE` (51 contratos).
- O gráfico "Inadimplência por tipo de garantia" (seção 5) usa `c.oldestOpen`, que também inclui faturas com `dado_incompleto = true` (mantém os 51).
- O banco de dados real possui: 181 contratos, 51 contratos com qualquer fatura `PE`, 26 contratos com fatura `PE` e `dado_incompleto = false`.
- O usuário decidiu que o card financeiro deve usar **apenas os 26** (dado completo), enquanto o gráfico da seção 5 mantém os 51.

## Passos

1. **Ajustar o cálculo de `contratosAfetados` em `src/pages/carteira-ideali/lib/useCarteiraIdeali.ts`**
   - Contar contratos distintos que possuem **pelo menos uma fatura `PE` com `dado_incompleto = false`**.
   - Manter o cálculo de `valorEmAtraso` inalterado (já usa apenas faturas `PE` com `dado_incompleto = false`).
   - **Não alterar** a lógica que alimenta o gráfico da seção 5 (`c.oldestOpen` continua considerando qualquer fatura `PE`).

2. **Adicionar o card "% de Inadimplência" em `src/pages/carteira-ideali/components/FinanceiroCards.tsx`**
   - Inserir o card imediatamente após o card "Contratos afetados".
   - Cálculo: `contratosAfetados / total * 100`.
   - Formato: 1 casa decimal + `%` (ex: `14,4%`).
   - Texto auxiliar: `"{contratosAfetados} de {total} contratos com fatura em aberto (dado completo)"`.
   - Proteger contra divisão por zero (`total === 0` → `0,0%`).

3. **Ajustar o grid da seção Financeiro**
   - Atualizar de `lg:grid-cols-4` para `lg:grid-cols-5` para acomodar o novo card sem quebra de layout.
   - Manter responsividade mobile-first (`grid-cols-1 sm:grid-cols-2`).

4. **Verificação**
   - Rodar o typecheck/build para garantir que não há erros de compilação.
   - Validar na preview que o card aparece com o valor esperado (26 ÷ 181 ≈ 14,4%).

## Escopo fora deste plano
- Nenhuma mudança na seção 5 (gráfico de inadimplência).
- Nenhuma alteração em outros cards, tabelas ou gráficos.
- Nenhuma mudança de banco de dados, RLS ou Edge Functions.