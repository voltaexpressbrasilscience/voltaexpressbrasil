/*
 * Motivos.tsx — "por que este match": os motivos calculados pelo Match v2, em chips.
 */
import { Check } from "lucide-react";

/* Lista de motivos; não renderiza nada quando não há motivos. */
const Motivos = ({ motivos }: { motivos?: string[] }) => {
  if (!motivos || motivos.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Por que este resultado">
      {motivos.map((m) => (
        <li key={m} className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs text-secondary-foreground">
          <Check className="h-3 w-3 text-success" aria-hidden="true" />
          {m}
        </li>
      ))}
    </ul>
  );
};

export default Motivos;

/* Fim de Motivos.tsx */
