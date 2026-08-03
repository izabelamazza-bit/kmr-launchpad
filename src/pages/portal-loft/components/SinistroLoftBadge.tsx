import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PendenciaStatusBadge } from "./PendenciaStatusBadge";
import { fmtDate } from "../lib/usePortalLoft";
import type { CobmaisLoftRow } from "../lib/useCobmaisLoft";
import type { PendenciaResumoContrato } from "../lib/useInadimplenciaLoft";

/**
 * Status de sinistro na Loft. Quando existe pendência importada para o contrato,
 * mostra o status mais recente + previsão/pagamento; sem dado, mantém o aviso
 * de integração pendente (nunca inventa status).
 */
export function SinistroLoftBadge({ pendencia }: { row: CobmaisLoftRow; pendencia?: PendenciaResumoContrato }) {
  if (!pendencia) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="secondary" className="font-normal whitespace-nowrap">
            Sem pendência importada
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          Nenhuma pendência da Loft foi importada para este contrato
        </TooltipContent>
      </Tooltip>
    );
  }

  const p = pendencia.maisRecente;
  return (
    <div className="flex items-center gap-1.5 whitespace-nowrap">
      <PendenciaStatusBadge status={p.imob_status} />
      {p.data_pagamento ? (
        <span className="text-xs text-[#27AE60] font-medium">Pago em {fmtDate(p.data_pagamento)}</span>
      ) : p.dt_vencimento ? (
        <span className="text-xs text-muted-foreground">Previsto para {fmtDate(p.dt_vencimento)}</span>
      ) : null}
    </div>
  );
}

export default SinistroLoftBadge;
