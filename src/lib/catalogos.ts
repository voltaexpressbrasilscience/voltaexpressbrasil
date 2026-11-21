/*
 * catalogos.ts — listas usadas nas telas: tipos de veículo, carroceria, carga e o formato do anúncio.
 * Antes se chamava mock-data.ts; o conteúdo é real, não dado de teste.
 */
export interface Anuncio {
  idAnuncio: number;
  tipoAnuncio: "V" | "C"; // V = Veículo, C = Carga
  origem: string;
  destino: string;
  tipoVeiculo: string;
  tipoCarroceria: string;
  refrigerado: boolean;
  valorSugerido: number;
  dataInicio: string;
  dataFim: string;
  nomeUsuario: string;
  telefone: string;
  tipoUsuario: "C" | "E";
  status: string;
}

export const mockAnuncios: Anuncio[] = [
  {
    idAnuncio: 1,
    tipoAnuncio: "V",
    origem: "Vila Velha/ES",
    destino: "São Paulo/SP",
    tipoVeiculo: "Carreta",
    tipoCarroceria: "Baú",
    refrigerado: true,
    valorSugerido: 8500,
    dataInicio: "2026-02-10",
    dataFim: "2026-02-12",
    nomeUsuario: "Transportes Alpha",
    telefone: "5527999990001",
    tipoUsuario: "E",
    status: "ATIVO",
  },
  {
    idAnuncio: 2,
    tipoAnuncio: "C",
    origem: "Belo Horizonte/MG",
    destino: "Rio de Janeiro/RJ",
    tipoVeiculo: "Truck",
    tipoCarroceria: "Sider",
    refrigerado: false,
    valorSugerido: 4200,
    dataInicio: "2026-02-11",
    dataFim: "2026-02-13",
    nomeUsuario: "João da Silva",
    telefone: "5531999990002",
    tipoUsuario: "C",
    status: "ATIVO",
  },
  {
    idAnuncio: 3,
    tipoAnuncio: "V",
    origem: "Curitiba/PR",
    destino: "Florianópolis/SC",
    tipoVeiculo: "Toco",
    tipoCarroceria: "Graneleiro",
    refrigerado: false,
    valorSugerido: 2800,
    dataInicio: "2026-02-14",
    dataFim: "2026-02-15",
    nomeUsuario: "Carlos Mendes",
    telefone: "5541999990003",
    tipoUsuario: "C",
    status: "ATIVO",
  },
  {
    idAnuncio: 4,
    tipoAnuncio: "C",
    origem: "Campinas/SP",
    destino: "Goiânia/GO",
    tipoVeiculo: "Carreta",
    tipoCarroceria: "Baú",
    refrigerado: true,
    valorSugerido: 12000,
    dataInicio: "2026-02-12",
    dataFim: "2026-02-16",
    nomeUsuario: "Frigoríficos Sul Ltda",
    telefone: "5519999990004",
    tipoUsuario: "E",
    status: "ATIVO",
  },
  {
    idAnuncio: 5,
    tipoAnuncio: "V",
    origem: "Salvador/BA",
    destino: "Recife/PE",
    tipoVeiculo: "Bitruck",
    tipoCarroceria: "Sider",
    refrigerado: false,
    valorSugerido: 5500,
    dataInicio: "2026-02-13",
    dataFim: "2026-02-14",
    nomeUsuario: "Maria Transportes",
    telefone: "5571999990005",
    tipoUsuario: "E",
    status: "ATIVO",
  },
  {
    idAnuncio: 6,
    tipoAnuncio: "C",
    origem: "Porto Alegre/RS",
    destino: "São Paulo/SP",
    tipoVeiculo: "Carreta",
    tipoCarroceria: "Baú",
    refrigerado: false,
    valorSugerido: 9800,
    dataInicio: "2026-02-15",
    dataFim: "2026-02-18",
    nomeUsuario: "Distribuidora Norte",
    telefone: "5551999990006",
    tipoUsuario: "E",
    status: "ATIVO",
  },
];

// v3: ordem do menor para o maior; "3/4" e "Carreta estendida" incluídos (pesquisa set/2024 e Hub).
export const tiposVeiculo = ["VUC", "3/4", "Toco", "Truck", "Bitruck", "Carreta", "Carreta estendida"];
export const tiposCarroceria = ["Baú", "Sider", "Graneleiro", "Tanque", "Plataforma", "Cegonha"];
export const categoriasCarga = ["Carga seca", "Refrigerada", "Granel sólido", "Líquidos", "Máquinas e volumes grandes", "Veículos", "Mudança"];
export const estados = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"
];
