# Diagnóstico: cruzamento por CPF zerado após a correção de URL

Não apliquei nenhuma correção. Abaixo, os valores reais encontrados.

## 1. Importação de hoje (24/09, origem api, tipo contrato)
- 306 linhas, CPF preenchido nas 306.
- Exemplos: `12792573694`, `5687424865`, `16156915613`, `70639061605`, `66724414920`.
- Formato: só dígitos, sem pontuação. 105 das 306 têm menos de 11 dígitos, porque o zero à esquerda sumiu (ex.: `5687424865` era `05687424865`). Isso indica que a API passou a mandar o CPF como número.

## 2. Importação anterior que funcionava (10/09)
- 2.263 linhas.
- Exemplos: `522.796.936-15`, `000.563.091-63`, `110.181.656-22`, `046.116.866-98`, `301.873.206-59`.
- Formato: com pontuação e zeros à esquerda. O formato mudou, sim.

## 3 e 4. O formato explica os 0 resultados? Só em parte
A tela compara apenas os dígitos, então a pontuação não atrapalha. O zero perdido atrapalharia só ~1/3 dos casos. O problema principal é outro: **a carteira mudou**.

| Comparação | Resultado |
|---|---|
| Contratos em comum (hoje × 10/09) | **0** |
| CPFs em comum, mesmo corrigindo os zeros | **0** |
| Base de 10/09 × Cobmais (230 CPFs) | 241 coincidências |
| Base de hoje × Cobmais (com ou sem correção dos zeros) | **0** |

- Hoje: cidade Montes Claros, contratos 1024516 a 4688182, corretores como Helmar Luckmann e Amanda Costa Ferreira.
- Em 10/09: cidade Uberlândia, contratos de 5 dígitos (24425, 31464...), corretores Paula, Luana e Mireile.

**Causa provável:** o token novo, ou o novo endereço, dá acesso à carteira de **outra imobiliária**. Não é a carteira Rotina/Alugar. O nome do campo continua batendo, já que o CPF veio preenchido nas 306 linhas. Os dados é que são de outra carteira. O volume também caiu de 2.263 para 306.

Sobre o item 3 (resposta crua da API): não chamei a API agora para não disparar nada em modo de planejamento. Mas o campo `inquilino_cpf` está sendo lido e gravado, então o nome não mudou.

## Próximos passos propostos (depois da sua confirmação)
1. Confirmar com a CredPago de qual conta ou imobiliária é o token novo e gerar o token da conta certa. Esse passo não depende de código.
2. Enquanto isso, pausar a rotina das 6h. Assim a importação de 10/09 continua sendo a mais recente e o cruzamento volta a funcionar. Também apagar as 2 importações de hoje (306 linhas cada), que são de outra carteira.
3. Proteção no código:
   - completar o CPF com zeros à esquerda até 11 dígitos quando vier como número;
   - abortar a gravação de contratos se nenhum contrato bater com a importação anterior (sinal de carteira trocada), avisando no resumo.
4. Mostrar uma amostra da resposta crua da API (1 item, CPF mascarado) para fechar o item 3.
