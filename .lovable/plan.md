## Ajustes em /carteira-ideali

**1. Cores do prazo de 60 dias** (`components/PrazoSinistroTable.tsx`)
Reescrever `badgeClass(dias)`:
- `dias < 0` → vermelho (destructive)
- `0 <= dias <= 14` → amarelo (#F2C94C / texto #0F2A44)
- `dias >= 15` → verde (#27AE60)

**2. Reordenar seções** (`CarteiraIdeali.tsx`)
Trocar a ordem de renderização: `GarantiaChart` passa a vir antes de `InadimplenciaChart`. Estados e handlers de filtro permanecem iguais.

**3. Gráfico de pizza** (`components/GarantiaChart.tsx`)
Substituir o `BarChart` por `PieChart` (recharts) em formato rosca:
- Mesma agregação atual (contagem por garantidora, todos os status).
- Paleta com tons da marca (#2F80ED, #0F2A44, #27AE60, #F2C94C, #F2994A, #56CCF2...) ciclando por fatia.
- Clique na fatia chama `onSelect(garantidora)`; botão "Limpar filtro" mantido.
- Legenda/labels com contagem absoluta e percentual (ex.: "CredPago — 128 (34%)"), com tooltip mostrando ambos.
- Layout responsivo (mobile-first): rosca centralizada com legenda abaixo.

Nenhuma outra seção da página é alterada.