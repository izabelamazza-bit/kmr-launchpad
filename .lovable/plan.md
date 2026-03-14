

## Landing Page KMR - Plano de Implementação

### Visão Geral
Landing page moderna para a KMR (garantia locatícia), focada em conversão de leads de imobiliárias. Design clean, estilo startup tech, mobile-first.

### Cores e Design System
Atualizar `src/index.css` com paleta KMR:
- Primary: azul escuro (~210 70% 15%)
- Accent/CTA: verde aprovação (~160 70% 45%)
- Secondary: azul tech (~200 60% 30%)
- Background claro, tipografia moderna

### Assets
- Copiar `Logo_KMR.png` para `src/assets/`

### Estrutura de Componentes

Criar componentes modulares em `src/components/landing/`:

1. **Header** - Navbar fixa com logo KMR, links âncora (Benefícios, Como Funciona, FAQ), botão CTA "Agendar demonstração"

2. **Hero** - Título forte, subtítulo, dois botões (Agendar demonstração + WhatsApp), ilustração com ícones de segurança/imóveis usando Lucide icons

3. **Benefits** - Grid 2x3 (mobile 1 coluna) com 5 cards: Processo simples, Regras claras, Aprovação rápida, Mais locações, Segurança. Ícones Lucide relevantes

4. **HowItWorks** - 4 passos com timeline visual (cadastro → análise → emissão → garantia)

5. **FAQ** - Accordion com 5 perguntas usando componente shadcn/ui Accordion

6. **ContactForm** - Formulário com campos Nome, Imobiliária, Telefone, Email. Validação com zod + react-hook-form. Submit via WhatsApp (encoded message)

7. **CTASection** - Bloco de destaque com gradiente, título forte, botão CTA

8. **Footer** - Logo, copyright, links básicos

### Página Index
Compor todos os componentes em `src/pages/Index.tsx` com scroll suave entre seções.

### SEO
- Atualizar `index.html` com meta tags (title, description, og tags)

### Responsividade
- Mobile-first com Tailwind breakpoints
- Header com menu hamburger no mobile
- Grid adaptativo nos cards

### Detalhes Técnicos
- WhatsApp link: `https://wa.me/NUMERO?text=...` (placeholder para número real)
- Formulário: validação client-side com zod, envio construindo mensagem WhatsApp
- Animações sutis com CSS transitions
- Smooth scroll com `scroll-behavior: smooth`

