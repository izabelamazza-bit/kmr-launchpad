# Investigação do upload .xlsx no Importar relatório Cobmais

## Resposta direta antes de aplicar
1. **Eu não reproduzi o bug no seletor nativo do sistema operacional.** A proposta anterior foi inferida pela leitura do código e estava incompleta: o valor atual já inclui `.xlsx`, então remover `.xls` não explica, por si só, arquivos `.xlsx` acinzentados.

2. **Não vou tratar a remoção de `.xls` como causa raiz sem teste.** O seletor nativo do SO não é inspecionável de forma confiável pelo Playwright headless, então a validação precisa se basear em evidências do DOM/renderização e, se necessário, em um teste manual assistido no preview.

3. **Validação já feita no código/renderização:**
   - O `Input` do shadcn repassa `accept`, `disabled` e demais props diretamente para o `<input>`.
   - No modal renderizado em `/portal-loft`, o `<input type="file">` está com:

```text
accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
disabled=false
```

   - No componente Cobmais, não foi encontrada validação por `file.type` ou MIME após a seleção; o `onChange` apenas salva `e.target.files?.[0]`.
   - A validação real ocorre depois, em `parseCobmaisXlsx(file)`, lendo o `arrayBuffer` com SheetJS e validando aba/cabeçalho.

## Hipóteses ainda abertas
- O problema pode estar no comportamento do seletor nativo em algum navegador/SO com a combinação de extensão + MIME.
- O arquivo do usuário pode estar com extensão, associação ou tipo diferente do esperado, mas isso ainda não explicaria ficar acinzentado antes da seleção.
- Pode haver diferença entre o preview do usuário e o estado local renderizado, embora o DOM local mostre o `accept` acima.

## Plano de ação seguro
1. Testar, sem alterar lógica de importação, duas variações de `accept` no input Cobmais:
   - Valor atual: `.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
   - Valor restrito esperado: `.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

2. Validar no preview com arquivo `.xlsx` real:
   - confirmar o atributo `accept` renderizado no DOM;
   - confirmar que o input não está `disabled`;
   - confirmar que `onChange` recebe o arquivo quando selecionado;
   - se possível no ambiente visual/manual, confirmar que o arquivo aparece selecionável no seletor nativo.

3. Só aplicar a mudança final se o teste mostrar que o valor restrito destrava o seletor ou se houver outra causa comprovada.

## Mudança candidata, se confirmada
Alterar o `accept` do upload Cobmais para:

```text
accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
```

## Resultado esperado da investigação
Ao final, reportar com precisão:
- valor do `accept` antes;
- valor do `accept` final;
- se a causa raiz foi o `accept`, estado `disabled`, validação JS, ou outro fator;
- evidência usada para confirmar que `.xlsx` voltou a ser selecionável/processável.
