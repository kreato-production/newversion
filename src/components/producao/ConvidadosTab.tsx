import { useState, useEffect } from 'react';
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
  funcaoGravacao?: string;
  observacoes?: string;
}

interface ConvidadosTabProps {
  gravacaoId: string;
}

export const ConvidadosTab = ({ gravacaoId }: ConvidadosTabProps) => {
  const [convidados, setConvidados] = useState<ConvidadoAlocado[]>(() => {
    const stored = localStorage.getItem(`kreato_gravacao_convidados_${gravacaoId}`);
    return stored ? JSON.parse(stored) : [];
  });

  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [selectedPessoa, setSelectedPessoa] = useState('');
  const [funcaoGravacao, setFuncaoGravacao] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const storedPessoas = localStorage.getItem('kreato_pessoas');
    if (storedPessoas) {
      const parsed = JSON.parse(storedPessoas);
      // Filtrar apenas pessoas ativas
      setPessoas(parsed.filter((p: Pessoa) => p.status === 'Ativo'));
    }
  }, []);

  const saveToStorage = (data: ConvidadoAlocado[]) => {
    localStorage.setItem(`kreato_gravacao_convidados_${gravacaoId}`, JSON.stringify(data));
    setConvidados(data);
  };

  const handleAddConvidado = () => {
    if (!selectedPessoa) return;

    const pessoa = pessoas.find((p) => p.id === selectedPessoa);
    if (!pessoa) return;

    // Verificar se já está na lista
    const exists = convidados.find((c) => c.pessoaId === selectedPessoa);
    if (exists) return;

    const novoConvidado: ConvidadoAlocado = {
      id: crypto.randomUUID(),
      pessoaId: pessoa.id,
      nome: `${pessoa.nome} ${pessoa.sobrenome}`.trim(),
      nomeTrabalho: pessoa.nomeTrabalho,
      foto: pessoa.foto,
      classificacao: pessoa.classificacao,
      telefone: pessoa.telefone,
      email: pessoa.email,
      funcaoGravacao: funcaoGravacao,
      observacoes: observacoes,
    };

    saveToStorage([...convidados, novoConvidado]);
    setSelectedPessoa('');
    setFuncaoGravacao('');
    setObservacoes('');
  };

  const handleRemoveConvidado = (id: string) => {
    saveToStorage(convidados.filter((c) => c.id !== id));
  };

  const handleUpdateConvidado = (id: string, field: 'funcaoGravacao' | 'observacoes', value: string) => {
    const updated = convidados.map((c) => {
      if (c.id === id) {
        return { ...c, [field]: value };
      }
      return c;
    });
    saveToStorage(updated);
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
      (p.nomeTrabalho && p.nomeTrabalho.toLowerCase().includes(searchLower)) ||
      (p.classificacao && p.classificacao.toLowerCase().includes(searchLower))
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <Label>Função na Gravação</Label>
            <Input
              placeholder="Ex: Entrevistado, Apresentador..."
              value={funcaoGravacao}
              onChange={(e) => setFuncaoGravacao(e.target.value)}
            />
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
              <TableHead>Classificação</TableHead>
              <TableHead>Função na Gravação</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Observações</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {convidados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
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
                    {convidado.classificacao && (
                      <Badge variant="secondary">{convidado.classificacao}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Input
                      value={convidado.funcaoGravacao || ''}
                      onChange={(e) =>
                        handleUpdateConvidado(convidado.id, 'funcaoGravacao', e.target.value)
                      }
                      placeholder="Função..."
                      className="h-8 text-sm"
                    />
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
                    <Input
                      value={convidado.observacoes || ''}
                      onChange={(e) =>
                        handleUpdateConvidado(convidado.id, 'observacoes', e.target.value)
                      }
                      placeholder="Observações..."
                      className="h-8 text-sm"
                    />
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
