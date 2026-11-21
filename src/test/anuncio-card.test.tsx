/*
 * anuncio-card.test.tsx — o card do Match v2 mostra score, motivos e o botão certo para visitante.
 */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AnuncioCard from "@/components/AnuncioCard";
import type { AnuncioCompleto } from "@/lib/anuncio-service";

const ANUNCIO: AnuncioCompleto = {
  id: "c2",
  tipo_anuncio: "C",
  origem_cidade: "Juiz de Fora",
  origem_estado: "MG",
  destino_cidade: "São Paulo",
  destino_estado: "SP",
  tipo_veiculo: null,
  tipo_carroceria: null,
  refrigerado: false,
  descricao_mercadoria: "Leite UHT paletizado",
  valor_sugerido: 3000,
  data_inicio: "2026-10-06",
  data_fim: "2026-10-10",
  nome_usuario: "Laticínios Serra Verde",
  telefone: "",
  created_at: "2026-09-28T12:00:00Z",
  categoria_carga: "Carga seca",
  peso_kg: 9000,
  score: 84,
  motivos: ["desvio de 0 km", "coleta em 8 dia(s)"],
};

describe("AnuncioCard", () => {
  it("exibe score, motivos, trajeto e pede login ao visitante", () => {
    render(
      <MemoryRouter>
        <AnuncioCard anuncio={ANUNCIO} />
      </MemoryRouter>,
    );
    expect(screen.getByLabelText(/Compatibilidade 84 de 100/)).toBeInTheDocument();
    expect(screen.getByText("desvio de 0 km")).toBeInTheDocument();
    expect(screen.getByText("Juiz de Fora/MG")).toBeInTheDocument();
    expect(screen.getByText("06/10/2026 – 10/10/2026")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Entre para falar com o anunciante/ })).toBeInTheDocument();
  });
});

/* Fim de anuncio-card.test.tsx */
