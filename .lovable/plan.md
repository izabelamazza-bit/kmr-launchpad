

## Adicionar Imagem de Fundo ao Hero da KMR

### Análise da Situação Atual
O Hero atualmente possui apenas decorações gradientes abstratas (linhas 10-13) com círculos blur. Não há imagem de fundo.

### Objetivo
Adicionar uma imagem de fundo que transmita tranquilidade e modernidade, relacionada a:
- Liberdade de burocracia
- Aprovação digital simplificada
- Segurança e tranquilidade

### Abordagens Possíveis

**Opção 1: Gerar Imagem com IA (Recomendado)**
- Usar modelo Nano banana 2 (google/gemini-3.1-flash-image-preview) para gerar uma imagem profissional
- Prompt sugerido: "Modern minimalist background image for a fintech landing page hero section, showing a peaceful home interior with soft natural light coming through windows, clean modern architecture, plants, calm blue and green color palette, professional photography style, subtle and elegant, representing peace of mind and freedom from bureaucracy"
- Aplicar a imagem com overlay suave para não competir com o texto

**Opção 2: Usar Stock Image**
- Buscar imagem em serviços como Unsplash (casa moderna, pessoa relaxada em casa, ambiente tranquilo)
- Integrar via URL

### Implementação Técnica

1. **Gerar/Obter Imagem**
   - Criar imagem apropriada (1920x1080 ou similar)
   - Salvar em `src/assets/hero-bg.jpg` ou similar

2. **Atualizar Hero.tsx**
   - Adicionar imagem de fundo dentro da `div` de background (linha 10)
   - Aplicar overlay escuro/azulado sutil (rgba) para garantir legibilidade do texto
   - Usar `bg-cover`, `bg-center`, `bg-no-repeat`
   - Manter os gradientes atuais como camada adicional ou substituir

3. **Exemplo de Estrutura**
```jsx
<div className="absolute inset-0 -z-10">
  {/* Background image */}
  <div className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20" 
       style={{ backgroundImage: "url('/src/assets/hero-bg.jpg')" }} />
  
  {/* Overlay gradient for better text contrast */}
  <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/90 to-background/85" />
  
  {/* Decorative elements (opcionais) */}
  <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-secondary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
</div>
```

### Ajustes de Estilo
- Ajustar opacidade da imagem para não sobrecarregar o texto (15-30%)
- Adicionar overlay gradient para transição suave
- Garantir contraste adequado nos textos
- Testar responsividade mobile

