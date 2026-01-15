import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, Users, Building2, Calendar, TrendingUp, Clock, Clapperboard, Wrench, MapPin, DollarSign } from 'lucide-react';
import { useMemo } from 'react';
import { isAfter, isBefore, addDays, parseISO, startOfWeek, endOfWeek, format, getMonth, getYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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

interface RecursoAlocado {
  id: string;
  dataInicio: string;
  dataFim: string;
}

interface Gravacao {
  id: string;
  nome: string;
  codigo: string;
  dataInicio?: string;
  dataFim?: string;
  status?: string;
  recursosFisicos?: RecursoAlocado[];
  recursosHumanos?: RecursoAlocado[];
  recursosTecnicos?: RecursoAlocado[];
}

const Dashboard = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  // Carregar dados reais do localStorage
  const stats = useMemo(() => {
    const gravacoes: Gravacao[] = JSON.parse(localStorage.getItem('kreato_gravacoes') || '[]');
    const conteudos = JSON.parse(localStorage.getItem('kreato_conteudos') || '[]');
    const recursosHumanos = JSON.parse(localStorage.getItem('kreato_recursos_humanos') || '[]');
    const recursosTecnicos = JSON.parse(localStorage.getItem('kreato_recursos_tecnicos') || '[]');
    const recursosFisicos = JSON.parse(localStorage.getItem('kreato_recursos_fisicos') || '[]');
    const unidades = JSON.parse(localStorage.getItem('kreato_unidades_negocio') || '[]');
    const fornecedores = JSON.parse(localStorage.getItem('kreato_fornecedores') || '[]');

    // Gravações ativas (com data de início no passado e data fim no futuro ou sem data fim)
    const hoje = new Date();
    const gravacoesAtivas = gravacoes.filter((g: Gravacao) => {
      if (!g.dataInicio) return false;
      const inicio = parseISO(g.dataInicio);
      const fim = g.dataFim ? parseISO(g.dataFim) : addDays(hoje, 365);
      return isBefore(inicio, addDays(hoje, 1)) && isAfter(fim, hoje);
    });

    return {
      gravacoes: gravacoes.length,
      gravacoesAtivas: gravacoesAtivas.length,
      conteudos: conteudos.length,
      recursosHumanos: recursosHumanos.length,
      recursosTecnicos: recursosTecnicos.length,
      recursosFisicos: recursosFisicos.length,
      unidades: unidades.length,
      fornecedores: fornecedores.length,
    };
  }, []);

  // Gravações da semana corrente (baseado na alocação de recursos)
  const gravacoesSemana = useMemo(() => {
    const gravacoes: Gravacao[] = JSON.parse(localStorage.getItem('kreato_gravacoes') || '[]');
    const hoje = new Date();
    const inicioSemana = startOfWeek(hoje, { weekStartsOn: 0 }); // Domingo
    const fimSemana = endOfWeek(hoje, { weekStartsOn: 0 }); // Sábado

    // Função para verificar se alguma alocação está na semana corrente
    const temAlocacaoNaSemana = (recursos?: RecursoAlocado[]): boolean => {
      if (!recursos || recursos.length === 0) return false;
      return recursos.some((r) => {
        if (!r.dataInicio || !r.dataFim) return false;
        const inicio = parseISO(r.dataInicio);
        const fim = parseISO(r.dataFim);
        // Verifica se há sobreposição com a semana corrente
        return isBefore(inicio, addDays(fimSemana, 1)) && isAfter(fim, addDays(inicioSemana, -1));
      });
    };

    // Filtra gravações que têm recursos alocados na semana corrente
    return gravacoes
      .filter((g) => {
        const temFisicos = temAlocacaoNaSemana(g.recursosFisicos);
        const temHumanos = temAlocacaoNaSemana(g.recursosHumanos);
        const temTecnicos = temAlocacaoNaSemana(g.recursosTecnicos);
        return temFisicos || temHumanos || temTecnicos;
      })
      .sort((a, b) => {
        // Ordena pela primeira data de alocação na semana
        const getFirstDate = (g: Gravacao): number => {
          const allResources = [
            ...(g.recursosFisicos || []),
            ...(g.recursosHumanos || []),
            ...(g.recursosTecnicos || []),
          ];
          const datesInWeek = allResources
            .filter((r) => r.dataInicio)
            .map((r) => parseISO(r.dataInicio).getTime())
            .filter((t) => t >= inicioSemana.getTime() && t <= fimSemana.getTime());
          return datesInWeek.length > 0 ? Math.min(...datesInWeek) : Infinity;
        };
        return getFirstDate(a) - getFirstDate(b);
      });
  }, []);

  // Dados para o gráfico de custos por mês
  const custosAnuais = useMemo(() => {
    const gravacoes = JSON.parse(localStorage.getItem('kreato_gravacoes') || '[]');
    const conteudos = JSON.parse(localStorage.getItem('kreato_conteudos') || '[]');
    const anoCorrente = new Date().getFullYear();
    
    // Determinar o ano a ser exibido (usa o ano mais recente com dados, ou ano corrente)
    let anoExibicao = anoCorrente;
    const anosComDados = new Set<number>();
    gravacoes.forEach((g: any) => {
      if (g.dataPrevista) {
        try {
          const parsed = parseISO(g.dataPrevista);
          if (!isNaN(parsed.getTime())) {
            anosComDados.add(getYear(parsed));
          }
        } catch {
          // Ignora datas inválidas
        }
      }
    });
    if (anosComDados.size > 0 && !anosComDados.has(anoCorrente)) {
      // Se não há dados no ano corrente, usa o ano mais recente com dados
      const anosArray = Array.from(anosComDados);
      anoExibicao = Math.max(...anosArray);
    }
    
    // Inicializar meses
    const meses = Array.from({ length: 12 }, (_, i) => ({
      mes: format(new Date(anoExibicao, i, 1), 'MMM', { locale: ptBR }),
      mesNumero: i,
      custosGravacoes: 0,
      custosConteudos: 0,
      ano: anoExibicao,
    }));

    // Calcular custos de gravações por mês (baseado na data prevista)
    gravacoes.forEach((gravacao: any) => {
      if (!gravacao.dataPrevista) return;
      const data = parseISO(gravacao.dataPrevista);
      if (getYear(data) !== anoExibicao) return;
      
      const mesIndex = getMonth(data);
      let custoTotal = 0;

      // Somar custos de recursos humanos
      if (gravacao.recursosHumanos) {
        gravacao.recursosHumanos.forEach((rh: any) => {
          custoTotal += parseFloat(rh.custoTotal || 0);
        });
      }

      // Somar custos de recursos físicos
      if (gravacao.recursosFisicos) {
        gravacao.recursosFisicos.forEach((rf: any) => {
          custoTotal += parseFloat(rf.custoTotal || 0);
        });
      }

      // Somar custos de recursos técnicos
      if (gravacao.recursosTecnicos) {
        gravacao.recursosTecnicos.forEach((rt: any) => {
          custoTotal += parseFloat(rt.custoTotal || 0);
        });
      }

      // Somar custos de terceiros
      if (gravacao.terceiros) {
        gravacao.terceiros.forEach((t: any) => {
          custoTotal += parseFloat(t.valor || 0);
        });
      }

      meses[mesIndex].custosGravacoes += custoTotal;
    });

    // Calcular custos de conteúdos por mês (baseado no ano de produção)
    conteudos.forEach((conteudo: any) => {
      // Se o ano de produção for o ano de exibição, distribuir custos
      if (conteudo.anoProducao !== anoExibicao.toString()) return;
      
      // Buscar gravações deste conteúdo
      const gravacoesConteudo = gravacoes.filter((g: any) => g.conteudoId === conteudo.id);
      
      let custoTotalConteudo = 0;
      gravacoesConteudo.forEach((gravacao: any) => {
        // Somar todos os custos
        if (gravacao.recursosHumanos) {
          gravacao.recursosHumanos.forEach((rh: any) => {
            custoTotalConteudo += parseFloat(rh.custoTotal || 0);
          });
        }
        if (gravacao.recursosFisicos) {
          gravacao.recursosFisicos.forEach((rf: any) => {
            custoTotalConteudo += parseFloat(rf.custoTotal || 0);
          });
        }
        if (gravacao.recursosTecnicos) {
          gravacao.recursosTecnicos.forEach((rt: any) => {
            custoTotalConteudo += parseFloat(rt.custoTotal || 0);
          });
        }
        if (gravacao.terceiros) {
          gravacao.terceiros.forEach((t: any) => {
            custoTotalConteudo += parseFloat(t.valor || 0);
          });
        }
      });

      // Distribuir custo pelo mês da data prevista das gravações
      gravacoesConteudo.forEach((gravacao: any) => {
        if (!gravacao.dataPrevista) return;
        const data = parseISO(gravacao.dataPrevista);
        if (getYear(data) !== anoExibicao) return;
        const mesIndex = getMonth(data);
        
        let custoGravacao = 0;
        if (gravacao.recursosHumanos) {
          gravacao.recursosHumanos.forEach((rh: any) => {
            custoGravacao += parseFloat(rh.custoTotal || 0);
          });
        }
        if (gravacao.recursosFisicos) {
          gravacao.recursosFisicos.forEach((rf: any) => {
            custoGravacao += parseFloat(rf.custoTotal || 0);
          });
        }
        if (gravacao.recursosTecnicos) {
          gravacao.recursosTecnicos.forEach((rt: any) => {
            custoGravacao += parseFloat(rt.custoTotal || 0);
          });
        }
        if (gravacao.terceiros) {
          gravacao.terceiros.forEach((t: any) => {
            custoGravacao += parseFloat(t.valor || 0);
          });
        }
        
        meses[mesIndex].custosConteudos += custoGravacao;
      });
    });

    return meses;
  }, []);

  // Formatar valores para exibição
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg overflow-hidden shadow-sm">
        <div className="p-4 bg-gradient-to-r from-kreato-cyan via-primary to-kreato-orange">
          <h1 className="text-2xl font-bold text-white">
            {t('dashboard.hello')}, {user?.nome}!
          </h1>
          <p className="text-white/80 mt-1">
            {t('dashboard.welcome')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('dashboard.recordings')}
          value={stats.gravacoes}
          description={`${stats.gravacoesAtivas} ${t('common.activeNow')}`}
          icon={Video}
          gradient="gradient-primary"
        />
        <StatCard
          title={t('dashboard.contents')}
          value={stats.conteudos}
          description={t('common.inSystem')}
          icon={Clapperboard}
          gradient="gradient-brand"
        />
        <StatCard
          title={t('dashboard.humanResources')}
          value={stats.recursosHumanos}
          description={t('common.activeCollaborators')}
          icon={Users}
          gradient="gradient-accent"
        />
        <StatCard
          title={t('dashboard.businessUnits')}
          value={stats.unidades}
          description={t('common.registered')}
          icon={Building2}
          gradient="gradient-primary"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title={t('dashboard.technicalResources')}
          value={stats.recursosTecnicos}
          description={t('common.registeredEquipment')}
          icon={Wrench}
          gradient="gradient-brand"
        />
        <StatCard
          title={t('dashboard.physicalResources')}
          value={stats.recursosFisicos}
          description={t('common.locationsSpaces')}
          icon={MapPin}
          gradient="gradient-accent"
        />
        <StatCard
          title={t('dashboard.suppliers')}
          value={stats.fornecedores}
          description={t('common.registeredPartners')}
          icon={Building2}
          gradient="gradient-primary"
        />
      </div>

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
                {gravacoesSemana.map((gravacao) => {
                  const totalRecursos = 
                    (gravacao.recursosFisicos?.length || 0) + 
                    (gravacao.recursosHumanos?.length || 0) + 
                    (gravacao.recursosTecnicos?.length || 0);
                  
                  return (
                    <div key={gravacao.id} className="flex items-center gap-4 p-3 border border-border rounded-lg">
                      <div className="w-10 h-10 rounded-lg gradient-brand flex items-center justify-center">
                        <Video className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{gravacao.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {totalRecursos} {t('common.allocatedResources')}
                        </p>
                      </div>
                      {gravacao.status && (
                        <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                          {gravacao.status}
                        </span>
                      )}
                    </div>
                  );
                })}
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

      {/* Gráficos de Custos - Grid com 2 colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Custos de Conteúdos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clapperboard className="w-5 h-5 text-kreato-orange" />
              Custos de Conteúdos - {custosAnuais[0]?.ano || new Date().getFullYear()}
            </CardTitle>
            <CardDescription>
              Somatório mensal dos custos de conteúdos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={custosAnuais}
                  margin={{ top: 20, right: 20, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="mes" 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  />
                  <YAxis 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                    tickFormatter={(value) => formatCurrency(value)}
                    width={70}
                  />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Bar 
                    dataKey="custosConteudos" 
                    name="Custos de Conteúdos" 
                    fill="hsl(24, 95%, 53%)" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Custos de Gravações */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="w-5 h-5 text-kreato-blue" />
              Custos de Gravações - {custosAnuais[0]?.ano || new Date().getFullYear()}
            </CardTitle>
            <CardDescription>
              Somatório mensal dos custos de gravações
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={custosAnuais}
                  margin={{ top: 20, right: 20, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="mes" 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  />
                  <YAxis 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                    tickFormatter={(value) => formatCurrency(value)}
                    width={70}
                  />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Bar 
                    dataKey="custosGravacoes" 
                    name="Custos de Gravações" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
