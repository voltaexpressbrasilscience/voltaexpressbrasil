/**
 * erros.ts — traduz erros técnicos (Supabase, rede, banco) em mensagens claras para o usuário.
 * v3 (T1.3): nenhuma tela mostra texto técnico em inglês ou código de erro.
 *
 * As mensagens que as funções do banco já levantam em português (ex.: "A data fim já passou.")
 * são mantidas como estão: foram escritas para o usuário.
 */

type ErroComMensagem = { message?: unknown; code?: unknown };

/** Pega o texto do erro, seja Error, erro do Supabase ({ message, code }) ou string. */
export function textoDoErro(err: unknown): string {
  if (!err) return "";
  if (typeof err === "string") return err;
  const msg = (err as ErroComMensagem).message;
  return typeof msg === "string" ? msg : "";
}

const TRADUCOES: Array<[RegExp, string]> = [
  [/failed to fetch|networkerror|load failed|network request failed/i, "Sem conexão com o servidor. Confira a internet e tente de novo."],
  [/invalid login credentials/i, "E-mail ou senha incorretos."],
  [/email not confirmed/i, "Confirme seu e-mail pelo link que enviamos antes de entrar."],
  [/user already registered|already been registered/i, "Já existe uma conta com este e-mail. Entre ou recupere a senha."],
  [/vt_usuario_documento_key|duplicate key.*documento/i, "Este CPF já está cadastrado. Entre com a conta existente ou recupere a senha."],
  [/vt_usuario_cnpj|duplicate key.*cnpj/i, "Este CNPJ já está ligado a outra conta."],
  [/password should be at least|password.*(short|characters)/i, "A senha precisa ter pelo menos 6 caracteres."],
  [/same.*password|new password should be different/i, "A nova senha precisa ser diferente da atual."],
  [/rate limit|too many requests|security purposes/i, "Muitas tentativas seguidas. Aguarde um minuto e tente de novo."],
  [/jwt expired|invalid jwt|refresh token/i, "Sua sessão expirou. Entre de novo para continuar."],
  [/permission denied|not authorized|row-level security/i, "Você não tem permissão para esta ação. Entre com a conta certa."],
  [/does not exist|could not find the function/i, "Este recurso ainda não está disponível. Avise o suporte da Volta Express."],
  [/payload too large|exceeded the maximum allowed size/i, "Arquivo grande demais. Envie uma imagem de até 2 MB."],
  [/invalid input syntax|violates check constraint|value too long/i, "Algum campo está com formato inválido. Revise os dados e tente de novo."],
];

/** Mensagem pronta para o usuário. `padrao` é usado quando o erro não é reconhecido. */
export function mensagemErro(err: unknown, padrao = "Algo deu errado. Tente de novo em instantes."): string {
  const texto = textoDoErro(err).trim();
  if (!texto) return padrao;
  for (const [padraoErro, mensagem] of TRADUCOES) {
    if (padraoErro.test(texto)) return mensagem;
  }
  // Mensagens do próprio banco (RAISE EXCEPTION) já vêm em português e terminam com ponto.
  if (/[áéíóúãõç]/i.test(texto) && texto.length <= 160) return texto;
  return padrao;
}
