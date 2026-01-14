import { useState } from 'react';
import { PageHeader } from '@/components/shared/PageComponents';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, ChevronLeft, ChevronRight, Filter, MapPin, Users } from 'lucide-react';
import { format, addDays, startOfWeek, addWeeks, subWeeks } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Mock data
const recursosFisicos = [
  { id: 1, nome: 'Estúdio A', tipo: 'Estúdio' },
  { id: 2, nome: 'Estúdio B', tipo: 'Estúdio' },
  { id: 3, nome: 'Sala de Reunião 1', tipo: 'Sala' },
  { id: 4, nome: 'Sala de Edição', tipo: 'Sala' },
  { id: 5, nome: 'Auditório', tipo: 'Auditório' },
];

const recursosHumanos = [
  { id: 1, nome: 'João Silva', funcao: 'Câmera' },
  { id: 2, nome: 'Maria Santos', funcao: 'Produção' },
  { id: 3, nome: 'Carlos Oliveira', funcao: 'Direção' },
  { id: 4, nome: 'Ana Costa', funcao: 'Edição' },
  { id: 5, nome: 'Pedro Lima', funcao: 'Áudio' },
];

// Mock de ocupações
const ocupacoesFisicas: Record<string, Record<string, { gravacao: string; horario: string }[]>> = {
  '1': {
    '2026-01-14': [{ gravacao: 'Comercial XYZ', horario: '08:00-12:00' }],
    '2026-01-15': [{ gravacao: 'Institucional ABC', horario: '14:00-18:00' }],
  },
  '2': {
    '2026-01-14': [{ gravacao: 'Filme Corporativo', horario: '09:00-17:00' }],
  },
};

const ocupacoesHumanas: Record<string, Record<string, { gravacao: string; horario: string }[]>> = {
  '1': {
    '2026-01-14': [{ gravacao: 'Comercial XYZ', horario: '08:00-12:00' }],
    '2026-01-15': [{ gravacao: 'Institucional ABC', horario: '14:00-18:00' }],
    '2026-01-16': [{ gravacao: 'Evento Live', horario: '10:00-16:00' }],
  },
  '2': {
    '2026-01-14': [{ gravacao: 'Filme Corporativo', horario: '09:00-17:00' }],
    '2026-01-15': [{ gravacao: 'Comercial XYZ', horario: '08:00-12:00' }],
  },
  '3': {
    '2026-01-16': [{ gravacao: 'Institucional ABC', horario: '14:00-18:00' }],
  },
};

const tiposRecursoFisico = ['Todos', 'Estúdio', 'Sala', 'Auditório'];
const funcoesRecursoHumano = ['Todas', 'Câmera', 'Produção', 'Direção', 'Edição', 'Áudio'];

