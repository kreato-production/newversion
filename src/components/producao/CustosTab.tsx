import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  MapPin,
  Wrench,
  Calculator,
  Clock,
  DollarSign,
  Building2,
  Loader2,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { ApiAlocacoesRepository } from '@/modules/alocacoes/alocacoes.api';
import { gravacoesRepository } from '@/modules/gravacoes/gravacoes.repository.provider';
import { ApiUnidadesRepository } from '@/modules/unidades/unidades.api.repository';
import { ApiRecursosHumanosRepository } from '@/modules/recursos-humanos/recursos-humanos.api.repository';
import { ApiRecursosFisicosRepository } from '@/modules/recursos-fisicos/recursos-fisicos.api.repository';
import { gravacoesRelacionamentosApi } from '@/modules/gravacoes/gravacoes-relacionamentos.api';
import { formatCurrency as formatCurrencyUtil } from '@/lib/currencies';

interface AlocacaoItem {
  id: string;
  gravacaoId: string;
  recursoHumanoId?: string;
  recursoFisicoId?: string;
  parentRecursoId?: string;
  horaInicio?: string;
  horaFim?: string;
  recursoHumanoNome?: string;
  recursoHumanoSobrenome?: string;
  recursoFisicoNome?: string;
  recursoTecnicoNome?: string;
}

interface RecursoHumanoItem {
  id: string;
  nome?: string;
  sobrenome?: string;
  custoHora?: number | string;
}

interface RecursoFisicoItem {
  id: string;
  nome?: string;
  custoHora?: number | string;
}

interface TerceiroItem {
  custo?: number | string;
  fornecedorNome?: string;
  servicoNome?: string;
  observacao?: string;
}

interface CustoItem {
  categoria: string;
  recurso: string;
  descricao: string;
  horas: number;
  custoUnitario: number;
  custoTotal: number;
  tipo: 'humano' | 'fisico' | 'tecnico' | 'terceiro';
}

interface CustosTabProps {
  gravacaoId: string;
}

const alocacoesRepository = new ApiAlocacoesRepository();
const unidadesRepository = new ApiUnidadesRepository();
const recursosHumanosRepository = new ApiRecursosHumanosRepository();
const recursosFisicosRepository = new ApiRecursosFisicosRepository();

const calcularHorasEntreTempo = (inicio: string, fim: string): number => {
  if (!inicio || !fim) return 0;

  const [horaInicio, minInicio] = inicio.split(':').map(Number);
  const [horaFim, minFim] = fim.split(':').map(Number);

  const totalMinutosInicio = horaInicio * 60 + minInicio;
  const totalMinutosFim = horaFim * 60 + minFim;
  const diferencaMinutos = totalMinutosFim - totalMinutosInicio;

  return diferencaMinutos > 0 ? diferencaMinutos / 60 : 0;
};

