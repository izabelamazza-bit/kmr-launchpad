## Objetivo

Reestruturar completamente a Seção C do checklist de auditoria (`/auditoria/:id`): novos blocos e itens, novo item automático (CPF locatário), contadores por bloco, Seção D colapsável e novo painel de "Resultado da auditoria" com risco calculado.

## Novo mapa de itens

| # | Bloco | Item | Automação |
|---|---|---|---|
| 1 | Status do imóvel e contrato | Imóvel ocupado ou desocupado | IA (Imoview) |
| 2 | Status do imóvel e contrato | Contrato saudável ou inadimplente | IA (Imoview) |
| 3 | Status do imóvel e contrato | Prazo do contrato — vigência e data de vencimento | IA (Imoview) |
| 4 | Dados das partes: contrato × Imoview | Nome do locatário — contrato × Imoview | IA (PDF) |
| 5 | Dados das partes: contrato × Imoview | Nome do locador — contrato × Imoview | IA (PDF) |
| 6 | Dados das partes: contrato × Imoview | Endereço do imóvel — contrato × Imoview | IA (PDF) |
| 7 | Dados das partes: contrato × Imoview | CPF do locatário — contrato × Imoview | **IA (PDF) — NOVO** |
| 9 | Documentação | Documentos pessoais do locatário (RG/CPF ou CNH) | Manual |
| 10 | Documentação | Documentos pessoais do locador | Manual |
| 11 | Documentação | Contrato de locação assinado pelo locatário | Manual |
| 13 | Documentação | Laudo de vistoria de entrada assinado | Manual |
| 14 | Cobertura e contrato da garantidora | Contrato com a garantidora está ativo e vigente | Manual |
| 15 | Cobertura e contrato da garantidora | Valor do aluguel no Imoview bate com o cadastrado no portal da garantidora | Manual |
| 16 | Cobertura e contrato da garantidora | Condomínio e taxas contratados? | Manual |
| 17 | Cobertura e contrato da garantidora | Prazo de cobertura alinhado com vigência do contrato de locação | Manual |
| 18 | Cobertura e contrato da garantidora | Forma de pagamento da taxa da garantidora (carta de crédito recorrente ou PVI) | Manual |
| 23 | Cobertura e contrato da garantidora | Locatário cadastrado na garantidora com os mesmos dados do contrato (nome e CPF) | Manual — NOVO |
| 19 | Cobertura e contrato da garantidora | Contrato da garantidora assinado por todas as partes | Manual |
| 27 | Específico garantidora | Verificar forma de pagamento da taxa (boleto / cartão / PVI) | Manual |
| 28 | Específico garantidora | Verificar data de renovação da garantidora | Manual |

**Removidos:** item 8 (dados bancários locador), 12 (contrato de prestação de serviço locador), 20/21/22 (Consistência Imoview), 25 (Índice), 26 (Garantidora). O Bloco 5 passa a ser genérico — os itens 27/28 aparecem para todos os contratos, independente da garantidora.

A ordem de exibição segue a tabela acima (agrupada por bloco). Os `item_number`s existentes são preservados quando possível para não corromper histórico; a ordenação visual será por bloco+número.

## Migration SQL

Uma única migration:

1. `UPDATE public.audit_checklist_items` — renomear labels dos itens 4, 5, 6, 7 e reatribuir `section = 'Dados das partes: contrato × Imoview'`.
2. `UPDATE` — mudar `section` dos itens 9, 10, 11, 13 para `'Documentação'`; dos 14–19 para `'Cobertura e contrato da garantidora'`; adicionar label novo do item 15 ("Valor do aluguel no Imoview bate com o cadastrado no portal da garantidora") e do item 16 ("Condomínio e taxas contratados?").
3. `DELETE FROM public.audit_checklist_items WHERE item_number IN (8, 12, 20, 21, 22, 25, 26)`.
4. `INSERT` do item 23 (Locatário cadastrado na garantidora…) em todos os contratos que ainda não têm, com `status='pending'`.
5. `INSERT` dos itens 27 e 28 (Bloco 5) em todos os contratos que ainda não têm (`ON CONFLICT DO NOTHING`), com nova label genérica e `section = 'Específico garantidora'`. Também `UPDATE` das linhas 27/28 já existentes para nova label/section (remover "— Loft").
6. Reescrever `public.seed_audit_checklist()` com o novo array de itens (24 itens totais: 1–7, 9–11, 13–19, 23, 27, 28) e sem lógica condicional Loft.
7. `DROP TRIGGER IF EXISTS ... ON public.audit_contracts` que chama `sync_loft_checklist_items` e `DROP FUNCTION public.sync_loft_checklist_items()`.

## Comparação automática — item 7 (CPF locatário)

Em `src/pages/auditoria/lib/autoCompare.ts`:

- Novo helper `normCpf(s)` → mantém apenas dígitos (`s.replace(/\D+/g, "")`).
- Novo `cmpCpf(a, b)`: retorna `null` se qualquer lado vazio; `true` se `normCpf(a) === normCpf(b)`.
- Em `buildAutoPatches`, adicionar `push(7, cmpCpf(contract.locatario_cpf, extracted.cpf_locatarios), "CPF locatário", contract.locatario_cpf, extracted.cpf_locatarios)`.
- Remover pushes dos itens 25 e 26 (não existem mais).
- Estender `ContractSectionA` com `locatario_cpf: string | null` e `ExtractedSectionB` com `cpf_locatarios: string | null`.

