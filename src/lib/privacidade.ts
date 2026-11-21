/**
 * privacidade.ts — versão vigente da Política de Privacidade.
 * Ao mudar o texto de src/pages/Privacidade.tsx, atualize a versão: o cadastro grava qual versão
 * o usuário aceitou (vt_usuario.versao_politica).
 */
export const VERSAO_POLITICA = "2026-10-28";
export const VERSAO_POLITICA_TEXTO = "28 de outubro de 2026";

/** Versão vigente dos Termos de Uso (src/pages/Termos.tsx). Mudou o texto, mude a versão. */
export const VERSAO_TERMOS = "2026-11-09";
export const VERSAO_TERMOS_TEXTO = "9 de novembro de 2026";

/** Contato oficial (decisão de 27/10/2026), usado na política, no rodapé e nas páginas de ajuda. */
export const CONTATO = {
  email: "voltaexpressbrasil@gmail.com",
  whatsapp: "5532988367667",
  whatsappTexto: "(32) 98836-7667",
} as const;

export const REDES = [
  { nome: "Instagram", url: "https://www.instagram.com/voltaexpressbrasil/" },
  { nome: "Facebook", url: "https://www.facebook.com/voltaexpressbrasil" },
  { nome: "YouTube", url: "https://www.youtube.com/@voltaexpressbrasil" },
  { nome: "X", url: "https://x.com/voltaexpressbrasil" },
  { nome: "TikTok", url: "https://www.tiktok.com/@voltaexpressbrasil" },
] as const;
