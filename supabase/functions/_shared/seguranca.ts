/*
 * seguranca.ts — proteção comum às Edge Functions da Volta Express (P2).
 * CORS só para as origens permitidas, exigência de usuário logado,
 * limite de chamadas por usuário (por instância) e validação de entrada.
 * Origens: variável ALLOWED_ORIGINS (separadas por vírgula) ou a lista padrão.
 */

const ORIGENS_PADRAO = [
  "https://voltaexpress.com.br",
  "https://www.voltaexpress.com.br",
  "http://localhost:8080",
];

const LIMITE_POR_MINUTO = 30;
const chamadas = new Map<string, number[]>();

/* Lista de origens permitidas, lida do ambiente quando configurada. */
export function origensPermitidas(): string[] {
  const env = Deno.env.get("ALLOWED_ORIGINS");
  if (!env) return ORIGENS_PADRAO;
  return env.split(",").map((o) => o.trim()).filter(Boolean);
}

/* Cabeçalhos CORS devolvendo a própria origem apenas quando ela é permitida. */
export function cabecalhosCors(req: Request): Record<string, string> {
  const origem = req.headers.get("origin") ?? "";
  const permitidas = origensPermitidas();
  return {
    "Access-Control-Allow-Origin": permitidas.includes(origem) ? origem : permitidas[0],
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

/* Resposta JSON com os cabeçalhos CORS. */
export function responder(req: Request, corpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { ...cabecalhosCors(req), "Content-Type": "application/json" },
  });
}

/* Recusa navegadores de origens não permitidas (chamadas sem Origin, como curl, seguem para a checagem de login). */
export function origemRecusada(req: Request): boolean {
  const origem = req.headers.get("origin");
  return origem !== null && !origensPermitidas().includes(origem);
}

/* Confere no Supabase Auth se o token é de um usuário logado; devolve o id ou null. */
export async function usuarioLogado(req: Request): Promise<string | null> {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.replace(/^Bearer\s+/i, "");
  const url = Deno.env.get("SUPABASE_URL");
  const chave = Deno.env.get("SUPABASE_ANON_KEY");
  if (!token || !url || !chave) return null;
  const res = await fetch(`${url}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: chave },
  });
  if (!res.ok) return null;
  const usuario = await res.json();
  return typeof usuario?.id === "string" ? usuario.id : null;
}

/* Limite simples de chamadas por usuário por minuto, mantido na memória da instância. */
export function excedeuLimite(usuarioId: string): boolean {
  const agora = Date.now();
  const recentes = (chamadas.get(usuarioId) ?? []).filter((t) => agora - t < 60_000);
  recentes.push(agora);
  chamadas.set(usuarioId, recentes);
  return recentes.length > LIMITE_POR_MINUTO;
}

/* Valida origem e destino recebidos no corpo da requisição. */
export function lerOrigemDestino(corpo: unknown): { origin: string; destination: string } | null {
  const c = corpo as { origin?: unknown; destination?: unknown } | null;
  const origin = typeof c?.origin === "string" ? c.origin.trim() : "";
  const destination = typeof c?.destination === "string" ? c.destination.trim() : "";
  if (!origin || !destination || origin.length > 200 || destination.length > 200) return null;
  return { origin, destination };
}

/* Porteiro comum: trata OPTIONS, origem, login, limite e corpo; devolve os dados ou a resposta de erro. */
export async function validarRequisicao(
  req: Request,
): Promise<{ dados: { origin: string; destination: string } } | { erro: Response }> {
  if (req.method === "OPTIONS") return { erro: new Response(null, { headers: cabecalhosCors(req) }) };
  if (req.method !== "POST") return { erro: responder(req, { error: "Método não permitido" }, 405) };
  if (origemRecusada(req)) return { erro: responder(req, { error: "Origem não permitida" }, 403) };
  const usuarioId = await usuarioLogado(req);
  if (!usuarioId) return { erro: responder(req, { error: "É preciso estar logado" }, 401) };
  if (excedeuLimite(usuarioId)) return { erro: responder(req, { error: "Muitas requisições; tente em 1 minuto" }, 429) };
  let corpo: unknown = null;
  try {
    corpo = await req.json();
  } catch {
    corpo = null;
  }
  const dados = lerOrigemDestino(corpo);
  if (!dados) return { erro: responder(req, { error: "origin e destination são obrigatórios (até 200 caracteres)" }, 400) };
  return { dados };
}

/* Fim de seguranca.ts */
