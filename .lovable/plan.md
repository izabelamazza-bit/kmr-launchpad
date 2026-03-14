

## Plano: ChatWidget global em todas as páginas

Mover o `<ChatWidget />` de dentro do `Index.tsx` para o `App.tsx`, posicionando-o fora do `<Routes>` para que apareça em todas as páginas automaticamente.

### Alterações

1. **`src/App.tsx`** — Importar `ChatWidget` e renderizá-lo após o `</Routes>`, dentro do `<BrowserRouter>`.

2. **`src/pages/Index.tsx`** — Remover o `<ChatWidget />` e o import correspondente (evitar duplicação).

Resultado: o botão flutuante do assistente aparecerá no canto inferior direito em todas as páginas do sistema.

