import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ClipboardList } from 'lucide-react';

interface GravacaoTarefasTabProps {
  gravacaoId: string;
}

interface Tarefa {
  id: string;
  titulo: string;
  recurso_humano_id: string | null;
  status_id: string | null;
  data_fim: string | null;
  recurso_humano?: { nome: string; sobrenome: string } | null;
  status?: { nome: string; cor: string | null } | null;
}

export const GravacaoTarefasTab = ({ gravacaoId }: GravacaoTarefasTabProps) => {
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTarefas = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('tarefas')
          .select(`
            id,
            titulo,
            recurso_humano_id,
            status_id,
            data_fim,
            recursos_humanos!tarefas_recurso_humano_id_fkey(nome, sobrenome),
            status_tarefa!tarefas_status_id_fkey(nome, cor)
          `)
          .eq('gravacao_id', gravacaoId)
          .order('data_fim', { ascending: true, nullsFirst: false });

        if (error) {
          console.error('Error fetching tarefas:', error);
          setTarefas([]);
        } else {
          // Map the data to match expected structure
          const mappedData = (data || []).map((t: any) => ({
            id: t.id,
            titulo: t.titulo,
            recurso_humano_id: t.recurso_humano_id,
            status_id: t.status_id,
            data_fim: t.data_fim,
            recurso_humano: t.recursos_humanos,
            status: t.status_tarefa,
          }));
          setTarefas(mappedData);
        }
      } catch (error) {
        console.error('Error fetching tarefas:', error);
      } finally {
        setLoading(false);
      }
    };

    if (gravacaoId) {
      fetchTarefas();
    }
  }, [gravacaoId]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    try {
      if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
        return format(parseISO(dateStr), 'dd/MM/yyyy');
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const getResponsavelNome = (tarefa: Tarefa) => {
    if (tarefa.recurso_humano) {
      return `${tarefa.recurso_humano.nome} ${tarefa.recurso_humano.sobrenome}`;
    }
    return '-';
  };

  if (loading) {
    return (
      <div className="space-y-2 p-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  if (tarefas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <ClipboardList className="w-12 h-12 text-muted-foreground mb-2" />
        <p className="text-muted-foreground">Nenhuma tarefa cadastrada para esta gravação.</p>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Título</TableHead>
            <TableHead>Responsável</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Data Limite</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tarefas.map((tarefa) => (
            <TableRow key={tarefa.id}>
              <TableCell>{tarefa.titulo}</TableCell>
              <TableCell>{getResponsavelNome(tarefa)}</TableCell>
              <TableCell>
                {tarefa.status ? (
                  <Badge
                    variant="outline"
                    style={{
                      backgroundColor: tarefa.status.cor ? `${tarefa.status.cor}20` : undefined,
                      borderColor: tarefa.status.cor || undefined,
                      color: tarefa.status.cor || undefined,
                    }}
                  >
                    {tarefa.status.nome}
                  </Badge>
                ) : (
                  '-'
                )}
              </TableCell>
              <TableCell>{formatDate(tarefa.data_fim)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
