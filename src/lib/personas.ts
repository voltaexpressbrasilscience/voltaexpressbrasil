/**
 * personas.ts — nomes das personas, iguais aos da landing (voltaexpressbrasil.com.br).
 * No banco os códigos continuam: 'C' = tem caminhão, 'E' = tem carga.
 * v3: a persona não define o tipo de documento (CPF sempre; CNPJ quando houver).
 */
export type CodigoPersona = "C" | "E";

export const PERSONAS: Record<CodigoPersona, { titulo: string; descricao: string; curto: string; slug: string }> = {
  C: {
    titulo: "Tenho caminhão",
    descricao: "Motorista autônomo ou transportadora, com um caminhão ou uma frota.",
    curto: "Motorista / transportadora",
    slug: "caminhao",
  },
  E: {
    titulo: "Tenho carga",
    descricao: "Embarcador: indústria, comércio, produtor rural ou pessoa física.",
    curto: "Embarcador",
    slug: "carga",
  },
};

/** "?perfil=caminhao" → "C"; "?perfil=carga" → "E" (links da Home e da landing). */
export function personaDoSlug(slug: string | null): CodigoPersona | "" {
  if (slug === PERSONAS.C.slug) return "C";
  if (slug === PERSONAS.E.slug) return "E";
  return "";
}

export const nomePersona = (codigo: string | null | undefined) =>
  codigo === "C" || codigo === "E" ? PERSONAS[codigo].curto : "";
