## Objetivo

Trazer para o dashboard `/carteira-ideali` a informação real de documentação do Google Drive, criando as tabelas `ideali_documentos` e `ideali_fila_analista`, um importador da planilha `Auditoria_Documentos_Garantias_Ideali.xlsx` e uma nova **Seção 7 — Documentação**, com a Fila do Analista.

## Planilha validada

- **Cruzamento Completo** — cabeçalho na linha 2, 181 contratos. Colunas: Código Contrato, Código Legado, Inquilino, Endereço, Status Contrato, Garantidora/Tipo Garantia, Prioritário, Planilha: Contrato Locação (Sim/Não), Planilha: Apólice Garantia (Sim/Não), Pasta encontrada no Drive, Status do Documento no Drive, Tem doc. de garantia no Drive, Nº arquivos na pasta, Nome da pasta no Drive.
- Distribuição do status: **56** Não existe no Drive, **52** Pasta existe sem contrato de locação, **21** Só versão não assinada, **52** Contrato assinado encontrado.
- **Fila do Analista** — cabeçalho na linha 4, **82** linhas, ordenada por urgência.
- **Resumo** — apenas texto informativo, não importada.

## 1. Banco de dados

**`public.ideali_documentos`** — uma linha por contrato, `codigo_contrato` único.

- Controle de Documentos: `contrato_locacao`, `vistoria`, `contrato_adm`, `relatorio_repasse_cobranca`, `apolice_garantia`, `apolice_seguro_incendio`, `levantamento_documentos` (booleans), `observacoes`, `migrar` (texto).
- Varredura do Drive: `status_documento_drive` (texto, CHECK nos 4 valores), `pasta_encontrada_drive`, `tem_doc_garantia_drive` (booleans), `n_arquivos_drive` (inteiro), `nome_pasta_drive` (texto), `prioritario` (boolean).
- **`prioritario` vem exclusivamente da coluna "Prioritário" da aba Cruzamento Completo.** Nenhum ponto do código recalcula prioridade por regra própria — a leitura em toda a UI é sempre desse campo.
- No import inicial, `contrato_locacao` e `apolice_garantia` vêm das colunas "Planilha: ...".

**`public.ideali_fila_analista`** — `codigo_contrato` único, `status_documento_drive`, `localizacao_documento`, `status_loft_seguradora`, `clausula_garantidora_presente`, `nome_inquilino_confere`, `endereco_confere`, `observacoes`, `status_fila`, `resolvido_em`, `ordem`.

**Enum de `status_fila`** (fechado por CHECK, default `'Pendente'`), distinto dos campos individuais de auditoria:
- `Pendente` — ainda não trabalhado pelo analista
- `Em andamento` — analista começou a verificar
- `Resolvido` — auditoria concluída (grava `resolvido_em`)
- `Sem ação possível` — documento comprovadamente inexistente/irrecuperável

Os campos individuais (`status_loft_seguradora`, `clausula_garantidora_presente`, `nome_inquilino_confere`, `endereco_confere`) mantêm seus próprios valores da planilha (`Pendente` / `Não verificado` / `Sim` / `Não`) e não se confundem com `status_fila`.

Ambas com RLS liberada a autenticados e GRANTs, no padrão de `ideali_contracts`.

## 2. Importador

Novo `src/pages/carteira-ideali/lib/documentosImport.ts` + `ImportDocumentosModal.tsx`, seguindo `idealiImport.ts` / `ImportIdealiModal.tsx`.

- Lê as duas abas com o offset correto de cabeçalho.
- Tela de conferência antes de gravar: total por status, linhas ignoradas, códigos ausentes em `ideali_contracts`.
- `ideali_documentos`: upsert por `codigo_contrato` em lotes de 500 (sobrescreve todos os campos do Drive).
- **`ideali_fila_analista` — regra de preservação obrigatória:**
  1. Buscar os `codigo_contrato` já existentes na tabela.
  2. Para códigos **existentes**: `UPDATE` apenas de `status_documento_drive` e `ordem`. Nunca tocar em `localizacao_documento`, `status_loft_seguradora`, `clausula_garantidora_presente`, `nome_inquilino_confere`, `endereco_confere`, `observacoes`, `status_fila`, `resolvido_em`.
  3. Para códigos **novos**: `INSERT` completo, com os campos manuais recebendo os defaults/placeholders da planilha.
  4. Nenhum upsert "cego" com a lista completa de colunas, para que os placeholders da planilha jamais apaguem trabalho do analista.
- O modal informa quantas linhas foram inseridas e quantas foram atualizadas apenas no status do Drive.
- Botão "Importar auditoria de documentos" no topo da página, ao lado do import atual.

## 3. Seção 7 — Documentação

Novo `DocumentacaoSection.tsx`, após a tabela de contratos.

**4 cards de resumo** (contagem real — esperado 56 / 52 / 21 / 52), clicáveis para filtrar:
- Não existe no Drive — vermelho
- Pasta existe, sem contrato de locação — amarelo
- Só versão não assinada — amarelo
- Contrato assinado encontrado — verde

**Tabela**: contrato, inquilino, `status_documento_drive` como badge em destaque, pasta/nº de arquivos, e `contrato_locacao` como coluna secundária discreta. Divergência (`contrato_locacao = true` com status ≠ "Contrato assinado encontrado") ganha indicador com tooltip. Coluna/marcador de prioritário lido direto do campo `prioritario`.

**Nota de rodapé** explicando que o status do Drive prevalece sobre `contrato_locacao`.

**Fila do Analista**: bloco próprio, ordenado por `ordem`, com busca, contador de pendentes, filtro por `status_fila` e por status do Drive, e edição inline dos campos manuais.

## 4. Hook de dados

Novo `src/pages/carteira-ideali/lib/useDocumentosIdeali.ts`, separado do `useCarteiraIdeali`, com paginação e ordenação estável. Seções 1–6 não são tocadas.

## Critérios de aceitação

- [ ] Tabelas criadas com RLS/GRANTs, status do Drive e `status_fila` restritos por CHECK.
- [ ] Import popula 181 documentos e 82 itens de fila, com resumo antes de gravar.
- [ ] Reimportação atualiza só `status_documento_drive` e `ordem` em linhas existentes da fila; dados manuais preservados.
- [ ] `prioritario` vem da planilha, sem recálculo em nenhum ponto do código.
- [ ] Cards exibem 56 / 52 / 21 / 52 com as cores corretas.
- [ ] Status do Drive é o destaque; `contrato_locacao` só como referência, com sinal de divergência.
- [ ] Seções 1 a 6 permanecem inalteradas.
