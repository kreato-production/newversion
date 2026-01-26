import { useMemo, useCallback } from 'react';
import { parseISO, isWithinInterval, getDay } from 'date-fns';

interface FaixaDisponibilidade {
  id: string;
  dataInicio: string;
  dataFim: string;
  horaInicio: string;
  horaFim: string;
  diasSemana: number[];
}

interface RecursoFisico {
  id: string;
  nome: string;
  faixasDisponibilidade?: FaixaDisponibilidade[];
}

interface HorarioOcupacao {
  horaInicio: string;
  horaFim: string;
}

interface RecursoAlocado {
  id: string;
  tipo: 'tecnico' | 'fisico';
  recursoId: string;
  recursoNome: string;
  alocacoes: Record<string, number>;
  horarios: Record<string, HorarioOcupacao>;
}

interface OcupacaoExistente {
  gravacaoId: string;
  gravacaoNome: string;
  horaInicio: string;
  horaFim: string;
}

interface DisponibilidadeResult {
  disponivel: boolean;
  motivo?: string;
  faixaDisponivel?: FaixaDisponibilidade;
  tempoLivreMinutos?: number;
  ocupacoesExistentes?: OcupacaoExistente[];
}

// Converte horário HH:mm para minutos
const horaParaMinutos = (hora: string): number => {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
};

// Calcula minutos de ocupação entre dois horários
const calcularMinutosOcupados = (horaInicio: string, horaFim: string): number => {
  return horaParaMinutos(horaFim) - horaParaMinutos(horaInicio);
};

// Verifica se dois intervalos de tempo se sobrepõem
const horariosSeOverlap = (
  inicio1: string,
  fim1: string,
  inicio2: string,
  fim2: string
): boolean => {
  const i1 = horaParaMinutos(inicio1);
  const f1 = horaParaMinutos(fim1);
  const i2 = horaParaMinutos(inicio2);
  const f2 = horaParaMinutos(fim2);
  return i1 < f2 && f1 > i2;
};

