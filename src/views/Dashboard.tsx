import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Video,
  Users,
  Calendar,
  TrendingUp,
  Clock,
  Clapperboard,
  Wrench,
  DollarSign,
  Loader2,
} from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import { parseISO, format, getMonth, getYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { ApiAnalyticsRepository } from '@/modules/analytics/analytics.api';
import type {
  DashboardOverviewResponse,
  DashboardRecordingSummary,
} from '@/modules/analytics/analytics.types';

const chartConfig = {
  custosGravacoes: {
    label: 'Gravações',
    color: 'hsl(var(--chart-2))',
  },
  custosConteudos: {
    label: 'Conteúdos',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

const StatCard = ({
  title,
  value,
  description,
  icon: Icon,
  gradient,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  gradient: string;
}) => (
  <Card className="overflow-hidden">
    <CardContent className="p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <div className={`p-3 rounded-xl ${gradient}`}>
          <Icon className="w-6 h-6 text-primary-foreground" />
        </div>
      </div>
    </CardContent>
  </Card>
);

interface DashboardStats {
  gravacoes: number;
  gravacoesAtivas: number;
  conteudos: number;
  recursosHumanos: number;
  recursosTecnicos: number;
  recursosFisicos: number;
  unidades: number;
  fornecedores: number;
}

const Dashboard = () => {
  const analyticsRepository = useMemo(() => new ApiAnalyticsRepository(), []);
  const { user, session } = useAuth();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('12m');
  const [stats, setStats] = useState<DashboardStats>({
    gravacoes: 0,
    gravacoesAtivas: 0,
    conteudos: 0,
    recursosHumanos: 0,
    recursosTecnicos: 0,
    recursosFisicos: 0,
    unidades: 0,
    fornecedores: 0,
  });
  const [gravacoesSemana, setGravacoesSemana] = useState<DashboardRecordingSummary[]>([]);
  const [gravacoesParaCusto, setGravacoesParaCusto] = useState<DashboardRecordingSummary[]>([]);

  useEffect(() => {
    let isActive = true;

    const fetchDashboardData = async () => {
      if (!session) {
        if (isActive) {
          setIsLoading(false);
        }
        return;
      }

      if (isActive) {
        setIsLoading(true);
      }

      try {
        const data: DashboardOverviewResponse = await analyticsRepository.getDashboardOverview();

        if (!isActive) {
          return;
        }

        setStats(data.stats);
        setGravacoesSemana(data.gravacoesSemana);
        setGravacoesParaCusto(data.gravacoes);
      } catch (err) {
        if (isActive) {
          console.error('Error fetching dashboard data:', err);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void fetchDashboardData();

    return () => {
      isActive = false;
    };
  }, [analyticsRepository, session]);

  const custosAnuais = useMemo(() => {
    const anoCorrente = new Date().getFullYear();
    let anoExibicao = anoCorrente;
    const anosComDados = new Set<number>();

    gravacoesParaCusto.forEach((g) => {
      if (!g.dataPrevista) {
        return;
      }

      try {
        const parsed = parseISO(g.dataPrevista);
        if (!isNaN(parsed.getTime())) {
          anosComDados.add(getYear(parsed));
        }
      } catch {
        // Ignora datas inválidas
      }
    });

    if (anosComDados.size > 0 && !anosComDados.has(anoCorrente)) {
      anoExibicao = Math.max(...Array.from(anosComDados));
    }

    const meses = Array.from({ length: 12 }, (_, index) => ({
      mes: format(new Date(anoExibicao, index, 1), 'MMM', { locale: ptBR }),
      mesNumero: index,
      custosGravacoes: 0,
      custosConteudos: 0,
      ano: anoExibicao,
    }));

    gravacoesParaCusto.forEach((gravacao) => {
      if (!gravacao.dataPrevista) {
        return;
      }

      try {
        const data = parseISO(gravacao.dataPrevista);
        if (isNaN(data.getTime()) || getYear(data) !== anoExibicao) {
          return;
        }

        const mesIndex = getMonth(data);
        meses[mesIndex].custosGravacoes += 1;
      } catch {
        // Ignora datas inválidas
      }
    });

    return meses;
  }, [gravacoesParaCusto]);

  const filteredCustos = useMemo(() => {
    const count = timeRange === '3m' ? 3 : timeRange === '6m' ? 6 : 12;
    return custosAnuais.slice(-count);
  }, [custosAnuais, timeRange]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {t('dashboard.hello')}, {user?.nome}!
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">{t('dashboard.welcome')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title={t('dashboard.totalRecordings')}
          value={stats.gravacoes}
          description={`${stats.gravacoesAtivas} ativas`}
          icon={Video}
          gradient="bg-kreato-blue"
        />
        <StatCard
          title={t('dashboard.totalContents')}
          value={stats.conteudos}
          description="Conteúdos cadastrados"
          icon={Clapperboard}
          gradient="bg-kreato-purple"
        />
        <StatCard
          title={t('dashboard.humanResources')}
          value={stats.recursosHumanos}
          description="Recursos humanos"
          icon={Users}
          gradient="bg-kreato-orange"
        />
        <StatCard
          title={t('dashboard.technicalResources')}
          value={stats.recursosTecnicos}
          description={`${stats.recursosFisicos} recursos físicos`}
          icon={Wrench}
          gradient="bg-kreato-cyan"
        />
      </div>

      <Card className="pt-0">
        <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
          <div className="grid flex-1 gap-1">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-kreato-cyan" />
              Gravações por Mês ({custosAnuais[0]?.ano || new Date().getFullYear()})
            </CardTitle>
            <CardDescription>Distribuição de gravações ao longo do ano</CardDescription>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="hidden w-[160px] rounded-lg sm:ml-auto sm:flex"
              aria-label="Selecionar período"
            >
              <SelectValue placeholder="Últimos 12 meses" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="12m" className="rounded-lg">
                Últimos 12 meses
              </SelectItem>
              <SelectItem value="6m" className="rounded-lg">
                Últimos 6 meses
              </SelectItem>
              <SelectItem value="3m" className="rounded-lg">
                Últimos 3 meses
              </SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
            <AreaChart data={filteredCustos}>
              <defs>
                <linearGradient id="fillGravacoes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-custosGravacoes)" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="var(--color-custosGravacoes)" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="fillConteudos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-custosConteudos)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--color-custosConteudos)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="mes"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" />}
              />
              <Area
                dataKey="custosConteudos"
                type="natural"
                fill="url(#fillConteudos)"
                stroke="var(--color-custosConteudos)"
                stackId="a"
              />
              <Area
                dataKey="custosGravacoes"
                type="natural"
                fill="url(#fillGravacoes)"
                stroke="var(--color-custosGravacoes)"
                stackId="a"
              />
              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-kreato-orange" />
              {t('dashboard.upcomingRecordings')}
            </CardTitle>
            <CardDescription>{t('dashboard.recordingsThisWeek')}</CardDescription>
          </CardHeader>
          <CardContent>
            {gravacoesSemana.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>{t('dashboard.noRecordingsThisWeek')}</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-80 overflow-y-auto">
                {gravacoesSemana.map((gravacao) => (
                  <div
                    key={gravacao.id}
                    className="flex items-center gap-4 p-3 border border-border rounded-lg"
                  >
                    <div className="w-10 h-10 rounded-lg gradient-brand flex items-center justify-center">
                      <Video className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{gravacao.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {gravacao.dataPrevista
                          ? format(parseISO(gravacao.dataPrevista), 'dd/MM/yyyy', { locale: ptBR })
                          : 'Sem data'}
                      </p>
                    </div>
                    <span className="text-xs font-mono text-muted-foreground">
                      {gravacao.codigo}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-kreato-blue" />
              {t('dashboard.systemSummary')}
            </CardTitle>
            <CardDescription>{t('dashboard.registryOverview')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Video className="w-5 h-5 text-kreato-blue" />
                  <span className="text-sm font-medium">{t('dashboard.totalRecordings')}</span>
                </div>
                <span className="text-lg font-bold">{stats.gravacoes}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Clapperboard className="w-5 h-5 text-kreato-purple" />
                  <span className="text-sm font-medium">{t('dashboard.totalContents')}</span>
                </div>
                <span className="text-lg font-bold">{stats.conteudos}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-kreato-orange" />
                  <span className="text-sm font-medium">{t('dashboard.humanResources')}</span>
                </div>
                <span className="text-lg font-bold">{stats.recursosHumanos}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Wrench className="w-5 h-5 text-kreato-cyan" />
                  <span className="text-sm font-medium">{t('dashboard.technicalResources')}</span>
                </div>
                <span className="text-lg font-bold">{stats.recursosTecnicos}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
