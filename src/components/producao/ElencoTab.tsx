import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, User, Search, Image as ImageIcon, Shirt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Figurino } from '@/pages/recursos/Figurinos';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Pessoa {
  id: string;
  nome: string;
  sobrenome: string;
  nomeTrabalho?: string;
  foto?: string;
  classificacao?: string;
  telefone?: string;
  email?: string;
  status?: string;
}

interface FigurinoElenco {
  figurinoId: string;
  codigoFigurino: string;
  descricao: string;
  imagemPrincipal?: string;
}

interface ElencoMembro {
  id: string;
  pessoaId: string;
  nome: string;
  nomeTrabalho?: string;
  foto?: string;
  classificacao?: string;
  personagem: string;
  descricaoPersonagem: string;
  figurinos: FigurinoElenco[];
}

interface ElencoTabProps {
  entityId: string; // pode ser gravacaoId ou conteudoId
  storagePrefix?: string; // 'gravacao' ou 'conteudo'
}

export const ElencoTab = ({ entityId, storagePrefix = 'gravacao' }: ElencoTabProps) => {
  const { session } = useAuth();
  const [elenco, setElenco] = useState<ElencoMembro[]>([]);
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [figurinos, setFigurinos] = useState<Figurino[]>([]);
  
  const [selectedPessoa, setSelectedPessoa] = useState('');
  const [personagem, setPersonagem] = useState('');
  const [descricaoPersonagem, setDescricaoPersonagem] = useState('');
  const [selectedFigurinos, setSelectedFigurinos] = useState<string[]>([]);
  const [searchPessoa, setSearchPessoa] = useState('');
  const [searchFigurino, setSearchFigurino] = useState('');

  const fetchData = useCallback(async () => {
    if (!session) return;

    try {
      // Fetch pessoas ativas
      const { data: pessoasData } = await supabase
        .from('pessoas')
        .select('id, nome, sobrenome, nome_trabalho, foto_url, status')
        .eq('status', 'Ativo')
        .order('nome');

      setPessoas((pessoasData || []).map((p: any) => ({
        id: p.id,
        nome: p.nome,
        sobrenome: p.sobrenome,
        nomeTrabalho: p.nome_trabalho,
        foto: p.foto_url,
        status: p.status,
      })));

      // Fetch figurinos
      const { data: figurinosData } = await supabase
        .from('figurinos')
        .select('*, figurino_imagens(*)')
        .order('codigo_figurino');

      setFigurinos((figurinosData || []).map((f: any) => ({
        id: f.id,
        codigoFigurino: f.codigo_figurino,
        descricao: f.descricao,
        codigoExterno: f.codigo_externo || '',
        dataCadastro: f.created_at || new Date().toISOString(),
        usuarioCadastro: f.created_by || '',
        imagens: (f.figurino_imagens || []).map((img: any) => ({
          id: img.id,
          url: img.url,
          isPrincipal: img.is_principal,
        })),
      })));

      // Fetch elenco from gravacao_elenco table
      const { data: elencoData } = await supabase
        .from('gravacao_elenco')
        .select('*, pessoas:pessoa_id(id, nome, sobrenome, nome_trabalho, foto_url)')
        .eq(storagePrefix === 'gravacao' ? 'gravacao_id' : 'conteudo_id', entityId);

      setElenco((elencoData || []).map((e: any) => ({
        id: e.id,
        pessoaId: e.pessoa_id,
        nome: `${e.pessoas?.nome || ''} ${e.pessoas?.sobrenome || ''}`.trim(),
        nomeTrabalho: e.pessoas?.nome_trabalho,
        foto: e.pessoas?.foto_url,
        personagem: e.personagem || '',
        descricaoPersonagem: '',
        figurinos: [],
      })));
    } catch (err) {
      console.error('Error fetching elenco data:', err);
    }
  }, [session, entityId, storagePrefix]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getImagemPrincipal = (figurino: Figurino): string | undefined => {
    const principal = figurino.imagens?.find(img => img.isPrincipal);
    return principal?.url || figurino.imagens?.[0]?.url;
  };

  const getInitials = (nome: string) => {
    return nome
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleAddMembro = async () => {
    if (!selectedPessoa || !personagem.trim()) return;

    const pessoa = pessoas.find((p) => p.id === selectedPessoa);
    if (!pessoa) return;

    const exists = elenco.find((e) => e.pessoaId === selectedPessoa);
    if (exists) return;

    const figurinosElenco: FigurinoElenco[] = selectedFigurinos
      .map(id => {
        const figurino = figurinos.find(f => f.id === id);
        if (!figurino) return null;
        return {
          figurinoId: figurino.id,
          codigoFigurino: figurino.codigoFigurino,
          descricao: figurino.descricao,
          imagemPrincipal: getImagemPrincipal(figurino),
        } as FigurinoElenco;
      })
      .filter((f): f is FigurinoElenco => f !== null);

    const novoMembro: ElencoMembro = {
      id: crypto.randomUUID(),
      pessoaId: pessoa.id,
      nome: `${pessoa.nome} ${pessoa.sobrenome}`.trim(),
      nomeTrabalho: pessoa.nomeTrabalho,
      foto: pessoa.foto,
      classificacao: pessoa.classificacao,
      personagem: personagem,
      descricaoPersonagem: descricaoPersonagem,
      figurinos: figurinosElenco,
    };

    // Save to Supabase
    const insertData = {
      pessoa_id: novoMembro.pessoaId,
      personagem: novoMembro.personagem,
      ...(storagePrefix === 'gravacao' ? { gravacao_id: entityId } : { conteudo_id: entityId }),
    };
    
    const { data: insertedData, error } = await supabase.from('gravacao_elenco').insert(insertData).select().single();
    if (!error && insertedData) {
      setElenco([...elenco, { ...novoMembro, id: insertedData.id }]);
    }
    resetForm();
  };

  const resetForm = () => {
    setSelectedPessoa('');
    setPersonagem('');
    setDescricaoPersonagem('');
    setSelectedFigurinos([]);
    setSearchPessoa('');
    setSearchFigurino('');
  };

  const handleRemoveMembro = async (id: string) => {
    await supabase.from('gravacao_elenco').delete().eq('id', id);
    setElenco(elenco.filter((e) => e.id !== id));
  };

  const handleUpdateMembro = async (id: string, field: keyof ElencoMembro, value: any) => {
    const updated = elenco.map((e) =>
      e.id === id ? { ...e, [field]: value } : e
    );
    setElenco(updated);
    
    // Map field to database column
    const dbFieldMap: Record<string, string> = {
      personagem: 'personagem',
    };
    
    if (dbFieldMap[field]) {
      await supabase.from('gravacao_elenco').update({ [dbFieldMap[field]]: value }).eq('id', id);
    }
  };

  const toggleFigurino = (figurinoId: string) => {
    setSelectedFigurinos(prev =>
      prev.includes(figurinoId)
        ? prev.filter(id => id !== figurinoId)
        : [...prev, figurinoId]
    );
  };

  const pessoasDisponiveis = pessoas.filter(
    (p) => !elenco.find((e) => e.pessoaId === p.id)
  );

  const pessoasFiltradas = pessoasDisponiveis.filter((p) => {
    const searchLower = searchPessoa.toLowerCase();
    return (
      p.nome.toLowerCase().includes(searchLower) ||
      p.sobrenome.toLowerCase().includes(searchLower) ||
      (p.nomeTrabalho && p.nomeTrabalho.toLowerCase().includes(searchLower))
    );
  });

  const figurinosFiltrados = figurinos.filter(f =>
    f.descricao?.toLowerCase().includes(searchFigurino.toLowerCase()) ||
    f.codigoFigurino?.toLowerCase().includes(searchFigurino.toLowerCase())
  );

  return (
    <div className="space-y-6 mt-4">
      {/* Formulário de adição */}
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
                  pessoasFiltradas.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={p.foto} />
                          <AvatarFallback className="text-[10px]">
                            {getInitials(`${p.nome} ${p.sobrenome}`)}
                          </AvatarFallback>
                        </Avatar>
                        <span>
                          {p.nomeTrabalho || `${p.nome} ${p.sobrenome}`}
                        </span>
                        {p.classificacao && (
                          <Badge variant="outline" className="text-[10px] ml-1">
                            {p.classificacao}
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
          <Label>Descrição do Personagem</Label>
          <Textarea
            placeholder="Breve descrição sobre o personagem..."
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
                      onClick={() => toggleFigurino(figurino.id)}
                    >
                      <Checkbox
                        checked={selectedFigurinos.includes(figurino.id)}
                        onCheckedChange={() => toggleFigurino(figurino.id)}
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
                  {selectedFigurinos.length} figurino{selectedFigurinos.length !== 1 ? 's' : ''} selecionado{selectedFigurinos.length !== 1 ? 's' : ''}
                </Badge>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Button
            type="button"
            onClick={handleAddMembro}
            disabled={!selectedPessoa || !personagem.trim()}
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar ao Elenco
          </Button>
        </div>
      </div>

      {/* Lista do Elenco */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Ator/Atriz</TableHead>
              <TableHead>Personagem</TableHead>
              <TableHead>Descrição</TableHead>
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
                      <AvatarFallback>
                        {getInitials(membro.nome)}
                      </AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {membro.nomeTrabalho || membro.nome}
                      </div>
                      {membro.nomeTrabalho && (
                        <div className="text-xs text-muted-foreground">
                          {membro.nome}
                        </div>
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
                      onChange={(e) =>
                        handleUpdateMembro(membro.id, 'personagem', e.target.value)
                      }
                      placeholder="Personagem..."
                      className="h-8 text-sm font-medium"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={membro.descricaoPersonagem}
                      onChange={(e) =>
                        handleUpdateMembro(membro.id, 'descricaoPersonagem', e.target.value)
                      }
                      placeholder="Descrição..."
                      className="h-8 text-sm min-w-40"
                    />
                  </TableCell>
                  <TableCell>
                    {membro.figurinos.length > 0 ? (
                      <div className="flex items-center gap-1 flex-wrap">
                        {membro.figurinos.slice(0, 3).map((fig) => (
                          <div
                            key={fig.figurinoId}
                            className="relative group"
                            title={`${fig.codigoFigurino} - ${fig.descricao}`}
                          >
                            {fig.imagemPrincipal ? (
                              <img
                                src={fig.imagemPrincipal}
                                alt={fig.descricao}
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
                      onClick={() => handleRemoveMembro(membro.id)}
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

      {/* Resumo */}
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