export const useRecursoFisicoDisponibilidade = () => {
  // Carrega recursos físicos do localStorage
  const recursosFisicos = useMemo<RecursoFisico[]>(() => {
    const stored = localStorage.getItem('kreato_recursos_fisicos');
    return stored ? JSON.parse(stored) : [];
  }, []);

  // Busca todas as ocupações de um recurso físico em uma data específica (de todas as gravações)
  const getOcupacoesRecurso = useCallback((
    recursoId: string,
    dataStr: string,
    gravacaoIdExcluir?: string
  ): OcupacaoExistente[] => {
    const ocupacoes: OcupacaoExistente[] = [];
    
    // Buscar todas as gravações
    const gravacoes = localStorage.getItem('kreato_gravacoes');
    const listaGravacoes = gravacoes ? JSON.parse(gravacoes) : [];
    
    for (const gravacao of listaGravacoes) {
      if (gravacaoIdExcluir && gravacao.id === gravacaoIdExcluir) continue;
      
      const recursosGravacao = localStorage.getItem(`kreato_gravacao_recursos_${gravacao.id}`);
      if (!recursosGravacao) continue;
      
      const recursos: RecursoAlocado[] = JSON.parse(recursosGravacao);
      const recursoAlocado = recursos.find(
        (r) => r.recursoId === recursoId && r.tipo === 'fisico'
      );
      
      if (recursoAlocado && recursoAlocado.alocacoes[dataStr] > 0) {
        const horario = recursoAlocado.horarios[dataStr];
        if (horario) {
          ocupacoes.push({
            gravacaoId: gravacao.id,
            gravacaoNome: gravacao.nome || gravacao.codigo,
            horaInicio: horario.horaInicio,
            horaFim: horario.horaFim,
          });
        }
      }
    }
    
    return ocupacoes;
  }, []);

  // Verifica se o recurso físico está disponível em uma data/horário específico
  const verificarDisponibilidade = useCallback((
    recursoId: string,
    dataStr: string,
    horaInicio?: string,
    horaFim?: string,
    gravacaoIdAtual?: string
  ): DisponibilidadeResult => {
    const recurso = recursosFisicos.find(r => r.id === recursoId);
    
    if (!recurso) {
      return { disponivel: false, motivo: 'Recurso não encontrado' };
    }
    
    const faixas = recurso.faixasDisponibilidade || [];
    
    // Se não há faixas de disponibilidade definidas, o recurso está sempre disponível
    if (faixas.length === 0) {
      return { disponivel: true };
    }
    
    const data = parseISO(dataStr);
    const diaSemana = getDay(data);
    
    // Encontrar faixas que cobrem esta data e dia da semana
    const faixasValidas = faixas.filter(faixa => {
      const inicio = parseISO(faixa.dataInicio);
      const fim = parseISO(faixa.dataFim);
      
      return isWithinInterval(data, { start: inicio, end: fim }) &&
             faixa.diasSemana.includes(diaSemana);
    });
    
    if (faixasValidas.length === 0) {
      return { 
        disponivel: false, 
        motivo: 'Recurso não disponível nesta data (fora das faixas de disponibilidade)' 
      };
    }
    
    // Se não especificou horário, verificar se há tempo livre em alguma faixa
    const ocupacoesExistentes = getOcupacoesRecurso(recursoId, dataStr, gravacaoIdAtual);
    
    // Calcular tempo livre disponível considerando todas as faixas
    let tempoLivreTotal = 0;
    
    for (const faixa of faixasValidas) {
      const faixaMinutos = calcularMinutosOcupados(faixa.horaInicio, faixa.horaFim);
      let minutosOcupados = 0;
      
      for (const ocupacao of ocupacoesExistentes) {
        // Verificar se a ocupação está dentro desta faixa
        if (horariosSeOverlap(faixa.horaInicio, faixa.horaFim, ocupacao.horaInicio, ocupacao.horaFim)) {
          // Calcular interseção dos horários
          const inicioOcup = Math.max(horaParaMinutos(faixa.horaInicio), horaParaMinutos(ocupacao.horaInicio));
          const fimOcup = Math.min(horaParaMinutos(faixa.horaFim), horaParaMinutos(ocupacao.horaFim));
          minutosOcupados += (fimOcup - inicioOcup);
        }
      }
      
      tempoLivreTotal += Math.max(0, faixaMinutos - minutosOcupados);
    }
    
    if (tempoLivreTotal <= 0) {
      return { 
        disponivel: false, 
        motivo: 'Recurso totalmente ocupado nesta data',
        ocupacoesExistentes,
        tempoLivreMinutos: 0,
      };
    }
    
    // Se especificou horário, verificar se o período solicitado está disponível
    if (horaInicio && horaFim) {
      // Verificar se o horário solicitado está dentro de alguma faixa disponível
      const faixaCompativels = faixasValidas.filter(faixa => {
        const faixaInicio = horaParaMinutos(faixa.horaInicio);
        const faixaFim = horaParaMinutos(faixa.horaFim);
        const solicitadoInicio = horaParaMinutos(horaInicio);
        const solicitadoFim = horaParaMinutos(horaFim);
        
        return solicitadoInicio >= faixaInicio && solicitadoFim <= faixaFim;
      });
      
      if (faixaCompativels.length === 0) {
        return {
          disponivel: false,
          motivo: 'Horário solicitado está fora das faixas de disponibilidade',
          faixaDisponivel: faixasValidas[0],
          tempoLivreMinutos: tempoLivreTotal,
          ocupacoesExistentes,
        };
      }
      
      // Verificar conflito com ocupações existentes
      for (const ocupacao of ocupacoesExistentes) {
        if (horariosSeOverlap(horaInicio, horaFim, ocupacao.horaInicio, ocupacao.horaFim)) {
          return {
            disponivel: false,
            motivo: `Conflito de horário com gravação "${ocupacao.gravacaoNome}" (${ocupacao.horaInicio} - ${ocupacao.horaFim})`,
            faixaDisponivel: faixaCompativels[0],
            tempoLivreMinutos: tempoLivreTotal,
            ocupacoesExistentes,
          };
        }
      }
    }
    
    return { 
      disponivel: true, 
      faixaDisponivel: faixasValidas[0],
      tempoLivreMinutos: tempoLivreTotal,
      ocupacoesExistentes,
    };
  }, [recursosFisicos, getOcupacoesRecurso]);

  // Retorna as faixas de disponibilidade válidas para uma data
  const getFaixasDisponiveis = useCallback((
    recursoId: string,
    dataStr: string
  ): FaixaDisponibilidade[] => {
    const recurso = recursosFisicos.find(r => r.id === recursoId);
    if (!recurso || !recurso.faixasDisponibilidade) return [];
    
    const data = parseISO(dataStr);
    const diaSemana = getDay(data);
    
    return recurso.faixasDisponibilidade.filter(faixa => {
      const inicio = parseISO(faixa.dataInicio);
      const fim = parseISO(faixa.dataFim);
      
      return isWithinInterval(data, { start: inicio, end: fim }) &&
             faixa.diasSemana.includes(diaSemana);
    });
  }, [recursosFisicos]);

  // Calcula ocupação detalhada de um recurso em uma data (para mapa de ocupação)
  const getOcupacaoDetalhada = useCallback((
    recursoId: string,
    dataStr: string
  ): {
    faixasDisponiveis: { horaInicio: string; horaFim: string; duracaoMinutos: number }[];
    ocupacoes: (OcupacaoExistente & { duracaoMinutos: number })[];
    totalDisponivel: number;
    totalOcupado: number;
    tempoLivre: number;
    percentualOcupacao: number;
  } => {
    const faixas = getFaixasDisponiveis(recursoId, dataStr);
    const ocupacoes = getOcupacoesRecurso(recursoId, dataStr);
    
    const faixasInfo = faixas.map(f => ({
      horaInicio: f.horaInicio,
      horaFim: f.horaFim,
      duracaoMinutos: calcularMinutosOcupados(f.horaInicio, f.horaFim),
    }));
    
    const ocupacoesInfo = ocupacoes.map(o => ({
      ...o,
      duracaoMinutos: calcularMinutosOcupados(o.horaInicio, o.horaFim),
    }));
    
    const totalDisponivel = faixasInfo.reduce((sum, f) => sum + f.duracaoMinutos, 0);
    const totalOcupado = ocupacoesInfo.reduce((sum, o) => sum + o.duracaoMinutos, 0);
    const tempoLivre = Math.max(0, totalDisponivel - totalOcupado);
    
    return {
      faixasDisponiveis: faixasInfo,
      ocupacoes: ocupacoesInfo,
      totalDisponivel,
      totalOcupado,
      tempoLivre,
      percentualOcupacao: totalDisponivel > 0 ? Math.round((totalOcupado / totalDisponivel) * 100) : 0,
    };
  }, [getFaixasDisponiveis, getOcupacoesRecurso]);

  // Formatar minutos em string legível (ex: "3h30min" ou "45min")
  const formatarMinutos = useCallback((minutos: number): string => {
    if (minutos <= 0) return '0min';
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    if (horas === 0) return `${mins}min`;
    if (mins === 0) return `${horas}h`;
    return `${horas}h${mins}min`;
  }, []);

  return {
    verificarDisponibilidade,
    getFaixasDisponiveis,
    getOcupacoesRecurso,
    getOcupacaoDetalhada,
    formatarMinutos,
    recursosFisicos,
  };
};
