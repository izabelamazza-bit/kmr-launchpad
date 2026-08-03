import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { fmtMoney } from "../lib/usePortalLoft";
import type { CobmaisLoftRow } from "../lib/useCobmaisLoft";
import type { PendenciaResumoContrato } from "../lib/useInadimplenciaLoft";

/**
 * Soma de valor_atual das pendências em aberto (sem data de pagamento) do contrato.
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

  if (pendencia.qtdEmAberto === 0) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="text-muted-foreground cursor-default">{fmtMoney(0)}</span>
        </TooltipTrigger>
        <TooltipContent>
          Todas as {pendencia.total} pendência(s) deste contrato já têm data de pagamento
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="font-semibold text-[#0F2A44] cursor-default whitespace-nowrap">
          {fmtMoney(pendencia.valorEmAberto)}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        Soma de {pendencia.qtdEmAberto} pendência(s) em aberto de {pendencia.total} no total
      </TooltipContent>
    </Tooltip>
  );
}

export default ValorProgramadoCell;
