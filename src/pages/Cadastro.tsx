/*
 * Cadastro.tsx — criação de conta.
 * v3: persona "Tenho caminhão" / "Tenho carga" (mesmos nomes da landing); CPF sempre obrigatório,
 * CNPJ opcional; aceite obrigatório da Política de Privacidade, gravado com data e versão.
 * v3.2: CPF, CNPJ e WhatsApp validados (src/lib/documentos.ts); o aceite inclui os Termos de Uso.
 * A persona pode vir da URL: /cadastro?perfil=caminhao ou /cadastro?perfil=carga.
 */
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { UserPlus, Mail, Lock, User, Phone, FileText, Building2, Truck, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import Header from "@/components/Header";
import logo from "@/assets/logo-volta-express.webp";
import { supabase } from "@/integrations/supabase/client";
import { mensagemErro } from "@/lib/erros";
import { PERSONAS, personaDoSlug, type CodigoPersona } from "@/lib/personas";
import { VERSAO_POLITICA, VERSAO_TERMOS } from "@/lib/privacidade";
import { erroDocumentos, soDigitos, whatsappParaGravar } from "@/lib/documentos";

const CadastroPage = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [tipoUsuario, setTipoUsuario] = useState<CodigoPersona | "">(personaDoSlug(params.get("perfil")));
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [password, setPassword] = useState("");
  const [aceite, setAceite] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tipoUsuario) {
      toast.error("Escolha se você tem caminhão ou tem carga.");
      return;
    }
    const erro = erroDocumentos({ cpf, cnpj, whatsapp: telefone });
    if (erro) {
      toast.error(erro);
      return;
    }
    if (!aceite) {
      toast.error("Para criar a conta, aceite os Termos de Uso e a Política de Privacidade.");
      return;
    }
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          nome: nome.trim(),
          tipo_usuario: tipoUsuario,
          documento: soDigitos(cpf),
          cnpj: soDigitos(cnpj),
          telefone: whatsappParaGravar(telefone),
          aceite_privacidade: "true",
          versao_politica: VERSAO_POLITICA,
          // Fica nos metadados da conta (auth.users) até existir coluna própria em vt_usuario.
          versao_termos: VERSAO_TERMOS,
        },
      },
    });

    setLoading(false);
    if (error) {
      toast.error("Não foi possível criar a conta", { description: mensagemErro(error) });
      return;
    }

    // O perfil (vt_usuario) é criado pelo gatilho handle_new_user no banco.
    toast.success("Conta criada!", { description: "Agora é só entrar com seu e-mail e senha." });
    setTimeout(() => navigate("/login"), 1500);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main id="conteudo" className="flex flex-1 items-center justify-center bg-muted/30 px-4 py-10">
        <Card className="w-full max-w-lg border-border shadow-elevated">
          <CardHeader className="items-center pb-2 text-center">
            <img src={logo} alt="Volta Express Brasil" className="mb-4 h-14 w-auto" />
            <CardTitle className="text-2xl">Criar conta</CardTitle>
            <p className="text-sm text-muted-foreground">Cadastro gratuito. Em 2 minutos você começa a anunciar.</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <fieldset>
                <legend className="text-sm font-medium">Como você vai usar a Volta Express?</legend>
                <div className="mt-2 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-required="true">
                  {(Object.keys(PERSONAS) as CodigoPersona[]).map((codigo) => {
                    const persona = PERSONAS[codigo];
                    const Icone = codigo === "C" ? Truck : Package;
                    const ativo = tipoUsuario === codigo;
                    return (
                      <button
                        key={codigo}
                        type="button"
                        role="radio"
                        aria-checked={ativo}
                        onClick={() => setTipoUsuario(codigo)}
                        className={`flex min-h-24 flex-col items-start gap-1 rounded-lg border-2 p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                          ativo ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                        }`}
                      >
                        <span className="flex items-center gap-2 font-semibold text-foreground">
                          <Icone className="h-5 w-5 text-primary" aria-hidden="true" />
                          {persona.titulo}
                        </span>
                        <span className="text-xs text-muted-foreground">{persona.descricao}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Qualquer conta pode anunciar caminhão ou carga. A escolha só define a tela que abre primeiro.
                </p>
              </fieldset>

              <div>
                <Label htmlFor="nome">Nome completo do responsável</Label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <Input id="nome" autoComplete="name" placeholder="João da Silva" className="pl-10" required value={nome} onChange={(e) => setNome(e.target.value)} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="cpf">CPF</Label>
                  <div className="relative mt-1">
                    <FileText className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                    <Input id="cpf" inputMode="numeric" placeholder="000.000.000-00" className="pl-10" required value={cpf} onChange={(e) => setCpf(e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="cnpj">
                    CNPJ <span className="font-normal text-muted-foreground">(se tiver)</span>
                  </Label>
                  <div className="relative mt-1">
                    <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                    <Input id="cnpj" inputMode="numeric" placeholder="00.000.000/0000-00" className="pl-10" value={cnpj} onChange={(e) => setCnpj(e.target.value)} />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="email">E-mail</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <Input id="email" type="email" autoComplete="email" placeholder="seu@email.com" className="pl-10" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>
              <div>
                <Label htmlFor="telefone">WhatsApp com DDD</Label>
                <div className="relative mt-1">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <Input id="telefone" type="tel" inputMode="tel" autoComplete="tel" placeholder="(32) 98888-7777" className="pl-10" required value={telefone} onChange={(e) => setTelefone(e.target.value)} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Só aparece para quem clicar em "Tenho interesse" no seu anúncio.</p>
              </div>
              <div>
                <Label htmlFor="senha">Senha</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <Input id="senha" type="password" autoComplete="new-password" placeholder="Mínimo de 6 caracteres" className="pl-10" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-3">
                <Checkbox id="aceite" checked={aceite} onCheckedChange={(v) => setAceite(v === true)} className="mt-0.5" aria-required="true" />
                <Label htmlFor="aceite" className="text-sm font-normal leading-snug">
                  Li e aceito os{" "}
                  <Link to="/termos" target="_blank" rel="noopener" className="font-medium text-primary underline underline-offset-2">
                    Termos de Uso
                  </Link>{" "}
                  e a{" "}
                  <Link to="/privacidade" target="_blank" rel="noopener" className="font-medium text-primary underline underline-offset-2">
                    Política de Privacidade
                  </Link>
                  , que explicam as regras da plataforma e quais dados a Volta Express usa e para quê.
                </Label>
              </div>

              <Button type="submit" disabled={loading} className="min-h-11 w-full gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
                <UserPlus className="h-4 w-4" aria-hidden="true" />
                {loading ? "Criando sua conta..." : "Criar minha conta"}
              </Button>
            </form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Já tem conta?{" "}
              <Link to="/login" className="font-medium text-primary hover:underline">
                Entrar
              </Link>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CadastroPage;
