// Taxas configuráveis de encargos por atraso
export const PERCENTUAL_MULTA = 0.10; // 10% fixo sobre o valor original
export const PERCENTUAL_JUROS_MENSAL = 0.01; // 1% ao mês, pro-rata dia (÷ 30)

export interface Encargos {
  diasAtraso: number;
  multa: number;
  juros: number;
  total: number;
}

const round2 = (v: number) => Math.round(v * 100) / 100;

const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/**
 * Calcula multa e juros sempre em relação à data de hoje.
 * Sem atraso (vencimento hoje ou futuro) => multa e juros zerados.
 */
export function calcularEncargos(
  valorOriginal: number,
  dataVencimento: Date | string | null | undefined,
): Encargos {
  const valor = Number(valorOriginal) || 0;
  if (!dataVencimento || valor <= 0) {
    return { diasAtraso: 0, multa: 0, juros: 0, total: round2(valor) };
  }

  const venc =
    typeof dataVencimento === "string"
      ? new Date(`${dataVencimento.slice(0, 10)}T00:00:00`)
      : dataVencimento;
  if (Number.isNaN(venc.getTime())) {
    return { diasAtraso: 0, multa: 0, juros: 0, total: round2(valor) };
  }

  const diffMs = startOfDay(new Date()) - startOfDay(venc);
  const diasAtraso = Math.max(0, Math.floor(diffMs / 86_400_000));

  if (diasAtraso === 0) {
    return { diasAtraso: 0, multa: 0, juros: 0, total: round2(valor) };
  }

  const multa = round2(valor * PERCENTUAL_MULTA);
  const juros = round2((valor * PERCENTUAL_JUROS_MENSAL / 30) * diasAtraso);
  const total = round2(valor + multa + juros);

  return { diasAtraso, multa, juros, total };
}
