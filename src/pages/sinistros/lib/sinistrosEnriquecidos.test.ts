import { describe, expect, it } from "vitest";
import { enriquecerSinistros, type SinistroBase, type DebitoSinistro } from "./sinistrosEnriquecidos";

const s = (id: string, contrato: string): SinistroBase => ({
  id, inquilino_nome: "x", inquilino_cpf: "x", codigo_contrato: contrato,
  status_imovel: "ocupado", status: "em_analise", created_at: "2026-10-14", empresa: "Rotina",
});
const d = (sid: string, tipo: string, venc: string, valor: number, total: number | null): DebitoSinistro => ({
  id: sid + venc + tipo + valor, sinistro_id: sid, tipo, descricao: null, data_vencimento: venc, valor, valor_total: total,
});

const sinistros = [s("a", "6412"), s("b", "6412"), s("c", "6412"), s("d", "6612"), s("e", "6612"), s("f", "4593")];
const debitos = [
  d("a", "aluguel", "2026-07-10", 1849.02, null), d("a", "consumo", "2026-07-10", 285, null), d("a", "consumo", "2026-07-10", 126.83, null),
  d("b", "aluguel", "2026-09-10", 2134.02, 2371.61), d("c", "aluguel", "2026-10-10", 2137.52, 2354.12),
  d("d", "aluguel", "2026-09-10", 787.27, 874.92), d("e", "aluguel", "2026-10-10", 790.77, 870.9),
];
const contratos = [
  { imoview_number: "6412", empresa: "Rotina", garantidora: "KMR" },
  { imoview_number: "6612", empresa: "Rotina", garantidora: "KMR" },
  { imoview_number: "4593", empresa: "Alugar", garantidora: "Loft" },
];
const r = Object.fromEntries(enriquecerSinistros(sinistros, contratos, debitos).map((x) => [x.id, x]));

describe("sinistros enriquecidos", () => {
  it("6412 tem 3 meses em atraso", () => expect(r.a.meses_em_atraso_contrato).toBe(3));
  it("6612 tem 2 meses em atraso", () => expect(r.d.meses_em_atraso_contrato).toBe(2));
  it("valor total usa valor quando valor_total vazio", () => expect(r.a.valor_total_sinistro).toBeCloseTo(2260.85, 2));
  it("valor total usa valor_total quando existe", () => expect(r.b.valor_total_sinistro).toBeCloseTo(2371.61, 2));
  it("vencimentos em MM/AAAA", () => expect(r.a.vencimentos).toEqual(["07/2026"]));
  it("cruzamento exige mesma empresa", () => expect(r.f.garantidora).toBe("Não identificada"));
  it("garantidora vem da auditoria", () => expect(r.d.garantidora).toBe("KMR"));
});
