## Mudanças

### 1. `src/pages/auditoria/AuditoriaContrato.tsx` — barra fixa de rodapé

Adicionar uma `<div>` fixa (`fixed bottom-0 left-0 right-0`) com fundo `bg-card`, borda superior e sombra, contendo:

- **Esquerda:** botão `variant="outline"` "← Voltar para Auditoria"
  - Mantém um estado `isDirty` que vira `true` em qualquer edição de `form` / `ex` / checklist e volta a `false` após salvar/carregar.
  - Se `isDirty`, abre `AlertDialog` com a mensagem "Tem certeza? As alterações não salvas serão perdidas." antes de navegar para `/auditoria`.

- **Direita:** botão primário "Salvar e voltar"
  - Em modo `isNew`: roda a validação atual (`validateA`) e cria o contrato; se ok, navega direto para `/auditoria` (em vez de redirecionar para `/auditoria/:id`).
  - Em modo edição: salva Seção A (`update audit_contracts`) + faz flush imediato do debounce da Seção B (`update audit_contract_extracted_data` com o `ex` atual). Checklist já é auto-salvo a cada toggle, então nada extra.
  - Ao final: `toast({ title: "Contrato salvo com sucesso!" })` e `navigate("/auditoria")`.
  - Estado `savingAll` desabilita o botão durante a operação.

- Adicionar `pb-24` ao `<main>` para evitar que o conteúdo fique embaixo da barra.
- Loader de extração (`extracting`) continua acima da barra (z-index maior).

### 2. `src/pages/auditoria/Auditoria.tsx` — botão "+ Novo contrato"

O `CrudLayout` já recebe `onNewClick={() => navigate("/auditoria/novo")}` e `newLabel="Novo contrato"`, então o botão já existe no topo. Verificar visualmente; se estiver oculto por algum motivo, garantir que `CrudLayout` está exibindo o CTA no canto superior direito. Nenhuma mudança de dado/dashboard necessária — a tela já recarrega ao montar e o novo contrato aparecerá automaticamente após o redirect.

## Fora de escopo

- Sem mudanças no schema, edge function, RLS ou lógica de checklist.
- Sem mudanças no botão "Criar contrato" / "Salvar dados" da Seção A — eles continuam funcionando para quem prefere salvar sem sair.