export const CustosTab = ({ gravacaoId }: CustosTabProps) => {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const [alocacoes, setAlocacoes] = useState<AlocacaoItem[]>([]);
  const [recursosHumanos, setRecursosHumanos] = useState<RecursoHumanoItem[]>([]);
  const [recursosFisicos, setRecursosFisicos] = useState<RecursoFisicoItem[]>([]);
  const [terceiros, setTerceiros] = useState<TerceiroItem[]>([]);
  const [moeda, setMoeda] = useState<string>('BRL');

  const formatCurrency = useCallback((value: number) => formatCurrencyUtil(value, moeda), [moeda]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [overview, gravacoes, unidades, rhData, rfData, terceirosData] = await Promise.all([
        alocacoesRepository.listOverview(),
        gravacoesRepository.list(),
        unidadesRepository.list(),
        recursosHumanosRepository.list(),
        recursosFisicosRepository.list(),
        gravacoesRelacionamentosApi.listTerceiros(gravacaoId),
      ]);

      const gravacao = gravacoes.find((item) => item.id === gravacaoId);
      const unidade = unidades.find((item) => item.id === gravacao?.unidadeNegocioId);
      if (unidade?.moeda) {
        setMoeda(unidade.moeda);
      } else {
        setMoeda('BRL');
      }

      setAlocacoes(
        (overview.alocacoes || []).filter(
          (item) => item.gravacaoId === gravacaoId,
        ) as AlocacaoItem[],
      );
      setRecursosHumanos((rhData || []) as RecursoHumanoItem[]);
      setRecursosFisicos((rfData || []) as RecursoFisicoItem[]);
      setTerceiros((terceirosData.items || []) as TerceiroItem[]);
    } catch (err) {
      console.error('Erro ao carregar dados de custos:', err);
    } finally {
      setIsLoading(false);
    }
  }, [gravacaoId]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const custos = useMemo(() => {
    const itens: CustoItem[] = [];
    const recursosById = new Map(alocacoes.map((item) => [item.id, item]));
    const rhById = new Map(recursosHumanos.map((item) => [item.id, item]));
    const rfById = new Map(recursosFisicos.map((item) => [item.id, item]));

    alocacoes.forEach((alocacao) => {
      if (alocacao.recursoHumanoId) {
        const rh = rhById.get(alocacao.recursoHumanoId);
        const custoHora = Number(rh?.custoHora || 0);
        const horas = calcularHorasEntreTempo(
          alocacao.horaInicio?.substring(0, 5) || '',
          alocacao.horaFim?.substring(0, 5) || '',
        );
        const recursoPai = alocacao.parentRecursoId
          ? recursosById.get(alocacao.parentRecursoId)
          : null;
        const descricao = recursoPai?.recursoTecnicoNome
          ? `${horas.toFixed(1)}h operando ${recursoPai.recursoTecnicoNome}`
          : `${horas.toFixed(1)}h de trabalho`;

        if (horas > 0) {
          itens.push({
            categoria: t('costsTab.humanResources'),
            recurso:
              `${rh?.nome || alocacao.recursoHumanoNome || ''} ${rh?.sobrenome || alocacao.recursoHumanoSobrenome || ''}`.trim(),
            descricao,
            horas,
            custoUnitario: custoHora,
            custoTotal: horas * custoHora,
            tipo: 'humano',
          });
        }
        return;
      }

      if (alocacao.recursoFisicoId) {
        const rf = rfById.get(alocacao.recursoFisicoId);
        const custoHora = Number(rf?.custoHora || 0);
        const horas = calcularHorasEntreTempo(
          alocacao.horaInicio?.substring(0, 5) || '',
          alocacao.horaFim?.substring(0, 5) || '',
        );

        if (horas > 0) {
          itens.push({
            categoria: t('costsTab.physicalResources'),
            recurso: rf?.nome || alocacao.recursoFisicoNome || '',
            descricao: `${horas.toFixed(1)}h de ocupação`,
            horas,
            custoUnitario: custoHora,
            custoTotal: horas * custoHora,
            tipo: 'fisico',
          });
        }
      }
    });

    terceiros.forEach((terceiro) => {
      const valor = Number(terceiro.custo || 0);
      itens.push({
        categoria: t('thirdParties.title'),
        recurso: terceiro.fornecedorNome || 'Fornecedor',
        descricao: terceiro.servicoNome || terceiro.observacao || 'Serviço',
        horas: 0,
        custoUnitario: valor,
        custoTotal: valor,
        tipo: 'terceiro',
      });
    });

    return itens;
  }, [alocacoes, recursosHumanos, recursosFisicos, terceiros, t]);

  const custosPorCategoria = useMemo(() => {
    const categorias: Record<string, CustoItem[]> = {};
    custos.forEach((item) => {
      if (!categorias[item.categoria]) {
        categorias[item.categoria] = [];
      }
      categorias[item.categoria].push(item);
    });
    return categorias;
  }, [custos]);

  const totaisPorCategoria = useMemo(() => {
    const totais: Record<string, { horas: number; custo: number }> = {};
    Object.entries(custosPorCategoria).forEach(([categoria, itens]) => {
      totais[categoria] = {
        horas: itens.reduce((acc, item) => acc + item.horas, 0),
        custo: itens.reduce((acc, item) => acc + item.custoTotal, 0),
      };
    });
    return totais;
  }, [custosPorCategoria]);

  const totalGeral = useMemo(
    () => ({
      horas: custos.reduce((acc, item) => acc + item.horas, 0),
      custo: custos.reduce((acc, item) => acc + item.custoTotal, 0),
    }),
    [custos],
  );

  const getIconCategoria = (categoria: string) => {
    if (categoria === t('costsTab.humanResources')) return <Users className="h-4 w-4" />;
    if (categoria === t('costsTab.physicalResources')) return <MapPin className="h-4 w-4" />;
    if (categoria === t('thirdParties.title')) return <Building2 className="h-4 w-4" />;
    return <Wrench className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (custos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Calculator className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">{t('costsTab.noCosts')}</h3>
        <p className="text-sm text-muted-foreground max-w-sm">{t('costsTab.noCostsDescription')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('costsTab.totalHours')}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalGeral.horas.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground">{t('costsTab.estimatedHours')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('costsTab.totalCost')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(totalGeral.custo)}
            </div>
            <p className="text-xs text-muted-foreground">{t('costsTab.estimatedCost')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('costsTab.costItems')}</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{custos.length}</div>
            <p className="text-xs text-muted-foreground">{t('costsTab.allocatedWithCost')}</p>
          </CardContent>
        </Card>
      </div>

      {Object.entries(custosPorCategoria).map(([categoria, itens]) => (
        <Card key={categoria}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              {getIconCategoria(categoria)}
              {categoria}
              <Badge variant="secondary" className="ml-2">
                {formatCurrency(totaisPorCategoria[categoria]?.custo || 0)}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('costsTab.resource')}</TableHead>
                  <TableHead>{t('common.description')}</TableHead>
                  {categoria !== t('thirdParties.title') && (
                    <>
                      <TableHead className="text-right">{t('costsTab.hours')}</TableHead>
                      <TableHead className="text-right">{t('costsTab.hourlyRate')}</TableHead>
                    </>
                  )}
                  <TableHead className="text-right">{t('costs.totalCost')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itens.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{item.recurso}</TableCell>
                    <TableCell className="text-muted-foreground">{item.descricao}</TableCell>
                    {categoria !== t('thirdParties.title') && (
                      <>
                        <TableCell className="text-right">{item.horas.toFixed(1)}h</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.custoUnitario)}
                        </TableCell>
                      </>
                    )}
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.custoTotal)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50">
                  <TableCell colSpan={2} className="font-medium">
                    {t('costsTab.subtotal')} - {categoria}
                  </TableCell>
                  {categoria !== t('thirdParties.title') && (
                    <>
                      <TableCell className="text-right font-medium">
                        {totaisPorCategoria[categoria]?.horas.toFixed(1)}h
                      </TableCell>
                      <TableCell></TableCell>
                    </>
                  )}
                  <TableCell className="text-right font-bold">
                    {formatCurrency(totaisPorCategoria[categoria]?.custo || 0)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}

      <Card className="border-primary">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('costsTab.totalEstimatedCost')}</p>
                <p className="text-sm text-muted-foreground">
                  {totalGeral.horas.toFixed(1)} {t('costsTab.workHours')}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-primary">{formatCurrency(totalGeral.custo)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
