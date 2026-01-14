import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, Users, Building2, Calendar, TrendingUp, Clock } from 'lucide-react';

const StatCard = ({
  title,
  value,
  description,
  icon: Icon,
  gradient,
}: {
  title: string;
  value: string;
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

const Dashboard = () => {
  const { user } = useAuth();

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
          title="Gravações Ativas"
          value="12"
          description="3 novas esta semana"
          icon={Video}
          gradient="gradient-primary"
        />
        <StatCard
          title="Recursos Humanos"
          value="48"
          description="Ativos no sistema"
          icon={Users}
          gradient="gradient-brand"
        />
        <StatCard
          title="Unidades de Negócio"
          value="5"
          description="Cadastradas"
          icon={Building2}
          gradient="gradient-accent"
        />
        <StatCard
          title="Agendamentos"
          value="24"
          description="Para este mês"
          icon={Calendar}
          gradient="gradient-primary"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-kreato-blue" />
              Atividade Recente
            </CardTitle>
            <CardDescription>Últimas ações no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { action: 'Nova gravação cadastrada', time: '2 min atrás', type: 'Produção' },
                { action: 'Recurso técnico atualizado', time: '15 min atrás', type: 'Recursos' },
                { action: 'Fornecedor adicionado', time: '1 hora atrás', type: 'Recursos' },
                { action: 'Status de gravação alterado', time: '2 horas atrás', type: 'Produção' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-kreato-orange" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{item.action}</p>
                    <p className="text-xs text-muted-foreground">{item.type}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{item.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-kreato-orange" />
              Próximas Gravações
            </CardTitle>
            <CardDescription>Agenda da semana</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { title: 'Curso de Marketing Digital', date: 'Hoje, 14:00', status: 'Em preparação' },
                { title: 'Webinar de Vendas', date: 'Amanhã, 10:00', status: 'Confirmado' },
                { title: 'Treinamento Interno', date: 'Qui, 09:00', status: 'Pendente' },
                { title: 'Podcast Ep. 45', date: 'Sex, 15:00', status: 'Confirmado' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-4 p-3 border border-border rounded-lg">
                  <div className="w-10 h-10 rounded-lg gradient-brand flex items-center justify-center">
                    <Video className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.date}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
