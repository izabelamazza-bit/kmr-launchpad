# Dashboard de Auditoria — status real por contrato

Hoje os cards ficam zerados porque o `audit_status` no banco só sai de "Nao iniciada" quando um item é marcado OK/NOK explicitamente, e o card "Com alerta" depende de um cálculo de risco que só existe dentro de um componente React (nunca é persistido nem consultado pela agregação). Vou uniformizar a definição e derivar tudo em tempo real a partir dos 20 itens do checklist.

## Novas regras (por contrato)

Sobre os 20 itens do `audit_checklist_items` (status ∈ `ok` / `nok` / `pending`):

- **Preenchidos** = itens com status `ok` ou `nok`.
- **Não iniciada**: 0 preenchidos.
- **Em andamento**: 1–19 preenchidos.
- **Completa**: 20 preenchidos (independente de OK/NOK).
- **Com pendências** (atributo, não status exclusivo): ≥1 item `nok`, estando o contrato em andamento ou completo.
- **Com alerta** (atributo): nível de risco = "Alto", calculado como hoje no `ResultadoAuditoria`:
  - qualquer item crítico (4, 5, 6, 7) com status `nok`, **ou**
  - garantidora do formulário divergente da garantidora extraída (exceto o par KMR↔Quintocred).

Os KPIs do topo passam a contar contratos em cada categoria; um mesmo contrato pode entrar em "Completa" e "Com pendências" ao mesmo tempo, e em "Com alerta" em paralelo — refletindo o que já é mostrado hoje na tela do contrato.

## Onde muda

### 1. Banco — `recalc_audit_status`

Ajustar a função trigger para a nova definição:

```text
preenchidos = ok + nok
- preenchidos = 0        -> 'Nao iniciada'
- preenchidos = total    -> 'Completa'
- caso contrário         -> 'Em andamento'
```

O status vira só progresso. "Com pendências" e "Com alerta" deixam de ser status e viram atributos derivados na leitura. Depois de aplicar a migração, disparar um recálculo único em todos os contratos existentes para que os 743 registros já reflitam o novo cálculo (um `UPDATE ... SET updated_at = now()` em `audit_checklist_items` cobre isso via trigger).

### 2. Frontend — `src/pages/auditoria/Auditoria.tsx`

- Ao carregar cada contrato, além de `total_items` e `ok_items`, calcular também `nok_items` e o flag `risco_alto` (mesma regra do `ResultadoAuditoria`, aplicada sobre os itens já buscados + `garantidora` do contrato × `garantidora_normalizada` do extracted data).
- Substituir `has_alert` (hoje amarrado a divergência de garantidora) pelo novo `risco_alto`. A `GarantidoraBadge` continua usando a lógica antiga de divergência para o rótulo da coluna — não misturar.
- Reescrever o bloco `totals`:
  - `completa`: `total_items === 20 && ok_items + nok_items === 20` (ou `audit_status === 'Completa'`).
  - `pendencia`: `nok_items > 0` (independente de estar em andamento ou completo).
  - `alerta`: `risco_alto === true`.
  - `total`, `loft`, `credaluga`, `kmr` continuam iguais.
- Ajustar o filtro `filtroProg`:
  - `completo` → `audit_status === 'Completa'`.
  - `incompleto` → `audit_status ∈ ('Em andamento','Nao iniciada')`.
  - `alerta` → `risco_alto === true` (não mais `has_alert || Com pendencia`).

### 3. Extrair a regra de risco para reuso

Criar `src/pages/auditoria/lib/risco.ts` com uma função pura `calcularRiscoAlto({ itens, garantidoraForm, garantidoraExtraida })` e usar tanto no `ResultadoAuditoria` (substituindo o cálculo inline) quanto no `Auditoria.tsx`. Garante que dashboard e tela do contrato nunca divirjam.

## Validação

- Abrir `/auditoria` com a base atual (743 contratos): os quatro cards do topo devem somar valores > 0 coerentes; "Total" continua 743.
- Marcar 1 item OK em um contrato "Nao iniciada" → contrato passa a contar em "Em andamento" (e cai de "Nao iniciada").
- Marcar item crítico (4/5/6/7) como NOK → contrato entra em "Com alerta" e "Com pendências".
- Completar os 20 itens sem NOK → entra em "Completa", sai de "Em andamento", não aparece em "Com pendências" nem "Com alerta".
