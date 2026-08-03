import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { CobmaisLoftRow } from "../lib/useCobmaisLoft";

/**
 * Placeholder isolado do "Valor já programado".
 * Substituir apenas este componente quando a fonte do dado existir.
 */
export function ValorProgramadoCell(_props: { row: CobmaisLoftRow }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="text-muted-foreground cursor-default">—</span>
      </TooltipTrigger>
      <TooltipContent>Não disponível neste relatório</TooltipContent>
    </Tooltip>
  );
}

export default ValorProgramadoCell;