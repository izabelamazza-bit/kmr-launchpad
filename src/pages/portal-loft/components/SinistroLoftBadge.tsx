import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertCircle } from "lucide-react";
import { PendenciaStatusBadge } from "./PendenciaStatusBadge";
import { fmtDate } from "../lib/usePortalLoft";
import type { CobmaisLoftRow } from "../lib/useCobmaisLoft";
import {
  diasDesde,
  estaParado,
  type PendenciaResumoContrato,
} from "../lib/useInadimplenciaLoft";

/**
 * Status de sinistro na Loft (duas linhas): status + "última atualização há X dias"
 * e, abaixo, previsão/pagamento. Sem dado, mantém o aviso de integração pendente
 * (nunca inventa status).
 *
 * A "última atualização" vem só de pendências enquanto as movimentações reais da
 * Loft não forem importadas — ver comentário em useInadimplenciaLoft.ts.
 */
export function SinistroLoftBadge({ pendencia }: { row: CobmaisLoftRow; pendencia?: PendenciaResumoContrato }) {
  if (!pendencia) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="whitespace-nowrap">
            <Badge variant="secondary" className="font-normal">
              Sem pendência importada
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">Sem movimentação registrada</p>
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          Nenhuma pendência da Loft foi importada para este contrato
        </TooltipContent>
      </Tooltip>
    );
  }

  const p = pendencia.maisRecente;
  const dias = diasDesde(pendencia.ultimaAtualizacao);
  const parado = estaParado(pendencia);
  return (
    <div className="whitespace-nowrap">
      <div className="flex items-center gap-1.5">
        <PendenciaStatusBadge status={p.imob_status} />
        <span className="text-xs text-muted-foreground">
          {dias === null
            ? "sem data de atualização"
            : dias === 0
              ? "atualizado hoje"
              : `última atualização há ${dias} ${dias === 1 ? "dia" : "dias"}`}
        </span>
        {parado && (
          <Tooltip>
            <TooltipTrigger asChild>
              <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              Sem retorno da Loft há {dias} dias — precisa de cobrança
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      <p className="text-xs mt-1">
        {p.data_pagamento ? (
          <span className="text-[#27AE60] font-medium">Pago em {fmtDate(p.data_pagamento)}</span>
        ) : p.dt_vencimento ? (
          <span className="text-muted-foreground">Previsto para {fmtDate(p.dt_vencimento)}</span>
        ) : (
          <span className="text-muted-foreground">Sem previsão informada</span>
        )}
      </p>
    </div>
  );
}

export default SinistroLoftBadge;
