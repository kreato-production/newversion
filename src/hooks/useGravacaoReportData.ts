import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface GravacaoBasicInfo {
  id: string;
  codigo: string;
  nome: string;
  dataPrevista: string | null;
  descricao: string | null;
  status: string | null;
  unidadeNegocio: string | null;
  centroLucro: string | null;
  classificacao: string | null;
  tipoConteudo: string | null;
  conteudo: string | null;
}

export interface CenaData {
  id: string;
  ordem: number;
  capitulo: string;
  numeroCena: string;
  ambiente: string;
  tipoAmbiente: string;
  periodo: string;
  localGravacao: string;
  personagens: string[];
  figurantes: string[];
  tempoAproximado: string;
  ritmo: string;
  descricao: string;
}

export interface RecursoData {
  id: string;
  tipo: 'humano' | 'fisico' | 'tecnico';
  nome: string;
  funcao?: string;
  horaInicio?: string;
  horaFim?: string;
  estoqueItem?: string;
}

export interface ElencoData {
  id: string;
  nome: string;
  nomeTrabalho?: string;
  personagem: string;
}

export interface ConvidadoData {
  id: string;
  nome: string;
  nomeTrabalho?: string;
  telefone?: string;
  email?: string;
  observacoes?: string;
}

export interface FigurinoData {
  id: string;
  codigoFigurino: string;
  descricao: string;
  tipoFigurino?: string;
  tamanhoPeca?: string;
  observacoes?: string;
}

export interface TerceiroData {
  id: string;
  fornecedorNome: string;
  servicoNome: string;
  custo: number;
}

export interface CustoItem {
  categoria: string;
  recurso: string;
  descricao: string;
  horas: number;
  custoUnitario: number;
  custoTotal: number;
}

export interface GravacaoReportData {
  basicInfo: GravacaoBasicInfo;
  cenas: CenaData[];
  recursos: RecursoData[];
  elenco: ElencoData[];
  convidados: ConvidadoData[];
  figurinos: FigurinoData[];
  terceiros: TerceiroData[];
  custos: CustoItem[];
  totais: {
    horasTotais: number;
    custoTotal: number;
    custoTerceiros: number;
  };
}

