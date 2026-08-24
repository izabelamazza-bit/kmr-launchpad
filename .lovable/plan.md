# Correção do accept de upload .xlsx no Importar relatório Cobmais

## Problema
No modal "Importar relatório Cobmais" o seletor de arquivo do sistema operacional está deixando os arquivos `.xlsx` acinzentados/não selecionáveis, indicando regressão no atributo `accept` do input de arquivo.

## Diagnóstico
O componente `src/pages/cobmais/components/ImportCobmaisModal.tsx` usa atualmente:

```
accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
```

O `Input` do shadcn repassa corretamente as props para o `<input type="file">`, então a causa é o próprio valor do `accept`.

## Ação
1. Alterar o `accept` do `<Input type="file">` no `ImportCobmaisModal.tsx` para:

```
accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
```

2. Verificar no preview que o seletor de arquivo agora permite selecionar arquivos `.xlsx` normalmente.

## Valores
- **Antes da correção:** `.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- **Após a correção:** `.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
