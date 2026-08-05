# Upload de múltiplos arquivos nos campos de sinistro

Objetivo: os campos citados passam a aceitar vários arquivos por vez, com lista de arquivos anexados, remoção individual e possibilidade de adicionar mais sem substituir os anteriores. Mesmo bucket e mesmas regras de acesso de hoje.

## Campos alterados

1. "Boleto do aluguel" (seção Débito de aluguel) — de 1 arquivo para vários.
2. Boleto de cada linha de "Contas de consumo" — de 1 arquivo para vários.
3. Checklist de documentos: "Água (se houver)", "Lixo (se houver)", "IPTU (se houver)" e "Apólice de seguro" — de 1 arquivo para vários.

Nada mais muda: textos do checklist, itens, validações, demais campos (termo de chaves, orçamentos de obras) e navegação seguem iguais.

## Como fica na tela

Cada um desses campos passa a usar o mesmo componente de upload múltiplo já existente na tela (o usado em "Orçamentos de obras"): botão "Selecionar arquivos" sempre visível + lista dos arquivos anexados, cada um com nome e botão de remover.

## Detalhes técnicos

- Componente: reutilizar `MultiFileUploadField` (já aceita `multiple`, acumula e remove por índice). `FileUploadField` continua em uso nos campos não citados.
- Estado em `NovoSinistro.tsx`:
  - `aluguelBoleto: File | null` -> `aluguelBoletos: File[]`.
  - `ContaConsumo.boleto: File | null` -> `boletos: File[]` (novas linhas iniciam com `[]`).
  - `ChecklistItem.file: File | null` -> `files: File[]`; os campos com múltiplos são decididos por uma lista de labels (`Água (se houver)`, `Lixo (se houver)`, `IPTU (se houver)`, `Apólice de seguro`); os demais itens continuam single-file lendo/gravando `files[0]`.
- Gravação (sem migração de banco, colunas atuais preservadas):
  - Aluguel: primeiro arquivo continua em `sinistro_debitos.boleto_path`; os arquivos extras entram em `sinistro_anexos` com `tipo = "Boleto do aluguel"`.
  - Consumo: primeiro arquivo em `boleto_path` do débito de consumo; extras em `sinistro_anexos` com `tipo = "Boleto - <descrição>"`.
  - Checklist: um registro em `sinistro_anexos` por arquivo, com `tipo` igual ao label do item (comportamento atual, apenas repetido por arquivo).
  - Uploads seguem usando `uploadFile` com os mesmos prefixos (`aluguel`, `consumo`, `checklist`) no bucket atual.
- A tela de resumo já lista anexos por registro, então os arquivos extras aparecem sem alteração adicional.

## Verificação

Typecheck e um teste no navegador anexando 2+ arquivos no boleto do aluguel e em "Água (se houver)", conferindo a lista, a remoção individual e o resumo após salvar.
