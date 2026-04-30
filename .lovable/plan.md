## Plano: Reescrita B2C da Landing Page (foco no inquilino)

### Escopo

Reescrever **apenas textos** da LP pública. Sem mudanças de layout, componentes, cores, imagens ou rotas. Sem alterações na área logada.

### Arquivos a editar (somente strings)

```text
src/components/landing/Hero.tsx
src/components/landing/Benefits.tsx
src/components/landing/HowItWorks.tsx
src/components/landing/FAQ.tsx
src/components/landing/CTASection.tsx
src/components/landing/ContactForm.tsx
src/components/landing/Header.tsx       (apenas se houver CTA "Agendar demonstração")
src/components/landing/Footer.tsx       (apenas microcopy se necessário)
index.html                              (title + meta description SEO B2C)
```

### Conteúdo proposto

**Hero**
- Badge: "Aluguel sem fiador"
- H1: "Alugue sem fiador, sem caução alta e sem burocracia."
- Subtítulo: "Aprovação rápida e 100% digital. Mostramos para o proprietário que você é um bom inquilino — e você fecha o aluguel sem dor de cabeça."
- CTA principal: "Quero alugar sem fiador" (rola para #contato)
- CTA secundário: "Falar no WhatsApp"

**Benefits** — título "Por que escolher a KMR para alugar"
1. Sem fiador — "Não precisa pedir favor para ninguém."
2. Sem caução alta — "Esqueça depósito de 3 aluguéis presos numa conta."
3. Aprovação rápida — "Análise em poucas horas, tudo online."
4. Mais chance de aprovar — "Seu perfil é avaliado de forma justa e transparente."
5. 100% digital — "Faça tudo pelo celular, sem ir em cartório."
6. Segurança para todos — "Você aluga tranquilo e o proprietário fica protegido."

**HowItWorks** — título "Como funciona para você" (2ª pessoa)
1. Você se cadastra — "Em poucos minutos, pelo celular."
2. Analisamos seu perfil — "Rápido, justo e sem burocracia."
3. Sua garantia é aprovada — "Você recebe a confirmação e pode seguir."
4. Você fecha o aluguel — "Mude para o seu novo lar sem fiador."

**FAQ** (substituir todas as 5)
- Preciso de fiador? — Não. A KMR substitui o fiador.
- Quanto custa? — Valor proporcional ao aluguel; consulte sua simulação no WhatsApp.
- Quanto tempo demora a aprovação? — Geralmente em poucas horas.
- É seguro? — Sim. Solução regulamentada, com contrato claro e sem letras miúdas.
- E se eu atrasar o aluguel? — Entre em contato o quanto antes; orientamos a regularização e evitamos que vire um problema maior.

**CTASection**
- H2: "Pronto para alugar sem fiador?"
- Texto: "Simples, rápido e digital. Comece agora e dê o próximo passo rumo ao seu novo lar."
- Botão: "Começar agora" (rola para #contato)

**ContactForm**
- Título: "Simule sua garantia"
- Subtítulo: "Preencha seus dados e fale com a gente no WhatsApp."
- Campo "Imobiliária" → trocar por "Cidade do imóvel" (apenas label/placeholder; ajustar schema/zod e mensagem do WhatsApp para enviar "Cidade" em vez de "Imobiliária").
- Botão: "Simular agora"
- Mensagem WhatsApp: "Olá! Quero alugar sem fiador. Nome / Cidade / Telefone / Email."

**Header**
- Se houver botão "Agendar demonstração", trocar para "Simular agora".

**index.html (SEO B2C)**
- title: "KMR — Alugue sem fiador e sem caução alta"
- meta description: "Garantia de aluguel rápida, simples e 100% digital. Alugue sem fiador, sem caução e sem burocracia com a KMR."
- og/twitter title e description equivalentes.

### Regras seguidas
- Sem alterar layout, classes Tailwind, estrutura de componentes ou imagens.
- Mantém marca KMR, paleta e tipografia.
- Linguagem direta, 2ª pessoa, sem juridiquês.
- Mantém menção sutil à proteção do proprietário (credibilidade).
- Nenhuma alteração na área logada (`/dashboard`, `/sinistros`, `/atendimento`, etc.).

### Não incluído
- Nenhuma migração, edge function ou mudança de schema.
- Sem novos componentes ou rotas.
- Sem alterações visuais.