import { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2, Search, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  gravacoesRelacionamentosApi,
  type GravacaoFigurinoItem,
  type GravacaoFigurinoOption,
} from '@/modules/gravacoes/gravacoes-relacionamentos.api';

interface FigurinosTabProps {
  gravacaoId: string;
}

const FigurinosTab = ({ gravacaoId }: FigurinosTabProps) => {
  const { toast } = useToast();
  const [figurinos, setFigurinos] = useState<GravacaoFigurinoOption[]>([]);
  const [figurinosAlocados, setFigurinosAlocados] = useState<GravacaoFigurinoItem[]>([]);
  const [selectedFigurino, setSelectedFigurino] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const loadData = useCallback(async () => {
    try {
      const response = await gravacoesRelacionamentosApi.listFigurinos(gravacaoId);
      setFigurinos(response.figurinos);
      setFigurinosAlocados(response.items);
    } catch (error) {
      console.error('Error loading gravacao figurinos from backend:', error);
      toast({
        title: 'Erro',
        description: `Nao foi possivel carregar os figurinos: ${(error as Error).message}`,
        variant: 'destructive',
      });
    }
  }, [gravacaoId, toast]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const getImagemPrincipal = (figurino: GravacaoFigurinoOption): string | undefined => {
    const principal = figurino.imagens.find((img) => img.isPrincipal);
    return principal?.url || figurino.imagens[0]?.url;
  };

  const handleAddFigurino = async () => {
    if (!selectedFigurino) return;

    const figurino = figurinos.find((item) => item.id === selectedFigurino);
    if (!figurino) return;

    const exists = figurinosAlocados.find((item) => item.figurinoId === selectedFigurino);
    if (exists) {
      toast({
        title: 'Atencao',
        description: 'Figurino ja adicionado a esta gravacao.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const inserted = await gravacoesRelacionamentosApi.addFigurino(gravacaoId, {
        figurinoId: selectedFigurino,
        observacao: observacoes,
      });

      setFigurinosAlocados((current) => [...current, inserted]);
      setSelectedFigurino('');
      setObservacoes('');
    } catch (error) {
      console.error('Error adding figurino from backend:', error);
      toast({
        title: 'Erro',
        description: `Erro ao adicionar figurino: ${(error as Error).message}`,
        variant: 'destructive',
      });
    }
  };

  const handleRemoveFigurino = async (id: string) => {
    try {
      await gravacoesRelacionamentosApi.removeFigurino(gravacaoId, id);
      setFigurinosAlocados((current) => current.filter((item) => item.id !== id));
    } catch (error) {
      console.error('Error removing figurino from backend:', error);
      toast({
        title: 'Erro',
        description: `Erro ao remover figurino: ${(error as Error).message}`,
        variant: 'destructive',
      });
    }
  };

  const handleUpdateFigurino = async (id: string, observacao: string) => {
    try {
      const updated = await gravacoesRelacionamentosApi.updateFigurino(gravacaoId, id, {
        observacao,
      });
      setFigurinosAlocados((current) => current.map((item) => (item.id === id ? updated : item)));
    } catch (error) {
      console.error('Error updating figurino from backend:', error);
      toast({
        title: 'Erro',
        description: `Erro ao atualizar figurino: ${(error as Error).message}`,
        variant: 'destructive',
      });
    }
  };

  const filteredFigurinos = figurinos.filter(
    (item) =>
      item.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.codigoFigurino.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="border rounded-lg p-4 space-y-4">
        <h3 className="font-medium">Adicionar Figurino</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-2">
            <Label>Figurino</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar figurino..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 mb-2"
              />
            </div>
            <Select value={selectedFigurino} onValueChange={setSelectedFigurino}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um figurino" />
              </SelectTrigger>
              <SelectContent>
                {filteredFigurinos.map((figurino) => (
                  <SelectItem key={figurino.id} value={figurino.id}>
                    <div className="flex items-center gap-2">
                      {getImagemPrincipal(figurino) ? (
                        <img
                          src={getImagemPrincipal(figurino)}
                          alt={figurino.descricao}
                          className="w-6 h-6 rounded object-cover"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded bg-muted flex items-center justify-center">
                          <ImageIcon className="w-3 h-3" />
                        </div>
                      )}
                      <span>
                        {figurino.codigoFigurino} - {figurino.descricao}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button onClick={() => void handleAddFigurino()} disabled={!selectedFigurino}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Observacoes</Label>
          <Textarea
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Observacoes sobre o uso do figurino na gravacao..."
            rows={2}
          />
        </div>
      </div>

      {figurinosAlocados.length > 0 ? (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Imagem</TableHead>
                <TableHead>Codigo</TableHead>
                <TableHead>Descricao</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Tamanho</TableHead>
                <TableHead>Observacoes</TableHead>
                <TableHead className="w-16">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {figurinosAlocados.map((figurino) => (
                <TableRow key={figurino.id}>
                  <TableCell>
                    {figurino.imagemPrincipal ? (
                      <img
                        src={figurino.imagemPrincipal}
                        alt={figurino.descricao}
                        className="w-12 h-12 rounded object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{figurino.codigoFigurino}</TableCell>
                  <TableCell>{figurino.descricao}</TableCell>
                  <TableCell>{figurino.tipoFigurino || '-'}</TableCell>
                  <TableCell>{figurino.tamanhoPeca || '-'}</TableCell>
                  <TableCell>
                    <Input
                      value={figurino.observacao || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFigurinosAlocados((current) =>
                          current.map((item) =>
                            item.id === figurino.id ? { ...item, observacao: value } : item,
                          ),
                        );
                      }}
                      onBlur={(e) => {
                        void handleUpdateFigurino(figurino.id, e.target.value);
                      }}
                      placeholder="Observacoes..."
                      className="min-w-32"
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => void handleRemoveFigurino(figurino.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground border rounded-lg">
          <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Nenhum figurino adicionado a esta gravacao</p>
        </div>
      )}
    </div>
  );
};

export default FigurinosTab;
