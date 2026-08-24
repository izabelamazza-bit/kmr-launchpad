import { describe, expect, it } from "vitest";
import { parseBoolSimNao, parseDateTimeBR, normalizeProduto } from "./cobmaisXlsxImport";

describe("parseBoolSimNao", () => {
  it("reconhece SIM/NÃO com e sem acento e caixa", () => {
    expect(parseBoolSimNao("SIM")).toBe(true);
    expect(parseBoolSimNao("sim")).toBe(true);
    expect(parseBoolSimNao("NÃO")).toBe(false);
    expect(parseBoolSimNao("nao")).toBe(false);
    expect(parseBoolSimNao("1")).toBe(true);
    expect(parseBoolSimNao("0")).toBe(false);
  });

  it("retorna null para vazio ou desconhecido", () => {
    expect(parseBoolSimNao("")).toBeNull();
    expect(parseBoolSimNao(null)).toBeNull();
    expect(parseBoolSimNao("talvez")).toBeNull();
  });
});

describe("parseDateTimeBR", () => {
  it("converte DD/MM/AAAA HH:MM:SS", () => {
    const iso = parseDateTimeBR("10/08/2026 14:32:05");
    expect(iso).not.toBeNull();
    const d = new Date(iso as string);
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(7);
    expect(d.getDate()).toBe(10);
  });

  it("aceita data sem hora", () => {
    const d = new Date(parseDateTimeBR("01/12/2025") as string);
    expect(d.getMonth()).toBe(11);
    expect(d.getDate()).toBe(1);
  });

  it("retorna null para vazio ou inválido", () => {
    expect(parseDateTimeBR("")).toBeNull();
    expect(parseDateTimeBR("31/13/2026")).toBeNull();
    expect(parseDateTimeBR("texto")).toBeNull();
  });
});

describe("normalizeProduto", () => {
  it("mantém normalização de garantidoras", () => {
    expect(normalizeProduto("CredPago - Garantia_Inteligente")).toBe("Loft");
    expect(normalizeProduto("KMR Basic")).toBe("KMR");
    expect(normalizeProduto("Fiador")).toBe("Fiador");
  });
});
