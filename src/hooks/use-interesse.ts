/*
 * use-interesse.ts — ação "Tenho interesse": registra o contato no banco e abre o WhatsApp do anunciante.
 * A janela é aberta antes da chamada assíncrona para não ser bloqueada pelo navegador.
 */
import { useState } from "react";
import { toast } from "sonner";
import { linkWhatsApp, registrarInteresse, type AnuncioCompleto } from "@/lib/anuncio-service";
import { mensagemErro } from "@/lib/erros";

/* Devolve a função de contato e o estado de carregamento para o anúncio informado. */
export function useInteresse(anuncio: AnuncioCompleto) {
  const [carregando, setCarregando] = useState(false);

  const contatar = async () => {
    const janela = window.open("", "_blank");
    setCarregando(true);
    try {
      const telefone = await registrarInteresse(anuncio.id, anuncio.score);
      if (!telefone) {
        janela?.close();
        toast.info("O anunciante ainda não cadastrou um WhatsApp.");
        return;
      }
      const link = linkWhatsApp(telefone, anuncio);
      if (janela) janela.location.href = link;
      else window.location.href = link;
    } catch (err) {
      janela?.close();
      toast.error("Não foi possível abrir o contato", { description: mensagemErro(err) });
    } finally {
      setCarregando(false);
    }
  };

  return { contatar, carregando };
}

/* Fim de use-interesse.ts */
