/*
 * AnuncioCard.tsx — card do anúncio (DS3).
 * Mostra o trajeto, os dados do veículo ou da carga, o anunciante com selo de perfil,
 * o score e o "por que este match" (quando vem do Match v2) e o botão "Tenho interesse".
 * O card inteiro abre o detalhe com o mapa; é acessível por teclado (Enter/Espaço).
 */
import { useState } from "react";
import { Truck, Package, MapPin, Calendar, Snowflake, ArrowRight, Weight, Repeat } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AnuncioCompleto } from "@/lib/anuncio-service";
import AnuncioDetailDialog from "./AnuncioDetailDialog";
import ScoreBadge from "./anuncio/ScoreBadge";
import Motivos from "./anuncio/Motivos";
import Anunciante from "./anuncio/Anunciante";
import BotaoInteresse from "./anuncio/BotaoInteresse";
import { formatarData, formatarKg, formatarReais } from "@/lib/formatos";
import { textoValidade } from "@/lib/anuncio-service";

interface AnuncioCardProps {
  anuncio: AnuncioCompleto;
}

/* Card do anúncio com ações de detalhe e interesse. */
const AnuncioCard = ({ anuncio }: AnuncioCardProps) => {
  const [showDetail, setShowDetail] = useState(false);
  const isVeiculo = anuncio.tipo_anuncio === "V";
  const origemLabel = `${anuncio.origem_cidade}/${anuncio.origem_estado.trim()}`;
  const destinoLabel = `${anuncio.destino_cidade}/${anuncio.destino_estado.trim()}`;
  const pesoOuCapacidade = isVeiculo ? anuncio.capacidade_peso_kg : anuncio.peso_kg;

  return (
    <>
      <Card
        role="button"
        tabIndex={0}
        aria-label={`${isVeiculo ? "Veículo" : "Carga"} de ${origemLabel} para ${destinoLabel}. Abrir detalhes`}
        className="group flex h-full cursor-pointer flex-col overflow-hidden border-border bg-card shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() => setShowDetail(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setShowDetail(true);
          }
        }}
      >
        <CardContent className="flex flex-1 flex-col p-0">
          <div className={`h-1.5 w-full ${isVeiculo ? "bg-primary" : "bg-gradient-accent"}`} />
          <div className="flex flex-1 flex-col gap-4 p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${isVeiculo ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"}`}>
                  {isVeiculo ? <Truck className="h-5 w-5" aria-hidden="true" /> : <Package className="h-5 w-5" aria-hidden="true" />}
                </div>
                <Badge variant="outline" className="text-xs font-medium">
                  {isVeiculo ? "Veículo disponível" : "Carga disponível"}
                </Badge>
              </div>
              {typeof anuncio.score === "number" ? (
                <ScoreBadge score={anuncio.score} />
              ) : (
                anuncio.refrigerado && (
                  <Badge className="gap-1 bg-sky-100 text-sky-800 hover:bg-sky-100">
                    <Snowflake className="h-3 w-3" aria-hidden="true" />Refrigerado
                  </Badge>
                )
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 shrink-0 text-success" aria-hidden="true" />
              <span className="font-semibold text-foreground">{origemLabel}</span>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-label="para" />
              <MapPin className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
              <span className="font-semibold text-foreground">{destinoLabel}</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {anuncio.tipo_veiculo && <Badge variant="secondary" className="text-xs">{anuncio.tipo_veiculo}</Badge>}
              {anuncio.tipo_carroceria && <Badge variant="secondary" className="text-xs">{anuncio.tipo_carroceria}</Badge>}
              {anuncio.categoria_carga && <Badge variant="secondary" className="text-xs">{anuncio.categoria_carga}</Badge>}
              {anuncio.descricao_mercadoria && <Badge variant="secondary" className="text-xs">{anuncio.descricao_mercadoria}</Badge>}
              {typeof anuncio.score === "number" && anuncio.refrigerado && (
                <Badge className="gap-1 bg-sky-100 text-xs text-sky-800 hover:bg-sky-100">
                  <Snowflake className="h-3 w-3" aria-hidden="true" />Refrigerado
                </Badge>
              )}
              {anuncio.frete_retorno && (
                <Badge className="gap-1 bg-success/15 text-xs text-success hover:bg-success/15">
                  <Repeat className="h-3 w-3" aria-hidden="true" />Frete de retorno
                </Badge>
              )}
              {pesoOuCapacidade != null && (
                <Badge variant="outline" className="gap-1 text-xs">
                  <Weight className="h-3 w-3" aria-hidden="true" />
                  {isVeiculo ? "até " : ""}{formatarKg(pesoOuCapacidade)}
                </Badge>
              )}
            </div>

            <Motivos motivos={anuncio.motivos} />

            <div className="mt-auto flex items-end justify-between gap-3 border-t border-border pt-4">
              <div className="min-w-0 space-y-1">
                <Anunciante nome={anuncio.nome_usuario} fotoUrl={anuncio.foto_url} />
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" aria-hidden="true" />
                  {formatarData(anuncio.data_inicio)} – {formatarData(anuncio.data_fim)}
                  {textoValidade(anuncio.data_fim) && <span className="font-medium text-foreground"> · {textoValidade(anuncio.data_fim)}</span>}
                </p>
              </div>
              {anuncio.valor_sugerido != null && (
                <div className="shrink-0 text-right">
                  <p className="text-xs text-muted-foreground">Valor</p>
                  <p className="font-mono text-lg font-bold tabular-nums text-accent">
                    {formatarReais(anuncio.valor_sugerido)}
                  </p>
                </div>
              )}
            </div>

            <BotaoInteresse anuncio={anuncio} />
          </div>
        </CardContent>
      </Card>

      <AnuncioDetailDialog anuncio={anuncio} open={showDetail} onOpenChange={setShowDetail} />
    </>
  );
};

export default AnuncioCard;

/* Fim de AnuncioCard.tsx */
