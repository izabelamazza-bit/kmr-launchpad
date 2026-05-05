# Redesign Visual da Landing Page KMR

Mantém todo o conteúdo textual atual (B2C, foco no inquilino) e a estrutura de seções, alterando apenas o tratamento visual e adicionando 2 blocos novos (estatísticas no Hero, seção Comparativo). A fonte global passa para **Poppins** em corpo e títulos.

## Ordem final das seções
```
Header → Hero (escuro) → Benefícios (claro) → Como Funciona (escuro)
→ Comparativo (escuro) → FAQ (claro) → CTA Final verde → ContactForm (claro)
→ Footer (escuro)
```
Para evitar duas seções escuras adjacentes, **Como Funciona** continua claro (já é) e o **Comparativo** vira a primeira seção escura logo após. Ajuste fino: HowItWorks fica em `#F5F7FA` (claro) e Benefícios também claro — então Benefícios vai para fundo branco puro e HowItWorks para `#F5F7FA`, alternando sutilmente; Hero (escuro) → Benefícios (branco) → HowItWorks (cinza claro) → Comparativo (escuro) → FAQ (branco) → CTA verde → ContactForm (cinza claro) → Footer (escuro).

## 1. Tokens globais (`src/index.css` + `tailwind.config.ts`)
- Fonte global passa a ser **Poppins** (já carregada). Atualizar `font-sans` e `font-display` ambos para Poppins.
- Atualizar variáveis HSL no `:root` para refletir a paleta oficial:
  - `--primary` → `#0F2A44`
  - `--secondary` → `#2F80ED`
  - `--accent` → `#27AE60`
  - `--muted` → `#F5F7FA`
  - `--muted-foreground` / texto → `#4F4F4F`
  - `--border` → `#E8EDF2`
- Botões com `border-radius: 9px`; cards com `14px` (via classes utilitárias `rounded-[9px]` / `rounded-[14px]` no JSX).

## 2. Hero (`Hero.tsx`)
- Remover `<img heroBg>` e o overlay degradê. Fundo sólido `bg-[#0F2A44]`.
- Badge: `bg-[rgba(47,128,237,0.15)] border border-[rgba(47,128,237,0.30)] text-[#7EB8F7]` — texto: `✦ Aluguel sem fiador`.
- H1: branco, com a palavra **"burocracia."** em `text-[#2F80ED]`. Texto: *"Alugue sem fiador, sem caução e sem burocracia."*
- Subtítulo: `text-[#A8C0D6]` — *"Aprovação rápida e 100% digital. Sua garantia de aluguel aprovada em poucas horas, sem dor de cabeça."*
- Botão primário branco (`bg-white text-[#0F2A44] font-bold rounded-[9px] px-[22px] py-3`): "Quero alugar sem fiador".
- Botão secundário transparente com borda branca 50%: "Falar no WhatsApp".
- Bloco de estatísticas abaixo, separado por `border-t border-white/10 pt-8 mt-10`, grid 3 colunas:
  - **+12.000** — Inquilinos aprovados
  - **98%** — Taxa de aprovação
  - **< 2h** — Tempo médio de análise
  - Números em branco/bold grande, labels em `text-[#A8C0D6] text-sm`.

## 3. Benefícios (`Benefits.tsx`)
- Fundo branco (`bg-white`).
- Cards: `bg-white border border-[#E8EDF2] rounded-[14px] shadow-sm`.
- Ícone em quadrado `bg-[#EBF3FF] rounded-xl text-[#2F80ED]`.
- Mantém os 6 cards e textos atuais. Título e subtítulo permanecem.

## 4. Como Funciona (`HowItWorks.tsx`)
- Fundo `bg-[#F5F7FA]`. Mantém conteúdo. Ajustar cor dos ícones para `#2F80ED` e linha conectora `bg-[#E8EDF2]`.

