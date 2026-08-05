# Empresa no Novo Sinistro + filtro de contratos

O que já existe hoje (verificado): o campo "Empresa" (Rotina/Alugar) já está no formulário, já é obrigatório na validação e a coluna `empresa` já existe na tabela de sinistros e é gravada no registro. Ou seja, os itens 1 e a obrigatoriedade estão prontos — nenhuma migração de banco é necessária.

O que falta: o vínculo do contrato/inquilino hoje é um campo de texto livre ("Código do contrato (Imoview)"), sem lista e sem filtro por empresa.

## Mudanças

1. Mover o campo "Empresa" para o topo do bloco de dados do inquilino, antes de Nome, CPF e contrato (hoje ele aparece por último).
2. Trocar o campo de texto "Código do contrato" por um seletor de contrato com busca, alimentado pelos contratos cadastrados da empresa escolhida (base de auditoria: 743 contratos em Rotina, 115 em Alugar). Cada opção mostra código do contrato, nome do inquilino e CPF.
3. Enquanto nenhuma empresa estiver selecionada, o seletor de contrato fica desabilitado com a mensagem "Selecione a empresa primeiro".
4. Ao trocar a empresa, o contrato já escolhido é limpo (evita vínculo cruzado entre empresas).
5. Ao escolher um contrato, Nome e CPF do inquilino são preenchidos automaticamente, permanecendo editáveis.

Nada mais no fluxo muda: status do imóvel, débitos, consumos, obras, checklist, observações, uploads e gravação continuam iguais.

## Detalhes técnicos

- `src/pages/sinistros/NovoSinistro.tsx`: reordenar o `Select` de empresa; substituir o `Input` de `codigoContrato` por um Combobox (Popover + Command, padrão shadcn já usado no projeto).
- Consulta: `audit_contracts` selecionando `imoview_number, locatario_nome, locatario_cpf` com `.eq("empresa", empresa)`, disparada quando `empresa` muda.
- `codigo_contrato` gravado continua sendo o número Imoview (mesmo formato de hoje), então a listagem e o resumo de sinistros seguem funcionando sem alteração.
