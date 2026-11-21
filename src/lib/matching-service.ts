/*
 * matching-service.ts — Match v3 entre as duas personas (docs/MATCH.md).
 * O cálculo roda no banco (vt_match_cargas e vt_match_veiculos): filtros obrigatórios,
 * encaixe na rota com PostGIS, score de 0 a 100 e motivos. Aqui só montamos a entrada,
 * calculamos a rota digitada (quando o Google está disponível) e convertemos a saída.
 */
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { registrarExibicao, type AnuncioCompleto } from "@/lib/anuncio-service";
import { calcularRota, type RotaCalculada } from "@/lib/rota-service";

export interface MatchingCriteria {
  tipoCarroceria: string;
  capacidadePeso?: number;
  capacidadeVolume?: number;
  origemCidade?: string;
  origemEstado?: string;
  destinoCidade?: string;
  destinoEstado?: string;
  dataInicio?: string;
  dataFim?: string;
  refrigerado: boolean;
}

export interface MatchingVeiculoCriteria {
  descricaoMercadoria: string;
  categoriaCarga?: string;
  pesoKg?: number;
  volumeM3?: number;
  origemCidade?: string;
  origemEstado?: string;
  destinoCidade?: string;
  destinoEstado?: string;
  dataInicio?: string;
  dataFim?: string;
  refrigerado: boolean;
  /** v3: coordenadas escolhidas no autocompletar (IBGE); usadas quando o Google não calcula a rota. */
  origemPonto?: { lat: number; lng: number } | null;
  destinoPonto?: { lat: number; lng: number } | null;
}

export interface ResultadoMatch {
  anuncios: AnuncioCompleto[];
  rota: RotaCalculada | null;
  modo: "rota" | "cidade" | "perto";
  /** Raio (km) usado na busca: a faixa ao redor da rota ou o círculo do "perto de mim". */
  raioKm: number | null;
  /** Centro da busca "perto de mim". */
  perto?: { lat: number; lng: number };
}

/* Converte um número do banco (numeric pode vir como texto) em number ou null. */
const num = (v: unknown): number | null => (v === null || v === undefined || v === "" ? null : Number(v));

/* Raio informado pelo banco no primeiro resultado (o mesmo para toda a busca). */
const raioDaBusca = (linhas: { raio_km: number | null }[] | null): number | null => num(linhas?.[0]?.raio_km);

/* Remove chaves vazias para o banco aplicar os padrões (janela de 30 dias, sem filtro etc.). */
function limpar(p: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(p).filter(([, v]) => v !== undefined && v !== null && v !== ""));
}

/* Entrada de vt_match_cargas a partir do formulário do motorista e da rota calculada. */
export function montarEntradaCargas(c: MatchingCriteria, rota: RotaCalculada | null): Record<string, unknown> {
  return limpar({
    tipo_carroceria: c.tipoCarroceria,
    refrigerado: c.refrigerado,
    capacidade_kg: c.capacidadePeso,
    capacidade_m3: c.capacidadeVolume,
    origem_cidade: c.origemCidade,
    origem_uf: c.origemEstado,
    destino_cidade: c.destinoCidade,
    destino_uf: c.destinoEstado,
    data_inicio: c.dataInicio,
    data_fim: c.dataFim,
    polyline: rota?.polyline,
  });
}

/* Entrada do "perto de mim" (M5): cargas com coleta a até "km" do ponto, para o caminhão informado. */
export function montarEntradaPerto(
  c: Pick<MatchingCriteria, "tipoCarroceria" | "refrigerado" | "capacidadePeso" | "capacidadeVolume" | "dataInicio" | "dataFim">,
  ponto: { lat: number; lng: number },
  km: number,
): Record<string, unknown> {
  return limpar({
    tipo_carroceria: c.tipoCarroceria,
    refrigerado: c.refrigerado,
    capacidade_kg: c.capacidadePeso,
    capacidade_m3: c.capacidadeVolume,
    data_inicio: c.dataInicio,
    data_fim: c.dataFim,
    perto_lat: ponto.lat,
    perto_lng: ponto.lng,
    perto_km: km,
  });
}

/* Entrada de vt_match_veiculos a partir do formulário da empresa e da rota calculada. */
export function montarEntradaVeiculos(c: MatchingVeiculoCriteria, rota: RotaCalculada | null): Record<string, unknown> {
  return limpar({
    categoria_carga: c.categoriaCarga,
    exige_refrigeracao: c.refrigerado,
    peso_kg: c.pesoKg,
    volume_m3: c.volumeM3,
    origem_cidade: c.origemCidade,
    origem_uf: c.origemEstado,
    destino_cidade: c.destinoCidade,
    destino_uf: c.destinoEstado,
    data_inicio: c.dataInicio,
    data_fim: c.dataFim,
    origem_lat: rota?.origem.lat ?? c.origemPonto?.lat,
    origem_lng: rota?.origem.lng ?? c.origemPonto?.lng,
    destino_lat: rota?.destino.lat ?? c.destinoPonto?.lat,
    destino_lng: rota?.destino.lng ?? c.destinoPonto?.lng,
  });
}

/* Calcula a rota digitada somente quando origem e destino estão completos. */
async function rotaDoFormulario(c: { origemCidade?: string; origemEstado?: string; destinoCidade?: string; destinoEstado?: string }) {
  if (!c.origemCidade || !c.origemEstado || !c.destinoCidade || !c.destinoEstado) return null;
  return calcularRota(
    { cidade: c.origemCidade, uf: c.origemEstado },
    { cidade: c.destinoCidade, uf: c.destinoEstado },
  );
}

