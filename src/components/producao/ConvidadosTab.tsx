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

interface ConvidadoAlocado {
  id: string;
  pessoaId: string;
  nome: string;
  nomeTrabalho?: string;
  foto?: string;
  classificacao?: string;
  telefone?: string;
  email?: string;
  observacoes?: string;
}

interface ConvidadosTabProps {
  gravacaoId: string;
}

export const ConvidadosTab = ({ gravacaoId }: ConvidadosTabProps) => {
  const { session } = useAuth();
  const [convidados, setConvidados] = useState<ConvidadoAlocado[]>([]);
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [selectedPessoa, setSelectedPessoa] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = useCallback(async () => {
    if (!session) return;

    try {
      // Fetch convidados from Supabase
      const { data: convidadosData } = await supabase
        .from('gravacao_convidados')
        .select('*, pessoas:pessoa_id(id, nome, sobrenome, nome_trabalho, foto_url, telefone, email)')
        .eq('gravacao_id', gravacaoId);

      setConvidados((convidadosData || []).map((c: any) => ({
        id: c.id,
        pessoaId: c.pessoa_id,
        nome: `${c.pessoas?.nome || ''} ${c.pessoas?.sobrenome || ''}`.trim(),
        nomeTrabalho: c.pessoas?.nome_trabalho,
        foto: c.pessoas?.foto_url,
        telefone: c.pessoas?.telefone,
        email: c.pessoas?.email,
        observacoes: c.observacao,
      })));

      // Fetch pessoas ativas
      const { data: pessoasData } = await supabase
        .from('pessoas')
        .select('id, nome, sobrenome, nome_trabalho, foto_url, telefone, email, status')
        .eq('status', 'Ativo')
        .order('nome');

      setPessoas((pessoasData || []).map((p: any) => ({
        id: p.id,
        nome: p.nome,
        sobrenome: p.sobrenome,
        nomeTrabalho: p.nome_trabalho,
        foto: p.foto_url,
        telefone: p.telefone,
        email: p.email,
        status: p.status,
      })));
    } catch (err) {
      console.error('Error fetching convidados data:', err);
    }
  }, [session, gravacaoId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddConvidado = async () => {
    if (!selectedPessoa) return;

    const pessoa = pessoas.find((p) => p.id === selectedPessoa);
    if (!pessoa) return;

    // Verificar se já está na lista
    const exists = convidados.find((c) => c.pessoaId === selectedPessoa);
    if (exists) return;

    const { data: insertedData, error } = await supabase
      .from('gravacao_convidados')
      .insert({
        gravacao_id: gravacaoId,
        pessoa_id: selectedPessoa,
        observacao: observacoes || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding convidado:', error);
      return;
    }

    const novoConvidado: ConvidadoAlocado = {
      id: insertedData.id,
      pessoaId: pessoa.id,
      nome: `${pessoa.nome} ${pessoa.sobrenome}`.trim(),
      nomeTrabalho: pessoa.nomeTrabalho,
      foto: pessoa.foto,
      telefone: pessoa.telefone,
      email: pessoa.email,
      observacoes: observacoes,
    };

    setConvidados([...convidados, novoConvidado]);
    setSelectedPessoa('');
    setObservacoes('');
  };

  const handleRemoveConvidado = async (id: string) => {
    const { error } = await supabase
      .from('gravacao_convidados')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error removing convidado:', error);
      return;
    }

    setConvidados(convidados.filter((c) => c.id !== id));
  };

  // Filtrar pessoas que ainda não foram adicionadas
  const pessoasDisponiveis = pessoas.filter(
    (p) => !convidados.find((c) => c.pessoaId === p.id)
  );

  // Filtrar por termo de busca
  const pessoasFiltradas = pessoasDisponiveis.filter((p) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      p.nome.toLowerCase().includes(searchLower) ||
      p.sobrenome.toLowerCase().includes(searchLower) ||
      (p.nomeTrabalho && p.nomeTrabalho.toLowerCase().includes(searchLower))
    );
  });

  const getInitials = (nome: string) => {
    return nome
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6 mt-4">
      {/* Formulário de adição */}
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
              onClick={handleAddConvidado}
              disabled={!selectedPessoa}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <Label>Observações</Label>
          <Textarea
            placeholder="Observações sobre o convidado..."
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            rows={2}
          />
        </div>
      </div>

      {/* Lista de convidados */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Observações</TableHead>
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
                      <AvatarFallback>
                        {getInitials(convidado.nome)}
                      </AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {convidado.nomeTrabalho || convidado.nome}
                      </div>
                      {convidado.nomeTrabalho && (
                        <div className="text-xs text-muted-foreground">
                          {convidado.nome}
                        </div>
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
                      onClick={() => handleRemoveConvidado(convidado.id)}
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
