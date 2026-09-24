# Cobmais: escolher a empresa no momento da importação

Nada existente será removido. Sem mudança no banco: as colunas `empresa` já existem em `cobmais_imports` e `cobmais_snapshots`.

## O que muda para quem usa

1. **Modal "Importar relatório Cobmais"** ganha, no topo e antes do campo de arquivo, o campo obrigatório **"Empresa do relatório"** com as opções Rotina e Alugar.
   - Vem pré-selecionado com a empresa ativa no topo da tela (se for Rotina ou Alugar). Se o topo estiver em Ideali, fica vazio e a pessoa precisa escolher.
   - Pode ser trocado livremente. Texto de apoio: "Sugerido pela empresa ativa. Confira antes de enviar."
   - O botão "Analisar arquivo" fica desabilitado até haver empresa e arquivo escolhidos.
   - Na tela de conferência e na tela de conclusão aparece a linha "Empresa: Alugar" (ou Rotina) em destaque, para a pessoa confirmar antes de gravar.
   - Se a empresa escolhida no modal for diferente da ativa no topo, mostra um aviso leve: "Este arquivo será gravado na Alugar. Você está vendo a Rotina — troque a empresa no topo para ver o resultado."
2. **Gravação**: a importação usa a empresa escolhida no modal (não a do topo) tanto no registro da importação quanto em todas as linhas.
3. **Histórico**: hoje a tela Cobmais só mostra "Última importação" (não existe listagem). Vou:
   - incluir a empresa ao lado da data na "Última importação" (ex.: "24/09/2026 16:40 · Alugar por Izabela — arquivo.xlsx");
   - adicionar um cartão compacto **"Histórico de importações"** com as 10 últimas importações de todas as empresas: data, empresa (etiqueta), arquivo, linhas e quem importou.
4. **Cobmais × Loft**: confirmado na leitura — a tela já busca a última importação Cobmais e a última importação de contratos do Portal Loft filtrando pela mesma empresa ativa, e a visão "mais recente por CPF" do Cobmais já é separada por empresa. Trocar a empresa no topo muda as duas fontes juntas. Nenhuma alteração necessária aqui; vou apenas validar no navegador.

## Validação ao final

- Captura de tela do modal com o campo de empresa visível.
- Teste com um arquivo Cobmais de exemplo gravado como Alugar: conferir que a importação e as linhas ficaram como Alugar, que as contagens da Rotina (4 relatórios, 3.403 linhas) não mudaram, e que o Cobmais × Loft da Rotina continua igual. Depois pergunto se mantenho ou removo essa importação de teste (não apago nada sem sua confirmação).

## Detalhes técnicos

- `ImportCobmaisModal.tsx`: estado `empresaSel` iniciado com `environment` se estiver em `["Rotina","Alugar"]`, senão `""`; ressincroniza ao abrir o modal; `Select` do shadcn; passa `empresaSel` para `importCobmaisXlsx(file, parsed, empresaSel, ...)` (a função já aceita empresa). `reset()` volta à sugestão.
- Lista de empresas do Cobmais como constante `EMPRESAS_COBMAIS = ["Rotina","Alugar"]` em `cobmaisXlsxImport.ts`.
- `Cobmais.tsx`: empresa no texto da última importação; novo cartão de histórico com consulta a `cobmais_imports` (order `data_importacao desc`, limit 10) + nomes via `users_registry`; recarrega em `onDone`.
- `useCobmaisLoft.ts` / view `cobmais_latest_loft` (`DISTINCT ON (empresa, cpf_cnpj)`): sem alteração.
