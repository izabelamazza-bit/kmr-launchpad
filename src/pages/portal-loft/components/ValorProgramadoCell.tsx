import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { fmtMoney } from "../lib/usePortalLoft";
import type { CobmaisLoftRow } from "../lib/useCobmaisLoft";
import type { PendenciaResumoContrato } from "../lib/useInadimplenciaLoft";

/**
 * "Valor já programado" = soma de valor_atual apenas das pendências em aberto
 * (sem data de pagamento) QUE TÊM data de previsão (dt_vencimento) confirmada
 * pela Loft. Pendências em aberto sem previsão NÃO entram na soma — o valor
 * total em aberto continua visível nos cards do topo, na coluna "Valor em risco"
 * e no tooltip abaixo.
 */
export function ValorProgramadoCell({
  pendencia,
}: {
  row: CobmaisLoftRow;
  pendencia?: PendenciaResumoContrato;
}) {
  if (!pendencia) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="text-muted-foreground cursor-default">—</span>
        </TooltipTrigger>
        <TooltipContent>Não disponível neste relatório</TooltipContent>
      </Tooltip>
    );
  }

  if (pendencia.qtdProgramada === 0) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="text-muted-foreground cursor-default">—</span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          {pendencia.qtdEmAberto > 0
            ? `Nenhuma pendência com data de previsão confirmada pela Loft. Há ${fmtMoney(
                pendencia.valorEmAberto,
              )} em aberto (${pendencia.qtdEmAberto} pendência(s)) sem data definida.`
            : `Todas as ${pendencia.total} pendência(s) deste contrato já têm data de pagamento`}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="font-semibold text-[#0F2A44] cursor-default whitespace-nowrap">
          {fmtMoney(pendencia.valorProgramado)}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        Soma de {pendencia.qtdProgramada} pendência(s) em aberto com data de previsão confirmada.
        {pendencia.qtdEmAberto > pendencia.qtdProgramada &&
          ` Total em aberto do contrato: ${fmtMoney(pendencia.valorEmAberto)}.`}
      </TooltipContent>
    </Tooltip>
  );
}

export default ValorProgramadoCell;