type LinhaCarga = Database["public"]["Functions"]["vt_match_cargas"]["Returns"][number];

/* Converte a linha de vt_match_cargas no formato do card. */
function cargaDoMatch(r: LinhaCarga): AnuncioCompleto {
  return {
    id: r.anuncio_id,
    tipo_anuncio: "C",
    origem_cidade: r.origem_cidade,
    origem_estado: r.origem_estado,
    destino_cidade: r.destino_cidade,
    destino_estado: r.destino_estado,
    tipo_veiculo: null,
    tipo_carroceria: null,
    refrigerado: r.exige_refrigeracao,
    descricao_mercadoria: r.descricao_mercadoria,
    valor_sugerido: r.valor_sugerido,
    data_inicio: r.data_inicio,
    data_fim: r.data_fim,
    nome_usuario: r.nome_usuario,
    telefone: "",
    created_at: r.created_at,
    foto_url: r.foto_url,
    categoria_carga: r.categoria_carga,
    peso_kg: r.peso_kg,
    volume_m3: r.volume_m3,
    score: r.score,
    motivos: r.motivos ?? [],
    desvio_km: r.desvio_km,
    modo_match: r.modo ?? null,
    raio_km: num(r.raio_km),
    km_coleta: num(r.km_coleta),
    desvio_estrada_km: num(r.desvio_estrada_km),
    origem_lat: num(r.origem_lat),
    origem_lng: num(r.origem_lng),
    destino_lat: num(r.destino_lat),
    destino_lng: num(r.destino_lng),
  };
}

/* Motorista busca cargas que cabem no caminho, no sentido e na data do veículo. */
export async function buscarCargasCompativeis(criteria: MatchingCriteria): Promise<ResultadoMatch> {
  const rota = await rotaDoFormulario(criteria);
  const { data, error } = await supabase.rpc("vt_match_cargas", { p: montarEntradaCargas(criteria, rota) as never });
  if (error) throw error;
  const anuncios = (data ?? []).map(cargaDoMatch);
  registrarExibicao(anuncios);
  return { anuncios, rota, modo: rota ? "rota" : "cidade", raioKm: raioDaBusca(data) };
}

/* "Perto de mim" (M5): cargas com coleta a até "km" da posição do motorista. */
export async function buscarCargasPerto(
  criteria: Pick<MatchingCriteria, "tipoCarroceria" | "refrigerado" | "capacidadePeso" | "capacidadeVolume" | "dataInicio" | "dataFim">,
  ponto: { lat: number; lng: number },
  km: number,
): Promise<ResultadoMatch> {
  const { data, error } = await supabase.rpc("vt_match_cargas", { p: montarEntradaPerto(criteria, ponto, km) as never });
  if (error) throw error;
  const anuncios = (data ?? []).map(cargaDoMatch);
  registrarExibicao(anuncios);
  return { anuncios, rota: null, modo: "perto", raioKm: km, perto: ponto };
}

/* Empresa busca veículos cuja rota passa pela origem e pelo destino da carga, nessa ordem. */
export async function buscarVeiculosCompativeis(criteria: MatchingVeiculoCriteria): Promise<ResultadoMatch> {
  const rota = await rotaDoFormulario(criteria);
  const { data, error } = await supabase.rpc("vt_match_veiculos", { p: montarEntradaVeiculos(criteria, rota) as never });
  if (error) throw error;
  const anuncios: AnuncioCompleto[] = (data ?? []).map((r) => ({
    id: r.anuncio_id,
    tipo_anuncio: "V",
    origem_cidade: r.origem_cidade,
    origem_estado: r.origem_estado,
    destino_cidade: r.destino_cidade,
    destino_estado: r.destino_estado,
    tipo_veiculo: r.tipo_veiculo,
    tipo_carroceria: r.tipo_carroceria,
    refrigerado: r.refrigerado,
    descricao_mercadoria: null,
    valor_sugerido: r.valor_sugerido,
    data_inicio: r.data_inicio,
    data_fim: r.data_fim,
    nome_usuario: r.nome_usuario,
    telefone: "",
    created_at: r.created_at,
    foto_url: r.foto_url,
    capacidade_peso_kg: r.capacidade_peso_kg,
    capacidade_volume_m3: r.capacidade_volume_m3,
    score: r.score,
    motivos: r.motivos ?? [],
    desvio_km: r.desvio_km,
    modo_match: r.modo ?? null,
    raio_km: num(r.raio_km),
    km_coleta: num(r.km_coleta),
    desvio_estrada_km: num(r.desvio_estrada_km),
    frete_retorno: r.frete_retorno === true,
    origem_lat: num(r.origem_lat),
    origem_lng: num(r.origem_lng),
    destino_lat: num(r.destino_lat),
    destino_lng: num(r.destino_lng),
  }));
  registrarExibicao(anuncios);
  const pelaRota = anuncios.some((a) => a.modo_match === "rota") || (!!rota || !!(criteria.origemPonto && criteria.destinoPonto));
  return { anuncios, rota, modo: pelaRota ? "rota" : "cidade", raioKm: null };
}

/* Faixa de qualidade do score, usada na cor e no texto do selo. */
export function faixaScore(score: number): { rotulo: string; tom: "alto" | "medio" | "baixo" } {
  if (score >= 75) return { rotulo: "Ótimo encaixe", tom: "alto" };
  if (score >= 55) return { rotulo: "Bom encaixe", tom: "medio" };
  return { rotulo: "Encaixe parcial", tom: "baixo" };
}

/* Fim de matching-service.ts */
