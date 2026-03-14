

## Redesign do Hero com imagem de fundo full-width

Inspirado no CredAluga: imagem de fundo grande ocupando toda a seção, com texto por cima e overlay escuro para legibilidade.

### Alterações em `src/components/landing/Hero.tsx`

1. **Copiar a imagem enviada** para `src/assets/hero-bg.jpg` (substituir a atual)

2. **Reformular o layout do Hero**:
   - Remover o grid de 2 colunas e a ilustração com cards flutuantes (linhas 49-99)
   - Fazer a seção ocupar mais altura (`min-h-[85vh]`) com a imagem de fundo em tela cheia
   - Imagem com `object-cover` ocupando todo o `inset-0`, sem opacity reduzida artificialmente
   - Overlay gradiente escuro (`from-primary/80 via-primary/60 to-primary/40`) para legibilidade natural, similar ao CredAluga
   - Texto em **branco** (`text-white`) centralizado ou alinhado à esquerda, posicionado sobre o overlay
   - Badge, h1, parágrafo e botões em branco/claro
   - Botão outline com borda branca

3. **Resultado**: Hero imersivo com a foto de reunião/handshake como fundo, texto branco grande por cima, aspecto profissional e natural como o site de referência.

