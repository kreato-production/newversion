import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Trash2, User } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  gravacoesRelacionamentosApi,
  type GravacaoConvidadoItem,
  type GravacaoConvidadoPessoa,
} from '@/modules/gravacoes/gravacoes-relacionamentos.api';

interface ConvidadosTabProps {
  gravacaoId: string;
}

export const ConvidadosTab = ({ gravacaoId }: ConvidadosTabProps) => {
  const { toast } = useToast();
  const [convidados, setConvidados] = useState<GravacaoConvidadoItem[]>([]);
  const [pessoas, setPessoas] = useState<GravacaoConvidadoPessoa[]>([]);
  const [selectedPessoa, setSelectedPessoa] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const response = await gravacoesRelacionamentosApi.listConvidados(gravacaoId);
      setConvidados(response.items);
      setPessoas(response.pessoas);
    } catch (error) {
      console.error('Error fetching convidados from backend:', error);
      toast({
        title: 'Erro',
        description: `Erro ao carregar convidados: ${(error as Error).message}`,
        variant: 'destructive',
      });
    }
  }, [gravacaoId, toast]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleAddConvidado = async () => {
    if (!selectedPessoa) return;

    const pessoa = pessoas.find((item) => item.id === selectedPessoa);
    if (!pessoa) return;

    const exists = convidados.find((item) => item.pessoaId === selectedPessoa);
    if (exists) {
      toast({
        title: 'Atencao',
        description: 'Esta pessoa ja foi adicionada como convidada.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const inserted = await gravacoesRelacionamentosApi.addConvidado(gravacaoId, {
        pessoaId: selectedPessoa,
        observacao: observacoes,
      });

      setConvidados((current) => [...current, inserted]);
      setSelectedPessoa('');
      setObservacoes('');
    } catch (error) {
      console.error('Error adding convidado from backend:', error);
      toast({
        title: 'Erro',
        description: `Erro ao adicionar convidado: ${(error as Error).message}`,
        variant: 'destructive',
      });
    }
  };

  const handleRemoveConvidado = async (id: string) => {
    try {
      await gravacoesRelacionamentosApi.removeConvidado(gravacaoId, id);
      setConvidados((current) => current.filter((item) => item.id !== id));
    } catch (error) {
      console.error('Error removing convidado from backend:', error);
      toast({
        title: 'Erro',
        description: `Erro ao remover convidado: ${(error as Error).message}`,
        variant: 'destructive',
      });
    }
  };

  const pessoasDisponiveis = pessoas.filter(
    (item) => !convidados.find((convidado) => convidado.pessoaId === item.id),
  );

  const pessoasFiltradas = pessoasDisponiveis.filter((item) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      item.nome.toLowerCase().includes(searchLower) ||
      item.sobrenome.toLowerCase().includes(searchLower) ||
      item.nomeTrabalho.toLowerCase().includes(searchLower)
    );
  });

  const getInitials = (nome: string) =>
    nome
      .split(' ')
      .map((parte) => parte[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  return (
    <div className="space-y-6 mt-4">
      <div className="border rounded-lg p-4 bg-muted/30">
        <h4 className="font-medium mb-4 flex items-center gap-2">
          <User className="h-4 w-4" />
          Adicionar Convidado
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2 lg:col-span-2">
            <Label>Pessoa *</Label>
            <Select value={selectedPessoa} onValueChange={setSelectedPessoa}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma pessoa..." />
              </SelectTrigger>
              <SelectContent>
                <div className="px-2 py-1.5">
                  <Input
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-8"
                  />
                </div>
                {pessoasFiltradas.length === 0 ? (
                  <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                    Nenhuma pessoa encontrada
                  </div>
                ) : (
                  pessoasFiltradas.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={item.foto} />
                          <AvatarFallback className="text-[10px]">
                            {getInitials(`${item.nome} ${item.sobrenome}`)}
                          </AvatarFallback>
                        </Avatar>
                        <span>{item.nomeTrabalho || `${item.nome} ${item.sobrenome}`}</span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button
              type="button"
              onClick={() => void handleAddConvidado()}
              disabled={!selectedPessoa}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <Label>Observacoes</Label>
          <Textarea
            placeholder="Observacoes sobre o convidado..."
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            rows={2}
          />
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Observacoes</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {convidados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Nenhum convidado adicionado
                </TableCell>
              </TableRow>
            ) : (
              convidados.map((convidado) => (
                <TableRow key={convidado.id}>
                  <TableCell>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={convidado.foto} />
                      <AvatarFallback>{getInitials(convidado.nome)}</AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{convidado.nomeTrabalho || convidado.nome}</div>
                      {convidado.nomeTrabalho && (
                        <div className="text-xs text-muted-foreground">{convidado.nome}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {convidado.telefone && <div>{convidado.telefone}</div>}
                      {convidado.email && (
                        <div className="text-muted-foreground text-xs truncate max-w-32">
                          {convidado.email}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {convidado.observacoes || '-'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => void handleRemoveConvidado(convidado.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {convidados.length > 0 && (
        <div className="flex justify-end">
          <Badge variant="outline" className="text-sm">
            Total: {convidados.length} convidado{convidados.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      )}
    </div>
  );
};
