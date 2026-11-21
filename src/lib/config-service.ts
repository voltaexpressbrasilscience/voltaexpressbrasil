/**
 * config-service.ts — parâmetros de negócio lidos do banco (tabela vt_match_config).
 * v3 (T1.4): o valor de referência por km deixa de ser um número fixo no código.
 * Mudar o valor = um UPDATE no banco, sem novo deploy:
 *   UPDATE vt_match_config SET valor_ref_km = 7.20 WHERE id = 1;
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/** Usado enquanto o banco não responde ou para visitantes sem login (a tabela é só para logados). */
export const VALOR_REF_KM_PADRAO = 6.5;

let cache: Promise<number> | null = null;

/** Valor de referência por km (R$). Busca uma vez por sessão e reaproveita. */
export function buscarValorReferenciaKm(): Promise<number> {
  if (!cache) {
    cache = (async () => {
      const { data, error } = await supabase.from("vt_match_config").select("valor_ref_km").eq("id", 1).maybeSingle();
      const valor = Number(data?.valor_ref_km);
      if (error || !Number.isFinite(valor) || valor <= 0) {
        cache = null; // tenta de novo na próxima vez
        return VALOR_REF_KM_PADRAO;
      }
      return valor;
    })();
  }
  return cache;
}

const cachePorTipo = new Map<string, Promise<number | null>>();

/**
 * Match v3 (Q6): valor por km do tipo de veículo (tabela vt_valor_referencia, preenchida com a ANTT).
 * Sem valor para o tipo (ou sem a migração M3), devolve null e vale o valor geral.
 */
export function buscarValorReferenciaTipo(tipoVeiculo: string): Promise<number | null> {
  let p = cachePorTipo.get(tipoVeiculo);
  if (!p) {
    p = (async () => {
      const { data, error } = await supabase
        .from("vt_valor_referencia")
        .select("valor_ref_km")
        .eq("tipo_veiculo", tipoVeiculo)
        .maybeSingle();
      const valor = Number(data?.valor_ref_km);
      return !error && Number.isFinite(valor) && valor > 0 ? valor : null;
    })();
    cachePorTipo.set(tipoVeiculo, p);
  }
  return p;
}

/** Hook: valor de referência por km, começando pelo padrão; usa o do tipo de veículo quando houver. */
export function useValorReferenciaKm(tipoVeiculo?: string | null): number {
  const [valor, setValor] = useState(VALOR_REF_KM_PADRAO);
  useEffect(() => {
    let ativo = true;
    (async () => {
      const geral = await buscarValorReferenciaKm();
      const doTipo = tipoVeiculo ? await buscarValorReferenciaTipo(tipoVeiculo) : null;
      if (ativo) setValor(doTipo ?? geral);
    })();
    return () => {
      ativo = false;
    };
  }, [tipoVeiculo]);
  return valor;
}

/** "R$ 6,50/km" */
export const formatarValorKm = (valor: number) =>
  `R$ ${valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/km`;

/** Referência do frete = distância × valor por km, arredondado para reais inteiros. */
export const valorDeReferencia = (distanciaKm: number, valorKm: number) => Math.round(distanciaKm * valorKm);
