# Navegação por empresa + filtro de Sinistros por empresa

Nada é apagado: rotas, telas, componentes e tabelas permanecem. Muda apenas o que aparece e o que é consultado.

## 1. Menu lateral por empresa ativa

Grupo "Operação" passa a ser montado a partir da empresa ativa:

```text
Rotina  -> Dashboard, Auditoria, Sinistros, Portal Loft
Alugar  -> Dashboard, Auditoria, Sinistros
Ideali  -> Dashboard, Carteira, Documentação
```

O grupo "Administração" e o rodapé (Sair) continuam iguais para todas as empresas.

## 2. Tela de Sinistros filtrada por empresa

- Listagem `/sinistros`: consulta passa a filtrar `empresa = empresa ativa`. Com "Alugar" a tabela vem vazia; com "Rotina" aparece a Vanilda.
- Contador/estado vazio da tela refletem o resultado filtrado.
- Detalhe `/novo-sinistro/resumo/:id`: se o sinistro carregado pertencer a outra empresa, a tela não exibe os dados e redireciona para `/sinistros` (evita acesso por URL direta fora do contexto).
- Trocar a empresa no cabeçalho refaz a consulta automaticamente (a empresa entra como dependência do efeito de carregamento).

## 3. Redirecionamento ao trocar de empresa

Guarda de rota no layout: cada rota tem as empresas em que faz sentido.

```text
Auditoria, Sinistros (e subtelas)  -> Rotina, Alugar
Portal Loft                        -> Rotina
Carteira, Documentação             -> Ideali
```

Se a rota atual não é permitida para a empresa recém-selecionada, navega para `/dashboard`. Rotas neutras (Dashboard, Cadastros, Leads, Agente, Atendimento, Configurações, Componentes) nunca redirecionam.

## 4. Outros pontos que leem sinistros

Levantamento feito no código:

- `useDashboardResumo.ts` — já filtra por empresa (cards do Dashboard). Sem mudança.
- `NovoSinistro.tsx` — já grava `empresa` obrigatoriamente. Sem mudança.
- `ResumoSinistro.tsx` — hoje busca por id sem checar empresa. Será ajustado (item 2).
- `src/lib/mcp/tools/list-sinistros.ts` e `supabase/functions/mcp/index.ts` — API MCP externa, sem sessão de empresa no cliente. Ganha um parâmetro opcional `empresa` para permitir o mesmo filtro, mantendo o comportamento atual quando não informado.
- Chat/assistente e telas de Pessoas/Auditoria não listam sinistros.

## Detalhes técnicos

- `AppSidebar.tsx`: mapa `operacaoPorEmpresa` derivado de `useEnvironment()`.
- `Sinistros.tsx`: `useEnvironment()` + `.eq("empresa", environment)` e `environment` no array de dependências.
- `ResumoSinistro.tsx`: incluir `empresa` no select e redirecionar quando divergir.
- Guarda de rota: pequeno hook/efeito em `AppLayout.tsx` com o mapa rota → empresas permitidas.

## Verificação final

Screenshots: menu lateral nas 3 empresas, `/sinistros` com Rotina (Vanilda visível) e `/sinistros` com Alugar (vazio).
