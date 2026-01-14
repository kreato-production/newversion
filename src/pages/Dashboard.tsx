import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, Users, Building2, Calendar, TrendingUp, Clock, Clapperboard, Wrench, MapPin } from 'lucide-react';
import { useMemo } from 'react';
import { format, isAfter, isBefore, addDays, parseISO, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Olá, {user?.nome}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Bem-vindo ao painel de controle do Kreato
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Gravações"
          value={stats.gravacoes}
          description={`${stats.gravacoesAtivas} ativas no momento`}
          icon={Video}
          gradient="gradient-primary"
        />
        <StatCard
          title="Conteúdos"
          value={stats.conteudos}
          description="Cadastrados no sistema"
          icon={Clapperboard}
          gradient="gradient-brand"
        />
        <StatCard
          title="Recursos Humanos"
          value={stats.recursosHumanos}
          description="Colaboradores ativos"
          icon={Users}
          gradient="gradient-accent"
        />
        <StatCard
          title="Unidades de Negócio"
          value={stats.unidades}
          description="Cadastradas"
          icon={Building2}
          gradient="gradient-primary"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Recursos Técnicos"
          value={stats.recursosTecnicos}
          description="Equipamentos cadastrados"
          icon={Wrench}
          gradient="gradient-brand"
        />
        <StatCard
          title="Recursos Físicos"
          value={stats.recursosFisicos}
          description="Locais/espaços"
          icon={MapPin}
          gradient="gradient-accent"
        />
        <StatCard
          title="Fornecedores"
          value={stats.fornecedores}
          description="Parceiros cadastrados"
          icon={Building2}
          gradient="gradient-primary"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-kreato-orange" />
              Próximas Gravações
            </CardTitle>
            <CardDescription>Gravações com recursos alocados esta semana</CardDescription>
          </CardHeader>
          <CardContent>
            {gravacoesSemana.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Nenhuma gravação com recursos alocados esta semana</p>
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
                          {totalRecursos} recurso{totalRecursos !== 1 ? 's' : ''} alocado{totalRecursos !== 1 ? 's' : ''}
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
              Resumo do Sistema
            </CardTitle>
            <CardDescription>Visão geral dos cadastros</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Video className="w-5 h-5 text-kreato-blue" />
                  <span className="text-sm font-medium">Total de Gravações</span>
                </div>
                <span className="text-lg font-bold">{stats.gravacoes}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Clapperboard className="w-5 h-5 text-kreato-purple" />
                  <span className="text-sm font-medium">Total de Conteúdos</span>
                </div>
                <span className="text-lg font-bold">{stats.conteudos}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-kreato-orange" />
                  <span className="text-sm font-medium">Recursos Humanos</span>
                </div>
                <span className="text-lg font-bold">{stats.recursosHumanos}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Wrench className="w-5 h-5 text-kreato-cyan" />
                  <span className="text-sm font-medium">Recursos Técnicos</span>
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
