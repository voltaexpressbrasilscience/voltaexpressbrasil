/*
 * formatos.ts — formatação de datas, pesos e valores exibidos na plataforma.
 */

/* Formata data AAAA-MM-DD como DD/MM/AAAA, sem deslocar o dia pelo fuso horário. */
export function formatarData(iso: string): string {
  const [a, m, d] = iso.slice(0, 10).split("-");
  return a && m && d ? `${d}/${m}/${a}` : iso;
}

/* Formata quilos com separador de milhar. */
export function formatarKg(kg: number): string {
  return `${kg.toLocaleString("pt-BR")} kg`;
}

/* Formata valor em reais. */
export function formatarReais(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/* Iniciais do nome para o avatar sem foto. */
export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  return (partes[0][0] + (partes.length > 1 ? partes[partes.length - 1][0] : "")).toUpperCase();
}

/* Fim de formatos.ts */
