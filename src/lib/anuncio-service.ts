/*
 * anuncio-service.ts — criação, listagem e gestão de anúncios da plataforma Volta Express.
 * A criação é transacional no banco (vt_criar_anuncio) e grava a rota para o Match v2.
 * O telefone do anunciante só é liberado por vt_registrar_interesse, que registra o contato (P1/M2).
 */
import { supabase } from "@/integrations/supabase/client";
import type { RotaCalculada } from "@/lib/rota-service";

export interface AnuncioCompleto {
  id: string;
  tipo_anuncio: string;
  origem_cidade: string;
  origem_estado: string;
  destino_cidade: string;
  destino_estado: string;
  tipo_veiculo: string | null;
  tipo_carroceria: string | null;
  refrigerado: boolean;
  descricao_mercadoria: string | null;
  valor_sugerido: number | null;
  data_inicio: string;
  data_fim: string;
  nome_usuario: string;
  telefone: string;
  created_at: string;
  foto_url?: string | null;
  status?: string;
  distancia_km?: number | null;
  categoria_carga?: string | null;
  peso_kg?: number | null;
  volume_m3?: number | null;
  capacidade_peso_kg?: number | null;
  capacidade_volume_m3?: number | null;
  score?: number;
  motivos?: string[];
  desvio_km?: number | null;
  /* Match v3: coordenadas (mapa), modo do match, km da coleta, desvio estimado na estrada e frete de retorno. */
  origem_lat?: number | null;
  origem_lng?: number | null;
  destino_lat?: number | null;
  destino_lng?: number | null;
  modo_match?: string | null;
  raio_km?: number | null;
  km_coleta?: number | null;
  desvio_estrada_km?: number | null;
  frete_retorno?: boolean;
}

export interface DadosRota {
  origemCidade: string;
  origemEstado: string;
  destinoCidade: string;
  destinoEstado: string;
  dataInicio: string;
  dataFim: string;
  valorSugerido?: number;
  rota?: RotaCalculada | null;
}

export interface DadosVeiculo extends DadosRota {
  placa: string;
  tipoVeiculo: string;
  capacidadePeso?: number;
  capacidadeVolume?: number;
  tipoCarroceria?: string;
  refrigerado: boolean;
}

export interface DadosCarga extends DadosRota {
  descricao: string;
  tipoMercadoria?: string;
  categoriaCarga?: string;
  exigeRefrigeracao?: boolean;
  peso?: number;
  volume?: number;
}

export interface PainelUsuario {
  anuncios_ativos: number;
  km_anunciados: number;
  interesses_recebidos_30d: number;
  interesses_enviados_30d: number;
  exibicoes_30d: number;
  /** v3 (migração frete fechado). Ausente se a migração ainda não foi aplicada. */
  fretes_fechados_30d?: number;
}

export type StatusAnuncio = "ATIVO" | "PAUSADO" | "ENCERRADO";

/* Data de hoje no formato do banco (AAAA-MM-DD), no fuso do navegador. */
export function hojeISO(agora: Date = new Date()): string {
  const d = new Date(agora.getTime() - agora.getTimezoneOffset() * 60000);
  return d.toISOString().slice(0, 10);
}

/* Parte comum do payload: trajeto, datas, valor e a rota calculada (quando existir). */
function payloadRota(dados: DadosRota): Record<string, unknown> {
  const p: Record<string, unknown> = {
    origem_cidade: dados.origemCidade,
    origem_uf: dados.origemEstado,
    destino_cidade: dados.destinoCidade,
    destino_uf: dados.destinoEstado,
    data_inicio: dados.dataInicio,
    data_fim: dados.dataFim,
    valor: dados.valorSugerido ?? null,
  };
  if (dados.rota) {
    p.polyline = dados.rota.polyline;
    p.distancia_km = dados.rota.distanciaKm;
    p.origem_lat = dados.rota.origem.lat;
    p.origem_lng = dados.rota.origem.lng;
    p.destino_lat = dados.rota.destino.lat;
    p.destino_lng = dados.rota.destino.lng;
  }
  return p;
}

/* Payload do anúncio de veículo enviado a vt_criar_anuncio. */
export function montarPayloadVeiculo(dados: DadosVeiculo): Record<string, unknown> {
  return {
    tipo: "V",
    ...payloadRota(dados),
    placa: dados.placa,
    tipo_veiculo: dados.tipoVeiculo,
    capacidade_kg: dados.capacidadePeso ?? null,
    capacidade_m3: dados.capacidadeVolume ?? null,
    tipo_carroceria: dados.tipoCarroceria ?? null,
    refrigerado: dados.refrigerado,
  };
}

