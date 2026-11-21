import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import Header from "@/components/Header";
import logo from "@/assets/logo-volta-express.webp";
import { supabase } from "@/integrations/supabase/client";
import { mensagemErro } from "@/lib/erros";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    // Listen for the PASSWORD_RECOVERY event from the auth state change
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const getPasswordStrength = (pw: string) => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 1) return { label: "Fraca", color: "bg-destructive", width: "25%" };
    if (score === 2) return { label: "Média", color: "bg-yellow-500", width: "50%" };
    if (score === 3) return { label: "Boa", color: "bg-blue-500", width: "75%" };
    return { label: "Forte", color: "bg-green-500", width: "100%" };
  };

  const strength = getPasswordStrength(password);
  const passwordsMatch = password === confirmPassword;
  const isValid = password.length >= 8 && passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      toast.error("Não foi possível redefinir a senha", { description: mensagemErro(error) });
    } else {
      toast.success("Senha redefinida com sucesso!", {
        description: "Você será redirecionado para o login.",
      });
      await supabase.auth.signOut();
      setTimeout(() => navigate("/login"), 2000);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 items-center justify-center bg-muted/30 py-12">
        <Card className="w-full max-w-md border-border shadow-elevated">
          <CardHeader className="items-center pb-2">
            <img src={logo} alt="VoltaExpress" className="mb-4 h-14 w-auto" />
            <CardTitle className="text-2xl">Redefinir senha</CardTitle>
            <p className="text-sm text-muted-foreground">Crie uma nova senha para sua conta</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Nova Senha</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="Mínimo 8 caracteres"
                    className="pl-10"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                {password.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full transition-all ${strength.color}`}
                          style={{ width: strength.width }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{strength.label}</span>
                    </div>
                    <ul className="space-y-0.5 text-xs text-muted-foreground">
                      <li className={password.length >= 8 ? "text-green-600" : ""}>
                        {password.length >= 8 ? "✓" : "○"} Mínimo 8 caracteres
                      </li>
                      <li className={/[A-Z]/.test(password) ? "text-green-600" : ""}>
                        {/[A-Z]/.test(password) ? "✓" : "○"} Letra maiúscula
                      </li>
                      <li className={/[0-9]/.test(password) ? "text-green-600" : ""}>
                        {/[0-9]/.test(password) ? "✓" : "○"} Número
                      </li>
                      <li className={/[^A-Za-z0-9]/.test(password) ? "text-green-600" : ""}>
                        {/[^A-Za-z0-9]/.test(password) ? "✓" : "○"} Caractere especial
                      </li>
                    </ul>
                  </div>
                )}
              </div>

              <div>
                <Label>Confirmar Nova Senha</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="Repita a nova senha"
                    className="pl-10"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                {confirmPassword.length > 0 && !passwordsMatch && (
                  <p className="mt-1 text-xs text-destructive">As senhas não coincidem</p>
                )}
                {confirmPassword.length > 0 && passwordsMatch && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-green-600">
                    <CheckCircle className="h-3 w-3" /> Senhas coincidem
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading || !isValid}
                className="w-full gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
              >
                {loading ? "Redefinindo..." : "Redefinir senha"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ResetPassword;
