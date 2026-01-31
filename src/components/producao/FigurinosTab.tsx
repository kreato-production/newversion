import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Search, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Figurino {
  id: string;
  codigoFigurino: string;
  descricao: string;
  tipoFigurino?: string;
  tamanhoPeca?: string;
  imagens?: { url: string; isPrincipal: boolean }[];
}

interface FigurinoAlocado {
  id: string;
  figurinoId: string;
  codigoFigurino: string;
  descricao: string;
  tipoFigurino?: string;
  tamanhoPeca?: string;
  imagemPrincipal?: string;
  observacoes?: string;
  pessoaId?: string;
}

interface FigurinosTabProps {
  gravacaoId: string;
}

const FigurinosTab = ({ gravacaoId }: FigurinosTabProps) => {
  const { toast } = useToast();
  const [figurinos, setFigurinos] = useState<Figurino[]>([]);
  const [figurinosAlocados, setFigurinosAlocados] = useState<FigurinoAlocado[]>([]);
  const [selectedFigurino, setSelectedFigurino] = useState<string>('');
  const [observacoes, setObservacoes] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  const loadFigurinos = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('figurinos')
        .select('id, codigo_figurino, descricao, tamanho_peca, tipo_figurino_id, tipos_figurino:tipo_figurino_id(nome)')
        .order('codigo_figurino');

      if (error) throw error;

      // Load images for each figurino
      const figurinosWithImages = await Promise.all((data || []).map(async (f: any) => {
        const { data: imgData } = await supabase
          .from('figurino_imagens')
          .select('url, is_principal')
          .eq('figurino_id', f.id);

        return {
          id: f.id,
          codigoFigurino: f.codigo_figurino,
          descricao: f.descricao,
          tipoFigurino: f.tipos_figurino?.nome || '',
          tamanhoPeca: f.tamanho_peca || '',
          imagens: (imgData || []).map((img: any) => ({ url: img.url, isPrincipal: img.is_principal })),
        };
      }));

      setFigurinos(figurinosWithImages);
    } catch (err) {
      console.error('Error loading figurinos:', err);
    }
  }, []);

  const loadAlocados = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('gravacao_figurinos')
        .select('id, figurino_id, observacao, pessoa_id, figurinos:figurino_id(id, codigo_figurino, descricao, tamanho_peca, tipo_figurino_id)')
        .eq('gravacao_id', gravacaoId);

      if (error) throw error;

      const mapped: FigurinoAlocado[] = await Promise.all((data || []).map(async (gf: any) => {
        // Get main image
        const { data: imgData } = await supabase
          .from('figurino_imagens')
          .select('url')
          .eq('figurino_id', gf.figurino_id)
          .eq('is_principal', true)
          .limit(1);

        let imagemPrincipal = imgData?.[0]?.url;
        if (!imagemPrincipal) {
          const { data: anyImg } = await supabase
            .from('figurino_imagens')
            .select('url')
            .eq('figurino_id', gf.figurino_id)
            .limit(1);
          imagemPrincipal = anyImg?.[0]?.url;
        }

        // Get tipo figurino name
        let tipoFigurino = '';
        if (gf.figurinos?.tipo_figurino_id) {
          const { data: tipoData } = await supabase
            .from('tipos_figurino')
            .select('nome')
            .eq('id', gf.figurinos.tipo_figurino_id)
            .single();
          tipoFigurino = tipoData?.nome || '';
        }

        return {
          id: gf.id,
          figurinoId: gf.figurino_id,
          codigoFigurino: gf.figurinos?.codigo_figurino || '',
          descricao: gf.figurinos?.descricao || '',
          tipoFigurino,
          tamanhoPeca: gf.figurinos?.tamanho_peca || '',
          imagemPrincipal,
          observacoes: gf.observacao || '',
          pessoaId: gf.pessoa_id,
        };
      }));

      setFigurinosAlocados(mapped);
    } catch (err) {
      console.error('Error loading alocados:', err);
    }
  }, [gravacaoId]);

  useEffect(() => {
    loadFigurinos();
    loadAlocados();
  }, [loadFigurinos, loadAlocados]);

  const getImagemPrincipal = (figurino: Figurino): string | undefined => {
    const principal = figurino.imagens?.find(img => img.isPrincipal);
    return principal?.url || figurino.imagens?.[0]?.url;
  };

  const handleAddFigurino = async () => {
    if (!selectedFigurino) return;

    const figurino = figurinos.find(f => f.id === selectedFigurino);
    if (!figurino) return;

    const exists = figurinosAlocados.find(f => f.figurinoId === selectedFigurino);
    if (exists) {
      toast({ title: 'Atenção', description: 'Figurino já adicionado a esta gravação.', variant: 'destructive' });
      return;
    }

    try {
      const { data: inserted, error } = await supabase
        .from('gravacao_figurinos')
        .insert({
          gravacao_id: gravacaoId,
          figurino_id: selectedFigurino,
          observacao: observacoes || null,
        })
        .select()
        .single();

      if (error) throw error;

      const novoFigurino: FigurinoAlocado = {
        id: inserted.id,
        figurinoId: figurino.id,
        codigoFigurino: figurino.codigoFigurino,
        descricao: figurino.descricao,
        tipoFigurino: figurino.tipoFigurino,
        tamanhoPeca: figurino.tamanhoPeca,
        imagemPrincipal: getImagemPrincipal(figurino),
        observacoes: observacoes,
      };

      setFigurinosAlocados([...figurinosAlocados, novoFigurino]);
      setSelectedFigurino('');
      setObservacoes('');
    } catch (err) {
      console.error('Error adding figurino:', err);
      toast({ title: 'Erro', description: 'Erro ao adicionar figurino.', variant: 'destructive' });
    }
  };

  const handleRemoveFigurino = async (id: string) => {
    try {
      const { error } = await supabase
        .from('gravacao_figurinos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setFigurinosAlocados(figurinosAlocados.filter(f => f.id !== id));
    } catch (err) {
      console.error('Error removing figurino:', err);
      toast({ title: 'Erro', description: 'Erro ao remover figurino.', variant: 'destructive' });
    }
  };

  const handleUpdateFigurino = async (id: string, field: string, value: string) => {
    try {
      const dbField = field === 'observacoes' ? 'observacao' : field;
      const { error } = await supabase
        .from('gravacao_figurinos')
        .update({ [dbField]: value })
        .eq('id', id);

      if (error) throw error;

      setFigurinosAlocados(figurinosAlocados.map(f =>
        f.id === id ? { ...f, [field]: value } : f
      ));
    } catch (err) {
      console.error('Error updating figurino:', err);
    }
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
                      <span>{figurino.codigoFigurino} - {figurino.descricao}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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