import { useState, useEffect, useRef } from "react";
import { User, Phone, Camera, Truck, Loader2, Save, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { mensagemErro } from "@/lib/erros";
import { nomePersona } from "@/lib/personas";
import { VERSAO_POLITICA, VERSAO_TERMOS } from "@/lib/privacidade";
import { erroDocumentos, soDigitos, whatsappParaGravar } from "@/lib/documentos";
/** CPF parcialmente oculto na tela: ***.456.789-** */
const cpfOculto = (doc: string) => {
  const d = soDigitos(doc);
  return d.length === 11 ? `***.${d.slice(3, 6)}.${d.slice(6, 9)}-**` : doc;
};

const PerfilPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [telefone, setTelefone] = useState("");
  const [nome, setNome] = useState("");
  const [tipoUsuario, setTipoUsuario] = useState("");
  const [documento, setDocumento] = useState("");
  const [cpfNovo, setCpfNovo] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [aceiteEm, setAceiteEm] = useState<string | null>(null);
  const [aceiteAgora, setAceiteAgora] = useState(false);
  // Termos de Uso (v3.2). termosNoBanco = false enquanto a migração 20261110120000 não estiver aplicada.
  const [termosNoBanco, setTermosNoBanco] = useState(false);
  const [aceiteTermosEm, setAceiteTermosEm] = useState<string | null>(null);
  const [aceiteTermosAgora, setAceiteTermosAgora] = useState(false);
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [fotoVeiculoUrl, setFotoVeiculoUrl] = useState<string | null>(null);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [uploadingVeiculo, setUploadingVeiculo] = useState(false);
  const fotoInputRef = useRef<HTMLInputElement>(null);
  const veiculoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, error } = await supabase
        .from("vt_usuario")
        .select("nome, telefone, tipo_usuario, documento, cnpj, aceite_privacidade_em, foto_url, foto_veiculo_url")
        .eq("user_id", user.id)
        .single();
      if (error) {
        console.error(error);
        toast.error("Não foi possível carregar o perfil", { description: "Tente de novo em instantes." });
      } else if (data) {
        setNome(data.nome);
        setTelefone(data.telefone ?? "");
        setTipoUsuario(data.tipo_usuario);
        setDocumento(data.documento);
        setCnpj(data.cnpj ?? "");
        setAceiteEm(data.aceite_privacidade_em);
        setFotoUrl(data.foto_url);
        setFotoVeiculoUrl(data.foto_veiculo_url);
      }
      // Consulta separada: se a coluna ainda não existir no banco, o resto do Perfil continua funcionando.
      const termos = await supabase.from("vt_usuario").select("aceite_termos_em").eq("user_id", user.id).single();
      if (!termos.error) {
        setTermosNoBanco(true);
        setAceiteTermosEm(termos.data.aceite_termos_em);
      }
      setLoading(false);
    })();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    // Contas antigas: o CNPJ ficou no campo documento; aqui a pessoa informa o CPF (regra v3).
    const precisaCpf = soDigitos(documento).length !== 11;
    if (precisaCpf && soDigitos(cpfNovo).length === 0) {
      setSaving(false);
      toast.error("Informe o CPF do responsável pela conta.");
      return;
    }
    const erro = erroDocumentos({ cpf: precisaCpf ? cpfNovo : undefined, cnpj, whatsapp: telefone });
    if (erro) {
      setSaving(false);
      toast.error(erro);
      return;
    }
    const alteracoes: Record<string, string | null> = {
      telefone: whatsappParaGravar(telefone),
      cnpj: soDigitos(cnpj) || null,
    };
    if (precisaCpf) alteracoes.documento = soDigitos(cpfNovo);
    if (!aceiteEm && aceiteAgora) {
      alteracoes.aceite_privacidade_em = new Date().toISOString();
      alteracoes.versao_politica = VERSAO_POLITICA;
    }
    if (termosNoBanco && !aceiteTermosEm && aceiteTermosAgora) {
      alteracoes.aceite_termos_em = new Date().toISOString();
      alteracoes.versao_termos = VERSAO_TERMOS;
    }
    const { error } = await supabase
      .from("vt_usuario")
      .update(alteracoes)
      .eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast.error("Não foi possível salvar", { description: mensagemErro(error) });
    } else {
      toast.success("Perfil atualizado!");
      if (precisaCpf) setDocumento(soDigitos(cpfNovo));
      if (alteracoes.aceite_privacidade_em) setAceiteEm(alteracoes.aceite_privacidade_em);
      if (alteracoes.aceite_termos_em) setAceiteTermosEm(alteracoes.aceite_termos_em);
    }
  };

  const uploadPhoto = async (file: File, type: "perfil" | "veiculo") => {
    if (!user) return;
    const setter = type === "perfil" ? setUploadingFoto : setUploadingVeiculo;
    setter(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${type}-${Date.now()}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from("user-photos")
      .upload(path, file, { upsert: true });

    if (upErr) {
      toast.error("Não foi possível enviar a foto", { description: mensagemErro(upErr) });
      setter(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("user-photos")
      .getPublicUrl(path);

    const column = type === "perfil" ? "foto_url" : "foto_veiculo_url";
    const { error: dbErr } = await supabase
      .from("vt_usuario")
      .update({ [column]: urlData.publicUrl })
      .eq("user_id", user.id);

    if (dbErr) {
      toast.error("Não foi possível salvar a foto", { description: "Tente de novo em instantes." });
    } else {
      if (type === "perfil") setFotoUrl(urlData.publicUrl);
      else setFotoVeiculoUrl(urlData.publicUrl);
      toast.success("Foto atualizada!");
    }
    setter(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-muted/30 py-8">
        <div className="container max-w-2xl">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Meu Perfil</h1>
          </div>

          <div className="space-y-6">
            {/* Foto de Perfil */}
            <Card className="border-border shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Camera className="h-5 w-5 text-accent" />
                  Foto de Perfil
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={fotoUrl ?? undefined} />
                  <AvatarFallback className="bg-primary/10 text-2xl text-primary">
                    {nome?.charAt(0)?.toUpperCase() ?? "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <input
                    ref={fotoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && uploadPhoto(e.target.files[0], "perfil")}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={uploadingFoto}
                    onClick={() => fotoInputRef.current?.click()}
                  >
                    {uploadingFoto ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}
                    {uploadingFoto ? "Enviando..." : "Alterar Foto"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Foto do Veículo */}
            <Card className="border-border shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Truck className="h-5 w-5 text-accent" />
                  Foto do Veículo
                </CardTitle>
              </CardHeader>
              <CardContent>
                {fotoVeiculoUrl ? (
                  <img
                    src={fotoVeiculoUrl}
                    alt="Veículo"
                    className="mb-4 h-48 w-full rounded-lg object-cover"
                  />
                ) : (
                  <div className="mb-4 flex h-48 items-center justify-center rounded-lg border border-dashed border-border bg-muted/50">
                    <p className="text-sm text-muted-foreground">Nenhuma foto do veículo</p>
                  </div>
                )}
                <input
                  ref={veiculoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && uploadPhoto(e.target.files[0], "veiculo")}
                />
                <Button
                  variant="outline"
                  size="sm"
                  disabled={uploadingVeiculo}
                  onClick={() => veiculoInputRef.current?.click()}
                >
                  {uploadingVeiculo ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}
                  {uploadingVeiculo ? "Enviando..." : "Alterar Foto do Veículo"}
                </Button>
              </CardContent>
            </Card>

            {/* Dados */}
            <Card className="border-border shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Phone className="h-5 w-5 text-accent" />
                  Dados Pessoais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Nome</Label>
                  <Input value={nome} disabled className="mt-1 bg-muted/50" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Perfil</Label>
                  <Input value={nomePersona(tipoUsuario)} disabled className="mt-1 bg-muted/50" />
                </div>
                {soDigitos(documento).length === 11 ? (
                  <div>
                    <Label className="text-xs text-muted-foreground">CPF</Label>
                    <Input value={cpfOculto(documento)} disabled className="mt-1 bg-muted/50" />
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="cpf-novo" className="text-xs text-muted-foreground">CPF do responsável (obrigatório)</Label>
                    <Input id="cpf-novo" inputMode="numeric" value={cpfNovo} onChange={(e) => setCpfNovo(e.target.value)} placeholder="000.000.000-00" className="mt-1" />
                    <p className="mt-1 text-xs text-muted-foreground">Sua conta foi criada com CNPJ. Agora pedimos também o CPF de quem responde por ela.</p>
                  </div>
                )}
                <div>
                  <Label htmlFor="cnpj" className="text-xs text-muted-foreground">CNPJ (se tiver)</Label>
                  <Input id="cnpj" inputMode="numeric" value={cnpj} onChange={(e) => setCnpj(e.target.value)} placeholder="00.000.000/0000-00" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="telefone" className="text-xs text-muted-foreground">WhatsApp com DDD</Label>
                  <Input
                    id="telefone"
                    type="tel"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    placeholder="(32) 98888-7777"
                    className="mt-1"
                  />
                </div>
                <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
                  <p className="flex items-center gap-2 font-medium text-foreground">
                    <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" /> Privacidade
                  </p>
                  {aceiteEm ? (
                    <p className="mt-1 text-muted-foreground">
                      Você aceitou a{" "}
                      <Link to="/privacidade" className="text-primary underline">Política de Privacidade</Link> em{" "}
                      {new Date(aceiteEm).toLocaleDateString("pt-BR")}.
                    </p>
                  ) : (
                    <div className="mt-2 flex items-start gap-2">
                      <Checkbox id="aceite-perfil" checked={aceiteAgora} onCheckedChange={(v) => setAceiteAgora(v === true)} className="mt-0.5" />
                      <Label htmlFor="aceite-perfil" className="text-sm font-normal leading-snug">
                        Li e aceito a{" "}
                        <Link to="/privacidade" target="_blank" rel="noopener" className="text-primary underline">Política de Privacidade</Link>.
                      </Label>
                    </div>
                  )}
                  {termosNoBanco &&
                    (aceiteTermosEm ? (
                      <p className="mt-1 text-muted-foreground">
                        Você aceitou os{" "}
                        <Link to="/termos" className="text-primary underline">Termos de Uso</Link> em{" "}
                        {new Date(aceiteTermosEm).toLocaleDateString("pt-BR")}.
                      </p>
                    ) : (
                      <div className="mt-2 flex items-start gap-2">
                        <Checkbox id="aceite-termos-perfil" checked={aceiteTermosAgora} onCheckedChange={(v) => setAceiteTermosAgora(v === true)} className="mt-0.5" />
                        <Label htmlFor="aceite-termos-perfil" className="text-sm font-normal leading-snug">
                          Li e aceito os{" "}
                          <Link to="/termos" target="_blank" rel="noopener" className="text-primary underline">Termos de Uso</Link>.
                        </Label>
                      </div>
                    ))}
                </div>
                <Button
                  onClick={handleSave}
                  className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
                  disabled={saving}
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {saving ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PerfilPage;
