import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogIn, Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import Header from "@/components/Header";
import logo from "@/assets/logo-volta-express.webp";
import { supabase } from "@/integrations/supabase/client";
import { mensagemErro } from "@/lib/erros";

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error("Não foi possível entrar", { description: mensagemErro(error) });
    } else {
      toast.success("Login realizado com sucesso!");
      navigate("/");
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 items-center justify-center bg-muted/30 py-12">
        <Card className="w-full max-w-md border-border shadow-elevated">
          <CardHeader className="items-center pb-2">
            <img src={logo} alt="VoltaExpress" className="mb-4 h-14 w-auto" />
            <CardTitle className="text-2xl">Entrar na plataforma</CardTitle>
            <p className="text-sm text-muted-foreground">Acesse sua conta VoltaExpress</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>E-mail</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input type="email" placeholder="seu@email.com" className="pl-10" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label>Senha</Label>
                  <Link to="/esqueci-senha" className="text-xs text-accent hover:underline">
                    Esqueci minha senha
                  </Link>
                </div>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input type="password" placeholder="••••••••" className="pl-10" required value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
                <LogIn className="h-4 w-4" />
                {loading ? "Entrando..." : "Entrar"}
              </Button>
            </form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Não tem conta?{" "}
              <Link to="/cadastro" className="font-medium text-accent hover:underline">
                Cadastre-se
              </Link>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default LoginPage;
