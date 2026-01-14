import { useState, useEffect, useMemo } from 'react';
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

interface Gravacao {
  id: string;
  nome: string;
  codigoExterno: string;
}

interface RecursoFisico {
  id: string;
  nome: string;
  tipo?: string;
}

interface RecursoHumano {
  id: string;
  nome: string;
  funcao?: string;
  cargo?: string;
}

interface OcupacaoItem {
  gravacao: string;
  gravacaoId: string;
  horario: string;
}

const Mapas = () => {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [filtroTipoFisico, setFiltroTipoFisico] = useState('Todos');
  const [filtroNomeFisico, setFiltroNomeFisico] = useState('');
  const [filtroFuncaoHumano, setFiltroFuncaoHumano] = useState('Todas');
  const [filtroNomeHumano, setFiltroNomeHumano] = useState('');
  const [filtroGravacao, setFiltroGravacao] = useState('Todas');
  const [showFilters, setShowFilters] = useState(false);

  // Carregar dados do localStorage
  const [gravacoes, setGravacoes] = useState<Gravacao[]>([]);
  const [recursosFisicos, setRecursosFisicos] = useState<RecursoFisico[]>([]);
  const [recursosHumanos, setRecursosHumanos] = useState<RecursoHumano[]>([]);
  const [alocacoesPorGravacao, setAlocacoesPorGravacao] = useState<Record<string, RecursoAlocado[]>>({});

  useEffect(() => {
    // Carregar gravações
    const storedGravacoes = localStorage.getItem('kreato_gravacoes');
    const gravacoesList: Gravacao[] = storedGravacoes ? JSON.parse(storedGravacoes) : [];
    setGravacoes(gravacoesList);

    // Carregar recursos físicos
    const storedFisicos = localStorage.getItem('kreato_recursos_fisicos');
    setRecursosFisicos(storedFisicos ? JSON.parse(storedFisicos) : []);

    // Carregar recursos humanos
    const storedHumanos = localStorage.getItem('kreato_recursos_humanos');
    setRecursosHumanos(storedHumanos ? JSON.parse(storedHumanos) : []);

    // Carregar alocações de cada gravação
    const alocacoes: Record<string, RecursoAlocado[]> = {};
    gravacoesList.forEach((g) => {
      const stored = localStorage.getItem(`kreato_gravacao_recursos_${g.id}`);
      if (stored) {
        alocacoes[g.id] = JSON.parse(stored);
      }
    });
    setAlocacoesPorGravacao(alocacoes);
  }, []);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  const handlePrevWeek = () => setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  const handleNextWeek = () => setCurrentWeekStart(addWeeks(currentWeekStart, 1));

  // Calcular ocupações de recursos físicos baseado nas alocações
  const ocupacoesFisicas = useMemo(() => {
    const ocupacoes: Record<string, Record<string, OcupacaoItem[]>> = {};

    Object.entries(alocacoesPorGravacao).forEach(([gravacaoId, recursos]) => {
      const gravacao = gravacoes.find((g) => g.id === gravacaoId);
      if (!gravacao) return;

      recursos
        .filter((r) => r.tipo === 'fisico')
        .forEach((recurso) => {
          if (!ocupacoes[recurso.recursoId]) {
            ocupacoes[recurso.recursoId] = {};
          }

          Object.entries(recurso.alocacoes).forEach(([dia, qtd]) => {
            if (qtd > 0) {
              const horario = recurso.horarios[dia];
              const horarioStr = horario
                ? `${horario.horaInicio} - ${horario.horaFim}`
                : 'Horário não definido';

              if (!ocupacoes[recurso.recursoId][dia]) {
                ocupacoes[recurso.recursoId][dia] = [];
              }

              ocupacoes[recurso.recursoId][dia].push({
                gravacao: gravacao.nome,
                gravacaoId: gravacao.id,
                horario: horarioStr,
              });
            }
          });
        });
    });

    return ocupacoes;
  }, [alocacoesPorGravacao, gravacoes]);

  // Calcular ocupações de recursos humanos baseado nas alocações
  const ocupacoesHumanas = useMemo(() => {
    const ocupacoes: Record<string, Record<string, OcupacaoItem[]>> = {};

    Object.entries(alocacoesPorGravacao).forEach(([gravacaoId, recursos]) => {
      const gravacao = gravacoes.find((g) => g.id === gravacaoId);
      if (!gravacao) return;

      recursos
        .filter((r) => r.tipo === 'tecnico')
        .forEach((recurso) => {
          Object.entries(recurso.recursosHumanos || {}).forEach(([dia, rhList]) => {
            rhList.forEach((rh) => {
              if (!ocupacoes[rh.recursoHumanoId]) {
                ocupacoes[rh.recursoHumanoId] = {};
              }

              if (!ocupacoes[rh.recursoHumanoId][dia]) {
                ocupacoes[rh.recursoHumanoId][dia] = [];
              }

              ocupacoes[rh.recursoHumanoId][dia].push({
                gravacao: gravacao.nome,
                gravacaoId: gravacao.id,
                horario: `${rh.horaInicio} - ${rh.horaFim}`,
              });
            });
          });
        });
    });

    return ocupacoes;
  }, [alocacoesPorGravacao, gravacoes]);

  // Obter tipos únicos de recursos físicos
  const tiposRecursoFisico = useMemo(() => {
    const tipos = new Set<string>();
    tipos.add('Todos');
    recursosFisicos.forEach((r) => {
      if (r.tipo) tipos.add(r.tipo);
    });
    return Array.from(tipos);
  }, [recursosFisicos]);

  // Obter funções únicas de recursos humanos
  const funcoesRecursoHumano = useMemo(() => {
    const funcoes = new Set<string>();
    funcoes.add('Todas');
    recursosHumanos.forEach((r) => {
      if (r.funcao) funcoes.add(r.funcao);
      if (r.cargo) funcoes.add(r.cargo);
    });
    return Array.from(funcoes);
  }, [recursosHumanos]);

  const getOcupacaoCelula = (
    ocupacoes: Record<string, Record<string, OcupacaoItem[]>>,
    recursoId: string,
    data: Date
  ) => {
    const dataStr = format(data, 'yyyy-MM-dd');
    let items = ocupacoes[recursoId]?.[dataStr] || [];
    
    // Filtrar por gravação se selecionado
    if (filtroGravacao !== 'Todas') {
      items = items.filter((item) => item.gravacaoId === filtroGravacao);
    }
    
    return items;
  };

  const filteredRecursosFisicos = recursosFisicos.filter((r) => {
    const matchTipo = filtroTipoFisico === 'Todos' || r.tipo === filtroTipoFisico;
    const matchNome = r.nome.toLowerCase().includes(filtroNomeFisico.toLowerCase());
    return matchTipo && matchNome;
  });

  const filteredRecursosHumanos = recursosHumanos.filter((r) => {
    const matchFuncao =
      filtroFuncaoHumano === 'Todas' ||
      r.funcao === filtroFuncaoHumano ||
      r.cargo === filtroFuncaoHumano;
    const matchNome = r.nome.toLowerCase().includes(filtroNomeHumano.toLowerCase());
    return matchFuncao && matchNome;
  });

  // Agrupar recursos humanos por cargo
  const recursosHumanosAgrupados = useMemo(() => {
    const grupos: Record<string, RecursoHumano[]> = {};
    filteredRecursosHumanos.forEach((r) => {
      const grupo = r.cargo || r.funcao || 'Sem cargo';
      if (!grupos[grupo]) {
        grupos[grupo] = [];
      }
      grupos[grupo].push(r);
    });
    return grupos;
  }, [filteredRecursosHumanos]);

  const renderWeekNavigator = () => (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" onClick={handlePrevWeek}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-md">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">
          {format(currentWeekStart, "dd 'de' MMMM", { locale: ptBR })} -{' '}
          {format(addDays(currentWeekStart, 6), "dd 'de' MMMM", { locale: ptBR })}
        </span>
      </div>
      <Button variant="outline" size="icon" onClick={handleNextWeek}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );

  const renderOcupacaoMatriz = (
    recursos: { id: string; nome: string }[],
    ocupacoes: Record<string, Record<string, OcupacaoItem[]>>,
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
                              <div className="font-medium text-primary truncate" title={oc.gravacao}>
                                {oc.gravacao}
                              </div>
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

  const renderOcupacaoMatrizAgrupada = (
    grupos: Record<string, RecursoHumano[]>,
    ocupacoes: Record<string, Record<string, OcupacaoItem[]>>,
    emptyMessage: string
  ) => {
    const grupoKeys = Object.keys(grupos).sort();
    
    if (grupoKeys.length === 0) {
      return (
        <div className="text-center text-muted-foreground py-8">
          {emptyMessage}
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {grupoKeys.map((grupo) => (
          <div key={grupo}>
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-semibold text-foreground">{grupo}</h4>
              <span className="text-xs text-muted-foreground">({grupos[grupo].length})</span>
            </div>
            <div className="overflow-x-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-background z-10 min-w-[180px]">Colaborador</TableHead>
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
                  {grupos[grupo].map((recurso) => (
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
                                    <div className="font-medium text-primary truncate" title={oc.gravacao}>
                                      {oc.gravacao}
                                    </div>
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
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ))}
      </div>
    );
  };

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
                  <div className="space-y-1.5">
                    <Label className="text-xs">Gravação/Projeto</Label>
                    <Select value={filtroGravacao} onValueChange={setFiltroGravacao}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Todas">Todas</SelectItem>
                        {gravacoes.map((g) => (
                          <SelectItem key={g.id} value={g.id}>
                            {g.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                'Nenhum recurso físico encontrado. Cadastre recursos físicos e aloque-os em gravações.'
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
                    <Label className="text-xs">Função/Cargo</Label>
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
                  <div className="space-y-1.5">
                    <Label className="text-xs">Gravação/Projeto</Label>
                    <Select value={filtroGravacao} onValueChange={setFiltroGravacao}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Todas">Todas</SelectItem>
                        {gravacoes.map((g) => (
                          <SelectItem key={g.id} value={g.id}>
                            {g.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-4">
              {renderOcupacaoMatrizAgrupada(
                recursosHumanosAgrupados,
                ocupacoesHumanas,
                'Nenhum recurso humano encontrado. Cadastre colaboradores e aloque-os em recursos técnicos das gravações.'
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Mapas;