/* Payload do anúncio de carga enviado a vt_criar_anuncio. */
export function montarPayloadCarga(dados: DadosCarga): Record<string, unknown> {
  return {
    tipo: "C",
    ...payloadRota(dados),
    descricao: dados.descricao,
    tipo_mercadoria: dados.tipoMercadoria ?? null,
    categoria_carga: dados.categoriaCarga ?? null,
    exige_refrigeracao: dados.exigeRefrigeracao ?? dados.categoriaCarga === "Refrigerada",
    peso_kg: dados.peso ?? null,
    volume_m3: dados.volume ?? null,
  };
}

/* Cria o anúncio de veículo numa única transação (reaproveita o veículo pela placa). */
export async function criarAnuncioVeiculo(_userId: string, dados: DadosVeiculo): Promise<string> {
  const { data, error } = await supabase.rpc("vt_criar_anuncio", { p: montarPayloadVeiculo(dados) as never });
  if (error) throw error;
  return data;
}

/* Cria o anúncio de carga numa única transação. */
export async function criarAnuncioCarga(_userId: string, dados: DadosCarga): Promise<string> {
  const { data, error } = await supabase.rpc("vt_criar_anuncio", { p: montarPayloadCarga(dados) as never });
  if (error) throw error;
  return data;
}

type LinhaAnuncio = {
  id: string;
  tipo_anuncio: string;
  valor_sugerido: number | null;
  data_disponivel_inicio: string;
  data_disponivel_fim: string;
  created_at: string;
  veiculo_id: string | null;
  mercadoria_id: string | null;
  origem_id: string | null;
  destino_id: string | null;
  user_id: string;
  status: string;
  distancia_km: number | null;
};

const COLUNAS_ANUNCIO =
  "id, tipo_anuncio, valor_sugerido, data_disponivel_inicio, data_disponivel_fim, created_at, veiculo_id, mercadoria_id, origem_id, destino_id, user_id, status, distancia_km";

/* Completa os anúncios com localizações, veículo, carroceria, mercadoria e anunciante. */
async function hidratar(anuncios: LinhaAnuncio[]): Promise<AnuncioCompleto[]> {
  if (anuncios.length === 0) return [];
  const locIds = [...new Set(anuncios.flatMap((a) => [a.origem_id, a.destino_id]).filter(Boolean))] as string[];
  const veiculoIds = [...new Set(anuncios.map((a) => a.veiculo_id).filter(Boolean))] as string[];
  const mercadoriaIds = [...new Set(anuncios.map((a) => a.mercadoria_id).filter(Boolean))] as string[];
  const userIds = [...new Set(anuncios.map((a) => a.user_id))];

  const [locRes, veiRes, carRes, merRes, usrRes] = await Promise.all([
    locIds.length > 0 ? supabase.from("vt_localizacao").select("*").in("id", locIds) : { data: [], error: null },
    veiculoIds.length > 0 ? supabase.from("vt_veiculo").select("*").in("id", veiculoIds) : { data: [], error: null },
    veiculoIds.length > 0 ? supabase.from("vt_carroceria").select("*").in("veiculo_id", veiculoIds) : { data: [], error: null },
    mercadoriaIds.length > 0 ? supabase.from("vt_mercadoria").select("*").in("id", mercadoriaIds) : { data: [], error: null },
    userIds.length > 0 ? supabase.rpc("vt_anunciantes", { ids: userIds }) : { data: [], error: null },
  ]);

  const locs = new Map((locRes.data ?? []).map((l) => [l.id, l]));
  const veis = new Map((veiRes.data ?? []).map((v) => [v.id, v]));
  const carrs = new Map((carRes.data ?? []).map((c) => [c.veiculo_id, c]));
  const mercs = new Map((merRes.data ?? []).map((m) => [m.id, m]));
  const users = new Map((usrRes.data ?? []).map((u) => [u.user_id, u]));

  return anuncios.map((a) => {
    const origem = a.origem_id ? locs.get(a.origem_id) : null;
    const destino = a.destino_id ? locs.get(a.destino_id) : null;
    const veiculo = a.veiculo_id ? veis.get(a.veiculo_id) : null;
    const carroceria = a.veiculo_id ? carrs.get(a.veiculo_id) : null;
    const mercadoria = a.mercadoria_id ? mercs.get(a.mercadoria_id) : null;
    const usuario = users.get(a.user_id);

    return {
      id: a.id,
      tipo_anuncio: a.tipo_anuncio,
      origem_cidade: origem?.cidade ?? "",
      origem_estado: origem?.estado ?? "",
      destino_cidade: destino?.cidade ?? "",
      destino_estado: destino?.estado ?? "",
      origem_lat: origem?.latitude ?? null,
      origem_lng: origem?.longitude ?? null,
      destino_lat: destino?.latitude ?? null,
      destino_lng: destino?.longitude ?? null,
      tipo_veiculo: veiculo?.tipo_veiculo ?? null,
      tipo_carroceria: carroceria?.tipo_carroceria ?? null,
      refrigerado: carroceria?.refrigerado ?? mercadoria?.exige_refrigeracao ?? false,
      descricao_mercadoria: mercadoria?.descricao ?? null,
      valor_sugerido: a.valor_sugerido,
      data_inicio: a.data_disponivel_inicio,
      data_fim: a.data_disponivel_fim,
      nome_usuario: usuario?.nome ?? "Anunciante",
      telefone: "",
      created_at: a.created_at,
      foto_url: usuario?.foto_url ?? null,
      status: a.status,
      distancia_km: a.distancia_km,
      categoria_carga: mercadoria?.categoria_carga ?? null,
      peso_kg: mercadoria?.peso_kg ?? null,
      volume_m3: mercadoria?.volume_m3 ?? null,
      capacidade_peso_kg: veiculo?.capacidade_peso_kg ?? null,
      capacidade_volume_m3: veiculo?.capacidade_volume_m3 ?? null,
    };
  });
}

