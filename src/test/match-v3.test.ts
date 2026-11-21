/*
 * match-v3.test.ts — Match v3: polyline, faixa do mapa, coordenadas, "perto de mim", volta e entrada sem Google.
 */
import { describe, expect, it } from "vitest";
import { decodificarPolyline, distanciaKm, larguraFaixaPx, limites, pontoDe } from "@/lib/geo";
import { montarEntradaPerto, montarEntradaVeiculos } from "@/lib/matching-service";
import { datasDaVolta } from "@/lib/anuncio-service";

// Goiânia → Morrinhos → Itumbiara → Tupaciguara → Uberlândia (mesma rota do docs/sql/02-popular-demo.sql)
const ROTA_GYN_UDI = "bdzdB~_ukHf}jEw`^vmcCnnTnub@owbBrw~@wprA";

describe("decodificarPolyline", () => {
  it("decodifica a rota de demonstração em 5 pontos, começando em Goiânia e terminando em Uberlândia", () => {
    const p = decodificarPolyline(ROTA_GYN_UDI);
    expect(p.length).toBe(5);
    expect(p[0].lat).toBe(-16.6869);
    expect(p[0].lng).toBe(-49.2648);
    expect(p[4].lat).toBe(-18.9186);
    expect(p[4].lng).toBe(-48.2772);
  });
  it("devolve lista vazia para texto vazio e descarta o ponto incompleto de um texto cortado", () => {
    expect(decodificarPolyline("").length).toBe(0);
    expect(decodificarPolyline("bdzdB~_uk").length).toBe(0);
  });
});

describe("distanciaKm", () => {
  it("Goiânia–Uberlândia em linha reta fica perto de 270 km", () => {
    const d = distanciaKm({ lat: -16.6869, lng: -49.2648 }, { lat: -18.9186, lng: -48.2772 });
    expect(Math.round(d / 5) * 5).toBe(270);
  });
});

describe("larguraFaixaPx", () => {
  it("dobra quando o zoom aumenta 1 nível e respeita o máximo", () => {
    const z6 = larguraFaixaPx(25, -18, 6);
    const z7 = larguraFaixaPx(25, -18, 7);
    expect(Math.round(z7 / z6)).toBe(2);
    expect(larguraFaixaPx(60, -18, 14)).toBe(600);
    expect(larguraFaixaPx(0, -18, 6)).toBe(0);
  });
});

describe("limites e pontoDe", () => {
  it("calcula os limites e aceita números vindos como texto do banco", () => {
    const l = limites([{ lat: -10, lng: -40 }, { lat: -20, lng: -50 }]);
    expect(l?.sw.lat).toBe(-20);
    expect(l?.ne.lng).toBe(-40);
    expect(limites([])).toBe(null);
    expect(pontoDe("-16.68", "-49.26")?.lat).toBe(-16.68);
    expect(pontoDe(null, "-49.26")).toBe(null);
  });
});

describe("montarEntradaPerto", () => {
  it("envia posição e raio, sem cidades", () => {
    const p = montarEntradaPerto({ tipoCarroceria: "Baú", refrigerado: false, capacidadePeso: 14000 }, { lat: -16.7, lng: -49.3 }, 50);
    expect(p.perto_lat).toBe(-16.7);
    expect(p.perto_km).toBe(50);
    expect(p.capacidade_kg).toBe(14000);
    expect("origem_cidade" in p).toBe(false);
    expect("capacidade_m3" in p).toBe(false);
  });
});

describe("montarEntradaVeiculos sem Google", () => {
  it("usa as coordenadas do IBGE quando a rota não foi calculada", () => {
    const p = montarEntradaVeiculos(
      {
        descricaoMercadoria: "Carga seca",
        refrigerado: false,
        origemCidade: "Itumbiara",
        origemEstado: "GO",
        destinoCidade: "Goiânia",
        destinoEstado: "GO",
        origemPonto: { lat: -18.4093, lng: -49.2158 },
        destinoPonto: { lat: -16.6869, lng: -49.2648 },
      },
      null,
    );
    expect(p.origem_lat).toBe(-18.4093);
    expect(p.destino_lng).toBe(-49.2648);
  });
  it("prefere as coordenadas do Google quando existem", () => {
    const p = montarEntradaVeiculos(
      { descricaoMercadoria: "x", refrigerado: false, origemPonto: { lat: 1, lng: 1 }, destinoPonto: { lat: 2, lng: 2 } },
      { distanciaKm: 10, duracaoTexto: "", polyline: "", origem: { lat: 5, lng: 6 }, destino: { lat: 7, lng: 8 }, valorSugerido: 0 },
    );
    expect(p.origem_lat).toBe(5);
    expect(p.destino_lat).toBe(7);
  });
});

describe("datasDaVolta", () => {
  it("começa quando a ida termina e dura o mesmo que a ida", () => {
    const d = datasDaVolta("2026-11-01", "2026-11-04", "2026-10-28");
    expect(d.inicio).toBe("2026-11-04");
    expect(d.fim).toBe("2026-11-07");
  });
  it("não começa no passado e dura pelo menos 1 dia", () => {
    const d = datasDaVolta("2026-10-01", "2026-10-01", "2026-10-28");
    expect(d.inicio).toBe("2026-10-28");
    expect(d.fim).toBe("2026-10-29");
  });
});

/* Fim de match-v3.test.ts */
