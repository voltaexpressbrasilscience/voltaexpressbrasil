/*
 * rota-service.ts — cálculo de rota pela Edge Function route-distance.
 * A rota (polyline + coordenadas de origem e destino) é gravada no anúncio e usada pelo Match v2.
 * Sem login ou sem a chave do Google, devolve null e a plataforma segue pelo filtro de cidades.
 */
import { supabase } from "@/integrations/supabase/client";

export interface Ponto {
  lat: number;
  lng: number;
}

export interface RotaCalculada {
  distanciaKm: number;
  duracaoTexto: string;
  polyline: string;
  origem: Ponto;
  destino: Ponto;
  valorSugerido: number;
}

export interface Local {
  cidade: string;
  uf: string;
}

/* Monta o texto de endereço enviado ao Google. */
export function enderecoLocal(local: Local): string {
  return `${local.cidade.trim()}, ${local.uf.trim()}, Brasil`;
}

/* Converte a resposta da Edge Function em RotaCalculada, ou null se estiver incompleta. */
export function lerRespostaRota(data: unknown): RotaCalculada | null {
  const d = data as {
    distanceKm?: number;
    durationText?: string;
    overviewPolyline?: string;
    startLocation?: Ponto;
    endLocation?: Ponto;
    suggestedValue?: number;
  } | null;
  if (!d || typeof d.distanceKm !== "number" || !d.overviewPolyline || !d.startLocation || !d.endLocation) return null;
  return {
    distanciaKm: d.distanceKm,
    duracaoTexto: d.durationText ?? "",
    polyline: d.overviewPolyline,
    origem: d.startLocation,
    destino: d.endLocation,
    valorSugerido: d.suggestedValue ?? 0,
  };
}

/* Calcula a rota entre dois locais; null quando não há cidade/UF completas ou a função falha. */
export async function calcularRota(origem: Local, destino: Local): Promise<RotaCalculada | null> {
  if (!origem.cidade || !origem.uf || !destino.cidade || !destino.uf) return null;
  try {
    const { data, error } = await supabase.functions.invoke("route-distance", {
      body: { origin: enderecoLocal(origem), destination: enderecoLocal(destino) },
    });
    if (error) return null;
    return lerRespostaRota(data);
  } catch {
    return null;
  }
}

/* Fim de rota-service.ts */