/* Anúncios ativos e dentro da validade, para a vitrine e a busca. */
export async function buscarAnuncios(): Promise<AnuncioCompleto[]> {
  const { data, error } = await supabase
    .from("vt_anuncio")
    .select(COLUNAS_ANUNCIO)
    .eq("status", "ATIVO")
    .gte("data_disponivel_fim", hojeISO())
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return hidratar((data ?? []) as LinhaAnuncio[]);
}

/* Todos os anúncios do próprio usuário (qualquer status), para o painel. */
export async function buscarMeusAnuncios(userId: string): Promise<AnuncioCompleto[]> {
  const { data, error } = await supabase
    .from("vt_anuncio")
    .select(COLUNAS_ANUNCIO)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return hidratar((data ?? []) as LinhaAnuncio[]);
}

/* Dados para pré-preencher a volta de um anúncio de caminhão do próprio usuário (Q5). */
export interface BaseVolta {
  placa: string;
  tipoVeiculo: string;
  capacidadePeso: number | null;
  capacidadeVolume: number | null;
  tipoCarroceria: string;
  refrigerado: boolean;
  origemCidade: string;
  origemEstado: string;
  destinoCidade: string;
  destinoEstado: string;
  dataInicio: string;
  dataFim: string;
}

/* Datas da volta: começa quando a ida termina (ou hoje) e dura o mesmo que a ida, no mínimo 1 dia. */
export function datasDaVolta(idaInicio: string, idaFim: string, hoje = hojeISO()): { inicio: string; fim: string } {
  const dia = 86400000;
  const ms = (d: string) => Date.parse(`${d}T00:00:00Z`);
  const inicio = Math.max(ms(idaFim), ms(hoje));
  const duracao = Math.max(ms(idaFim) - ms(idaInicio), dia);
  const iso = (t: number) => new Date(t).toISOString().slice(0, 10);
  return { inicio: iso(inicio), fim: iso(inicio + duracao) };
}

/* Carrega o anúncio de caminhão (do próprio usuário) e devolve a volta: origem e destino invertidos. */
export async function carregarBaseVolta(anuncioId: string): Promise<BaseVolta | null> {
  const { data, error } = await supabase
    .from("vt_anuncio")
    .select(COLUNAS_ANUNCIO)
    .eq("id", anuncioId)
    .eq("tipo_anuncio", "V")
    .maybeSingle();
  if (error || !data) return null;
  const linha = data as LinhaAnuncio;
  const [completo] = await hidratar([linha]);
  if (!completo || !linha.veiculo_id) return null;
  const { data: veiculo } = await supabase.from("vt_veiculo").select("placa").eq("id", linha.veiculo_id).maybeSingle();
  const datas = datasDaVolta(completo.data_inicio, completo.data_fim);
  return {
    placa: veiculo?.placa ?? "",
    tipoVeiculo: completo.tipo_veiculo ?? "",
    capacidadePeso: completo.capacidade_peso_kg ?? null,
    capacidadeVolume: completo.capacidade_volume_m3 ?? null,
    tipoCarroceria: completo.tipo_carroceria ?? "",
    refrigerado: completo.refrigerado,
    origemCidade: completo.destino_cidade,
    origemEstado: completo.destino_estado.trim(),
    destinoCidade: completo.origem_cidade,
    destinoEstado: completo.origem_estado.trim(),
    dataInicio: datas.inicio,
    dataFim: datas.fim,
  };
}

