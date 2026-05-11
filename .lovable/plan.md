## Alterações solicitadas

### 1. Tela `/novo-sinistro` — campo Observações no Checklist

No card "Checklist de documentos" (`src/pages/sinistros/NovoSinistro.tsx`), adicionar abaixo da lista de itens (e antes dos botões "Cancelar"/"Continuar") um campo de Observações:

- Label: **Observações**
- Subtítulo: "Adicione informações relevantes sobre o sinistro."
- `<textarea>` 100% width, min-h 120px, border `#E8EDF2`, radius 8px, padding 12px, Poppins 14px, color `#4F4F4F`
- Placeholder: "Adicione informações relevantes sobre o sinistro..."
- Novo state `observacoes` salvo em `sinistros.observacoes` no `insert` (a coluna já existe).

### 2. Tela `/novo-sinistro/resumo/:id` — substituir Observações por Histórico

No `src/pages/sinistros/ResumoSinistro.tsx`, **remover** o card de Observações e adicionar um novo card **Histórico**:

- Header: título "Histórico" + subtítulo "Atualizações e registros sobre o andamento do caso."
- Lista (mais recente → mais antiga). Cada entrada em card `bg:#F5F7FA`, radius 8px, padding 12px, mb 8px:
  - Data/hora (`DD/MM/AAAA às HH:MM`) e nome do autor — 12px, `#4F4F4F`
  - Texto do update — 14px, `#0F2A44`
- Vazio: "Nenhuma atualização registrada ainda."
- Form de novo update: label "Adicionar atualização", textarea (100%, min-h 100px, placeholder "Descreva a atualização sobre este caso..."), botão "+ Adicionar update" (`#2F80ED`, branco, radius 8px, font-weight 600, alinhado à direita).
- Ao clicar: insere com timestamp + usuário logado e atualiza a lista localmente (sem reload).

### Banco de dados (migration nova)

Criar tabela `public.sinistro_historico`:

- `id uuid pk default gen_random_uuid()`
- `sinistro_id uuid not null` (referencia `sinistros.id`)
- `user_id uuid` (autor — `auth.uid()`)
- `user_name text` (snapshot do nome para exibição)
- `texto text not null`
- `created_at timestamptz default now()`
- Índice em `sinistro_id`
- RLS: ENABLE; políticas para `authenticated` em SELECT/INSERT (UPDATE/DELETE não necessários para histórico imutável).

Para preencher `user_name`, ler de `users_registry` pelo `email` do usuário autenticado (fallback para email).

### Arquivos afetados

- `src/pages/sinistros/NovoSinistro.tsx` — novo campo + insert da observação
- `src/pages/sinistros/ResumoSinistro.tsx` — remove Observações, adiciona Histórico (fetch + form + insert otimista)
- Nova migration SQL para `sinistro_historico`

### Pontos a confirmar

- Manter a coluna `sinistros.observacoes` no banco (apenas deixar de editar pela tela de resumo) — assim o valor capturado em `/novo-sinistro` continua acessível. Confirma?