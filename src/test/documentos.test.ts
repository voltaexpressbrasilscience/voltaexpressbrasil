/*
 * documentos.test.ts — validação de CPF, CNPJ e WhatsApp (src/lib/documentos.ts).
 * Os números usados são exemplos públicos de documentos válidos, não pertencem a ninguém.
 */
import { describe, expect, it } from "vitest";
import { cnpjValido, cpfValido, erroDocumentos, whatsappParaGravar, whatsappValido } from "@/lib/documentos";

describe("cpfValido", () => {
  it("aceita CPF com dígito verificador certo, com ou sem máscara", () => {
    expect(cpfValido("529.982.247-25")).toBe(true);
    expect(cpfValido("52998224725")).toBe(true);
  });
  it("recusa dígito errado, tamanho errado e sequência repetida", () => {
    expect(cpfValido("529.982.247-24")).toBe(false);
    expect(cpfValido("5299822472")).toBe(false);
    expect(cpfValido("111.111.111-11")).toBe(false);
    expect(cpfValido("")).toBe(false);
  });
});

describe("cnpjValido", () => {
  it("aceita CNPJ com dígito verificador certo", () => {
    expect(cnpjValido("11.222.333/0001-81")).toBe(true);
    expect(cnpjValido("11222333000181")).toBe(true);
  });
  it("recusa dígito errado e sequência repetida", () => {
    expect(cnpjValido("11.222.333/0001-80")).toBe(false);
    expect(cnpjValido("00.000.000/0000-00")).toBe(false);
  });
});

describe("whatsappValido", () => {
  it("aceita celular com DDD, com ou sem +55", () => {
    expect(whatsappValido("(32) 98836-7667")).toBe(true);
    expect(whatsappValido("+55 32 98836-7667")).toBe(true);
  });
  it("recusa fixo, DDD inexistente e número sem DDD", () => {
    expect(whatsappValido("(32) 3215-0000")).toBe(false);
    expect(whatsappValido("(20) 98836-7667")).toBe(false);
    expect(whatsappValido("98836-7667")).toBe(false);
  });
  it("grava sem o código do país", () => {
    expect(whatsappParaGravar("+55 32 98836-7667")).toBe("32988367667");
    expect(whatsappParaGravar("(32) 98836-7667")).toBe("32988367667");
  });
});

describe("erroDocumentos", () => {
  it("devolve null quando está tudo certo e o CNPJ é vazio", () => {
    expect(erroDocumentos({ cpf: "529.982.247-25", cnpj: "", whatsapp: "32988367667" })).toBeNull();
  });
  it("aponta o primeiro problema, em português", () => {
    expect(erroDocumentos({ cpf: "123", cnpj: "", whatsapp: "32988367667" })).toMatch(/CPF inválido/);
    expect(erroDocumentos({ cpf: "52998224725", cnpj: "123", whatsapp: "32988367667" })).toMatch(/CNPJ inválido/);
    expect(erroDocumentos({ cpf: "52998224725", whatsapp: "3232150000" })).toMatch(/WhatsApp inválido/);
  });
  it("não valida o CPF quando ele não é informado (Perfil de conta que já tem CPF)", () => {
    expect(erroDocumentos({ cnpj: "", whatsapp: "32988367667" })).toBeNull();
  });
});

/* Fim de documentos.test.ts */