## 5. NOVA Seção — Comparativo (`Comparativo.tsx`)
Criar componente novo e inserir em `Index.tsx` após `HowItWorks`.
- Fundo `bg-[#0F2A44]`.
- Eyebrow: `COMPARATIVO` (caps, `text-[#7EB8F7] tracking-widest text-xs`).
- Título: *"A diferença que a KMR faz"* (branco).
- Grid 2 colunas (stack no mobile):
  - **Card esquerdo "Sem a KMR"**: `bg-white/5 border border-white/10 rounded-[14px] p-8`. Título com "Sem" em `text-[#FF7A7A]`. Lista com ícone `✗` em `#FF7A7A`:
    1. Precisa apresentar fiador ou pagar caução adiantado
    2. Burocracia e demora para aprovação da locação
    3. Perda de tempo com idas ao cartório e papelada
  - **Card direito "Com a KMR"**: `bg-[#2F80ED] rounded-[14px] p-8 shadow-xl`. Título com "Com" em branco bold. Lista com ícone `✓` branco:
    1. Aluguel sem fiador, sem burocracia ou caução
    2. Análise de crédito em até 2 horas, 100% online
    3. Documentos assinados digitalmente na plataforma

## 6. FAQ (`FAQ.tsx`)
- Fundo branco. Mantém conteúdo. Ajustar acentos para `#2F80ED`.

## 7. NOVO CTA Final verde (`CTAFinal.tsx`)
Criar e inserir em `Index.tsx` antes do `ContactForm`.
- Container full-width section `bg-[#27AE60]` com card centralizado.
- Título branco: *"Pronto para alugar sem complicação?"*
- Subtítulo `text-white/90`: *"Simule agora e descubra quanto você economiza sem precisar de fiador."*
- Botão: `bg-white text-[#27AE60] font-bold rounded-[9px] px-[22px] py-3` — *"Simular minha garantia"*, link `#contato`.
- Substitui visualmente o `CTASection.tsx` antigo (azul) na ordem; pode-se remover/comentar o antigo para evitar redundância. Plano: **remover `CTASection` do `Index.tsx`** e usar o novo verde no lugar.

## 8. ContactForm (`ContactForm.tsx`)
- Fundo da seção `bg-[#F5F7FA]`. Card branco `rounded-[14px] border-[#E8EDF2]`.
- Botão submit: `bg-[#2F80ED] hover:bg-[#2F80ED]/90 text-white rounded-[9px] font-semibold`.

## 9. Header (`Header.tsx`)
- Fundo branco sólido (já é card/blur). Botão "Simular agora": `bg-[#2F80ED] text-white rounded-[9px]`. Botão Login: `outline` com borda `#E8EDF2`.

## 10. Footer
- Mantém `bg-primary` (agora `#0F2A44`).

## Detalhes técnicos
- Não criar novos componentes UI fora dos existentes em `src/components/ui/*`. As novas seções (`Comparativo`, `CTAFinal`) são compostos com `Button` e elementos nativos.
- Atualizar `src/pages/Index.tsx` para incluir `<Comparativo />` após `<HowItWorks />` e `<CTAFinal />` antes do `<ContactForm />`, removendo `<CTASection />`.
- Sem alterações em backend, rotas, schema ou área logada.
- Mobile-first: grids colapsam para 1 coluna; estatísticas do hero viram 3 colunas em `sm:` e empilhadas em mobile com separadores discretos.

## Arquivos
- Editar: `src/index.css`, `tailwind.config.ts`, `src/components/landing/Hero.tsx`, `Benefits.tsx`, `HowItWorks.tsx`, `FAQ.tsx`, `ContactForm.tsx`, `Header.tsx`, `src/pages/Index.tsx`
- Criar: `src/components/landing/Comparativo.tsx`, `src/components/landing/CTAFinal.tsx`
- Remover do uso: `CTASection.tsx` (arquivo permanece, mas sai do `Index.tsx`)
