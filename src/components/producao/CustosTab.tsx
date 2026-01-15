import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Users, MapPin, Wrench, Calculator, Clock, DollarSign, Building2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface RecursoHumanoAlocado {
  id: string;
  recursoHumanoId: string;
  nome: string;
  horaInicio: string;
  horaFim: string;
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
  recursosHumanos: Record<string, RecursoHumanoAlocado[]>;
  horarios: Record<string, HorarioOcupacao>;
}

interface RecursoHumano {
  id: string;
  nome: string;
  sobrenome?: string;
  custoHora: number;
  cargo?: string;
}

interface RecursoFisico {
  id: string;
  nome: string;
  custoHora: number;
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

interface TerceiroAlocado {
  id: string;
  fornecedorId: string;
  fornecedorNome: string;
  servicoId: string;
  servicoNome: string;
  custo: number;
}

interface CustosTabProps {
  gravacaoId: string;
}

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
  const { t, formatCurrency } = useLanguage();
  const [recursos, setRecursos] = useState<RecursoAlocado[]>([]);
  const [recursosHumanos, setRecursosHumanos] = useState<RecursoHumano[]>([]);
  const [recursosFisicos, setRecursosFisicos] = useState<RecursoFisico[]>([]);
  const [terceiros, setTerceiros] = useState<TerceiroAlocado[]>([]);

  useEffect(() => {
    // Carregar recursos alocados na gravação
    const storedRecursos = localStorage.getItem(`kreato_gravacao_recursos_${gravacaoId}`);
    if (storedRecursos) {
      setRecursos(JSON.parse(storedRecursos));
    }

    // Carregar cadastro de recursos humanos (com custo/hora)
    const storedRH = localStorage.getItem('kreato_recursos_humanos');
    if (storedRH) {
      setRecursosHumanos(JSON.parse(storedRH));
    }

    // Carregar cadastro de recursos físicos (com custo/hora)
    const storedFisicos = localStorage.getItem('kreato_recursos_fisicos');
    if (storedFisicos) {
      setRecursosFisicos(JSON.parse(storedFisicos));
    }

    // Carregar terceiros alocados
    const storedTerceiros = localStorage.getItem(`kreato_gravacao_terceiros_${gravacaoId}`);
    if (storedTerceiros) {
      setTerceiros(JSON.parse(storedTerceiros));
    }
  }, [gravacaoId]);

  const custos = useMemo(() => {
    const itens: CustoItem[] = [];

    recursos.forEach((recurso) => {
      if (recurso.tipo === 'fisico') {
        // Custo de recursos físicos - baseado no horário de ocupação
        const recursoFisico = recursosFisicos.find((rf) => rf.id === recurso.recursoId);
        const custoHora = recursoFisico?.custoHora || 0;

        let totalHoras = 0;
        const diasUtilizados: string[] = [];

        Object.entries(recurso.horarios || {}).forEach(([dia, horario]) => {
          const horas = calcularHorasEntreTempo(horario.horaInicio, horario.horaFim);
          if (horas > 0) {
            totalHoras += horas;
            diasUtilizados.push(dia);
          }
        });

        if (totalHoras > 0) {
          itens.push({
            categoria: t('costsTab.physicalResources'),
            recurso: recurso.recursoNome,
            descricao: `${diasUtilizados.length} ${t('costsTab.daysOccupation')}`,
            horas: totalHoras,
            custoUnitario: custoHora,
            custoTotal: totalHoras * custoHora,
            tipo: 'fisico',
          });
        }
      } else if (recurso.tipo === 'tecnico') {
        // Custo de recursos humanos alocados em recursos técnicos
        const rhPorColaborador: Record<string, { nome: string; horas: number; dias: number }> = {};

        Object.entries(recurso.recursosHumanos || {}).forEach(([dia, rhList]) => {
          rhList.forEach((rh) => {
            const horas = calcularHorasEntreTempo(rh.horaInicio, rh.horaFim);
            if (!rhPorColaborador[rh.recursoHumanoId]) {
              rhPorColaborador[rh.recursoHumanoId] = { nome: rh.nome, horas: 0, dias: 0 };
            }
            rhPorColaborador[rh.recursoHumanoId].horas += horas;
            rhPorColaborador[rh.recursoHumanoId].dias += 1;
          });
        });

        Object.entries(rhPorColaborador).forEach(([rhId, dados]) => {
          const colaborador = recursosHumanos.find((rh) => rh.id === rhId);
          const custoHora = colaborador?.custoHora || 0;

          if (dados.horas > 0) {
            itens.push({
              categoria: t('costsTab.humanResources'),
              recurso: dados.nome,
              descricao: `${dados.dias} ${t('costsTab.daysIn')} ${recurso.recursoNome}`,
              horas: dados.horas,
              custoUnitario: custoHora,
              custoTotal: dados.horas * custoHora,
              tipo: 'humano',
            });
          }
        });
      }
    });

    // Adicionar custos de terceiros
    terceiros.forEach((terceiro) => {
      itens.push({
        categoria: t('thirdParties.title'),
        recurso: terceiro.fornecedorNome,
        descricao: terceiro.servicoNome,
        horas: 0,
        custoUnitario: terceiro.custo,
        custoTotal: terceiro.custo,
        tipo: 'terceiro',
      });
    });

    return itens;
  }, [recursos, recursosHumanos, recursosFisicos, terceiros, t]);

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

  const totalGeral = useMemo(() => {
    return {
      horas: custos.reduce((acc, item) => acc + item.horas, 0),
      custo: custos.reduce((acc, item) => acc + item.custoTotal, 0),
    };
  }, [custos]);

  const getIconCategoria = (categoria: string) => {
    if (categoria === t('costsTab.humanResources')) return <Users className="h-4 w-4" />;
    if (categoria === t('costsTab.physicalResources')) return <MapPin className="h-4 w-4" />;
    if (categoria === t('thirdParties.title')) return <Building2 className="h-4 w-4" />;
    return <Wrench className="h-4 w-4" />;
  };

  if (custos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Calculator className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">{t('costsTab.noCosts')}</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          {t('costsTab.noCostsDescription')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4">
      {/* Cards de resumo */}
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
            <div className="text-2xl font-bold text-primary">{formatCurrency(totalGeral.custo)}</div>
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

      {/* Tabela de custos por categoria */}
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
                        <TableCell className="text-right">{formatCurrency(item.custoUnitario)}</TableCell>
                      </>
                    )}
                    <TableCell className="text-right font-medium">{formatCurrency(item.custoTotal)}</TableCell>
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

      {/* Total Geral */}
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