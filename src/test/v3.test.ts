/*
 * v3.test.ts — regras novas da versão 3: mensagens de erro, validade do anúncio, valor de referência e personas.
 */
import { describe, expect, it } from "vitest";
import { mensagemErro, textoDoErro } from "@/lib/erros";
import { textoValidade } from "@/lib/anuncio-service";
import { valorDeReferencia, formatarValorKm } from "@/lib/config-service";
import { personaDoSlug, nomePersona } from "@/lib/personas";

describe("mensagemErro", () => {
  it("traduz erros conhecidos do Supabase e da rede", () => {
    expect(mensagemErro({ message: "Invalid login credentials" })).toBe("E-mail ou senha incorretos.");
    expect(mensagemErro(new Error("Failed to fetch"))).toMatch(/Sem conexão/);
    expect(mensagemErro({ message: 'duplicate key value violates unique constraint "vt_usuario_documento_key"' })).toMatch(/CPF já está cadastrado/);
  });
  it("mantém as mensagens do banco que já estão em português", () => {
    expect(mensagemErro({ message: "A data fim já passou." })).toBe("A data fim já passou.");
  });
  it("usa a mensagem padrão para texto técnico desconhecido", () => {
    expect(mensagemErro({ message: "PGRST301 unexpected token" })).toBe("Algo deu errado. Tente de novo em instantes.");
    expect(mensagemErro(null, "Padrão")).toBe("Padrão");
    expect(textoDoErro("texto")).toBe("texto");
  });
});

describe("textoValidade", () => {
  it("conta os dias até a data fim", () => {
    expect(textoValidade("2026-11-01", "2026-11-01")).toBe("Vence hoje");
    expect(textoValidade("2026-11-02", "2026-11-01")).toBe("Vence amanhã");
    expect(textoValidade("2026-11-08", "2026-11-01")).toBe("Vence em 7 dias");
    expect(textoValidade("2026-10-31", "2026-11-01")).toBe("");
  });
});

describe("valor de referência", () => {
  it("multiplica a distância pelo valor do km e formata", () => {
    expect(valorDeReferencia(492, 6.5)).toBe(3198);
    expect(formatarValorKm(6.5)).toBe("R$ 6,50/km");
  });
});

describe("personas", () => {
  it("lê a persona do link e devolve o nome curto", () => {
    expect(personaDoSlug("caminhao")).toBe("C");
    expect(personaDoSlug("carga")).toBe("E");
    expect(personaDoSlug(null)).toBe("");
    expect(nomePersona("E")).toBe("Embarcador");
  });
});

/* Fim de v3.test.ts */