/* Pausa, reativa ou encerra um anúncio do próprio usuário. */
export async function alterarStatusAnuncio(anuncioId: string, status: StatusAnuncio): Promise<void> {
  const { error } = await supabase.from("vt_anuncio").update({ status }).eq("id", anuncioId);
  if (error) throw error;
}

/*
 * v3 (T3.5): encerra o anúncio informando se o frete foi fechado pela Volta Express.
 * Se a migração v3 ainda não estiver aplicada no banco, encerra do jeito antigo (sem registrar o "fechado").
 */
export async function encerrarAnuncio(anuncioId: string, freteFechado: boolean): Promise<{ registrouFechado: boolean }> {
  const { error } = await supabase.rpc("vt_encerrar_anuncio", { p_anuncio: anuncioId, p_fechado: freteFechado });
  if (!error) return { registrouFechado: freteFechado };
  const semFuncao = error.code === "PGRST202" || /could not find the function|does not exist/i.test(error.message ?? "");
  if (!semFuncao) throw error;
  await alterarStatusAnuncio(anuncioId, "ENCERRADO");
  return { registrouFechado: false };
}

/* v3 (T3.3): "Vence hoje", "Vence amanhã", "Vence em 5 dias" — ou vazio se já venceu. */
export function textoValidade(dataFim: string, hoje = hojeISO()): string {
  const dias = Math.round((Date.parse(`${dataFim}T00:00:00Z`) - Date.parse(`${hoje}T00:00:00Z`)) / 86400000);
  if (Number.isNaN(dias) || dias < 0) return "";
  if (dias === 0) return "Vence hoje";
  if (dias === 1) return "Vence amanhã";
  return `Vence em ${dias} dias`;
}

/* Indicadores do painel do usuário logado. */
export async function carregarPainel(): Promise<PainelUsuario | null> {
  const { data, error } = await supabase.rpc("vt_meu_painel");
  if (error) throw error;
  return (data as unknown as PainelUsuario) ?? null;
}

/* Registra o interesse no anúncio e devolve o telefone do anunciante. */
export async function registrarInteresse(anuncioId: string, score?: number): Promise<string> {
  const { data, error } = await supabase.rpc("vt_registrar_interesse", { p_anuncio: anuncioId, p_score: score });
  if (error) throw error;
  return data ?? "";
}

/* Registra que os anúncios foram exibidos num resultado de match (não bloqueia a tela). */
export function registrarExibicao(anuncios: AnuncioCompleto[]): void {
  if (anuncios.length === 0) return;
  const linhas = anuncios.map((a) => ({ anuncio_id: a.id, tipo: "exibido", score: a.score ?? null }));
  supabase.from("vt_match_evento").insert(linhas).then(({ error }) => {
    if (error) console.warn("Não foi possível registrar a exibição:", error.message);
  });
}

/* Link do WhatsApp com DDI 55 e mensagem de contexto do anúncio. */
export function linkWhatsApp(telefone: string, anuncio: Pick<AnuncioCompleto, "origem_cidade" | "destino_cidade">): string {
  let phone = telefone.replace(/\D/g, "");
  if (phone && !phone.startsWith("55")) phone = "55" + phone;
  const mensagem = encodeURIComponent(
    `Olá! Vi o seu anúncio ${anuncio.origem_cidade} → ${anuncio.destino_cidade} na Volta Express e tenho interesse.`,
  );
  return `https://api.whatsapp.com/send?phone=${phone}&text=${mensagem}`;
}

/* Status exibido: um anúncio ATIVO com data fim no passado aparece como expirado. */
export function statusExibido(a: Pick<AnuncioCompleto, "status" | "data_fim">, hoje = hojeISO()): string {
  if (a.status === "ATIVO" && a.data_fim < hoje) return "EXPIRADO";
  return a.status ?? "ATIVO";
}

/* Fim de anuncio-service.ts */
