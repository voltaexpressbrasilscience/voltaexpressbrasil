/*
 * ScoreBadge.tsx — selo do score do Match v2 (0 a 100), com cor e rótulo pela faixa de qualidade.
 */
import { faixaScore } from "@/lib/matching-service";
import { cn } from "@/lib/utils";

const TONS = {
  alto: "bg-success/15 text-success border-success/30",
  medio: "bg-accent/10 text-accent border-accent/30",
  baixo: "bg-muted text-muted-foreground border-border",
} as const;

/* Selo compacto: número em destaque (estilo telemetria) e o rótulo da faixa. */
const ScoreBadge = ({ score, className }: { score: number; className?: string }) => {
  const faixa = faixaScore(score);
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold", TONS[faixa.tom], className)}
      aria-label={`Compatibilidade ${score} de 100: ${faixa.rotulo}`}
    >
      <span className="font-mono text-sm tabular-nums">{score}</span>
      <span>{faixa.rotulo}</span>
    </span>
  );
};

export default ScoreBadge;

/* Fim de ScoreBadge.tsx */
