import { useState, useEffect } from 'react';
import { Plus, Trash2, Search, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Figurino } from '@/pages/recursos/Figurinos';

interface FigurinoAlocado {
  id: string;
  figurinoId: string;
  codigoFigurino: string;
  descricao: string;
  tipoFigurino?: string;
  tamanhoPeca?: string;
  imagemPrincipal?: string;
  quantidade: number;
  observacoes?: string;
}

interface FigurinosTabProps {
  gravacaoId: string;
}

const FigurinosTab = ({ gravacaoId }: FigurinosTabProps) => {
  const [figurinos, setFigurinos] = useState<Figurino[]>([]);
  const [figurinosAlocados, setFigurinosAlocados] = useState<FigurinoAlocado[]>([]);
  const [selectedFigurino, setSelectedFigurino] = useState<string>('');
  const [quantidade, setQuantidade] = useState<string>('1');
  const [observacoes, setObservacoes] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  const storageKey = `kreato_gravacao_figurinos_${gravacaoId}`;

  useEffect(() => {
    const storedFigurinos = localStorage.getItem('kreato_figurinos');
    if (storedFigurinos) {
      setFigurinos(JSON.parse(storedFigurinos));
    }

    const storedAlocados = localStorage.getItem(storageKey);
    if (storedAlocados) {
      setFigurinosAlocados(JSON.parse(storedAlocados));
    }
  }, [storageKey]);

  const saveToStorage = (data: FigurinoAlocado[]) => {
    localStorage.setItem(storageKey, JSON.stringify(data));
    setFigurinosAlocados(data);
  };

  const getImagemPrincipal = (figurino: Figurino): string | undefined => {
    const principal = figurino.imagens?.find(img => img.isPrincipal);
    return principal?.url || figurino.imagens?.[0]?.url;
  };

  const handleAddFigurino = () => {
    if (!selectedFigurino) return;

    const figurino = figurinos.find(f => f.id === selectedFigurino);
    if (!figurino) return;

    const exists = figurinosAlocados.find(f => f.figurinoId === selectedFigurino);
    if (exists) {
      // Se já existe, incrementa a quantidade
      const updated = figurinosAlocados.map(f => 
        f.figurinoId === selectedFigurino 
          ? { ...f, quantidade: f.quantidade + parseInt(quantidade) || 1 }
          : f
      );
      saveToStorage(updated);
    } else {
      const novoFigurino: FigurinoAlocado = {
        id: crypto.randomUUID(),
        figurinoId: figurino.id,
        codigoFigurino: figurino.codigoFigurino,
        descricao: figurino.descricao,
        tipoFigurino: figurino.tipoFigurino,
        tamanhoPeca: figurino.tamanhoPeca,
        imagemPrincipal: getImagemPrincipal(figurino),
        quantidade: parseInt(quantidade) || 1,
        observacoes: observacoes,
      };
      saveToStorage([...figurinosAlocados, novoFigurino]);
    }

    setSelectedFigurino('');
    setQuantidade('1');
    setObservacoes('');
  };

  const handleRemoveFigurino = (id: string) => {
    const updated = figurinosAlocados.filter(f => f.id !== id);
    saveToStorage(updated);
  };

  const handleUpdateFigurino = (id: string, field: string, value: string | number) => {
    const updated = figurinosAlocados.map(f =>
      f.id === id ? { ...f, [field]: value } : f
    );
    saveToStorage(updated);
  };

  const filteredFigurinos = figurinos.filter(f =>
    f.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.codigoFigurino?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Adicionar Figurino */}
      <div className="border rounded-lg p-4 space-y-4">
        <h3 className="font-medium">Adicionar Figurino</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                      <span>{figurino.codigoFigurino} - {figurino.descricao}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Quantidade</Label>
            <Input
              type="number"
              min="1"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              placeholder="1"
            />
          </div>

          <div className="flex items-end">
            <Button onClick={handleAddFigurino} disabled={!selectedFigurino}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Observações</Label>
          <Textarea
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Observações sobre o uso do figurino na gravação..."
            rows={2}
          />
        </div>
      </div>

      {/* Lista de Figurinos Alocados */}
      {figurinosAlocados.length > 0 ? (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Imagem</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Tamanho</TableHead>
                <TableHead className="w-24">Qtd</TableHead>
                <TableHead>Observações</TableHead>
                <TableHead className="w-16">Ações</TableHead>
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
                      type="number"
                      min="1"
                      value={figurino.quantidade}
                      onChange={(e) => handleUpdateFigurino(figurino.id, 'quantidade', parseInt(e.target.value) || 1)}
                      className="w-20"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={figurino.observacoes || ''}
                      onChange={(e) => handleUpdateFigurino(figurino.id, 'observacoes', e.target.value)}
                      placeholder="Observações..."
                      className="min-w-32"
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveFigurino(figurino.id)}
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
          <p>Nenhum figurino adicionado a esta gravação</p>
        </div>
      )}
    </div>
  );
};

export default FigurinosTab;
