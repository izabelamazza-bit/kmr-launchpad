# Observações com anexos e exibição no resumo do sinistro

## 1. Anexos no bloco "Observações" (/novo-sinistro)

O bloco "Observações" passa a ter, abaixo do textarea, um campo de upload múltiplo igual aos demais do formulário: botão "Selecionar arquivos" + lista dos arquivos anexados (nome e botão de remover cada um). Aceita PDF e imagens, e novos arquivos são somados aos já selecionados.

Ao salvar, os arquivos vão para o mesmo bucket de storage já usado pelo sinistro, com a mesma regra de acesso, e ficam identificados como anexos de "Observações".

## 2. Bloco "Observações" na tela de visualização

Hoje o resumo do sinistro carrega o texto de observações do banco, mas não o exibe em nenhum lugar — por isso ele "desaparece" após salvar. A correção adiciona um bloco "Observações" na tela de visualização, posicionado imediatamente acima do bloco "Histórico", contendo:

- o texto informado no cadastro (ou "Nenhuma observação registrada." quando vazio);
- a lista de arquivos anexados nas observações, cada um clicável para abrir/baixar.

O bloco é somente leitura. Nenhum outro bloco da tela muda; o bloco "Histórico" segue exatamente como está.

## Detalhes técnicos

- `NovoSinistro.tsx`: novo estado `observacoesFiles: File[]` renderizado com o `MultiFileUploadField` já existente; no `handleSubmit`, após os demais uploads, cada arquivo é enviado via `uploadFile(sinistro.id, f, "observacoes")` e registrado em `sinistro_anexos` com `tipo = "Observações"`. Sem migração de banco.
- `ResumoSinistro.tsx`: novo Card "Observações" inserido antes do Card "Histórico", usando `sinistro.observacoes` e os `anexos` filtrados por `tipo === "Observações"`, com o `downloadFile` já existente (signed URL).
- Os anexos de observações continuam aparecendo também na listagem "Arquivos anexados", já que ela lista todos os registros de anexos.

## Verificação

Typecheck e teste no navegador: criar um sinistro com texto + 2 arquivos nas observações e conferir, no resumo, o bloco "Observações" acima do "Histórico" com o texto e os links dos arquivos.
