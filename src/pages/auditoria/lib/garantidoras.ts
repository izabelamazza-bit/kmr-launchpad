export const GARANTIDORAS = ["Loft", "Credaluga", "KMR"] as const;
export type Garantidora = (typeof GARANTIDORAS)[number];

export function garantidoraColor(g: string | null | undefined) {
  switch (g) {
    case "Loft":
      return { bg: "#2F80ED", text: "#FFFFFF", label: "Loft" };
    case "Credaluga":
      return { bg: "#27AE60", text: "#FFFFFF", label: "Credaluga" };
    case "KMR":
      return { bg: "#F2C94C", text: "#0F2A44", label: "KMR" };
    case "Quintocred":
      return { bg: "#EB5757", text: "#FFFFFF", label: "Quintocred" };
    case "Outra":
    case "Não identificada":
      return { bg: "#F2994A", text: "#FFFFFF", label: g };
    default:
      return { bg: "#BDBDBD", text: "#FFFFFF", label: g ?? "—" };
  }
}