const Mapas = () => {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [filtroTipoFisico, setFiltroTipoFisico] = useState('Todos');
  const [filtroNomeFisico, setFiltroNomeFisico] = useState('');
  const [filtroFuncaoHumano, setFiltroFuncaoHumano] = useState('Todas');
  const [filtroNomeHumano, setFiltroNomeHumano] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  const handlePrevWeek = () => setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  const handleNextWeek = () => setCurrentWeekStart(addWeeks(currentWeekStart, 1));

  const getOcupacaoCelula = (
    ocupacoes: Record<string, Record<string, { gravacao: string; horario: string }[]>>,
    recursoId: number,
    data: Date
  ) => {
    const dataStr = format(data, 'yyyy-MM-dd');
    return ocupacoes[String(recursoId)]?.[dataStr] || [];
  };

  const filteredRecursosFisicos = recursosFisicos.filter((r) => {
    const matchTipo = filtroTipoFisico === 'Todos' || r.tipo === filtroTipoFisico;
    const matchNome = r.nome.toLowerCase().includes(filtroNomeFisico.toLowerCase());
    return matchTipo && matchNome;
  });

  const filteredRecursosHumanos = recursosHumanos.filter((r) => {
    const matchFuncao = filtroFuncaoHumano === 'Todas' || r.funcao === filtroFuncaoHumano;
    const matchNome = r.nome.toLowerCase().includes(filtroNomeHumano.toLowerCase());
    return matchFuncao && matchNome;
  });

  const renderWeekNavigator = () => (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" onClick={handlePrevWeek}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-md">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">
          {format(currentWeekStart, "dd 'de' MMMM", { locale: ptBR })} - {format(addDays(currentWeekStart, 6), "dd 'de' MMMM", { locale: ptBR })}
        </span>
      </div>
      <Button variant="outline" size="icon" onClick={handleNextWeek}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );

  const renderOcupacaoMatriz = (
    recursos: { id: number; nome: string }[],
    ocupacoes: Record<string, Record<string, { gravacao: string; horario: string }[]>>,
    emptyMessage: string
  ) => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 bg-background z-10 min-w-[180px]">Recurso</TableHead>
            {weekDays.map((day) => (
              <TableHead key={day.toISOString()} className="text-center min-w-[140px]">
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">
                    {format(day, 'EEEE', { locale: ptBR })}
                  </span>
                  <span className="font-semibold">{format(day, 'dd/MM')}</span>
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {recursos.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            recursos.map((recurso) => (
              <TableRow key={recurso.id}>
                <TableCell className="sticky left-0 bg-background z-10 font-medium">
                  {recurso.nome}
                </TableCell>
                {weekDays.map((day) => {
                  const ocupacoesDia = getOcupacaoCelula(ocupacoes, recurso.id, day);
                  return (
                    <TableCell key={day.toISOString()} className="text-center p-1">
                      {ocupacoesDia.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {ocupacoesDia.map((oc, idx) => (
                            <div
                              key={idx}
                              className="bg-primary/10 border border-primary/30 rounded p-1.5 text-xs"
                            >
                              <div className="font-medium text-primary truncate">{oc.gravacao}</div>
                              <div className="text-muted-foreground">{oc.horario}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground/50">-</span>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-foreground">Mapas de Ocupação</h1>
        <div className="flex items-center gap-2">
          {renderWeekNavigator()}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            Filtros
          </Button>
        </div>
      </div>

      <Tabs defaultValue="fisicos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="fisicos" className="gap-2">
            <MapPin className="h-4 w-4" />
            Recursos Físicos
          </TabsTrigger>
          <TabsTrigger value="humanos" className="gap-2">
            <Users className="h-4 w-4" />
            Recursos Humanos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="fisicos" className="space-y-4">
          {showFilters && (
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm">Filtros - Recursos Físicos</CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Tipo de Recurso</Label>
                    <Select value={filtroTipoFisico} onValueChange={setFiltroTipoFisico}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {tiposRecursoFisico.map((tipo) => (
                          <SelectItem key={tipo} value={tipo}>
                            {tipo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Nome do Recurso</Label>
                    <Input
                      placeholder="Buscar por nome..."
                      value={filtroNomeFisico}
                      onChange={(e) => setFiltroNomeFisico(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-4">
              {renderOcupacaoMatriz(
                filteredRecursosFisicos,
                ocupacoesFisicas,
                'Nenhum recurso físico encontrado'
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="humanos" className="space-y-4">
          {showFilters && (
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm">Filtros - Recursos Humanos</CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Função</Label>
                    <Select value={filtroFuncaoHumano} onValueChange={setFiltroFuncaoHumano}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {funcoesRecursoHumano.map((funcao) => (
                          <SelectItem key={funcao} value={funcao}>
                            {funcao}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Nome do Colaborador</Label>
                    <Input
                      placeholder="Buscar por nome..."
                      value={filtroNomeHumano}
                      onChange={(e) => setFiltroNomeHumano(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-4">
              {renderOcupacaoMatriz(
                filteredRecursosHumanos,
                ocupacoesHumanas,
                'Nenhum recurso humano encontrado'
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Mapas;
