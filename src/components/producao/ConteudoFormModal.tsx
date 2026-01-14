import { useState, useEffect } from 'react';
import { Loader2, Wand2, Edit, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { type Conteudo, generateCodigoConteudo } from '@/pages/producao/Conteudo';
import { type Gravacao, generateCodigoGravacao } from '@/pages/producao/GravacaoList';
import { SortableTable, Column } from '@/components/shared/SortableTable';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ConteudoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Conteudo) => void;
  data?: Conteudo | null;
}

export const ConteudoFormModal = ({
  isOpen,
  onClose,
  onSave,
  data,
}: ConteudoFormModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState({
    codigoExterno: '',
    descricao: '',
    quantidadeEpisodios: '',
    centroLucro: '',
    anoProducao: '',
    sinopse: '',
  });

  const [centrosLucro, setCentrosLucro] = useState<{ id: string; nome: string; parentId: string | null; status: string }[]>([]);
  const [gravacoes, setGravacoes] = useState<Gravacao[]>([]);
  const [statusList, setStatusList] = useState<{ id: string; nome: string; cor: string }[]>([]);

  // Função para construir a hierarquia de centros de lucro
  const buildHierarchy = (items: typeof centrosLucro, parentId: string | null = null, level: number = 0): { id: string; nome: string; displayName: string; level: number }[] => {
    const result: { id: string; nome: string; displayName: string; level: number }[] = [];
    const children = items.filter(item => item.parentId === parentId);
    
    for (const child of children) {
      const prefix = level > 0 ? '│ '.repeat(level - 1) + '├─ ' : '';
      result.push({
        id: child.id,
        nome: child.nome,
        displayName: `${prefix}${child.nome}`,
        level
      });
      result.push(...buildHierarchy(items, child.id, level + 1));
    }
    
    return result;
  };

  const centrosLucroHierarquicos = buildHierarchy(centrosLucro);

  useEffect(() => {
    const loadOptions = () => {
      const storedCentrosLucro = localStorage.getItem('kreato_centros_lucro');
      const storedStatus = localStorage.getItem('kreato_status_gravacao');
      setCentrosLucro(storedCentrosLucro ? JSON.parse(storedCentrosLucro).filter((cl: { status: string }) => cl.status === 'Ativo') : []);
      setStatusList(storedStatus ? JSON.parse(storedStatus) : []);
    };

    if (isOpen) {
      loadOptions();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    
    if (data) {
      setFormData({
        codigoExterno: data.codigoExterno || '',
        descricao: data.descricao || '',
        quantidadeEpisodios: String(data.quantidadeEpisodios || ''),
        centroLucro: data.centroLucro || '',
        anoProducao: data.anoProducao || '',
        sinopse: data.sinopse || '',
      });
      loadGravacoes(data.id);
    } else {
      const novoCodigo = generateCodigoConteudo();
      setFormData({
        codigoExterno: novoCodigo,
        descricao: '',
        quantidadeEpisodios: '',
        centroLucro: '',
        anoProducao: '',
        sinopse: '',
      });
      setGravacoes([]);
    }
  }, [data, isOpen]);

  const loadGravacoes = (conteudoId: string) => {
    const stored = localStorage.getItem('kreato_gravacoes');
    const allGravacoes: Gravacao[] = stored ? JSON.parse(stored) : [];
    const filtered = allGravacoes.filter((g: any) => g.conteudoId === conteudoId);
    setGravacoes(filtered);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.descricao.trim()) {
      toast({ title: 'Erro', description: 'Descrição é obrigatória.', variant: 'destructive' });
      return;
    }

    const conteudo: Conteudo = {
      id: data?.id || crypto.randomUUID(),
      codigoExterno: formData.codigoExterno,
      descricao: formData.descricao,
      quantidadeEpisodios: parseInt(formData.quantidadeEpisodios) || 0,
      centroLucro: formData.centroLucro,
      anoProducao: formData.anoProducao,
      sinopse: formData.sinopse,
      usuarioCadastro: data?.usuarioCadastro || user?.nome || 'Admin',
      dataCadastro: data?.dataCadastro || new Date().toLocaleDateString('pt-BR'),
    };

    onSave(conteudo);
    onClose();
  };

  const handleGenerateGravacoes = () => {
    if (!data?.id) {
      toast({
        title: 'Atenção',
        description: 'Salve o conteúdo antes de gerar gravações.',
        variant: 'destructive',
      });
      return;
    }

    const quantidade = parseInt(formData.quantidadeEpisodios);
    if (!quantidade || quantidade <= 0) {
      toast({
        title: 'Atenção',
        description: 'Defina a quantidade de episódios antes de gerar.',
        variant: 'destructive',
      });
      return;
    }

    if (gravacoes.length >= quantidade) {
      toast({
        title: 'Atenção',
        description: 'Todas as gravações já foram geradas para este conteúdo.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);

    setTimeout(() => {
      const stored = localStorage.getItem('kreato_gravacoes');
      const allGravacoes: Gravacao[] = stored ? JSON.parse(stored) : [];
      
      const novasGravacoes: Gravacao[] = [];
      const startEpisode = gravacoes.length + 1;

      for (let i = startEpisode; i <= quantidade; i++) {
        const novoCodigo = generateCodigoGravacao();
        // Update localStorage after each code generation to avoid duplicates
        const tempStored = localStorage.getItem('kreato_gravacoes');
        const tempGravacoes = tempStored ? JSON.parse(tempStored) : [];
        
        const novaGravacao: Gravacao = {
          id: crypto.randomUUID(),
          codigo: novoCodigo,
          codigoExterno: '',
          nome: `${formData.descricao} - Episódio ${i}`,
          unidadeNegocio: '',
          centroLucro: formData.centroLucro,
          classificacao: '',
          tipoConteudo: '',
          descricao: '',
          status: '',
          dataPrevista: '',
          dataCadastro: new Date().toLocaleDateString('pt-BR'),
          usuarioCadastro: user?.nome || 'Admin',
          conteudoId: data.id,
        } as Gravacao & { conteudoId: string };

        novasGravacoes.push(novaGravacao);
        localStorage.setItem('kreato_gravacoes', JSON.stringify([...tempGravacoes, novaGravacao]));
      }

      setGravacoes([...gravacoes, ...novasGravacoes]);
      setIsGenerating(false);
      
      toast({
        title: 'Sucesso',
        description: `${novasGravacoes.length} gravações geradas com sucesso!`,
      });
    }, 500);
  };

  const getStatusColor = (statusNome: string): string | undefined => {
    const status = statusList.find((s) => s.nome === statusNome);
    return status?.cor;
  };

  const columns: Column<Gravacao>[] = [
    {
      key: 'codigo',
      label: 'Código',
      className: 'w-32',
      render: (item) => (
        <span className="font-mono text-sm font-medium text-primary">{item.codigo || '-'}</span>
      ),
    },
    {
      key: 'nome',
      label: 'Nome',
      render: (item) => <span className="font-medium">{item.nome}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (item) => {
        const cor = getStatusColor(item.status);
        return (
          <Badge 
            style={cor ? { backgroundColor: cor } : undefined}
            className={cor ? 'text-white' : 'bg-muted text-muted-foreground'}
          >
            {item.status || 'Sem status'}
          </Badge>
        );
      },
    },
    {
      key: 'dataCadastro',
      label: 'Data Cadastro',
      className: 'w-32',
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{data ? 'Editar Conteúdo' : 'Novo Conteúdo'}</DialogTitle>
          <DialogDescription>
            Preencha os campos para {data ? 'editar' : 'cadastrar'} o conteúdo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="codigoExterno">Código Externo</Label>
              <Input
                id="codigoExterno"
                value={formData.codigoExterno}
                onChange={(e) => setFormData({ ...formData, codigoExterno: e.target.value.slice(0, 10) })}
                maxLength={10}
                placeholder="Máx. 10 caracteres"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição *</Label>
              <Input
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value.slice(0, 100) })}
                maxLength={100}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantidadeEpisodios">Qtd. Episódios</Label>
              <Input
                id="quantidadeEpisodios"
                type="number"
                value={formData.quantidadeEpisodios}
                onChange={(e) => {
                  const val = e.target.value.slice(0, 5);
                  if (/^\d*$/.test(val)) {
                    setFormData({ ...formData, quantidadeEpisodios: val });
                  }
                }}
                maxLength={5}
                placeholder="Máx. 5 dígitos"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Centro de Lucro</Label>
              <Select
                value={formData.centroLucro}
                onValueChange={(value) => setFormData({ ...formData, centroLucro: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {centrosLucroHierarquicos.map((cl) => (
                    <SelectItem key={cl.id} value={cl.nome}>
                      <span className="font-mono whitespace-pre">{cl.displayName}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="anoProducao">Ano de Produção</Label>
              <Input
                id="anoProducao"
                value={formData.anoProducao}
                onChange={(e) => {
                  const val = e.target.value.slice(0, 4);
                  if (/^\d*$/.test(val)) {
                    setFormData({ ...formData, anoProducao: val });
                  }
                }}
                maxLength={4}
                placeholder="Ex: 2024"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sinopse">Descrição / Sinopse</Label>
            <Textarea
              id="sinopse"
              value={formData.sinopse}
              onChange={(e) => setFormData({ ...formData, sinopse: e.target.value })}
              rows={3}
              placeholder="Descrição detalhada do conteúdo..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="space-y-2">
              <Label>Usuário de Cadastro</Label>
              <Input
                value={data?.usuarioCadastro || user?.nome || 'Admin'}
                readOnly
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label>Data de Cadastro</Label>
              <Input
                value={data?.dataCadastro || new Date().toLocaleDateString('pt-BR')}
                readOnly
                className="bg-muted"
              />
            </div>
          </div>

          {data && (
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Gravações do Conteúdo</h3>
                <Button
                  type="button"
                  onClick={handleGenerateGravacoes}
                  disabled={isGenerating}
                  className="gradient-primary hover:opacity-90"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 mr-2" />
                      Gerar
                    </>
                  )}
                </Button>
              </div>

              {gravacoes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border rounded-lg">
                  <p>Nenhuma gravação associada.</p>
                  <p className="text-sm mt-1">Clique em "Gerar" para criar as gravações automaticamente.</p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden max-h-[300px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-32">Código</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead className="w-32">Status</TableHead>
                        <TableHead className="w-32">Data Cadastro</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {gravacoes.map((gravacao) => {
                        const cor = getStatusColor(gravacao.status);
                        return (
                          <TableRow key={gravacao.id}>
                            <TableCell className="font-mono text-sm font-medium text-primary">
                              {gravacao.codigo}
                            </TableCell>
                            <TableCell className="font-medium">{gravacao.nome}</TableCell>
                            <TableCell>
                              <Badge 
                                style={cor ? { backgroundColor: cor } : undefined}
                                className={cor ? 'text-white' : 'bg-muted text-muted-foreground'}
                              >
                                {gravacao.status || 'Sem status'}
                              </Badge>
                            </TableCell>
                            <TableCell>{gravacao.dataCadastro}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="gradient-primary hover:opacity-90">
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
