import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, User, Search, Shirt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import {
  elencoApi,
  type ElencoEntityType,
  type ElencoFigurinoOption,
  type ElencoMembro,
  type ElencoPessoa,
} from '@/modules/elenco/elenco.api';

interface ElencoTabProps {
  entityId: string;
  storagePrefix?: string;
}

export const ElencoTab = ({ entityId, storagePrefix = 'gravacao' }: ElencoTabProps) => {
  const { toast } = useToast();
  const entityType: ElencoEntityType = storagePrefix === 'conteudo' ? 'conteudo' : 'gravacao';

  const [elenco, setElenco] = useState<ElencoMembro[]>([]);
  const [pessoas, setPessoas] = useState<ElencoPessoa[]>([]);
  const [figurinos, setFigurinos] = useState<ElencoFigurinoOption[]>([]);

  const [selectedPessoa, setSelectedPessoa] = useState('');
  const [personagem, setPersonagem] = useState('');
  const [descricaoPersonagem, setDescricaoPersonagem] = useState('');
  const [selectedFigurinos, setSelectedFigurinos] = useState<string[]>([]);
  const [searchPessoa, setSearchPessoa] = useState('');
  const [searchFigurino, setSearchFigurino] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const response = await elencoApi.list(entityType, entityId);
      setPessoas(response.pessoas);
      setFigurinos(response.figurinos);
      setElenco(response.items);
    } catch (error) {
      console.error('Error fetching elenco from backend:', error);
      toast({
        title: 'Erro',
        description: `Erro ao carregar elenco: ${(error as Error).message}`,
        variant: 'destructive',
      });
    }
  }, [entityId, entityType, toast]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const getImagemPrincipal = (figurino: ElencoFigurinoOption): string | undefined => {
    const principal = figurino.imagens.find((img) => img.isPrincipal);
    return principal?.url || figurino.imagens[0]?.url;
  };

  const getInitials = (nome: string) =>
    nome
      .split(' ')
      .map((parte) => parte[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  const handleAddMembro = async () => {
    if (!selectedPessoa || !personagem.trim()) return;

    const pessoa = pessoas.find((item) => item.id === selectedPessoa);
    if (!pessoa) return;

    const exists = elenco.find((item) => item.pessoaId === selectedPessoa);
    if (exists) {
      toast({
        title: 'Atencao',
        description: 'Essa pessoa ja foi adicionada ao elenco.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const inserted = await elencoApi.add(entityType, entityId, {
        pessoaId: pessoa.id,
        personagem,
        descricaoPersonagem,
        figurinoIds: selectedFigurinos,
      });

      setElenco((current) => [...current, inserted]);
      setSelectedPessoa('');
      setPersonagem('');
      setDescricaoPersonagem('');
      setSelectedFigurinos([]);
      setSearchPessoa('');
      setSearchFigurino('');
    } catch (error) {
      console.error('Error adding elenco member from backend:', error);
      toast({
        title: 'Erro',
        description: `Erro ao adicionar ao elenco: ${(error as Error).message}`,
        variant: 'destructive',
      });
    }
  };

  const handleRemoveMembro = async (id: string) => {
    try {
      await elencoApi.remove(entityType, entityId, id);
      setElenco((current) => current.filter((item) => item.id !== id));
    } catch (error) {
      console.error('Error removing elenco member from backend:', error);
      toast({
        title: 'Erro',
        description: `Erro ao remover membro do elenco: ${(error as Error).message}`,
        variant: 'destructive',
      });
    }
  };

  const handleUpdateMembro = async (membro: ElencoMembro) => {
    try {
      const updated = await elencoApi.update(entityType, entityId, membro.id, {
        personagem: membro.personagem,
        descricaoPersonagem: membro.descricaoPersonagem,
        figurinoIds: membro.figurinos.map((item) => item.figurinoId),
      });
      setElenco((current) => current.map((item) => (item.id === membro.id ? updated : item)));
    } catch (error) {
      console.error('Error updating elenco member from backend:', error);
      toast({
        title: 'Erro',
        description: `Erro ao atualizar membro do elenco: ${(error as Error).message}`,
        variant: 'destructive',
      });
    }
  };

  const toggleFormFigurino = (figurinoId: string) => {
    setSelectedFigurinos((current) =>
      current.includes(figurinoId)
        ? current.filter((id) => id !== figurinoId)
        : [...current, figurinoId],
    );
  };

  const pessoasDisponiveis = pessoas.filter(
    (item) => !elenco.find((membro) => membro.pessoaId === item.id),
  );

  const pessoasFiltradas = pessoasDisponiveis.filter((item) => {
    const term = searchPessoa.toLowerCase();
    return (
      item.nome.toLowerCase().includes(term) ||
      item.sobrenome.toLowerCase().includes(term) ||
      item.nomeTrabalho.toLowerCase().includes(term)
    );
  });

  const figurinosFiltrados = figurinos.filter(
    (item) =>
      item.descricao.toLowerCase().includes(searchFigurino.toLowerCase()) ||
      item.codigoFigurino.toLowerCase().includes(searchFigurino.toLowerCase()),
  );

  return (
    <div className="space-y-6 mt-4">
      <div className="border rounded-lg p-4 bg-muted/30">
        <h4 className="font-medium mb-4 flex items-center gap-2">
          <User className="h-4 w-4" />
          Adicionar ao Elenco
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Pessoa *</Label>
            <Select value={selectedPessoa} onValueChange={setSelectedPessoa}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma pessoa..." />
              </SelectTrigger>
              <SelectContent>
                <div className="px-2 py-1.5">
                  <Input
                    placeholder="Buscar..."
                    value={searchPessoa}
                    onChange={(e) => setSearchPessoa(e.target.value)}
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
                        {item.classificacao && (
                          <Badge variant="outline" className="text-[10px] ml-1">
                            {item.classificacao}
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Personagem *</Label>
            <Input
              placeholder="Nome do personagem..."
              value={personagem}
              onChange={(e) => setPersonagem(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <Label>Descricao do Personagem</Label>
          <Textarea
            placeholder="Breve descricao sobre o personagem..."
            value={descricaoPersonagem}
            onChange={(e) => setDescricaoPersonagem(e.target.value)}
            rows={2}
          />
        </div>

        <div className="mt-4 space-y-2">
          <Label className="flex items-center gap-2">
            <Shirt className="h-4 w-4" />
            Figurinos do Personagem
          </Label>
          <div className="border rounded-lg p-3">
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar figurino..."
                value={searchFigurino}
                onChange={(e) => setSearchFigurino(e.target.value)}
                className="pl-9 h-8"
              />
            </div>
            <ScrollArea className="h-32">
              {figurinosFiltrados.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-4">
                  Nenhum figurino encontrado
                </div>
              ) : (
                <div className="space-y-1">
                  {figurinosFiltrados.map((figurino) => (
                    <div
                      key={figurino.id}
                      className="flex items-center gap-2 p-2 hover:bg-muted rounded cursor-pointer"
                      onClick={() => toggleFormFigurino(figurino.id)}
                    >
                      <Checkbox
                        checked={selectedFigurinos.includes(figurino.id)}
                        onCheckedChange={() => toggleFormFigurino(figurino.id)}
                      />
                      {getImagemPrincipal(figurino) ? (
                        <img
                          src={getImagemPrincipal(figurino)}
                          alt={figurino.descricao}
                          className="w-8 h-8 rounded object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                          <Shirt className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {figurino.codigoFigurino}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {figurino.descricao}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
            {selectedFigurinos.length > 0 && (
              <div className="mt-2 pt-2 border-t">
                <Badge variant="secondary">
                  {selectedFigurinos.length} figurino{selectedFigurinos.length !== 1 ? 's' : ''}{' '}
                  selecionado{selectedFigurinos.length !== 1 ? 's' : ''}
                </Badge>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Button
            type="button"
            onClick={() => void handleAddMembro()}
            disabled={!selectedPessoa || !personagem.trim()}
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar ao Elenco
          </Button>
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Ator/Atriz</TableHead>
              <TableHead>Personagem</TableHead>
              <TableHead>Descricao</TableHead>
              <TableHead>Figurinos</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {elenco.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhum membro do elenco adicionado
                </TableCell>
              </TableRow>
            ) : (
              elenco.map((membro) => (
                <TableRow key={membro.id}>
                  <TableCell>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={membro.foto} />
                      <AvatarFallback>{getInitials(membro.nome)}</AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{membro.nomeTrabalho || membro.nome}</div>
                      {membro.nomeTrabalho && (
                        <div className="text-xs text-muted-foreground">{membro.nome}</div>
                      )}
                      {membro.classificacao && (
                        <Badge variant="outline" className="text-[10px] mt-1">
                          {membro.classificacao}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Input
                      value={membro.personagem}
                      onChange={(e) => {
                        const value = e.target.value;
                        setElenco((current) =>
                          current.map((item) =>
                            item.id === membro.id ? { ...item, personagem: value } : item,
                          ),
                        );
                      }}
                      onBlur={() => {
                        const current = elenco.find((item) => item.id === membro.id);
                        if (current) {
                          void handleUpdateMembro(current);
                        }
                      }}
                      placeholder="Personagem..."
                      className="h-8 text-sm font-medium"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={membro.descricaoPersonagem}
                      onChange={(e) => {
                        const value = e.target.value;
                        setElenco((current) =>
                          current.map((item) =>
                            item.id === membro.id ? { ...item, descricaoPersonagem: value } : item,
                          ),
                        );
                      }}
                      onBlur={() => {
                        const current = elenco.find((item) => item.id === membro.id);
                        if (current) {
                          void handleUpdateMembro(current);
                        }
                      }}
                      placeholder="Descricao..."
                      className="h-8 text-sm min-w-40"
                    />
                  </TableCell>
                  <TableCell>
                    {membro.figurinos.length > 0 ? (
                      <div className="flex items-center gap-1 flex-wrap">
                        {membro.figurinos.slice(0, 3).map((figurino) => (
                          <div
                            key={figurino.figurinoId}
                            className="relative group"
                            title={`${figurino.codigoFigurino} - ${figurino.descricao}`}
                          >
                            {figurino.imagemPrincipal ? (
                              <img
                                src={figurino.imagemPrincipal}
                                alt={figurino.descricao}
                                className="w-8 h-8 rounded object-cover border"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded bg-muted flex items-center justify-center border">
                                <Shirt className="w-4 h-4 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                        ))}
                        {membro.figurinos.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{membro.figurinos.length - 3}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => void handleRemoveMembro(membro.id)}
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

      {elenco.length > 0 && (
        <div className="flex justify-end gap-2">
          <Badge variant="outline" className="text-sm">
            Total: {elenco.length} membro{elenco.length !== 1 ? 's' : ''} do elenco
          </Badge>
        </div>
      )}
    </div>
  );
};

export default ElencoTab;
