import { useState, useEffect, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Plus, Edit } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { IncidenciaGravacaoFormModal } from './IncidenciaGravacaoFormModal';
import {
  ApiIncidenciasGravacaoRepository,
  type IncidenciaGravacaoApiItem,
} from '@/modules/incidencias-gravacao/incidencias-gravacao.api';
import { ApiParametrizacoesRepository } from '@/modules/parametrizacoes/parametrizacoes.api.repository';

interface GravacaoIncidenciasTabProps {
  gravacaoId: string;
}

interface Incidencia extends IncidenciaGravacaoApiItem {
  severidade_titulo?: string | null;
  severidade_cor?: string | null;
}

const incidenciasRepository = new ApiIncidenciasGravacaoRepository();
const parametrizacoesRepository = new ApiParametrizacoesRepository();

export const GravacaoIncidenciasTab = ({ gravacaoId }: GravacaoIncidenciasTabProps) => {
  const { t } = useLanguage();
  const [items, setItems] = useState<Incidencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Incidencia | null>(null);

  const fetchIncidencias = useCallback(async () => {
    setLoading(true);
    try {
      const [data, severidadesResponse] = await Promise.all([
        incidenciasRepository.listByGravacao(gravacaoId),
        parametrizacoesRepository.listSeveridadesIncidencia(),
      ]);

      const severidadesById = new Map(
        (severidadesResponse.data || []).map((item) => [item.id, item]),
      );

      setItems(
        (data || []).map((item) => ({
          ...item,
          severidade_titulo: item.severidade_id
            ? severidadesById.get(item.severidade_id)?.titulo || null
            : null,
          severidade_cor: item.severidade_id
            ? severidadesById.get(item.severidade_id)?.cor || null
            : null,
        })),
      );
    } catch (err) {
      console.error('Error fetching incidencias:', err);
    } finally {
      setLoading(false);
    }
  }, [gravacaoId]);

  useEffect(() => {
    if (gravacaoId) {
      void fetchIncidencias();
    }
  }, [gravacaoId, fetchIncidencias]);

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

  const handleAddNew = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: Incidencia) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    await fetchIncidencias();
    setEditingItem(null);
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

  return (
    <div className="mt-4">
      <div className="flex justify-end mb-4">
        <Button size="sm" onClick={handleAddNew}>
          <Plus className="w-4 h-4 mr-1" />
          {t('common.new')} {t('incident.entity')}
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <AlertTriangle className="w-12 h-12 text-muted-foreground mb-2" />
          <p className="text-muted-foreground">{t('incident.noIncidents')}</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('common.externalCode')}</TableHead>
              <TableHead>{t('incident.title')}</TableHead>
              <TableHead>{t('incident.severity')}</TableHead>
              <TableHead>{t('incident.date')}</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-mono text-sm">{item.codigo_externo || '-'}</TableCell>
                <TableCell>{item.titulo}</TableCell>
                <TableCell>
                  {item.severidade_titulo ? (
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: item.severidade_cor || '#888' }}
                      />
                      <span>{item.severidade_titulo}</span>
                    </div>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>{formatDate(item.data_incidencia)}</TableCell>
                <TableCell>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => handleEdit(item)}
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <IncidenciaGravacaoFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSave}
        data={editingItem ? editingItem : { gravacao_id: gravacaoId }}
        defaultGravacaoId={gravacaoId}
        readOnly={false}
      />
    </div>
  );
};
