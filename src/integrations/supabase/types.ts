export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      vt_anuncio: {
        Row: {
          distancia_km: number | null
          rota: unknown | null
          created_at: string
          data_disponivel_fim: string
          data_disponivel_inicio: string
          destino_id: string | null
          id: string
          mercadoria_id: string | null
          origem_id: string | null
          status: string
          tipo_anuncio: string
          updated_at: string
          user_id: string
          valor_sugerido: number | null
          veiculo_id: string | null
        }
        Insert: {
          distancia_km?: number | null
          rota?: unknown | null
          created_at?: string
          data_disponivel_fim: string
          data_disponivel_inicio: string
          destino_id?: string | null
          id?: string
          mercadoria_id?: string | null
          origem_id?: string | null
          status?: string
          tipo_anuncio: string
          updated_at?: string
          user_id: string
          valor_sugerido?: number | null
          veiculo_id?: string | null
        }
        Update: {
          distancia_km?: number | null
          rota?: unknown | null
          created_at?: string
          data_disponivel_fim?: string
          data_disponivel_inicio?: string
          destino_id?: string | null
          id?: string
          mercadoria_id?: string | null
          origem_id?: string | null
          status?: string
          tipo_anuncio?: string
          updated_at?: string
          user_id?: string
          valor_sugerido?: number | null
          veiculo_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vt_anuncio_destino_id_fkey"
            columns: ["destino_id"]
            isOneToOne: false
            referencedRelation: "vt_localizacao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vt_anuncio_mercadoria_id_fkey"
            columns: ["mercadoria_id"]
            isOneToOne: false
            referencedRelation: "vt_mercadoria"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vt_anuncio_origem_id_fkey"
            columns: ["origem_id"]
            isOneToOne: false
            referencedRelation: "vt_localizacao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vt_anuncio_veiculo_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "vt_veiculo"
            referencedColumns: ["id"]
          },
        ]
      }
      vt_carroceria: {
        Row: {
          id: string
          refrigerado: boolean
          tipo_carroceria: string
          veiculo_id: string
        }
        Insert: {
          id?: string
          refrigerado?: boolean
          tipo_carroceria: string
          veiculo_id: string
        }
        Update: {
          id?: string
          refrigerado?: boolean
          tipo_carroceria?: string
          veiculo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vt_carroceria_veiculo_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "vt_veiculo"
            referencedColumns: ["id"]
          },
        ]
      }
      vt_compatibilidade: {
        Row: { categoria_carga: string; tipo_carroceria: string }
        Insert: { categoria_carga: string; tipo_carroceria: string }
        Update: { categoria_carga?: string; tipo_carroceria?: string }
        Relationships: []
      }
      vt_match_config: {
        Row: {
          id: number
          janela_dias: number
          peso_anunciante: number
          peso_aproveitamento: number
          peso_capacidade: number
          peso_data: number
          peso_desvio: number
          peso_valor: number
          raio_km: number
          valor_ref_km: number
          raio_min_km: number
          raio_max_km: number
          raio_pct: number
          fator_estrada: number
          nota_modo_cidade: number
          bonus_retorno: number
          perto_km_padrao: number
          versao_pesos: string
        }
        Insert: { id?: number }
        Update: { id?: number }
        Relationships: []
      }
      vt_match_evento: {
        Row: {
          anuncio_id: string
          criado_em: string
          id: string
          score: number | null
          tipo: string
          user_id: string
        }
        Insert: {
          anuncio_id: string
          criado_em?: string
          id?: string
          score?: number | null
          tipo: string
          user_id?: string
        }
        Update: {
          anuncio_id?: string
          criado_em?: string
          id?: string
          score?: number | null
          tipo?: string
          user_id?: string
        }
        Relationships: []
      }
      vt_municipio: {
        Row: {
          codigo_ibge: number
          nome: string
          latitude: number
          longitude: number
          capital: number
          codigo_uf: number
          siafi_id: string | null
          ddd: number | null
          fuso_horario: string | null
        }
        Insert: { codigo_ibge: number; nome: string; latitude: number; longitude: number; codigo_uf: number }
        Update: { nome?: string; latitude?: number; longitude?: number }
        Relationships: []
      }
      vt_uf: {
        Row: { codigo_uf: number; uf: string; nome: string }
        Insert: { codigo_uf: number; uf: string; nome: string }
        Update: { uf?: string; nome?: string }
        Relationships: []
      }
      vt_valor_referencia: {
        Row: { tipo_veiculo: string; valor_ref_km: number | null; fonte: string | null; atualizado_em: string | null }
        Insert: { tipo_veiculo: string; valor_ref_km?: number | null; fonte?: string | null; atualizado_em?: string | null }
        Update: { valor_ref_km?: number | null; fonte?: string | null; atualizado_em?: string | null }
        Relationships: []
      }
      vt_localizacao: {
        Row: {
          user_id: string | null
          cidade: string
          estado: string
          id: string
          latitude: number | null
          longitude: number | null
          /** M3: coluna calculada (geography) a partir de latitude/longitude. */
          ponto: unknown | null
        }
        Insert: {
          user_id?: string | null
          cidade: string
          estado: string
          id?: string
          latitude?: number | null
          longitude?: number | null
        }
        Update: {
          user_id?: string | null
          cidade?: string
          estado?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
        }
        Relationships: []
      }
      vt_mercadoria: {
        Row: {
          categoria_carga: string | null
          exige_refrigeracao: boolean
          user_id: string | null
          created_at: string
          descricao: string
          id: string
          peso_kg: number | null
          tipo_mercadoria: string | null
          volume_m3: number | null
        }
        Insert: {
          categoria_carga?: string | null
          exige_refrigeracao?: boolean
          user_id?: string | null
          created_at?: string
          descricao: string
          id?: string
          peso_kg?: number | null
          tipo_mercadoria?: string | null
          volume_m3?: number | null
        }
        Update: {
          categoria_carga?: string | null
          exige_refrigeracao?: boolean
          user_id?: string | null
          created_at?: string
          descricao?: string
          id?: string
          peso_kg?: number | null
          tipo_mercadoria?: string | null
          volume_m3?: number | null
        }
        Relationships: []
      }
      vt_ocorrencia: {
        Row: {
          data_ocorrencia: string
          detalhes: string | null
          entidade: string | null
          entidade_id: string | null
          id: string
          tipo_ocorrencia: string
          user_id: string | null
        }
        Insert: {
          data_ocorrencia?: string
          detalhes?: string | null
          entidade?: string | null
          entidade_id?: string | null
          id?: string
          tipo_ocorrencia: string
          user_id?: string | null
        }
        Update: {
          data_ocorrencia?: string
          detalhes?: string | null
          entidade?: string | null
          entidade_id?: string | null
          id?: string
          tipo_ocorrencia?: string
          user_id?: string | null
        }
        Relationships: []
      }
      vt_usuario: {
        Row: {
          aceite_privacidade_em: string | null
          aceite_termos_em: string | null
          ativo: boolean
          cnpj: string | null
          created_at: string
          documento: string
          foto_url: string | null
          foto_veiculo_url: string | null
          id: string
          nome: string
          telefone: string | null
          tipo_usuario: string
          updated_at: string
          user_id: string
          versao_politica: string | null
          versao_termos: string | null
        }
        Insert: {
          aceite_privacidade_em?: string | null
          aceite_termos_em?: string | null
          ativo?: boolean
          cnpj?: string | null
          created_at?: string
          documento: string
          foto_url?: string | null
          foto_veiculo_url?: string | null
          id?: string
          nome: string
          telefone?: string | null
          tipo_usuario: string
          updated_at?: string
          user_id: string
          versao_politica?: string | null
          versao_termos?: string | null
        }
        Update: {
          aceite_privacidade_em?: string | null
          aceite_termos_em?: string | null
          ativo?: boolean
          cnpj?: string | null
          created_at?: string
          documento?: string
          foto_url?: string | null
          foto_veiculo_url?: string | null
          id?: string
          nome?: string
          telefone?: string | null
          tipo_usuario?: string
          updated_at?: string
          user_id?: string
          versao_politica?: string | null
          versao_termos?: string | null
        }
        Relationships: []
      }
      vt_veiculo: {
        Row: {
          ativo: boolean
          capacidade_peso_kg: number | null
          capacidade_volume_m3: number | null
          created_at: string
          id: string
          placa: string
          tipo_veiculo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          capacidade_peso_kg?: number | null
          capacidade_volume_m3?: number | null
          created_at?: string
          id?: string
          placa: string
          tipo_veiculo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          capacidade_peso_kg?: number | null
          capacidade_volume_m3?: number | null
          created_at?: string
          id?: string
          placa?: string
          tipo_veiculo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      expire_anuncios: { Args: never; Returns: undefined }
      vt_anunciantes: {
        Args: { ids: string[] }
        Returns: {
          foto_url: string | null
          nome: string
          user_id: string
        }[]
      }
      vt_criar_anuncio: { Args: { p: Json }; Returns: string }
      vt_encerrar_anuncio: {
        Args: { p_anuncio: string; p_fechado?: boolean }
        Returns: undefined
      }
      vt_match_cargas: {
        Args: { p: Json }
        Returns: {
          anuncio_id: string
          categoria_carga: string | null
          created_at: string
          data_fim: string
          data_inicio: string
          descricao_mercadoria: string | null
          desvio_km: number | null
          destino_cidade: string
          destino_estado: string
          exige_refrigeracao: boolean
          foto_url: string | null
          motivos: string[]
          nome_usuario: string
          origem_cidade: string
          origem_estado: string
          peso_kg: number | null
          score: number
          valor_sugerido: number | null
          volume_m3: number | null
          modo: string
          raio_km: number | null
          km_coleta: number | null
          desvio_estrada_km: number | null
          origem_lat: number | null
          origem_lng: number | null
          destino_lat: number | null
          destino_lng: number | null
        }[]
      }
      vt_match_veiculos: {
        Args: { p: Json }
        Returns: {
          anuncio_id: string
          capacidade_peso_kg: number | null
          capacidade_volume_m3: number | null
          created_at: string
          data_fim: string
          data_inicio: string
          desvio_km: number | null
          destino_cidade: string
          destino_estado: string
          foto_url: string | null
          motivos: string[]
          nome_usuario: string
          origem_cidade: string
          origem_estado: string
          refrigerado: boolean
          score: number
          tipo_carroceria: string | null
          tipo_veiculo: string | null
          valor_sugerido: number | null
          modo: string
          raio_km: number | null
          km_coleta: number | null
          desvio_estrada_km: number | null
          frete_retorno: boolean
          origem_lat: number | null
          origem_lng: number | null
          destino_lat: number | null
          destino_lng: number | null
        }[]
      }
      vt_buscar_municipios: {
        Args: { q: string; p_uf?: string; p_limite?: number }
        Returns: { codigo_ibge: number; nome: string; uf: string; latitude: number; longitude: number }[]
      }
      vt_meu_painel: { Args: never; Returns: Json }
      vt_norm: { Args: { t: string }; Returns: string }
      vt_raio_km: { Args: { km: number }; Returns: number }
      vt_rota_anuncio: { Args: { p_anuncio: string }; Returns: string | null }
      vt_registrar_interesse: {
        Args: { p_anuncio: string; p_score?: number }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
