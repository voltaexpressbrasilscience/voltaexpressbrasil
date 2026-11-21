
-- Tabela de Usuários (profiles vinculado ao auth.users)
CREATE TABLE public.vt_usuario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo_usuario CHAR(1) NOT NULL CHECK (tipo_usuario IN ('C', 'E')),
  nome VARCHAR(200) NOT NULL,
  documento VARCHAR(20) NOT NULL,
  telefone VARCHAR(20),
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id),
  UNIQUE(documento)
);

ALTER TABLE public.vt_usuario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.vt_usuario FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.vt_usuario FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.vt_usuario FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Public can view active users" ON public.vt_usuario FOR SELECT USING (ativo = true);

-- Tabela de Localização
CREATE TABLE public.vt_localizacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cidade VARCHAR(100) NOT NULL,
  estado CHAR(2) NOT NULL,
  latitude DECIMAL(9,6),
  longitude DECIMAL(9,6)
);

ALTER TABLE public.vt_localizacao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read locations" ON public.vt_localizacao FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert locations" ON public.vt_localizacao FOR INSERT TO authenticated WITH CHECK (true);

-- Tabela de Veículos
CREATE TABLE public.vt_veiculo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  placa VARCHAR(10) NOT NULL,
  tipo_veiculo VARCHAR(50) NOT NULL,
  capacidade_peso_kg DECIMAL(10,2),
  capacidade_volume_m3 DECIMAL(10,2),
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.vt_veiculo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own vehicles" ON public.vt_veiculo FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own vehicles" ON public.vt_veiculo FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own vehicles" ON public.vt_veiculo FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own vehicles" ON public.vt_veiculo FOR DELETE USING (auth.uid() = user_id);

-- Tabela de Carroceria
CREATE TABLE public.vt_carroceria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  veiculo_id UUID NOT NULL REFERENCES public.vt_veiculo(id) ON DELETE CASCADE,
  tipo_carroceria VARCHAR(50) NOT NULL,
  refrigerado BOOLEAN NOT NULL DEFAULT false
);

ALTER TABLE public.vt_carroceria ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own carrocerias" ON public.vt_carroceria FOR ALL USING (
  EXISTS (SELECT 1 FROM public.vt_veiculo v WHERE v.id = veiculo_id AND v.user_id = auth.uid())
);

-- Tabela de Mercadoria
CREATE TABLE public.vt_mercadoria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  descricao VARCHAR(200) NOT NULL,
  tipo_mercadoria VARCHAR(100),
  peso_kg DECIMAL(10,2),
  volume_m3 DECIMAL(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.vt_mercadoria ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read mercadorias" ON public.vt_mercadoria FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert mercadorias" ON public.vt_mercadoria FOR INSERT TO authenticated WITH CHECK (true);

-- Tabela de Anúncios
CREATE TABLE public.vt_anuncio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  veiculo_id UUID REFERENCES public.vt_veiculo(id),
  mercadoria_id UUID REFERENCES public.vt_mercadoria(id),
  origem_id UUID REFERENCES public.vt_localizacao(id),
  destino_id UUID REFERENCES public.vt_localizacao(id),
  tipo_anuncio CHAR(1) NOT NULL CHECK (tipo_anuncio IN ('V', 'C')),
  data_disponivel_inicio DATE NOT NULL,
  data_disponivel_fim DATE NOT NULL,
  valor_sugerido DECIMAL(10,2),
  status VARCHAR(20) NOT NULL DEFAULT 'ATIVO',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.vt_anuncio ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active anuncios" ON public.vt_anuncio FOR SELECT USING (status = 'ATIVO');
CREATE POLICY "Users can view own anuncios" ON public.vt_anuncio FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own anuncios" ON public.vt_anuncio FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own anuncios" ON public.vt_anuncio FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own anuncios" ON public.vt_anuncio FOR DELETE USING (auth.uid() = user_id);

-- Tabela de Ocorrências (log/auditoria)
CREATE TABLE public.vt_ocorrencia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  tipo_ocorrencia VARCHAR(50) NOT NULL,
  entidade VARCHAR(50),
  entidade_id UUID,
  data_ocorrencia TIMESTAMPTZ NOT NULL DEFAULT now(),
  detalhes TEXT
);

ALTER TABLE public.vt_ocorrencia ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own ocorrencias" ON public.vt_ocorrencia FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Authenticated can insert ocorrencias" ON public.vt_ocorrencia FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_vt_usuario_updated_at BEFORE UPDATE ON public.vt_usuario FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_vt_veiculo_updated_at BEFORE UPDATE ON public.vt_veiculo FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_vt_anuncio_updated_at BEFORE UPDATE ON public.vt_anuncio FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_vt_anuncio_status ON public.vt_anuncio(status);
CREATE INDEX idx_vt_anuncio_tipo ON public.vt_anuncio(tipo_anuncio);
CREATE INDEX idx_vt_anuncio_user ON public.vt_anuncio(user_id);
CREATE INDEX idx_vt_veiculo_user ON public.vt_veiculo(user_id);
CREATE INDEX idx_vt_usuario_documento ON public.vt_usuario(documento);
