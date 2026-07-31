# Importação do relatório Cobmais (.xlsx)

Nova tela "Cobmais" com importação do relatório de cobrança em Excel, lendo apenas a aba "Cobrança" e gravando nas tabelas `cobmais_imports` / `cobmais_snapshots` já criadas.

## Fluxo da tela

1. Botão "Importar relatório Cobmais" abre um modal (mesmo padrão do Portal Loft: selecionar arquivo, analisar, conferir, confirmar).
2. **Analisar**: o arquivo é lido no navegador; valida se a aba "Cobrança" existe e se o cabeçalho é exatamente CPF/CNPJ, CLIENTE, CREDOR, CONTRATO, ATRASO, PRODUTO, OBSERVAÇÃO, RISCO, MARCADOR. Aba ou cabeçalho errados geram mensagem clara indicando o que falta ou sobra, sem gravar nada no banco.
3. **Prévia**: mostra total de linhas, linhas ignoradas (sem CPF/CNPJ) e a quebra por garantidora identificada (Loft / KMR / Credaluga / não rastreadas).
4. **Confirmar**: cria o registro da importação e grava os snapshots em lotes de até 500, com barra de progresso.
5. **Resumo final**: total importado e quantos foram identificados como Loft, KMR e Credaluga.
6. **Erros**: qualquer falha durante a gravação desfaz a importação inteira (remove os snapshots e o registro de importação) e avisa o usuário — nunca fica importação parcial silenciosa. Se o desfazer também falhar, a mensagem orienta a avisar o suporte.

## Normalização do PRODUTO

Comparação sem diferenciar maiúsculas/minúsculas, acentos ou espaços extras:

- LOFT, CredPago - Garantia_Inteligente → **Loft**
- CredAluga, CredAluga - Garantia_Inteligente → **Credaluga**
- KMR, KMR Basic, QuintoCred → **KMR**
- Qualquer outro valor (Fiador, Caução, Sem garantia, Seguro fiança, Outros...) mantém o texto original do PRODUTO

## Onde fica

- Nova rota `/cobmais`, com o layout padrão do sistema (menu lateral fixo e seletor de empresa).
- Item "Cobmais" no menu "Operação" apenas na empresa **Rotina** (Rotina Recebíveis); nas demais empresas o item não aparece e o acesso direto à rota redireciona para o Dashboard.
- A tela mostra a última importação (data, arquivo, quem importou) e uma tabela dos registros do snapshot mais recente, com busca por CPF/CNPJ, cliente ou contrato e filtro por garantidora.

## Detalhes técnicos

- `src/pages/cobmais/lib/cobmaisXlsxImport.ts`: leitura com SheetJS (`xlsx`, já instalado) via `XLSX.read(arrayBuffer)` + `sheet_to_json({ header: 1, raw: false, defval: "" })`; validação de aba/cabeçalho com erro dedicado (`HeaderMismatchError`, no padrão de `loftCsvImport.ts`); parsers de número (`atraso` inteiro, `risco` numérico, aceitando formato brasileiro) e de texto (vazio → null); `normalizeProduto()` exportada e coberta por teste unitário; `importCobmaisXlsx()` insere em `cobmais_imports`, grava snapshots em lotes de 500 com callback de progresso e faz rollback por `import_id` em caso de erro.
- Mapeamento de colunas: CPF/CNPJ→`cpf_cnpj`, CLIENTE→`cliente`, CREDOR→`credor`, CONTRATO→`contrato`, ATRASO→`atraso`, PRODUTO→`produto`, OBSERVAÇÃO→`status_cobranca`, RISCO→`risco`, MARCADOR→`marcador`, mais `garantidora_normalizada`.
- `src/pages/cobmais/components/ImportCobmaisModal.tsx` reaproveitando a estrutura de `ImportLoftModal.tsx` (Dialog, Progress, ErrorBox, Row) e os componentes de `/componentes`.
- `src/pages/cobmais/Cobmais.tsx` + `lib/useCobmais.ts` (última importação, snapshots, contagens por garantidora).
- `src/App.tsx`: rota `/cobmais`; `AppSidebar.tsx`: item adicionado apenas ao array de `Rotina`; guarda de empresa na página, no mesmo padrão já usado em Sinistros.
- Nenhuma alteração de schema — as tabelas e a view já existem.