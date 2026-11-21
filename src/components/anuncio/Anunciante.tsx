/*
 * Anunciante.tsx — identificação do anunciante com foto (ou iniciais) e selo de perfil completo.
 */
import { BadgeCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { iniciais } from "@/lib/formatos";

/* Avatar + nome; o selo aparece quando o anunciante tem foto de perfil. */
const Anunciante = ({ nome, fotoUrl }: { nome: string; fotoUrl?: string | null }) => (
  <div className="flex min-w-0 items-center gap-2">
    <Avatar className="h-8 w-8">
      {fotoUrl && <AvatarImage src={fotoUrl} alt="" />}
      <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">{iniciais(nome)}</AvatarFallback>
    </Avatar>
    <span className="truncate text-sm font-medium text-foreground">{nome}</span>
    {fotoUrl && <BadgeCheck className="h-4 w-4 shrink-0 text-success" aria-label="Perfil completo" />}
  </div>
);

export default Anunciante;

/* Fim de Anunciante.tsx */