export const useGravacaoReportData = () => {
  const [isLoading, setIsLoading] = useState(false);

  const calcularHorasEntreTempo = (inicio: string, fim: string): number => {
    if (!inicio || !fim) return 0;
    
    const [horaInicio, minInicio] = inicio.split(':').map(Number);
    const [horaFim, minFim] = fim.split(':').map(Number);
    
    const totalMinutosInicio = horaInicio * 60 + minInicio;
    const totalMinutosFim = horaFim * 60 + minFim;
    
    const diferencaMinutos = totalMinutosFim - totalMinutosInicio;
    return diferencaMinutos > 0 ? diferencaMinutos / 60 : 0;
  };

  const fetchReportData = useCallback(async (gravacaoId: string): Promise<GravacaoReportData | null> => {
    setIsLoading(true);
    try {
      // Fetch basic gravacao info
      const { data: gravacaoData } = await supabase
        .from('gravacoes')
        .select(`
          id, codigo, nome, descricao, data_prevista,
          status_gravacao:status_id(nome),
          unidades_negocio:unidade_negocio_id(nome),
          centros_lucro:centro_lucro_id(nome),
          classificacoes:classificacao_id(nome),
          tipos_gravacao:tipo_conteudo_id(nome),
          conteudos:conteudo_id(descricao)
        `)
        .eq('id', gravacaoId)
        .single();

      if (!gravacaoData) return null;

      const basicInfo: GravacaoBasicInfo = {
        id: gravacaoData.id,
        codigo: gravacaoData.codigo,
        nome: gravacaoData.nome,
        dataPrevista: gravacaoData.data_prevista,
        descricao: gravacaoData.descricao,
        status: (gravacaoData.status_gravacao as any)?.nome || null,
        unidadeNegocio: (gravacaoData.unidades_negocio as any)?.nome || null,
        centroLucro: (gravacaoData.centros_lucro as any)?.nome || null,
        classificacao: (gravacaoData.classificacoes as any)?.nome || null,
        tipoConteudo: (gravacaoData.tipos_gravacao as any)?.nome || null,
        conteudo: (gravacaoData.conteudos as any)?.descricao || null,
      };

      // Fetch cenas (Roteiro)
      const { data: cenasData } = await supabase
        .from('gravacao_cenas')
        .select('*')
        .eq('gravacao_id', gravacaoId)
        .order('ordem');

      const cenas: CenaData[] = (cenasData || []).map((c: any) => ({
        id: c.id,
        ordem: c.ordem,
        capitulo: c.capitulo || '',
        numeroCena: c.numero_cena || '',
        ambiente: c.ambiente || '',
        tipoAmbiente: c.tipo_ambiente || '',
        periodo: c.periodo || '',
        localGravacao: c.local_gravacao || '',
        personagens: c.personagens || [],
        figurantes: c.figurantes || [],
        tempoAproximado: c.tempo_aproximado || '',
        ritmo: c.ritmo || '',
        descricao: c.descricao || '',
      }));

      // Fetch recursos
      const { data: recursosData } = await supabase
        .from('gravacao_recursos')
        .select(`
          id, hora_inicio, hora_fim,
          recursos_humanos:recurso_humano_id(id, nome, sobrenome, custo_hora, funcoes:funcao_id(nome)),
          recursos_fisicos:recurso_fisico_id(id, nome, custo_hora),
          recursos_tecnicos:recurso_tecnico_id(id, nome, funcoes:funcao_operador_id(nome))
        `)
        .eq('gravacao_id', gravacaoId);

      const recursos: RecursoData[] = [];
      const custos: CustoItem[] = [];

      (recursosData || []).forEach((r: any) => {
        if (r.recursos_humanos) {
          const rh = r.recursos_humanos;
          const horas = calcularHorasEntreTempo(r.hora_inicio, r.hora_fim);
          recursos.push({
            id: r.id,
            tipo: 'humano',
            nome: `${rh.nome} ${rh.sobrenome || ''}`.trim(),
            funcao: rh.funcoes?.nome,
            horaInicio: r.hora_inicio,
            horaFim: r.hora_fim,
          });
          if (horas > 0) {
            custos.push({
              categoria: 'Recursos Humanos',
              recurso: `${rh.nome} ${rh.sobrenome || ''}`.trim(),
              descricao: `${horas.toFixed(1)}h de trabalho`,
              horas,
              custoUnitario: rh.custo_hora || 0,
              custoTotal: horas * (rh.custo_hora || 0),
            });
          }
        }
        if (r.recursos_fisicos) {
          const rf = r.recursos_fisicos;
          const horas = calcularHorasEntreTempo(r.hora_inicio, r.hora_fim);
          recursos.push({
            id: r.id,
            tipo: 'fisico',
            nome: rf.nome,
            horaInicio: r.hora_inicio,
            horaFim: r.hora_fim,
          });
          if (horas > 0) {
            custos.push({
              categoria: 'Recursos Físicos',
              recurso: rf.nome,
              descricao: `${horas.toFixed(1)}h de ocupação`,
              horas,
              custoUnitario: rf.custo_hora || 0,
              custoTotal: horas * (rf.custo_hora || 0),
            });
          }
        }
        if (r.recursos_tecnicos) {
          const rt = r.recursos_tecnicos;
          recursos.push({
            id: r.id,
            tipo: 'tecnico',
            nome: rt.nome,
            funcao: rt.funcoes?.nome,
            horaInicio: r.hora_inicio,
            horaFim: r.hora_fim,
          });
        }
      });

      // Fetch elenco
      const { data: elencoData } = await supabase
        .from('gravacao_elenco')
        .select('id, personagem, pessoas:pessoa_id(id, nome, sobrenome, nome_trabalho)')
        .eq('gravacao_id', gravacaoId);

      const elenco: ElencoData[] = (elencoData || []).map((e: any) => ({
        id: e.id,
        nome: `${e.pessoas?.nome || ''} ${e.pessoas?.sobrenome || ''}`.trim(),
        nomeTrabalho: e.pessoas?.nome_trabalho,
        personagem: e.personagem || '',
      }));

      // Fetch convidados
      const { data: convidadosData } = await supabase
        .from('gravacao_convidados')
        .select('id, observacao, pessoas:pessoa_id(id, nome, sobrenome, nome_trabalho, telefone, email)')
        .eq('gravacao_id', gravacaoId);

      const convidados: ConvidadoData[] = (convidadosData || []).map((c: any) => ({
        id: c.id,
        nome: `${c.pessoas?.nome || ''} ${c.pessoas?.sobrenome || ''}`.trim(),
        nomeTrabalho: c.pessoas?.nome_trabalho,
        telefone: c.pessoas?.telefone,
        email: c.pessoas?.email,
        observacoes: c.observacao,
      }));

      // Fetch figurinos
      const { data: figurinosData } = await supabase
        .from('gravacao_figurinos')
        .select('id, observacao, figurinos:figurino_id(id, codigo_figurino, descricao, tamanho_peca, tipos_figurino:tipo_figurino_id(nome))')
        .eq('gravacao_id', gravacaoId);

      const figurinos: FigurinoData[] = (figurinosData || []).map((f: any) => ({
        id: f.id,
        codigoFigurino: f.figurinos?.codigo_figurino || '',
        descricao: f.figurinos?.descricao || '',
        tipoFigurino: f.figurinos?.tipos_figurino?.nome,
        tamanhoPeca: f.figurinos?.tamanho_peca,
        observacoes: f.observacao,
      }));

      // Fetch terceiros
      const { data: terceirosData } = await supabase
        .from('gravacao_terceiros')
        .select('id, valor, fornecedores:fornecedor_id(nome), fornecedor_servicos:servico_id(nome)')
        .eq('gravacao_id', gravacaoId);

      const terceiros: TerceiroData[] = (terceirosData || []).map((t: any) => {
        const custo = t.valor || 0;
        // Add to costs
        custos.push({
          categoria: 'Terceiros',
          recurso: t.fornecedores?.nome || 'Fornecedor',
          descricao: t.fornecedor_servicos?.nome || 'Serviço',
          horas: 0,
          custoUnitario: custo,
          custoTotal: custo,
        });
        return {
          id: t.id,
          fornecedorNome: t.fornecedores?.nome || '',
          servicoNome: t.fornecedor_servicos?.nome || '',
          custo,
        };
      });

      // Calculate totals
      const horasTotais = custos.reduce((acc, c) => acc + c.horas, 0);
      const custoTotal = custos.reduce((acc, c) => acc + c.custoTotal, 0);
      const custoTerceiros = terceiros.reduce((acc, t) => acc + t.custo, 0);

      return {
        basicInfo,
        cenas,
        recursos,
        elenco,
        convidados,
        figurinos,
        terceiros,
        custos,
        totais: {
          horasTotais,
          custoTotal,
          custoTerceiros,
        },
      };
    } catch (error) {
      console.error('Error fetching report data:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    fetchReportData,
  };
};
