/*
 * geo-service.ts — consultas de geografia no banco (Match v3).
 * Municípios do IBGE para autocompletar (M3) e rota gravada do anúncio para o mapa (M1).
 * Tudo degrada sem erro: se a migração M3 ou a base do IBGE ainda não existirem, devolve vazio.
 */
import { supabase } from "@/integrations/supabase/client";

export interface Municipio {
  codigoIbge: number;
  nome: string;
  uf: string;
  lat: number;
  lng: number;
}

/* Sugestões de município para o texto digitado (mínimo de 2 letras). */
export async function buscarMunicipios(texto: string, uf?: string, limite = 8): Promise<Municipio[]> {
  const q = texto.trim();
  if (q.length < 2) return [];
  const { data, error } = await supabase.rpc("vt_buscar_municipios", {
    q,
    p_uf: uf && uf !== "all" ? uf : undefined,
    p_limite: limite,
  });
  if (error || !data) return [];
  return data.map((m) => ({
    codigoIbge: m.codigo_ibge,
    nome: m.nome,
    uf: m.uf,
    lat: Number(m.latitude),
    lng: Number(m.longitude),
  }));
}

/* Rota gravada no anúncio (polyline), ou null se não houver ou a função ainda não existir. */
export async function buscarRotaAnuncio(anuncioId: string): Promise<string | null> {
  const { data, error } = await supabase.rpc("vt_rota_anuncio", { p_anuncio: anuncioId });
  if (error || !data) return null;
  return data;
}

/* Posição atual do aparelho (pede permissão ao navegador). */
export function posicaoAtual(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Seu navegador não informa a localização."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => reject(new Error("Não foi possível obter sua localização. Verifique a permissão do navegador.")),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  });
}

/* Fim de geo-service.ts */
