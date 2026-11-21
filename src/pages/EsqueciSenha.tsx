import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import Header from "@/components/Header";
import logo from "@/assets/logo-volta-express.webp";
import { supabase } from "@/integrations/supabase/client";
import { mensagemErro } from "@/lib/erros";

const EsqueciSenha = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://voltaexpress.com.br/reset-password",
    });
    setLoading(false);
    if (error) {
      toast.error("Não foi possível enviar o e-mail", { description: mensagemErro(error) });
    } else {
      setSent(true);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 items-center justify-center bg-muted/30 py-12">
        <Card className="w-full max-w-md border-border shadow-elevated">
          <CardHeader className="items-center pb-2">
            <img src={logo} alt="VoltaExpress" className="mb-4 h-14 w-auto" />
            <CardTitle className="text-2xl">Recuperar senha</CardTitle>
            <p className="text-sm text-muted-foreground">
              Informe seu e-mail para receber o link de recuperação
            </p>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="space-y-4">
                <Alert className="border-green-300 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    E-mail enviado com sucesso! Verifique sua caixa de entrada (e a pasta de spam) para redefinir sua senha.
                  </AlertDescription>
                </Alert>
                <Link to="/login">
                  <Button variant="outline" className="mt-2 w-full gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Voltar para o login
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>E-mail</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="seu@email.com"
                      className="pl-10"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  {loading ? "Enviando..." : "Enviar link de recuperação"}
                </Button>
                <Link to="/login" className="block text-center text-sm text-muted-foreground hover:underline">
                  <ArrowLeft className="mr-1 inline h-3 w-3" />
                  Voltar para o login
                </Link>
              </form>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default EsqueciSenha;
