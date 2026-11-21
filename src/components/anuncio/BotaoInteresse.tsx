/*
 * BotaoInteresse.tsx — botão de contato do anúncio.
 * Logado: "Tenho interesse" (registra e abre o WhatsApp). Visitante: leva ao login.
 */
import { Link } from "react-router-dom";
import { LogIn, Loader2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useInteresse } from "@/hooks/use-interesse";
import type { AnuncioCompleto } from "@/lib/anuncio-service";

/* Botão de largura total usado no card e no detalhe do anúncio. */
const BotaoInteresse = ({ anuncio, size = "sm" }: { anuncio: AnuncioCompleto; size?: "sm" | "default" }) => {
  const { user } = useAuth();
  const { contatar, carregando } = useInteresse(anuncio);

  if (!user) {
    return (
      <Button asChild variant="outline" size={size} className="w-full gap-2" onClick={(e) => e.stopPropagation()}>
        <Link to="/login">
          <LogIn className="h-4 w-4" />
          Entre para falar com o anunciante
        </Link>
      </Button>
    );
  }

  return (
    <Button
      size={size}
      className="w-full gap-2 bg-whatsapp text-white hover:bg-whatsapp/90"
      disabled={carregando}
      onClick={(e) => {
        e.stopPropagation();
        contatar();
      }}
    >
      {carregando ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
      Tenho interesse · WhatsApp
    </Button>
  );
};

export default BotaoInteresse;

/* Fim de BotaoInteresse.tsx */
