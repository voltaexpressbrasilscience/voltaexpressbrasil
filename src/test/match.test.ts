/*
 * match.test.ts — testes das regras do front do Match v2 e da criação de anúncio:
 * montagem das entradas enviadas ao banco, leitura da rota, faixas de score, status e formatos.
 */
import { describe, expect, it } from "vitest";
import { montarEntradaCargas, montarEntradaVeiculos, faixaScore } from "@/lib/matching-service";
import { montarPayloadCarga, montarPayloadVeiculo, linkWhatsApp, statusExibido, hojeISO } from "@/lib/anuncio-service";
import { lerRespostaRota, type RotaCalculada } from "@/lib/rota-service";
import { formatarData, formatarKg } from "@/lib/formatos";

const ROTA: RotaCalculada = {
  distanciaKm: 480.5,
  duracaoTexto: "6 h 30 min",
  polyline: "abc123",
  origem: { lat: -21.76, lng: -43.35 },
  destino: { lat: -23.55, lng: -46.63 },
  valorSugerido: 3123.25,
};

describe("montarEntradaCargas", () => {
  it("envia a polyline quando a rota foi calculada e omite campos vazios", () => {
    const p = montarEntradaCargas(
      { tipoCarroceria: "Baú", refrigerado: false, capacidadePeso: 14000, origemCidade: "Juiz de Fora", origemEstado: "MG", destinoCidade: "São Paulo", destinoEstado: "SP" },
      ROTA,
    );
    expect(p).toMatchObject({ tipo_carroceria: "Baú", capacidade_kg: 14000, polyline: "abc123", origem_uf: "MG" });
    expect(p).not.toHaveProperty("data_inicio");
    expect(p).not.toHaveProperty("capacidade_m3");
  });

  it("sem rota, cai no match por cidades (sem polyline)", () => {
    const p = montarEntradaCargas({ tipoCarroceria: "Sider", refrigerado: true, origemCidade: "Juiz de Fora", destinoCidade: "São Paulo" }, null);
    expect(p).not.toHaveProperty("polyline");
    expect(p.refrigerado).toBe(true);
  });
});

describe("montarEntradaVeiculos", () => {
  it("usa as coordenadas de origem e destino da carga", () => {
    const p = montarEntradaVeiculos({ descricaoMercadoria: "x", categoriaCarga: "Carga seca", refrigerado: false, pesoKg: 8000 }, ROTA);
    expect(p).toMatchObject({ categoria_carga: "Carga seca", peso_kg: 8000, origem_lat: -21.76, destino_lng: -46.63, exige_refrigeracao: false });
  });
});

describe("payloads de criação", () => {
  const trajeto = { origemCidade: "Juiz de Fora", origemEstado: "MG", destinoCidade: "São Paulo", destinoEstado: "SP", dataInicio: "2026-10-05", dataFim: "2026-10-10", valorSugerido: 3200 };

  it("veículo leva placa, carroceria e a rota gravada", () => {
    const p = montarPayloadVeiculo({ ...trajeto, placa: "TST1A23", tipoVeiculo: "Truck", tipoCarroceria: "Baú", refrigerado: false, capacidadePeso: 14000, rota: ROTA });
    expect(p).toMatchObject({ tipo: "V", placa: "TST1A23", tipo_carroceria: "Baú", polyline: "abc123", distancia_km: 480.5, origem_lat: -21.76, valor: 3200 });
  });

  it("carga refrigerada marca exige_refrigeracao automaticamente", () => {
    const p = montarPayloadCarga({ ...trajeto, descricao: "Queijos", categoriaCarga: "Refrigerada" });
    expect(p).toMatchObject({ tipo: "C", categoria_carga: "Refrigerada", exige_refrigeracao: true });
    expect(p).not.toHaveProperty("polyline");
  });
});

describe("lerRespostaRota", () => {
  it("converte a resposta completa da Edge Function", () => {
    const r = lerRespostaRota({ distanceKm: 10, durationText: "15 min", overviewPolyline: "p", startLocation: { lat: 1, lng: 2 }, endLocation: { lat: 3, lng: 4 }, suggestedValue: 65 });
    expect(r).toEqual({ distanciaKm: 10, duracaoTexto: "15 min", polyline: "p", origem: { lat: 1, lng: 2 }, destino: { lat: 3, lng: 4 }, valorSugerido: 65 });
  });

  it("devolve null para erro ou resposta incompleta", () => {
    expect(lerRespostaRota({ error: "No route found" })).toBeNull();
    expect(lerRespostaRota(null)).toBeNull();
  });
});

describe("faixaScore", () => {
  it("classifica por faixa", () => {
    expect(faixaScore(84).tom).toBe("alto");
    expect(faixaScore(60).tom).toBe("medio");
    expect(faixaScore(40).tom).toBe("baixo");
  });
});

describe("apoio", () => {
  it("link do WhatsApp adiciona DDI 55 e o trajeto na mensagem", () => {
    const link = linkWhatsApp("(32) 99000-0003", { origem_cidade: "Juiz de Fora", destino_cidade: "São Paulo" });
    expect(link).toContain("phone=5532990000003");
    expect(decodeURIComponent(link)).toContain("Juiz de Fora → São Paulo");
  });

  it("anúncio ativo vencido aparece como expirado", () => {
    expect(statusExibido({ status: "ATIVO", data_fim: "2026-01-01" }, "2026-09-28")).toBe("EXPIRADO");
    expect(statusExibido({ status: "PAUSADO", data_fim: "2026-12-01" }, "2026-09-28")).toBe("PAUSADO");
  });

  it("formata data sem deslocar pelo fuso e peso com milhar", () => {
    expect(formatarData("2026-10-05")).toBe("05/10/2026");
    expect(formatarKg(14000)).toBe("14.000 kg");
    expect(hojeISO(new Date(2026, 8, 28, 23, 30))).toBe("2026-09-28");
  });
});

/* Fim de match.test.ts */
