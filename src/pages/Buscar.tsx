/*
 * Buscar.tsx — "Oportunidades": todos os anúncios ativos, em lista ou no mapa (v3, M6).
 */
import { lazy, Suspense, useState, useEffect } from "react";
import { Search as SearchIcon, Loader2, ArrowUpDown, List, Map as MapIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AnuncioCard from "@/components/AnuncioCard";
import SearchFilters from "@/components/SearchFilters";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { tiposVeiculo, tiposCarroceria, estados } from "@/lib/catalogos";
import { buscarAnuncios, type AnuncioCompleto } from "@/lib/anuncio-service";

const MapaOportunidades = lazy(() => import("@/components/MapaOportunidades"));

const defaultFilters = {
  origemEstado: "all",
  destinoEstado: "all",
  tipoVeiculo: "all",
  tipoCarroceria: "all",
  refrigerado: false,
  tipoAnuncio: "all",
};

const BuscarPage = () => {
  const [filters, setFilters] = useState(defaultFilters);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("data_desc");
  const [anuncios, setAnuncios] = useState<AnuncioCompleto[]>([]);
  const [loading, setLoading] = useState(true);
  const [visao, setVisao] = useState<"lista" | "mapa">("lista");

  useEffect(() => {
    buscarAnuncios()
      .then(setAnuncios)
      .catch((err) => console.error("Erro ao buscar anúncios:", err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = anuncios.filter((a) => {
    if (filters.tipoAnuncio !== "all" && a.tipo_anuncio !== filters.tipoAnuncio) return false;
    if (filters.origemEstado !== "all" && a.origem_estado.trim() !== filters.origemEstado) return false;
    if (filters.destinoEstado !== "all" && a.destino_estado.trim() !== filters.destinoEstado) return false;
    if (filters.tipoVeiculo !== "all" && a.tipo_veiculo !== filters.tipoVeiculo) return false;
    if (filters.tipoCarroceria !== "all" && a.tipo_carroceria !== filters.tipoCarroceria) return false;
    if (filters.refrigerado && !a.refrigerado) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        a.origem_cidade.toLowerCase().includes(s) ||
        a.destino_cidade.toLowerCase().includes(s) ||
        a.nome_usuario.toLowerCase().includes(s)
      );
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case "preco_asc":
        return (a.valor_sugerido ?? 0) - (b.valor_sugerido ?? 0);
      case "preco_desc":
        return (b.valor_sugerido ?? 0) - (a.valor_sugerido ?? 0);
      case "data_asc":
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case "data_desc":
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-muted/30 py-8">
        <div className="container">
          <div className="mb-6">
            <h1 className="mb-2 text-3xl font-bold text-foreground">Oportunidades</h1>
            <p className="text-muted-foreground">Todos os caminhões e cargas anunciados agora. Para ver só o que combina com a sua rota, use o Match de frete.</p>
          </div>

          <div className="relative mb-6">
            <SearchIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por cidade ou nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-card"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            <aside>
              <SearchFilters filters={filters} onFiltersChange={setFilters} onReset={() => setFilters(defaultFilters)} />
            </aside>

            <div>
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {sorted.length} anúncio{sorted.length !== 1 ? "s" : ""} encontrado{sorted.length !== 1 ? "s" : ""}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex rounded-md border border-border bg-card p-0.5" role="group" aria-label="Forma de exibição">
                        <Button type="button" size="sm" variant={visao === "lista" ? "secondary" : "ghost"} className="gap-1" aria-pressed={visao === "lista"} onClick={() => setVisao("lista")}>
                          <List className="h-4 w-4" aria-hidden="true" />Lista
                        </Button>
                        <Button type="button" size="sm" variant={visao === "mapa" ? "secondary" : "ghost"} className="gap-1" aria-pressed={visao === "mapa"} onClick={() => setVisao("mapa")}>
                          <MapIcon className="h-4 w-4" aria-hidden="true" />Mapa
                        </Button>
                      </div>
                      <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-[200px] bg-card">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="data_desc">Mais recentes</SelectItem>
                          <SelectItem value="data_asc">Mais antigos</SelectItem>
                          <SelectItem value="preco_asc">Menor preço</SelectItem>
                          <SelectItem value="preco_desc">Maior preço</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {sorted.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card py-16">
                      <SearchIcon className="mb-4 h-12 w-12 text-muted-foreground/40" />
                      <p className="text-lg font-medium text-muted-foreground">Nenhum anúncio encontrado</p>
                      <p className="text-sm text-muted-foreground/60">Tente ajustar os filtros</p>
                    </div>
                  ) : visao === "mapa" ? (
                    <Suspense fallback={<div className="h-[420px] w-full animate-pulse rounded-lg bg-muted" />}>
                      <MapaOportunidades anuncios={sorted} />
                    </Suspense>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {sorted.map((a) => (
                        <AnuncioCard key={a.id} anuncio={a} />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BuscarPage;
