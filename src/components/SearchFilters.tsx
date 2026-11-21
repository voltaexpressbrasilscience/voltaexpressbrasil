import { Search, Filter, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { tiposVeiculo, tiposCarroceria, estados } from "@/lib/catalogos";

interface Filters {
  origemEstado: string;
  destinoEstado: string;
  tipoVeiculo: string;
  tipoCarroceria: string;
  refrigerado: boolean;
  tipoAnuncio: string;
}

interface SearchFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  onReset: () => void;
}

const SearchFilters = ({ filters, onFiltersChange, onReset }: SearchFiltersProps) => {
  const update = (key: keyof Filters, value: string | boolean) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <Card className="border-border shadow-card">
      <CardContent className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Filter className="h-4 w-4 text-accent" />
            Filtros de Busca
          </div>
          <Button variant="ghost" size="sm" onClick={onReset} className="gap-1 text-xs text-muted-foreground">
            <RotateCcw className="h-3 w-3" />
            Limpar
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground">Tipo de Anúncio</Label>
            <Select value={filters.tipoAnuncio} onValueChange={(v) => update("tipoAnuncio", v)}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Todos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="V">Veículo Disponível</SelectItem>
                <SelectItem value="C">Carga Disponível</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Estado Origem</Label>
            <Select value={filters.origemEstado} onValueChange={(v) => update("origemEstado", v)}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Todos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {estados.map((e) => (<SelectItem key={e} value={e}>{e}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Estado Destino</Label>
            <Select value={filters.destinoEstado} onValueChange={(v) => update("destinoEstado", v)}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Todos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {estados.map((e) => (<SelectItem key={e} value={e}>{e}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Tipo de Veículo</Label>
            <Select value={filters.tipoVeiculo} onValueChange={(v) => update("tipoVeiculo", v)}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Todos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {tiposVeiculo.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Tipo de Carroceria</Label>
            <Select value={filters.tipoCarroceria} onValueChange={(v) => update("tipoCarroceria", v)}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Todos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {tiposCarroceria.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <Label className="text-xs text-muted-foreground">Apenas Refrigerado</Label>
            <Switch checked={filters.refrigerado} onCheckedChange={(v) => update("refrigerado", v)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SearchFilters;
