import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ClipboardList } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ApiTarefasRepository, type Tarefa } from '@/modules/tarefas/tarefas.api';

interface GravacaoTarefasTabProps {
  gravacaoId: string;
}

const tarefasRepository = new ApiTarefasRepository();

export const GravacaoTarefasTab = ({ gravacaoId }: GravacaoTarefasTabProps) => {
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      try {
        setTarefas(await tarefasRepository.listByGravacao(gravacaoId));
      } catch (error) {
        console.error('Error fetching tarefas:', error);
        setTarefas([]);
      } finally {
        setLoading(false);
      }
    };

    if (gravacaoId) {
      void load();
    }
  }, [gravacaoId]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) {
      return '-';
    }

    try {
      return format(parseISO(dateStr), 'dd/MM/yyyy');
    } catch {
      return dateStr;
    }
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
        <p className="text-muted-foreground">Nenhuma tarefa cadastrada para esta gravaÃ§Ã£o.</p>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>TÃ­tulo</TableHead>
            <TableHead>ResponsÃ¡vel</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Data Limite</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tarefas.map((tarefa) => (
            <TableRow key={tarefa.id}>
              <TableCell>{tarefa.titulo}</TableCell>
              <TableCell>{tarefa.recursoHumanoNome || '-'}</TableCell>
              <TableCell>
                {tarefa.statusNome ? (
                  <Badge
                    variant="outline"
                    style={{
                      backgroundColor: tarefa.statusCor ? `${tarefa.statusCor}20` : undefined,
                      borderColor: tarefa.statusCor || undefined,
                      color: tarefa.statusCor || undefined,
                    }}
                  >
                    {tarefa.statusNome}
                  </Badge>
                ) : (
                  '-'
                )}
              </TableCell>
              <TableCell>{formatDate(tarefa.dataFim)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
