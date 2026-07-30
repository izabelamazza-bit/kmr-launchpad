## Objetivo
Reorganizar apenas a navegação: sidebar fixa recolhível em todas as telas e nova home do /dashboard com resumo das 3 áreas operacionais. Nenhuma rota, permissão ou lógica interna de tela muda.

## 1. Sidebar (novo componente)
`src/components/layout/AppSidebar.tsx` usando o shadcn `Sidebar` (`collapsible="icon"`), já disponível em `src/components/ui/sidebar.tsx`.

- Grupo "Operação" (destaque normal): Auditoria (`/auditoria`), Sinistros (`/sinistros`), Portal Loft (`/portal-loft`).
- Grupo "Administração" no rodapé (`SidebarFooter`), visualmente discreto (ícone `h-3.5`, texto `text-xs font-normal text-muted-foreground`): Usuários (`/cadastros/usuarios`), Leads (`/cadastros/leads`), Agente de IA (`/agente`), Atendimento (`/atendimento`).
- Item ativo destacado via `NavLink` + `isActive` (match por prefixo de rota, para telas de detalhe como `/auditoria/:id`).
- Topo: logo KMR; base: botão "Sair" mantendo o `supabase.auth.signOut()` já usado hoje.

## 2. Shell de layout
`src/components/layout/AppLayout.tsx`: `SidebarProvider` + `<div className="min-h-screen flex w-full">` + `AppSidebar` + header fino com `SidebarTrigger` (visível sempre, inclusive mobile — no mobile o trigger vira o hambúrguer e a sidebar abre em sheet, comportamento nativo do componente) + `<Outlet />`.

No `App.tsx`, as rotas autenticadas passam a ficar dentro de uma rota pai com `AppLayout` (dashboard, auditoria, sinistros, portal-loft, cadastros, agente, atendimento, configurações, carteira/documentação Ideali). Ficam fora: `/`, `/login`, `/trocar-senha`, consent, NotFound.

Ajuste mínimo nas telas: `CrudLayout` e os headers próprios de Auditoria/Sinistros/Portal Loft/Dashboard deixam de repetir o header global (logo + Sair + seta voltar) para não duplicar com o shell — o conteúdo e a lógica de cada tela permanecem intactos.

## 3. Home do /dashboard
- Mantém o banner "Registrar novo sinistro" como está (oculto no ambiente Ideali, como hoje).
- Remove os cards de Usuários, Leads, Agente de IA e Atendimento.
- Passa a exibir 3 blocos clicáveis: Auditoria, Sinistros e Portal Loft, cada um com os números de resumo da própria tela:
  - Portal Loft: reaproveita `ResumoCards` já existente (`src/pages/portal-loft/components/ResumoCards.tsx`) via o hook `usePortalLoft`.
  - Auditoria: extrai o `KpiCard` hoje interno de `Auditoria.tsx` para um componente compartilhado e reusa os mesmos totais (Total, Completa, Com pendências, Com alerta) — cálculo idêntico ao da tela.
  - Sinistros: não existe componente de resumo hoje; será usado o mesmo `KpiCard` com contagem por status (Em análise, Processo de pagamento, Pago, Cancelado) lida da mesma query que a tela já usa.
- Ambiente Ideali continua mostrando só Carteira e Documentação (sidebar também restrita a esses 2 itens nesse ambiente).

## 4. Responsivo
Desktop: sidebar fixa, recolhível para modo ícone. Mobile/tablet (<768px): hambúrguer no topo abrindo a sidebar em overlay; conteúdo das telas segue com o mesmo container e paddings atuais.
