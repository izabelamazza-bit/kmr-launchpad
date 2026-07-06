export const CRITICAL_ITEMS = [4, 5, 6, 7];

export interface RiscoInput {
  itens: { item_number: number; status: string }[];
  garantidoraForm: string | null;
  garantidoraExtraida: string | null;
}

export function calcularRiscoAlto({ itens, garantidoraForm, garantidoraExtraida }: RiscoInput): boolean {
  const criticoNok = itens.some(
    (i) => CRITICAL_ITEMS.includes(i.item_number) && i.status === "nok"
  );
  const garantidoraDivergenteNaoTombada =
    !!garantidoraForm &&
    !!garantidoraExtraida &&
    garantidoraForm.toLowerCase() !== garantidoraExtraida.toLowerCase() &&
    !(garantidoraForm === "KMR" && garantidoraExtraida === "Quintocred");
  return criticoNok || garantidoraDivergenteNaoTombada;
}