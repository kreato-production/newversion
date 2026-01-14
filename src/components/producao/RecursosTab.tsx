import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Plus, Trash2, Users, X, Clock } from 'lucide-react';
import { Label } from '@/components/ui/label';

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
  alocacoes: Record<string, number>; // dia -> quantidade
  recursosHumanos: Record<string, RecursoHumanoAlocado[]>; // dia -> lista de recursos humanos (para técnicos)
  horarios: Record<string, HorarioOcupacao>; // dia -> horário de ocupação (para físicos)
}

interface RecursoHumano {
  id: string;
  nome: string;
  cargo?: string;
  departamento?: string;
}

interface RecursosTabProps {
  gravacaoId: string;
}

export const RecursosTab = ({ gravacaoId }: RecursosTabProps) => {
  const [mesAno, setMesAno] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [recursos, setRecursos] = useState<RecursoAlocado[]>(() => {
    const stored = localStorage.getItem(`kreato_gravacao_recursos_${gravacaoId}`);
    const data = stored ? JSON.parse(stored) : [];
    // Garantir que todos os recursos tenham as propriedades necessárias
    return data.map((r: RecursoAlocado) => ({
      ...r,
      recursosHumanos: r.recursosHumanos || {},
      horarios: r.horarios || {},
    }));
  });

  const [recursosTecnicos, setRecursosTecnicos] = useState<{ id: string; nome: string }[]>([]);
  const [recursosFisicos, setRecursosFisicos] = useState<{ id: string; nome: string }[]>([]);
  const [recursosHumanos, setRecursosHumanos] = useState<RecursoHumano[]>([]);
  const [selectedTipo, setSelectedTipo] = useState<'tecnico' | 'fisico'>('tecnico');
  const [selectedRecurso, setSelectedRecurso] = useState('');

  // Modal de recursos humanos (para recursos técnicos)
  const [rhModalOpen, setRhModalOpen] = useState(false);
  const [rhModalRecurso, setRhModalRecurso] = useState<RecursoAlocado | null>(null);
  const [rhModalDia, setRhModalDia] = useState('');
  const [selectedRH, setSelectedRH] = useState('');
  const [horaInicio, setHoraInicio] = useState('08:00');
  const [horaFim, setHoraFim] = useState('18:00');

  // Modal de horário de ocupação (para recursos físicos)
  const [horarioModalOpen, setHorarioModalOpen] = useState(false);
  const [horarioModalRecurso, setHorarioModalRecurso] = useState<RecursoAlocado | null>(null);
  const [horarioModalDia, setHorarioModalDia] = useState('');
  const [horarioInicio, setHorarioInicio] = useState('08:00');
  const [horarioFim, setHorarioFim] = useState('18:00');

  useEffect(() => {
    const tecnicos = localStorage.getItem('kreato_recursos_tecnicos');
    const fisicos = localStorage.getItem('kreato_recursos_fisicos');
    const humanos = localStorage.getItem('kreato_recursos_humanos');
    setRecursosTecnicos(tecnicos ? JSON.parse(tecnicos) : []);
    setRecursosFisicos(fisicos ? JSON.parse(fisicos) : []);
    setRecursosHumanos(humanos ? JSON.parse(humanos) : []);
  }, []);

  const saveToStorage = (data: RecursoAlocado[]) => {
    localStorage.setItem(`kreato_gravacao_recursos_${gravacaoId}`, JSON.stringify(data));
    setRecursos(data);
  };

  const diasDoMes = useMemo(() => {
    const [ano, mes] = mesAno.split('-').map(Number);
    const ultimoDia = new Date(ano, mes, 0).getDate();
    const dias: { dia: number; diaSemana: number; isWeekend: boolean; dataKey: string }[] = [];
    
    for (let d = 1; d <= ultimoDia; d++) {
      const data = new Date(ano, mes - 1, d);
      const diaSemana = data.getDay();
      dias.push({
        dia: d,
        diaSemana,
        isWeekend: diaSemana === 0 || diaSemana === 6,
        dataKey: `${mesAno}-${String(d).padStart(2, '0')}`,
      });
    }
    return dias;
  }, [mesAno]);

  const handleAddRecurso = () => {
    if (!selectedRecurso) return;
    
    const lista = selectedTipo === 'tecnico' ? recursosTecnicos : recursosFisicos;
    const recurso = lista.find((r) => r.id === selectedRecurso);
    if (!recurso) return;

    const exists = recursos.find((r) => r.recursoId === selectedRecurso && r.tipo === selectedTipo);
    if (exists) return;

    const novoRecurso: RecursoAlocado = {
      id: crypto.randomUUID(),
      tipo: selectedTipo,
      recursoId: selectedRecurso,
      recursoNome: recurso.nome,
      alocacoes: {},
      recursosHumanos: {},
      horarios: {},
    };

    saveToStorage([...recursos, novoRecurso]);
    setSelectedRecurso('');
  };

  const handleRemoveRecurso = (id: string) => {
    saveToStorage(recursos.filter((r) => r.id !== id));
  };

  const handleAlocacaoChange = (recursoId: string, dia: string, valor: number) => {
    const updated = recursos.map((r) => {
      if (r.id === recursoId) {
        return {
          ...r,
          alocacoes: {
            ...r.alocacoes,
            [dia]: valor,
          },
        };
      }
      return r;
    });
    saveToStorage(updated);
  };

  const openRHModal = (recurso: RecursoAlocado, dia: string) => {
    setRhModalRecurso(recurso);
    setRhModalDia(dia);
    setSelectedRH('');
    setHoraInicio('08:00');
    setHoraFim('18:00');
    setRhModalOpen(true);
  };

  const handleAddRH = () => {
    if (!selectedRH || !rhModalRecurso) return;
    
    const rh = recursosHumanos.find((r) => r.id === selectedRH);
    if (!rh) return;

    const novoRH: RecursoHumanoAlocado = {
      id: crypto.randomUUID(),
      recursoHumanoId: selectedRH,
      nome: rh.nome,
      horaInicio,
      horaFim,
    };

    const updated = recursos.map((r) => {
      if (r.id === rhModalRecurso.id) {
        const rhAtual = r.recursosHumanos[rhModalDia] || [];
        return {
          ...r,
          recursosHumanos: {
            ...r.recursosHumanos,
            [rhModalDia]: [...rhAtual, novoRH],
          },
        };
      }
      return r;
    });

    saveToStorage(updated);
    setSelectedRH('');
    setHoraInicio('08:00');
    setHoraFim('18:00');
  };

  const handleRemoveRH = (recursoId: string, dia: string, rhId: string) => {
    const updated = recursos.map((r) => {
      if (r.id === recursoId) {
        return {
          ...r,
          recursosHumanos: {
            ...r.recursosHumanos,
            [dia]: (r.recursosHumanos[dia] || []).filter((rh) => rh.id !== rhId),
          },
        };
      }
      return r;
    });
    saveToStorage(updated);
  };

  const getRHCount = (recurso: RecursoAlocado, dia: string) => {
    return (recurso.recursosHumanos[dia] || []).length;
  };

  // Funções para horário de ocupação (recursos físicos)
  const openHorarioModal = (recurso: RecursoAlocado, dia: string) => {
    setHorarioModalRecurso(recurso);
    setHorarioModalDia(dia);
    const horarioExistente = recurso.horarios[dia];
    setHorarioInicio(horarioExistente?.horaInicio || '08:00');
    setHorarioFim(horarioExistente?.horaFim || '18:00');
    setHorarioModalOpen(true);
  };

  const handleSaveHorario = () => {
    if (!horarioModalRecurso) return;

    const updated = recursos.map((r) => {
      if (r.id === horarioModalRecurso.id) {
        return {
          ...r,
          horarios: {
            ...r.horarios,
            [horarioModalDia]: {
              horaInicio: horarioInicio,
              horaFim: horarioFim,
            },
          },
        };
      }
      return r;
    });

    saveToStorage(updated);
    setHorarioModalOpen(false);
  };

  const handleRemoveHorario = () => {
    if (!horarioModalRecurso) return;

    const updated = recursos.map((r) => {
      if (r.id === horarioModalRecurso.id) {
        const { [horarioModalDia]: _, ...restHorarios } = r.horarios;
        return {
          ...r,
          horarios: restHorarios,
        };
      }
      return r;
    });

    saveToStorage(updated);
    setHorarioModalOpen(false);
  };

  const getHorario = (recurso: RecursoAlocado, dia: string): HorarioOcupacao | undefined => {
    return recurso.horarios[dia];
  };

  const mesesDisponiveis = useMemo(() => {
    const meses = [];
    const now = new Date();
    for (let i = -6; i <= 12; i++) {
      const data = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const valor = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
      const label = data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      meses.push({ valor, label });
    }
    return meses;
  }, []);

  const recursosDisponiveis = selectedTipo === 'tecnico' ? recursosTecnicos : recursosFisicos;

  // Agrupar recursos por tipo
  const recursosTecnicosAlocados = recursos.filter((r) => r.tipo === 'tecnico');
  const recursosFisicosAlocados = recursos.filter((r) => r.tipo === 'fisico');

  const rhAlocadosNoDia = rhModalRecurso?.recursosHumanos[rhModalDia] || [];

  const renderRecursosTable = (recursosLista: RecursoAlocado[], tipoLabel: string, tipoIcon: string, isTecnico: boolean) => {
    if (recursosLista.length === 0) return null;

    return (
      <div className="mb-4">
        <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
          <span className="text-muted-foreground">{tipoIcon}</span>
          {tipoLabel}
          <span className="text-xs text-muted-foreground">({recursosLista.length})</span>
        </h4>
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-1.5 py-1 font-medium sticky left-0 bg-muted/50 min-w-40 text-xs">
                  Recurso
                </th>
                {diasDoMes.map((d) => (
                  <th
                    key={d.dia}
                    className={`px-0.5 py-1 text-center font-medium w-10 ${d.isWeekend ? 'bg-weekend' : ''}`}
                  >
                    {d.dia}
                  </th>
                ))}
                <th className="px-1 py-1 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {recursosLista.map((recurso) => (
                <tr key={recurso.id} className="border-b">
                  <td className="px-1.5 py-0.5 sticky left-0 bg-card font-medium text-xs whitespace-nowrap">
                    {recurso.recursoNome}
                  </td>
                  {diasDoMes.map((d) => {
                    const rhCount = getRHCount(recurso, d.dataKey);
                    const rhList = recurso.recursosHumanos[d.dataKey] || [];
                    const qtdAlocada = recurso.alocacoes[d.dataKey] || 0;
                    const faltaColaborador = isTecnico && qtdAlocada > 0 && rhCount === 0;
                    const horario = getHorario(recurso, d.dataKey);
                    const faltaHorario = !isTecnico && qtdAlocada > 0 && !horario;
                    
                    return (
                      <td
                        key={d.dia}
                        className={`px-0 py-0.5 text-center ${d.isWeekend ? 'bg-weekend' : ''}`}
                      >
                        <div className="flex flex-col items-center gap-0.5">
                          <Input
                            type="number"
                            min="0"
                            className="w-8 h-6 text-center p-0 text-[10px]"
                            value={recurso.alocacoes[d.dataKey] || ''}
                            onChange={(e) =>
                              handleAlocacaoChange(
                                recurso.id,
                                d.dataKey,
                                parseInt(e.target.value) || 0
                              )
                            }
                          />
                          {/* Ícone de colaborador para recursos TÉCNICOS */}
                          {isTecnico && (
                            <TooltipProvider delayDuration={200}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className={`h-5 w-5 relative ${
                                      faltaColaborador 
                                        ? 'text-destructive hover:text-destructive' 
                                        : rhCount > 0 
                                          ? 'text-primary' 
                                          : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                    onClick={() => openRHModal(recurso, d.dataKey)}
                                  >
                                    <Users className="w-3 h-3" />
                                    {rhCount > 0 && (
                                      <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[8px] rounded-full w-3 h-3 flex items-center justify-center">
                                        {rhCount}
                                      </span>
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs">
                                  {rhCount > 0 ? (
                                    <div className="space-y-1">
                                      <p className="font-medium text-xs">{rhCount} colaborador(es):</p>
                                      <ul className="text-xs space-y-0.5">
                                        {rhList.map((rh) => (
                                          <li key={rh.id} className="text-muted-foreground">
                                            • {rh.nome} ({rh.horaInicio} - {rh.horaFim})
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  ) : faltaColaborador ? (
                                    <p className="text-xs text-destructive font-medium">
                                      Atenção: recurso sem colaborador associado!
                                    </p>
                                  ) : (
                                    <p className="text-xs text-muted-foreground">
                                      Clique para adicionar colaboradores
                                    </p>
                                  )}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          {/* Ícone de horário para recursos FÍSICOS */}
                          {!isTecnico && (
                            <TooltipProvider delayDuration={200}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className={`h-5 w-5 relative ${
                                      faltaHorario 
                                        ? 'text-destructive hover:text-destructive' 
                                        : horario 
                                          ? 'text-primary' 
                                          : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                    onClick={() => openHorarioModal(recurso, d.dataKey)}
                                  >
                                    <Clock className="w-3 h-3" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs">
                                  {horario ? (
                                    <div className="space-y-1">
                                      <p className="font-medium text-xs">Horário de ocupação:</p>
                                      <p className="text-xs text-muted-foreground">
                                        {horario.horaInicio} - {horario.horaFim}
                                      </p>
                                    </div>
                                  ) : faltaHorario ? (
                                    <p className="text-xs text-destructive font-medium">
                                      Atenção: defina o horário de ocupação!
                                    </p>
                                  ) : (
                                    <p className="text-xs text-muted-foreground">
                                      Clique para definir horário
                                    </p>
                                  )}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </td>
                    );
                  })}
                  <td className="px-0 py-0.5">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemoveRecurso(recurso.id)}
                      className="h-6 w-6 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <label className="text-sm text-muted-foreground">Mês/Ano</label>
          <Select value={mesAno} onValueChange={setMesAno}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {mesesDisponiveis.map((m) => (
                <SelectItem key={m.valor} value={m.valor}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-sm text-muted-foreground">Tipo</label>
          <Select value={selectedTipo} onValueChange={(v) => setSelectedTipo(v as 'tecnico' | 'fisico')}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tecnico">Técnico</SelectItem>
              <SelectItem value="fisico">Físico</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1 flex-1 min-w-48">
          <label className="text-sm text-muted-foreground">Recurso</label>
          <Select value={selectedRecurso} onValueChange={setSelectedRecurso}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um recurso..." />
            </SelectTrigger>
            <SelectContent>
              {recursosDisponiveis.map((r) => (
                <SelectItem key={r.id} value={r.id}>{r.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleAddRecurso} disabled={!selectedRecurso} size="icon">
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {recursos.length > 0 && (
        <div className="space-y-4">
          {renderRecursosTable(recursosTecnicosAlocados, 'Recursos Técnicos', '🔧', true)}
          {renderRecursosTable(recursosFisicosAlocados, 'Recursos Físicos', '🏢', false)}
        </div>
      )}

      {recursos.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>Nenhum recurso adicionado ainda.</p>
          <p className="text-sm">Adicione recursos técnicos ou físicos acima.</p>
        </div>
      )}

      {/* Modal para gerenciar recursos humanos */}
      <Dialog open={rhModalOpen} onOpenChange={setRhModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Recursos Humanos - {rhModalRecurso?.recursoNome}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Data: {rhModalDia ? new Date(rhModalDia + 'T12:00:00').toLocaleDateString('pt-BR') : ''}
            </p>
          </DialogHeader>

          <div className="space-y-4">
            {/* Formulário para adicionar */}
            <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
              <Label className="text-sm font-medium">Adicionar Colaborador</Label>
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Colaborador</Label>
                  <Select value={selectedRH} onValueChange={setSelectedRH}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {recursosHumanos.map((rh) => (
                        <SelectItem key={rh.id} value={rh.id}>
                          {rh.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Hora Início</Label>
                    <Input
                      type="time"
                      value={horaInicio}
                      onChange={(e) => setHoraInicio(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Hora Fim</Label>
                    <Input
                      type="time"
                      value={horaFim}
                      onChange={(e) => setHoraFim(e.target.value)}
                    />
                  </div>
                </div>
                <Button onClick={handleAddRH} disabled={!selectedRH} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar
                </Button>
              </div>
            </div>

            {/* Lista de recursos humanos alocados */}
            {rhAlocadosNoDia.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Colaboradores Alocados</Label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {rhAlocadosNoDia.map((rh) => (
                    <div
                      key={rh.id}
                      className="flex items-center justify-between p-2 border rounded-lg bg-background"
                    >
                      <div>
                        <p className="font-medium text-sm">{rh.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {rh.horaInicio} - {rh.horaFim}
                        </p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleRemoveRH(rhModalRecurso!.id, rhModalDia, rh.id)}
                        className="h-7 w-7 text-destructive hover:text-destructive"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {rhAlocadosNoDia.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-4">
                Nenhum colaborador alocado para este dia.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRhModalOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para definir horário de ocupação (recursos físicos) */}
      <Dialog open={horarioModalOpen} onOpenChange={setHorarioModalOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Horário de Ocupação - {horarioModalRecurso?.recursoNome}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Data: {horarioModalDia ? new Date(horarioModalDia + 'T12:00:00').toLocaleDateString('pt-BR') : ''}
            </p>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Hora Início</Label>
                <Input
                  type="time"
                  value={horarioInicio}
                  onChange={(e) => setHorarioInicio(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Hora Fim</Label>
                <Input
                  type="time"
                  value={horarioFim}
                  onChange={(e) => setHorarioFim(e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            {horarioModalRecurso?.horarios[horarioModalDia] && (
              <Button variant="destructive" onClick={handleRemoveHorario}>
                Remover
              </Button>
            )}
            <Button variant="outline" onClick={() => setHorarioModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveHorario}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
