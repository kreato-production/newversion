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
import { Plus, Trash2 } from 'lucide-react';

interface RecursoAlocado {
  id: string;
  tipo: 'tecnico' | 'fisico';
  recursoId: string;
  recursoNome: string;
  alocacoes: Record<string, number>; // dia -> quantidade
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
    return stored ? JSON.parse(stored) : [];
  });

  const [recursosTecnicos, setRecursosTecnicos] = useState<{ id: string; nome: string }[]>([]);
  const [recursosFisicos, setRecursosFisicos] = useState<{ id: string; nome: string }[]>([]);
  const [selectedTipo, setSelectedTipo] = useState<'tecnico' | 'fisico'>('tecnico');
  const [selectedRecurso, setSelectedRecurso] = useState('');

  useEffect(() => {
    const tecnicos = localStorage.getItem('kreato_recursos_tecnicos');
    const fisicos = localStorage.getItem('kreato_recursos_fisicos');
    setRecursosTecnicos(tecnicos ? JSON.parse(tecnicos) : []);
    setRecursosFisicos(fisicos ? JSON.parse(fisicos) : []);
  }, []);

  const saveToStorage = (data: RecursoAlocado[]) => {
    localStorage.setItem(`kreato_gravacao_recursos_${gravacaoId}`, JSON.stringify(data));
    setRecursos(data);
  };

  const diasDoMes = useMemo(() => {
    const [ano, mes] = mesAno.split('-').map(Number);
    const ultimoDia = new Date(ano, mes, 0).getDate();
    const dias: { dia: number; diaSemana: number; isWeekend: boolean }[] = [];
    
    for (let d = 1; d <= ultimoDia; d++) {
      const data = new Date(ano, mes - 1, d);
      const diaSemana = data.getDay();
      dias.push({
        dia: d,
        diaSemana,
        isWeekend: diaSemana === 0 || diaSemana === 6,
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
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-2 font-medium sticky left-0 bg-muted/50 min-w-48">Recurso</th>
                {diasDoMes.map((d) => (
                  <th
                    key={d.dia}
                    className={`p-2 text-center font-medium min-w-12 ${d.isWeekend ? 'bg-weekend' : ''}`}
                  >
                    {d.dia}
                  </th>
                ))}
                <th className="p-2 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {recursos.map((recurso) => (
                <tr key={recurso.id} className="border-b">
                  <td className="p-2 sticky left-0 bg-card font-medium">
                    <span className="text-xs text-muted-foreground mr-1">
                      [{recurso.tipo === 'tecnico' ? 'T' : 'F'}]
                    </span>
                    {recurso.recursoNome}
                  </td>
                  {diasDoMes.map((d) => (
                    <td
                      key={d.dia}
                      className={`p-1 text-center ${d.isWeekend ? 'bg-weekend' : ''}`}
                    >
                      <Input
                        type="number"
                        min="0"
                        className="w-12 h-8 text-center p-1 text-xs"
                        value={recurso.alocacoes[`${mesAno}-${String(d.dia).padStart(2, '0')}`] || ''}
                        onChange={(e) =>
                          handleAlocacaoChange(
                            recurso.id,
                            `${mesAno}-${String(d.dia).padStart(2, '0')}`,
                            parseInt(e.target.value) || 0
                          )
                        }
                      />
                    </td>
                  ))}
                  <td className="p-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemoveRecurso(recurso.id)}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {recursos.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>Nenhum recurso adicionado ainda.</p>
          <p className="text-sm">Adicione recursos técnicos ou físicos acima.</p>
        </div>
      )}
    </div>
  );
};
