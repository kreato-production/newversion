import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Video } from 'lucide-react';
import { pessoasRepository } from '@/modules/pessoas/pessoas.repository.provider';
import type { GravacaoParticipacao } from '@/modules/pessoas/pessoas.types';

interface PessoaGravacoesTabProps {
  pessoaId: string;
}

export const PessoaGravacoesTab = ({ pessoaId }: PessoaGravacoesTabProps) => {
  const [gravacoes, setGravacoes] = useState<GravacaoParticipacao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGravacoes = async () => {
      setLoading(true);
      try {
        setGravacoes(await pessoasRepository.listGravacoes(pessoaId));
      } catch (error) {
        console.error('Error fetching gravacoes da pessoa:', error);
        setGravacoes([]);
      } finally {
        setLoading(false);
      }
    };

    if (pessoaId) {
      void fetchGravacoes();
    }
  }, [pessoaId]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) {
      return '-';
    }

    try {
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
              <TableCell>{formatDate(gravacao.dataPrevista)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
