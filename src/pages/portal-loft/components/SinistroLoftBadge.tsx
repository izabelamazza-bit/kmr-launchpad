import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { CobmaisLoftRow } from "../lib/useCobmaisLoft";

/**
 * Placeholder isolado do "Status de sinistro na Loft".
 * Quando o RPA de sinistros da Loft existir, basta trocar o corpo deste
 * componente pelo dado real — a tabela não precisa ser alterada.
 */
export function SinistroLoftBadge(_props: { row: CobmaisLoftRow }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="secondary" className="font-normal whitespace-nowrap">
          Aguardando integração
        </Badge>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        Ainda não há RPA de sinistros da Loft — este dado será preenchido quando disponível
      </TooltipContent>
    </Tooltip>
  );
}

export default SinistroLoftBadge;