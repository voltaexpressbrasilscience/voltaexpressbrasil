/*
 * documentos.ts — validação de CPF, CNPJ e WhatsApp no cadastro e no Perfil (prioridade de 27/10/2026).
 * Confere o dígito verificador e o formato; não consulta a Receita Federal.
 * Os campos continuam gravados só com números (decisão X7 da v3).
 */

export const soDigitos = (v: string) => v.replace(/\D/g, "");

/* Sequências como 000.000.000-00 passam no cálculo, mas não existem. */
const repetido = (d: string) => /^(\d)\1+$/.test(d);

/* Dígito verificador no padrão da Receita: soma ponderada, resto de 11. */
function digito(base: string, pesos: number[]): number {
  const soma = base.split("").reduce((total, n, i) => total + Number(n) * pesos[i], 0);
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

export function cpfValido(valor: string): boolean {
  const d = soDigitos(valor);
  if (d.length !== 11 || repetido(d)) return false;
  const d1 = digito(d.slice(0, 9), [10, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = digito(d.slice(0, 10), [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);
  return d1 === Number(d[9]) && d2 === Number(d[10]);
}

export function cnpjValido(valor: string): boolean {
  const d = soDigitos(valor);
  if (d.length !== 14 || repetido(d)) return false;
  const d1 = digito(d.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = digito(d.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return d1 === Number(d[12]) && d2 === Number(d[13]);
}

/* DDDs em uso no Brasil (Anatel). */
const DDDS = new Set([
  11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 24, 27, 28, 31, 32, 33, 34, 35, 37, 38,
  41, 42, 43, 44, 45, 46, 47, 48, 49, 51, 53, 54, 55, 61, 62, 63, 64, 65, 66, 67, 68, 69,
  71, 73, 74, 75, 77, 79, 81, 82, 83, 84, 85, 86, 87, 88, 89, 91, 92, 93, 94, 95, 96, 97, 98, 99,
]);

/**
 * Celular com DDD: 11 dígitos, DDD válido e número começando por 9 (o link wa.me precisa disso).
 * Aceita o código do país na frente: +55 32 98836-7667.
 */
export function whatsappValido(valor: string): boolean {
  let d = soDigitos(valor);
  if (d.length === 13 && d.startsWith("55")) d = d.slice(2);
  return d.length === 11 && DDDS.has(Number(d.slice(0, 2))) && d[2] === "9";
}

/** Telefone só com DDD e número (sem o 55), para gravar no banco. */
export function whatsappParaGravar(valor: string): string {
  const d = soDigitos(valor);
  return d.length === 13 && d.startsWith("55") ? d.slice(2) : d;
}

/**
 * Primeiro problema encontrado nos documentos do cadastro, em português, ou null se estiver tudo certo.
 * O CNPJ é opcional: vazio passa; preenchido, precisa ser válido.
 */
export function erroDocumentos({ cpf, cnpj, whatsapp }: { cpf?: string; cnpj?: string; whatsapp?: string }): string | null {
  if (cpf !== undefined && !cpfValido(cpf)) return "CPF inválido. Confira os 11 números.";
  if (cnpj !== undefined && soDigitos(cnpj) !== "" && !cnpjValido(cnpj)) return "CNPJ inválido. Confira os 14 números ou deixe em branco.";
  if (whatsapp !== undefined && !whatsappValido(whatsapp)) return "WhatsApp inválido. Use DDD + número do celular, por exemplo (32) 98836-7667.";
  return null;
}

/* Fim de documentos.ts */
