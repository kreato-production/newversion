import { useCallback, useState, useEffect } from 'react';
import { parseISO, isWithinInterval, getDay } from 'date-fns';
import { apiRequest } from '@/lib/api/http';

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

interface RecursosFisicosListResponse {
  data: Array<{
    id: string;
    nome: string;
    faixasDisponibilidade?: FaixaDisponibilidade[];
  }>;
}

interface OcupacaoApiResponse {
  recursoId: string;
  data: string;
  gravacaoId: string;
  gravacaoNome: string;
  horaInicio: string;
  horaFim: string;
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
  fim2: string,
): boolean => {
  const i1 = horaParaMinutos(inicio1);
  const f1 = horaParaMinutos(fim1);
  const i2 = horaParaMinutos(inicio2);
  const f2 = horaParaMinutos(fim2);
  return i1 < f2 && f1 > i2;
};

export const useRecursoFisicoDisponibilidade = () => {
  const [recursosFisicos, setRecursosFisicos] = useState<RecursoFisico[]>([]);

  // Fetch resources with availability windows from Supabase
  useEffect(() => {
    let isMounted = true;

    const fetchRecursos = async () => {
      try {
        const response = await apiRequest<RecursosFisicosListResponse>(
          '/recursos-fisicos?limit=200&offset=0',
        );

        if (!isMounted) {
          return;
        }

        setRecursosFisicos(
          (response.data || []).map((recurso) => ({
            id: recurso.id,
            nome: recurso.nome,
            faixasDisponibilidade: recurso.faixasDisponibilidade || [],
          })),
        );
      } catch (error) {
        console.error('Erro ao carregar disponibilidade de recursos fisicos:', error);
        if (isMounted) {
          setRecursosFisicos([]);
        }
      }
    };

    fetchRecursos();

    return () => {
      isMounted = false;
    };
  }, []);

  const getRecursosFisicos = useCallback((): RecursoFisico[] => {
    return recursosFisicos;
  }, [recursosFisicos]);

  // Busca todas as ocupações de um recurso físico em uma data específica (de todas as gravações)
  const getOcupacoesRecurso = useCallback(
    async (
      recursoId: string,
      dataStr: string,
      gravacaoIdExcluir?: string,
    ): Promise<OcupacaoExistente[]> => {
      const ocupacoes = await apiRequest<OcupacaoApiResponse[]>(
        `/recursos-fisicos/ocupacao?dataInicio=${encodeURIComponent(dataStr)}&dataFim=${encodeURIComponent(dataStr)}`,
      );

      return (ocupacoes || [])
        .filter((item) => item.recursoId === recursoId)
        .filter((item) => !gravacaoIdExcluir || item.gravacaoId !== gravacaoIdExcluir)
        .map((item) => ({
          gravacaoId: item.gravacaoId,
          gravacaoNome: item.gravacaoNome,
          horaInicio: item.horaInicio.slice(0, 5),
          horaFim: item.horaFim.slice(0, 5),
        }));
    },
    [],
  );

  // Verifica se o recurso físico está disponível em uma data/horário específico
  const verificarDisponibilidade = useCallback(
    (
      recursoId: string,
      dataStr: string,
      horaInicio?: string,
      horaFim?: string,
      gravacaoIdAtual?: string,
    ): DisponibilidadeResult => {
      const recurso = recursosFisicos.find((r) => r.id === recursoId);

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
      const faixasValidas = faixas.filter((faixa) => {
        const inicio = parseISO(faixa.dataInicio);
        const fim = parseISO(faixa.dataFim);

        return (
          isWithinInterval(data, { start: inicio, end: fim }) &&
          faixa.diasSemana.includes(diaSemana)
        );
      });

      if (faixasValidas.length === 0) {
        return {
          disponivel: false,
          motivo: 'Recurso não disponível nesta data (fora das faixas de disponibilidade)',
        };
      }

      // Se especificou horário, verificar se o período solicitado está disponível
      if (horaInicio && horaFim) {
        // Verificar se o horário solicitado está dentro de alguma faixa disponível
        const faixaCompativels = faixasValidas.filter((faixa) => {
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
          };
        }
      }

      return {
        disponivel: true,
        faixaDisponivel: faixasValidas[0],
      };
    },
    [recursosFisicos],
  );

  // Retorna as faixas de disponibilidade válidas para uma data
  const getFaixasDisponiveis = useCallback(
    (recursoId: string, dataStr: string): FaixaDisponibilidade[] => {
      const recurso = recursosFisicos.find((r) => r.id === recursoId);
      if (!recurso || !recurso.faixasDisponibilidade) return [];

      const data = parseISO(dataStr);
      const diaSemana = getDay(data);

      return recurso.faixasDisponibilidade.filter((faixa) => {
        const inicio = parseISO(faixa.dataInicio);
        const fim = parseISO(faixa.dataFim);

        return (
          isWithinInterval(data, { start: inicio, end: fim }) &&
          faixa.diasSemana.includes(diaSemana)
        );
      });
    },
    [recursosFisicos],
  );

  // Calcula ocupação detalhada de um recurso em uma data (para mapa de ocupação)
  const getOcupacaoDetalhada = useCallback(
    (
      recursoId: string,
      dataStr: string,
    ): {
      faixasDisponiveis: { horaInicio: string; horaFim: string; duracaoMinutos: number }[];
      ocupacoes: (OcupacaoExistente & { duracaoMinutos: number })[];
      totalDisponivel: number;
      totalOcupado: number;
      tempoLivre: number;
      percentualOcupacao: number;
    } => {
      const faixas = getFaixasDisponiveis(recursoId, dataStr);

      const faixasInfo = faixas.map((f) => ({
        horaInicio: f.horaInicio,
        horaFim: f.horaFim,
        duracaoMinutos: calcularMinutosOcupados(f.horaInicio, f.horaFim),
      }));

      const totalDisponivel = faixasInfo.reduce((sum, f) => sum + f.duracaoMinutos, 0);

      // Return synchronous version with empty occupations
      // Actual occupations should be loaded asynchronously where needed
      return {
        faixasDisponiveis: faixasInfo,
        ocupacoes: [],
        totalDisponivel,
        totalOcupado: 0,
        tempoLivre: totalDisponivel,
        percentualOcupacao: 0,
      };
    },
    [getFaixasDisponiveis],
  );

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
    getRecursosFisicos,
  };
};
