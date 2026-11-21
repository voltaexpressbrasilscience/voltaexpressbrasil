/*
 * geo.ts — funções de geografia sem dependência do Google (testáveis).
 * Match v3 (M1/M2): o mapa desenha a rota já gravada (polyline) em vez de pedir outra ao Google,
 * e a faixa de busca é desenhada com a mesma largura (raio) que o banco usou.
 */

export interface Ponto {
  lat: number;
  lng: number;
}

/* Decodifica uma polyline no formato do Google (precisão 5) em pontos. */
export function decodificarPolyline(codigo: string): Ponto[] {
  const pontos: Ponto[] = [];
  let i = 0;
  let lat = 0;
  let lng = 0;
  while (i < codigo.length) {
    const delta: number[] = [];
    for (let k = 0; k < 2; k++) {
      let resultado = 0;
      let deslocamento = 0;
      let byte: number;
      do {
        if (i >= codigo.length) return pontos;
        byte = codigo.charCodeAt(i++) - 63;
        resultado |= (byte & 0x1f) << deslocamento;
        deslocamento += 5;
      } while (byte >= 0x20);
      delta.push(resultado & 1 ? ~(resultado >> 1) : resultado >> 1);
    }
    lat += delta[0];
    lng += delta[1];
    pontos.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return pontos;
}

/* Distância em km entre dois pontos (fórmula de haversine). */
export function distanciaKm(a: Ponto, b: Ponto): number {
  const r = 6371.0088;
  const rad = (g: number) => (g * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(h));
}

/* Metros representados por 1 pixel do mapa (projeção Web Mercator) na latitude e no zoom dados. */
export function metrosPorPixel(lat: number, zoom: number): number {
  return (156543.03392 * Math.cos((lat * Math.PI) / 180)) / 2 ** zoom;
}

/* Largura (px) do traço que desenha a faixa de busca de "raioKm" para cada lado da rota. */
export function larguraFaixaPx(raioKm: number, lat: number, zoom: number, maximo = 600): number {
  if (!(raioKm > 0)) return 0;
  return Math.min(maximo, Math.max(2, (2 * raioKm * 1000) / metrosPorPixel(lat, zoom)));
}

/* Limites (sul-oeste e norte-leste) que contêm todos os pontos; null se a lista estiver vazia. */
export function limites(pontos: Ponto[]): { sw: Ponto; ne: Ponto } | null {
  if (pontos.length === 0) return null;
  let s = Infinity;
  let w = Infinity;
  let n = -Infinity;
  let e = -Infinity;
  for (const p of pontos) {
    s = Math.min(s, p.lat);
    n = Math.max(n, p.lat);
    w = Math.min(w, p.lng);
    e = Math.max(e, p.lng);
  }
  return { sw: { lat: s, lng: w }, ne: { lat: n, lng: e } };
}

/* Converte um valor do banco (numeric pode vir como texto) em número, ou null. */
export function coordenada(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/* Ponto a partir de latitude e longitude do banco, ou null se faltar alguma. */
export function pontoDe(lat: unknown, lng: unknown): Ponto | null {
  const a = coordenada(lat);
  const b = coordenada(lng);
  return a === null || b === null ? null : { lat: a, lng: b };
}

/* Fim de geo.ts */
