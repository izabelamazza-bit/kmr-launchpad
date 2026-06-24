# Importação em massa de contratos do Imoview + Empresa

## 1. Banco de dados (migration)

Em `audit_contracts`:
- Adicionar coluna `empresa text` com check constraint `IN ('Rotina','Alugar')`.
- Adicionar colunas auxiliares vindas da planilha (para preservar os dados sem perder o que já existe na seção A):
  - `valor_aluguel numeric`
  - `data_inicio date`
  - `data_fim date`
  - `data_proximo_reajuste date`
  - `indice_reajuste text`
- Relaxar o check de `garantidora` para permitir o valor `'Alerta'` (linhas com `FormaGarantia` desconhecido). Mantém Loft/Credaluga/KMR + Alerta.
- Coluna `import_batch_id uuid` (opcional, para rastrear lote).

Em `audit_contract_extracted_data`:
- O endereço extraído da coluna `Imoveis` e o nome do locatário já cabem nos campos existentes (`endereco_imovel`, `locatarios`, `cpf_locatario`, `garantidora_normalizada`). Apenas popular esses campos durante a importação para que apareçam imediatamente na lista.

## 2. Parser de planilha (frontend)

Novo arquivo `src/pages/auditoria/lib/imoviewImport.ts`:
- Usa `xlsx` (SheetJS) — adicionar dependência.
- Lê o arquivo, normaliza headers, e para cada linha aplica as regras:
  - Filtra `Status ∈ {Saudável, Saudavel, Atrasado}`. Outros → conta como "ignorado por status".
  - Normaliza `FormaGarantia`: `CredPago→Loft`, `CredAluga→Credaluga`, `KMR→KMR`, demais → `Alerta`.
  - `Situacao = Ativo` → `ocupacao = Ocupado`.
  - `Status`: `Saudável → Saudavel`, `Atrasado → Inadimplente`.
  - Extrai endereço de `Imoveis` via regex que captura o trecho `R. … CEP XXXXX-XXX` (também aceita `Rua`, `Av.`, `Avenida`, `Travessa`, etc.).
  - Converte datas (`DataInicio`, `DataFim`, `DataProximoReajuste`) — aceita serial Excel ou string `dd/mm/yyyy`.
  - Converte `Valor` para número (remove `R$`, milhar/decimal pt-BR).
  - `Responsavel` → grava em `analyst_name` (sem vincular `analyst_id`, já que não há mapping de nome→user; analista pode ajustar depois).

## 3. Modal de importação

Novo componente `src/pages/auditoria/components/ImportImoviewModal.tsx`:

Fluxo:
1. Select **Empresa** (obrigatório): Rotina / Alugar.
2. Input file (`.xls,.xlsx`).
3. Botão "Importar".
4. Durante processamento: spinner + "Importando contratos…".
5. Para cada linha válida:
   - `SELECT id FROM audit_contracts WHERE imoview_number = ?` — se existir, ignora (conta como "duplicado").
   - `INSERT INTO audit_contracts` com todos os campos mapeados + `empresa` + `created_by = auth.uid()` + `audit_status='Nao iniciada'`. O trigger `seed_audit_checklist` já popula o checklist.
   - `UPDATE audit_contract_extracted_data` (registro criado por outro trigger? — não há; então `INSERT`) com `locatarios`, `cpf_locatario`, `endereco_imovel`, `garantidora_normalizada`.
6. Ao final, mostra resumo:
   - Total lido
   - Importados com sucesso
   - Ignorados (duplicados)
   - Ignorados (status fora de Saudável/Atrasado)
   - Ignorados (linhas inválidas — sem `Codigo`)
   - Lista colapsável com os números de contrato em cada categoria.
7. Botão "Fechar" → fecha modal, recarrega a lista (re-executa o `load()` do `Auditoria.tsx`).

Observação: como o trigger seed cria o checklist no `INSERT` e o `seed` para Loft cria itens 23–24 só quando `garantidora='Loft'`, importar com `garantidora='Alerta'` não cria itens Loft — comportamento desejado.

## 4. Tela principal Auditoria

`src/pages/auditoria/Auditoria.tsx`:
- Adicionar botão "Importar planilha Imoview" ao lado de "+ Novo contrato". O `CrudLayout` hoje só aceita `onNewClick`/`newLabel`; vou passar um `extraActions?: ReactNode` novo (ou usar um header customizado via children). Plano: estender `CrudLayout` com prop opcional `extraActions` renderizada ao lado do botão "+ Novo".
- Adicionar filtro "Empresa" (Todas/Rotina/Alugar) na grid de filtros (agora 5–6 colunas).
- Adicionar coluna "Empresa" no `DataTable` (com `hideOnMobile: false`).
- Estado `filtroEmpresa` aplicado tanto no `filtered` quanto nos `totals` (cards de KPI devem refletir o filtro de empresa).
- Badge vermelho quando `garantidora === 'Alerta'`: o `GarantidoraBadge` já trata "Outra" e mostra alerta; estender `garantidoraColor` para o caso `Alerta → bg #EB5757`.

## 5. CrudLayout

`src/components/crud/CrudLayout.tsx` — adicionar prop opcional `extraActions?: ReactNode` renderizada antes do botão "+ Novo".

## 6. Fora do escopo
- Não alterar edge function `extract-contract`.
- Não mudar lógica do checklist nem da tela de edição de contrato.
- Não vincular `Responsavel` da planilha a `analyst_id` (sem mapping confiável).
- Sem upload de PDFs em massa.

## Detalhes técnicos

Dependência nova: `xlsx` (SheetJS), parseado client-side — sem edge function.

Regex de endereço (exemplo):
```text
/((?:R\.|Rua|Av\.|Avenida|Trav\.|Travessa|Al\.|Alameda|Pç\.|Praça)[^\n]*?CEP\s*\d{5}-?\d{3})/i
```

Trigger atual `recalc_audit_status` é `AFTER UPDATE` em `audit_checklist_items` — não dispara no insert do seed, então novos contratos importados ficam com `audit_status='Nao iniciada'` (correto).

A política RLS de `audit_contract_extracted_data` precisa permitir INSERT pelo usuário autenticado — verificarei na implementação e ajustarei se necessário (provavelmente já existe policy de UPDATE/INSERT; se for só UPDATE, adiciono INSERT na migration).