Em `AuditoriaContrato.tsx > runExtraction`, passar `locatario_cpf: form.locatario_cpf` no primeiro objeto e `cpf_locatarios: newExtracted.cpf_locatarios` no segundo. Rodar `applyAutoComparison` também dentro do `load()` (ou num `useEffect` que dispare quando `extracted` estiver presente), para preencher automaticamente o item 7 ao abrir contratos que já têm extração — mesma estratégia idempotente já usada por `applyImoviewChecklist`.

Remover bloco `isTombadoQuintocred` da lógica de item 26 e do próprio `autoCompare` (a badge Quintocred no header da Seção A permanece).

## UI da Seção C — contadores por bloco

Em `AuditoriaContrato.tsx`, o `checklistGrouped` já agrupa por `section`. Para cada bloco, calcular:

```ts
const ok = items.filter(i => i.status === 'ok').length;
const total = items.length;
const pct = ok / total;
const color = pct === 1 ? 'green' : pct > 0 ? 'yellow' : 'red';
```

Renderizar `"X/Y corretos"` como Badge no cabeçalho do bloco (verde `#27AE60`, amarelo `#F2C94C` fg `#8A6D00`, vermelho `#EB5757`). Atualiza reativamente porque `checklist` está no state.

Ordenar `checklistGrouped` pela nova ordem fixa de blocos (Status → Dados → Documentação → Cobertura → Específico garantidora) via array de referência, não pela ordem de inserção.

## Seção D colapsável

Trocar o `Card` da Seção D por `Collapsible` (já disponível em `@/components/ui/collapsible`) com estado `metadataOpen` inicial `false`. Trigger renderiza `ChevronDown` rotacionado + título "Metadados"; `CollapsibleContent` envolve o grid atual. Mantém o mesmo visual de card.

## Novo card "Resultado da auditoria"

Componente inline em `AuditoriaContrato.tsx` (ou novo arquivo `src/pages/auditoria/components/ResultadoAuditoria.tsx`) que recebe `checklist: ChecklistRow[]` e o `garantidora` do form.

Cálculos:

- `aprovados = items.filter(i => i.status === 'ok').length`
- `reprovados = items.filter(i => i.status === 'nok').length`
- `pendentes = items.filter(i => i.status === 'pending').length`
- `verificaveis = aprovados + reprovados` (pendentes não contam no denominador)
- `progressPct = verificaveis ? Math.round(aprovados / verificaveis * 100) : 0`
- **Itens críticos:** `CRITICAL = [4, 5, 6, 7]` (nome locatário, nome locador, endereço, CPF). Nota: o requisito menciona "garantidora" como crítico; como não há mais item de checklist para garantidora, também consideramos crítico o caso em que `form.garantidora` está presente, `extracted.garantidora_normalizada` está presente e são diferentes, **exceto** exceção Quintocred (usando `isTombadoQuintocred` do `autoCompare`).
- `criticalNok = items.some(i => CRITICAL.includes(i.item_number) && i.status === 'nok') || garantidoraDivergenteNaoTombada`
- `pctPendentes = totalItens ? pendentes / totalItens : 0`

Regras de risco:
- 🔴 **Alto** se `criticalNok`
- 🟡 **Médio** se `reprovados > 0 && !criticalNok` **ou** `pctPendentes > 0.3`
- 🟢 **Baixo** caso contrário

Layout do card (sempre visível abaixo da Seção D):
- Título "Resultado da auditoria".
- `<Progress value={progressPct} />` com label "X% aprovados (Y de Z itens verificáveis)".
- Grid 3 colunas: `✅ Aprovados (n)`, `❌ Reprovados (n)`, `⬜ Pendentes (n)` — grandes.
- Badge de risco: cor conforme regra + rótulo "Baixo/Médio/Alto".
- Texto síntese dinâmico. Template:
  - Se `pendentes === total`: "Auditoria não iniciada — X itens pendentes de verificação."
  - Se `pendentes > 0`: "Auditoria em andamento — {A} aprovados, {R} {reprovado(s)}{lista opcional dos labels reprovados críticos, ex.: ' (endereço divergente)'}, {P} pendentes de verificação manual. Risco {nível}{ — revisar item crítico antes de prosseguir se alto}."
  - Se `pendentes === 0`: "Auditoria concluída — {A} aprovados, {R} reprovados. Risco {nível}."

## Arquivos tocados

- `supabase/migrations/<timestamp>_reestruturar_checklist.sql` — nova migration (descrita acima).
- `src/pages/auditoria/lib/autoCompare.ts` — adicionar comparação de CPF (item 7), remover itens 25/26.
- `src/pages/auditoria/AuditoriaContrato.tsx` — passar CPF em `runExtraction`, aplicar `applyAutoComparison` também dentro do `load()`, ordenar blocos, exibir contador por bloco, colapsar Seção D, renderizar `ResultadoAuditoria`.
- `src/pages/auditoria/components/ResultadoAuditoria.tsx` — novo componente.

Sem alteração em `ChecklistItem.tsx`, `imoviewChecklist.ts`, na Edge Function `extract-contract` (o campo `cpf_locatarios` já é extraído e persistido) nem na Seção A.

## Verificação

- Abrir um contrato existente: itens 8 e 12 desaparecem, blocos são renomeados, item 7 recebe automaticamente OK/NOK conforme CPF do PDF × Imoview, badges de contador aparecem no topo de cada bloco.
- Seção D inicia fechada; expande ao clicar na seta.
- Card "Resultado da auditoria" renderiza com números coerentes; ao marcar/desmarcar itens, progresso, contagens, badge de risco e texto síntese atualizam em tempo real.
- Contrato com garantidora Loft: itens 27/28 continuam presentes mas com labels genéricas, sem sufixo "— Loft". Contratos de outras garantidoras também têm itens 27/28.
