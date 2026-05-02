import { Calendar, User, Video } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Tarefa, TarefaStatus } from '@/modules/tarefas/tarefas.api';

interface TarefaKanbanViewProps {
  tarefas: Tarefa[];
  statusList: TarefaStatus[];
  onEdit: (tarefa: Tarefa) => void;
  formatDate: (d: string) => string;
}

const PRIORIDADE_COLOR: Record<string, string> = {
  alta: 'bg-red-500',
  media: 'bg-yellow-500',
  baixa: 'bg-green-500',
};

const PRIORIDADE_LABEL: Record<string, string> = {
  alta: 'Alta',
  media: 'Média',
  baixa: 'Baixa',
};

function KanbanCard({
  tarefa,
  onEdit,
  formatDate,
}: {
  tarefa: Tarefa;
  onEdit: (t: Tarefa) => void;
  formatDate: (d: string) => string;
}) {
  return (
    <div
      className="bg-background border rounded-lg p-3 cursor-pointer hover:shadow-md hover:border-primary/40 transition-all space-y-2 group"
      onClick={() => onEdit(tarefa)}
    >
      <p className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-primary transition-colors">
        {tarefa.titulo}
      </p>

      {(tarefa.gravacaoNome || tarefa.recursoHumanoNome) && (
        <div className="space-y-1">
          {tarefa.gravacaoNome && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Video className="h-3 w-3 shrink-0" />
              <span className="truncate">{tarefa.gravacaoNome}</span>
            </div>
          )}
          {tarefa.recursoHumanoNome && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <User className="h-3 w-3 shrink-0" />
              <span className="truncate">{tarefa.recursoHumanoNome}</span>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-1.5">
          <div
            className={cn(
              'w-2 h-2 rounded-full shrink-0',
              PRIORIDADE_COLOR[tarefa.prioridade] ?? 'bg-gray-400',
            )}
          />
          <span className="text-xs text-muted-foreground">
            {PRIORIDADE_LABEL[tarefa.prioridade] ?? tarefa.prioridade}
          </span>
        </div>

        {tarefa.dataFim && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(tarefa.dataFim)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function KanbanColumn({
  status,
  tarefas,
  onEdit,
  formatDate,
}: {
  status: TarefaStatus | null;
  tarefas: Tarefa[];
  onEdit: (t: Tarefa) => void;
  formatDate: (d: string) => string;
}) {
  const headerColor = status?.cor ?? '#6b7280';
  const label = status?.nome ?? 'Sem Status';

  return (
    <div className="flex flex-col w-72 shrink-0 rounded-lg border bg-muted/30">
      {/* Column header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b">
        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: headerColor }} />
        <span className="text-sm font-semibold flex-1 truncate">{label}</span>
        <Badge variant="secondary" className="text-xs h-5 px-1.5 shrink-0">
          {tarefas.length}
        </Badge>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[120px] max-h-[calc(100vh-320px)]">
        {tarefas.length === 0 ? (
          <div className="flex items-center justify-center h-20 text-xs text-muted-foreground border border-dashed rounded-md">
            Nenhuma tarefa
          </div>
        ) : (
          tarefas.map((tarefa) => (
            <KanbanCard key={tarefa.id} tarefa={tarefa} onEdit={onEdit} formatDate={formatDate} />
          ))
        )}
      </div>
    </div>
  );
}

export function TarefaKanbanView({
  tarefas,
  statusList,
  onEdit,
  formatDate,
}: TarefaKanbanViewProps) {
  const tarefasByStatus: Record<string, Tarefa[]> = {};

  for (const status of statusList) {
    tarefasByStatus[status.id] = [];
  }
  const semStatus: Tarefa[] = [];

  for (const tarefa of tarefas) {
    if (tarefa.statusId && tarefasByStatus[tarefa.statusId] !== undefined) {
      tarefasByStatus[tarefa.statusId].push(tarefa);
    } else {
      semStatus.push(tarefa);
    }
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 pt-1 px-0.5 min-h-[200px]">
      {statusList.map((status) => (
        <KanbanColumn
          key={status.id}
          status={status}
          tarefas={tarefasByStatus[status.id] ?? []}
          onEdit={onEdit}
          formatDate={formatDate}
        />
      ))}
      {semStatus.length > 0 && (
        <KanbanColumn
          key="sem-status"
          status={null}
          tarefas={semStatus}
          onEdit={onEdit}
          formatDate={formatDate}
        />
      )}
    </div>
  );
}
