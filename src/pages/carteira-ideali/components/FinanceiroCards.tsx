import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { formatBRL } from "../lib/useCarteiraIdeali";

interface Props {
  valorEmAtraso: number;
  contratosAfetados: number;
  total: number;
  faturasIncompletas: number;
  carteiraAtivaMes: number;
}

export function FinanceiroCards({
  valorEmAtraso,
  contratosAfetados,
  total,
  faturasIncompletas,
  carteiraAtivaMes,
}: Props) {
  const percent = total > 0
    ? ((contratosAfetados / total) * 100).toLocaleString("pt-BR", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })
    : "0,0";

  return (
    <section aria-labelledby="financeiro">
      <h2 id="financeiro" className="text-base font-semibold mb-3">
        Financeiro
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Valor em atraso</p>
            <p className="text-2xl font-bold mt-1 text-destructive">{formatBRL(valorEmAtraso)}</p>
            <p className="text-xs text-muted-foreground mt-1">faturas em aberto com valor confirmado</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Contratos afetados</p>
            <p className="text-2xl font-bold mt-1">
              {contratosAfetados}
              <span className="text-base font-normal text-muted-foreground"> de {total}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">com ao menos 1 fatura em aberto</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">% de Inadimplência</p>
            <p className="text-2xl font-bold mt-1">{percent}%</p>
            <p className="text-xs text-muted-foreground mt-1">
              {contratosAfetados} de {total} contratos com fatura em aberto (dado completo)
            </p>
          </CardContent>
        </Card>

        <Card className="border-[#F2994A]/50 bg-[#F2994A]/10">
          <CardContent className="p-4">
            <p className="text-xs text-[#B26B22] font-medium flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5" /> Faturas com dado incompleto
            </p>
            <p className="text-2xl font-bold mt-1 text-[#B26B22]">{faturasIncompletas}</p>
            <p className="text-xs text-[#B26B22] mt-1">sem valor registrado — verificar manualmente</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Carteira ativa/mês</p>
            <p className="text-2xl font-bold mt-1 text-[#27AE60]">{formatBRL(carteiraAtivaMes)}</p>
            <p className="text-xs text-muted-foreground mt-1">soma dos aluguéis dos contratos ativos</p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
