import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Video } from 'lucide-react';

interface PessoaGravacoesTabProps {
  pessoaId: string;
}

interface GravacaoParticipacao {
  id: string;
  codigo: string;
  nome: string;
  data_prevista: string | null;
}

export const PessoaGravacoesTab = ({ pessoaId }: PessoaGravacoesTabProps) => {
  const [gravacoes, setGravacoes] = useState<GravacaoParticipacao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGravacoes = async () => {
      setLoading(true);
      try {
        // Get recordings where the person is in the cast (gravacao_elenco)
        const { data: elencoData } = await supabase
          .from('gravacao_elenco')
          .select('gravacao_id')
          .eq('pessoa_id', pessoaId)
          .not('gravacao_id', 'is', null);

        // Get recordings where the person is a guest (gravacao_convidados)
        const { data: convidadosData } = await supabase
          .from('gravacao_convidados')
          .select('gravacao_id')
          .eq('pessoa_id', pessoaId);

        // Combine unique gravacao IDs
        const elencoIds = (elencoData || []).map(e => e.gravacao_id).filter(Boolean) as string[];
        const convidadosIds = (convidadosData || []).map(c => c.gravacao_id);
        const allIds = [...new Set([...elencoIds, ...convidadosIds])];

        if (allIds.length === 0) {
          setGravacoes([]);
          setLoading(false);
          return;
        }

        // Fetch the recordings details
        const { data: gravacoesData } = await supabase
          .from('gravacoes')
          .select('id, codigo, nome, data_prevista')
          .in('id', allIds)
          .order('data_prevista', { ascending: false, nullsFirst: false });

        setGravacoes(gravacoesData || []);
      } catch (error) {
        console.error('Error fetching gravacoes:', error);
      } finally {
        setLoading(false);
      }
    };

    if (pessoaId) {
      fetchGravacoes();
    }
  }, [pessoaId]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    try {
      // Check if it's ISO format
      if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
        return format(parseISO(dateStr), 'dd/MM/yyyy');
      }
      return dateStr;
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

  if (gravacoes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Video className="w-12 h-12 text-muted-foreground mb-2" />
        <p className="text-muted-foreground">Esta pessoa não participou de nenhuma gravação.</p>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Título</TableHead>
            <TableHead>Data Prevista</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {gravacoes.map((gravacao) => (
            <TableRow key={gravacao.id}>
              <TableCell className="font-mono">{gravacao.codigo}</TableCell>
              <TableCell>{gravacao.nome}</TableCell>
              <TableCell>{formatDate(gravacao.data_prevista)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
