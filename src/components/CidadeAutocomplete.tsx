/*
 * CidadeAutocomplete.tsx — campo de cidade com sugestões dos municípios do IBGE (Match v3, M3).
 * Escolher uma sugestão preenche a cidade escrita certo, a UF e as coordenadas (sem Google).
 * Continua aceitando texto livre: se a base do IBGE ainda não foi importada, funciona como um campo comum.
 * Acessível: padrão combobox (setas, Enter, Esc) e anúncio da quantidade de sugestões.
 */
import { useEffect, useId, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { buscarMunicipios, type Municipio } from "@/lib/geo-service";
import { cn } from "@/lib/utils";

interface CidadeAutocompleteProps {
  id: string;
  value: string;
  /** UF já escolhida: filtra as sugestões. "all" ou vazio = todas. */
  uf?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  /** Texto digitado (sem município escolhido: o ponto fica indefinido). */
  onTextoChange: (cidade: string) => void;
  /** Município escolhido na lista. */
  onEscolher: (m: Municipio) => void;
}

const CidadeAutocomplete = ({ id, value, uf, placeholder, required, className, onTextoChange, onEscolher }: CidadeAutocompleteProps) => {
  const listaId = useId();
  const [sugestoes, setSugestoes] = useState<Municipio[]>([]);
  const [aberto, setAberto] = useState(false);
  const [ativo, setAtivo] = useState(-1);
  const escolhido = useRef<string | null>(null);

  useEffect(() => {
    const texto = value.trim();
    if (texto.length < 2 || escolhido.current === texto) {
      setSugestoes([]);
      return;
    }
    let vivo = true;
    const t = setTimeout(async () => {
      const r = await buscarMunicipios(texto, uf);
      if (!vivo) return;
      setSugestoes(r);
      setAtivo(-1);
      setAberto(r.length > 0);
    }, 250);
    return () => {
      vivo = false;
      clearTimeout(t);
    };
  }, [value, uf]);

  const escolher = (m: Municipio) => {
    escolhido.current = m.nome;
    onEscolher(m);
    setAberto(false);
    setSugestoes([]);
  };

  const aoTeclar = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!aberto || sugestoes.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setAtivo((i) => (i + 1) % sugestoes.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setAtivo((i) => (i <= 0 ? sugestoes.length - 1 : i - 1));
    } else if (e.key === "Enter" && ativo >= 0) {
      e.preventDefault();
      escolher(sugestoes[ativo]);
    } else if (e.key === "Escape") {
      setAberto(false);
    }
  };

  return (
    <div className="relative">
      <Input
        id={id}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={aberto}
        aria-controls={listaId}
        aria-activedescendant={ativo >= 0 ? `${listaId}-${ativo}` : undefined}
        autoComplete="off"
        placeholder={placeholder}
        required={required}
        className={className}
        value={value}
        onChange={(e) => {
          escolhido.current = null;
          onTextoChange(e.target.value);
        }}
        onKeyDown={aoTeclar}
        onBlur={() => setTimeout(() => setAberto(false), 150)}
        onFocus={() => sugestoes.length > 0 && setAberto(true)}
      />
      {aberto && (
        <ul
          id={listaId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-md border border-border bg-popover py-1 text-sm shadow-lg"
        >
          {sugestoes.map((m, i) => (
            <li
              key={m.codigoIbge}
              id={`${listaId}-${i}`}
              role="option"
              aria-selected={i === ativo}
              className={cn(
                "flex cursor-pointer items-center justify-between gap-2 px-3 py-2",
                i === ativo ? "bg-accent/10 text-foreground" : "text-popover-foreground hover:bg-muted",
              )}
              onMouseDown={(e) => {
                e.preventDefault();
                escolher(m);
              }}
            >
              <span>{m.nome}</span>
              <span className="text-xs font-semibold text-muted-foreground">{m.uf}</span>
            </li>
          ))}
        </ul>
      )}
      <span className="sr-only" aria-live="polite">
        {aberto ? `${sugestoes.length} cidade(s) sugerida(s)` : ""}
      </span>
    </div>
  );
};

export default CidadeAutocomplete;

/* Fim de CidadeAutocomplete.tsx */
