# /sinistros — garantidora, vencimentos e valor total

Sem mudança no banco nem nas regras de acesso (RLS). Tudo é feito na tela, a partir das tabelas atuais.

## O que já foi confirmado
- `audit_contracts` tem a coluna `empresa` e não há contrato repetido com o mesmo número dentro de uma mesma empresa. O cruzamento vai usar **número do contrato + empresa**.
- Com esse cruzamento, ficam 4 sinistros da Rotina como "Não identificada": os contratos 4593 (Neudes Anunciação da Silva Justo, 2 sinistros), 6596 (VANILDA LOURA CAVALCANTE) e 5492 (Andrea Borras Prometti Rafael). Nenhum desses números existe em Auditoria, em nenhuma das duas empresas. A lista será conferida de novo depois da implementação.

## Lógica única (uma só fonte)
Vou criar um arquivo `src/pages/sinistros/lib/sinistrosEnriquecidos.ts`. Ele será usado pela lista, pelos cards e pela futura exportação para Excel:
- `STATUS_FINALIZADOS: string[] = []`, com um comentário pedindo para incluir status como concluído, pago ou encerrado quando eles forem criados.
- `STATUS_SINISTRO_LABEL`: um mapa único de status para nome legível (em_analise → "Em análise", entre outros). A tela atual passa a usar esse mapa.
- Uma função pura `enriquecerSinistros(sinistros, contratos, debitos)` que devolve, para cada sinistro:
  - **garantidora**: vem de Auditoria, cruzando número do contrato e empresa. Sem correspondência, fica "Não identificada".
  - **debitos**: todos os débitos do sinistro.
  - **vencimentos**: os meses (MM/AAAA) distintos, do mais antigo ao mais recente. São lidos direto do texto da data, sem conversão de fuso.
  - **valor_total_sinistro**: soma do valor total de cada débito, ou do valor simples quando o total estiver vazio.
  - **meses_em_atraso_contrato**: quantos meses distintos de débitos de aluguel existem em todos os sinistros do mesmo contrato e da mesma empresa, ignorando os status que estiverem em STATUS_FINALIZADOS.
- Um hook `useSinistrosEnriquecidos(empresa)` que faz 3 consultas em lote: os sinistros da empresa, os contratos de Auditoria com `in(numeros)` da mesma empresa e os débitos com `in(ids)`. As consultas são divididas em blocos para não estourar o tamanho da URL.

## Tela /sinistros
- As colunas ficam nesta ordem: Inquilino | Contrato | Garantidora | Vencimento(s) | Imóvel | Valor total | Status | Criado em | Ações.
- **Garantidora**: usa o mesmo selo de Auditoria (cores de Loft, Credaluga e KMR). "Alerta" aparece em âmbar e "Não identificada" em cinza. Essas duas cores valem só nesta tela; Auditoria continua como está.
- **Vencimento(s)**: os meses separados por vírgula, ou "Sem débitos" em cinza quando não houver débito.
- **Valor total**: em R$.
- **Ordenação padrão**: pelo contrato e, dentro dele, pelo vencimento mais antigo.
- **Filtro "Garantidora"** ao lado da busca, com as opções Todas, Loft, Credaluga, KMR, Alerta e Não identificada. Ele funciona junto com a busca e com a Empresa ativa.
- No celular, algumas colunas ficam escondidas para a tabela continuar legível.

## Validação depois de aplicar
- Teste automático da função pura, com os dados reais dos contratos 6412 e 6612. O esperado é 6412 = 3 meses e 6612 = 2 meses.
- Consulta no banco e verificação na tela com Playwright, conferindo para 6412 e 6612: garantidora, vencimentos, valor total e meses em atraso.
- Lista final dos sinistros "Não identificada", com inquilino e contrato.

## Ponto de atenção
No contrato 6412, o sinistro de 04/08 tem vencimento 10/07. Somado a 10/09 e 10/10, isso dá 3 meses, como você espera. No 6612, os vencimentos são 10/09 e 10/10, ou seja, 2 meses.
