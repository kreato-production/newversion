import { useState, useEffect, useCallback } from 'react';
import { Loader2, Wand2 } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { type Conteudo, generateCodigoConteudo } from '@/pages/producao/Conteudo';
import { type Gravacao } from '@/pages/producao/GravacaoList';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ConteudoCustosTab } from './ConteudoCustosTab';
import { ElencoTab } from './ElencoTab';
import { supabase } from '@/integrations/supabase/client';
import { getCurrencyByCode } from '@/lib/currencies';

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
    unidadeNegocio: '',
    tipoConteudo: '',
    classificacao: '',
    anoProducao: '',
    sinopse: '',
    orcamento: '',
  });

  const [centrosLucro, setCentrosLucro] = useState<{ id: string; nome: string; parentId: string | null; status: string }[]>([]);
  const [filteredCentrosLucro, setFilteredCentrosLucro] = useState<{ id: string; nome: string; parentId: string | null; status: string }[]>([]);
  const [unidades, setUnidades] = useState<{ id: string; nome: string; moeda?: string | null }[]>([]);
  const [tipos, setTipos] = useState<{ id: string; nome: string }[]>([]);
  const [classificacoes, setClassificacoes] = useState<{ id: string; nome: string }[]>([]);
  const [gravacoes, setGravacoes] = useState<Gravacao[]>([]);
  const [statusList, setStatusList] = useState<{ id: string; nome: string; cor: string }[]>([]);
  const [centroLucroUnidades, setCentroLucroUnidades] = useState<{ centro_lucro_id: string; unidade_negocio_id: string }[]>([]);

  // Get the currency for the selected business unit
  const getSelectedCurrency = () => {
    if (!formData.unidadeNegocio) return null;
    const unidade = unidades.find(u => u.nome === formData.unidadeNegocio);
    return unidade?.moeda || 'BRL';
  };

  const selectedCurrency = getSelectedCurrency();

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

  const centrosLucroHierarquicos = buildHierarchy(filteredCentrosLucro);

  // Efeito para filtrar centros de lucro quando a unidade de negócio muda
  useEffect(() => {
    if (!formData.unidadeNegocio) {
      setFilteredCentrosLucro([]);
      return;
    }

    // Encontrar o ID da unidade selecionada
    const unidadeSelecionada = unidades.find(u => u.nome === formData.unidadeNegocio);
    if (!unidadeSelecionada) {
      setFilteredCentrosLucro([]);
      return;
    }

    // Filtrar centros de lucro associados à unidade selecionada
    const centrosAssociados = centroLucroUnidades
      .filter(clu => clu.unidade_negocio_id === unidadeSelecionada.id)
      .map(clu => clu.centro_lucro_id);

    const centrosFiltrados = centrosLucro.filter(cl => centrosAssociados.includes(cl.id));
    setFilteredCentrosLucro(centrosFiltrados);
  }, [formData.unidadeNegocio, unidades, centroLucroUnidades, centrosLucro]);

  const loadOptions = useCallback(async () => {
    try {
      const [centrosRes, statusRes, unidadesRes, tiposRes, classificacoesRes, centroLucroUnidadesRes] = await Promise.all([
        supabase.from('centros_lucro').select('id, nome, parent_id, status').eq('status', 'Ativo').order('nome'),
        supabase.from('status_gravacao').select('id, nome, cor').order('nome'),
        supabase.from('unidades_negocio').select('id, nome, moeda').order('nome'),
        supabase.from('tipos_gravacao').select('id, nome').order('nome'),
        supabase.from('classificacoes').select('id, nome').order('nome'),
        supabase.from('centro_lucro_unidades').select('centro_lucro_id, unidade_negocio_id'),
      ]);

      setCentrosLucro((centrosRes.data || []).map(c => ({ id: c.id, nome: c.nome, parentId: c.parent_id, status: c.status || 'Ativo' })));
      setStatusList((statusRes.data || []).map(s => ({ id: s.id, nome: s.nome, cor: s.cor || '#888888' })));
      setUnidades((unidadesRes.data || []).map(u => ({ id: u.id, nome: u.nome, moeda: u.moeda })));
      setTipos(tiposRes.data || []);
      setClassificacoes(classificacoesRes.data || []);
      setCentroLucroUnidades(centroLucroUnidadesRes.data || []);
    } catch (err) {
      console.error('Error loading options:', err);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadOptions();
    }
  }, [isOpen, loadOptions]);

  useEffect(() => {
    if (!isOpen) return;
    
    if (data) {
      setFormData({
        codigoExterno: data.codigoExterno || '',
        descricao: data.descricao || '',
        quantidadeEpisodios: String(data.quantidadeEpisodios || ''),
        centroLucro: data.centroLucro || '',
        unidadeNegocio: data.unidadeNegocio || '',
        tipoConteudo: data.tipoConteudo || '',
        classificacao: data.classificacao || '',
        anoProducao: data.anoProducao || '',
        sinopse: data.sinopse || '',
        orcamento: String((data as any).orcamento || ''),
      });
      loadGravacoes(data.id);
    } else {
      const novoCodigo = generateCodigoConteudo();
      setFormData({
        codigoExterno: novoCodigo,
        descricao: '',
        quantidadeEpisodios: '',
        centroLucro: '',
        unidadeNegocio: '',
        tipoConteudo: '',
        classificacao: '',
        anoProducao: '',
        sinopse: '',
        orcamento: '',
      });
      setGravacoes([]);
    }
  }, [data, isOpen]);

  const loadGravacoes = async (conteudoId: string) => {
    try {
      const { data: gData, error } = await supabase
        .from('gravacoes')
        .select('*, status_gravacao:status_id(id, nome, cor)')
        .eq('conteudo_id', conteudoId)
        .order('codigo');

      if (error) throw error;

      const mapped: Gravacao[] = (gData || []).map((g: any) => ({
        id: g.id,
        codigo: g.codigo,
        codigoExterno: g.codigo_externo || '',
        nome: g.nome,
        unidadeNegocio: g.unidade_negocio_id || '',
        centroLucro: g.centro_lucro_id || '',
        classificacao: g.classificacao_id || '',
        tipoConteudo: g.tipo_conteudo_id || '',
        descricao: g.descricao || '',
        status: g.status_gravacao?.nome || '',
        dataPrevista: g.data_prevista || '',
        dataCadastro: g.created_at ? new Date(g.created_at).toLocaleDateString('pt-BR') : '',
        usuarioCadastro: '',
      }));
      setGravacoes(mapped);
    } catch (err) {
      console.error('Error loading gravacoes:', err);
    }
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
      unidadeNegocio: formData.unidadeNegocio,
      tipoConteudo: formData.tipoConteudo,
      classificacao: formData.classificacao,
      anoProducao: formData.anoProducao,
      sinopse: formData.sinopse,
      usuarioCadastro: data?.usuarioCadastro || user?.nome || 'Admin',
      dataCadastro: data?.dataCadastro || new Date().toLocaleDateString('pt-BR'),
    };
    
    // Add orcamento if set
    (conteudo as any).orcamento = parseFloat(formData.orcamento) || 0;

    onSave(conteudo);
    onClose();
  };

  const handleGenerateGravacoes = async () => {
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

    try {
      const novasGravacoes = [];
      const startEpisode = gravacoes.length + 1;
      const numGravacoesGeradas = quantidade - gravacoes.length;
      
      // Calculate budget per recording (distribute equally)
      const orcamentoTotal = parseFloat(formData.orcamento) || 0;
      const orcamentoPorGravacao = orcamentoTotal > 0 && numGravacoesGeradas > 0 
        ? orcamentoTotal / quantidade // Divide by total quantity (including existing)
        : 0;
      
      // Get IDs for the form values
      const unidadeSelecionada = unidades.find(u => u.nome === formData.unidadeNegocio);
      const centroSelecionado = centrosLucro.find(c => c.nome === formData.centroLucro);
      const classificacaoSelecionada = classificacoes.find(c => c.nome === formData.classificacao);
      const tipoSelecionado = tipos.find(t => t.nome === formData.tipoConteudo);

      for (let i = startEpisode; i <= quantidade; i++) {
        const insertData = {
          nome: `${formData.descricao} - Episódio ${i}`,
          unidade_negocio_id: unidadeSelecionada?.id || null,
          centro_lucro_id: centroSelecionado?.id || null,
          classificacao_id: classificacaoSelecionada?.id || null,
          tipo_conteudo_id: tipoSelecionado?.id || null,
          conteudo_id: data.id,
          created_by: user?.id || null,
          orcamento: orcamentoPorGravacao,
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: inserted, error } = await (supabase as any)
          .from('gravacoes')
          .insert(insertData)
          .select()
          .single();

        if (error) throw error;
        if (inserted) {
          novasGravacoes.push({
            id: inserted.id,
            codigo: inserted.codigo,
            codigoExterno: inserted.codigo_externo || '',
            nome: inserted.nome,
            unidadeNegocio: inserted.unidade_negocio_id || '',
            centroLucro: inserted.centro_lucro_id || '',
            classificacao: inserted.classificacao_id || '',
            tipoConteudo: inserted.tipo_conteudo_id || '',
            descricao: inserted.descricao || '',
            status: '',
            dataPrevista: inserted.data_prevista || '',
            dataCadastro: inserted.created_at ? new Date(inserted.created_at).toLocaleDateString('pt-BR') : '',
            usuarioCadastro: user?.nome || '',
          } as Gravacao);
        }
      }

      setGravacoes([...gravacoes, ...novasGravacoes]);
      toast({
        title: 'Sucesso',
        description: `${novasGravacoes.length} gravações geradas com sucesso!`,
      });
    } catch (err) {
      console.error('Error generating gravacoes:', err);
      toast({
        title: 'Erro',
        description: 'Erro ao gerar gravações.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getStatusColor = (statusNome: string): string | undefined => {
    const status = statusList.find((s) => s.nome === statusNome);
    return status?.cor;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[900px] max-w-[900px] max-h-[80vh] overflow-y-auto">
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
              <Label>Unidade de Negócio</Label>
              <Select
                value={formData.unidadeNegocio}
                onValueChange={(value) => {
                  // Limpar centro de lucro ao mudar unidade de negócio
                  setFormData({ ...formData, unidadeNegocio: value, centroLucro: '' });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {unidades.map((u) => (
                    <SelectItem key={u.id} value={u.nome}>{u.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Centro de Lucro</Label>
              <Select
                value={formData.centroLucro}
                onValueChange={(value) => setFormData({ ...formData, centroLucro: value })}
                disabled={!formData.unidadeNegocio}
              >
                <SelectTrigger className={!formData.unidadeNegocio ? 'opacity-50 cursor-not-allowed' : ''}>
                  <SelectValue placeholder={!formData.unidadeNegocio ? "Selecione uma Unidade primeiro" : "Selecione..."} />
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
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Conteúdo</Label>
              <Select
                value={formData.tipoConteudo}
                onValueChange={(value) => setFormData({ ...formData, tipoConteudo: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {tipos.map((t) => (
                    <SelectItem key={t.id} value={t.nome}>{t.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Classificação</Label>
              <Select
                value={formData.classificacao}
                onValueChange={(value) => setFormData({ ...formData, classificacao: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {classificacoes.map((c) => (
                    <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>
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

          <div className="grid grid-cols-2 gap-4">
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
            <div className="space-y-2">
              <Label htmlFor="orcamento">
                Orçamento {selectedCurrency && `(${getCurrencyByCode(selectedCurrency)?.symbol || selectedCurrency})`}
              </Label>
              <Input
                id="orcamento"
                type="number"
                value={formData.orcamento}
                onChange={(e) => setFormData({ ...formData, orcamento: e.target.value })}
                disabled={!formData.unidadeNegocio}
                className={!formData.unidadeNegocio ? 'opacity-50 cursor-not-allowed' : ''}
                placeholder={!formData.unidadeNegocio ? 'Selecione uma Unidade primeiro' : 'Valor do orçamento'}
                step="0.01"
                min="0"
              />
              {!formData.unidadeNegocio && (
                <p className="text-xs text-muted-foreground">
                  Selecione uma Unidade de Negócio para habilitar
                </p>
              )}
            </div>
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
              <Tabs defaultValue="gravacoes" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="gravacoes">Gravações</TabsTrigger>
                  <TabsTrigger value="elenco">Elenco</TabsTrigger>
                  <TabsTrigger value="custos">Custos</TabsTrigger>
                </TabsList>
                
                <TabsContent value="gravacoes" className="mt-4">
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
                </TabsContent>

                <TabsContent value="elenco" className="mt-4">
                  <ElencoTab entityId={data.id} storagePrefix="conteudo" />
                </TabsContent>
                
                <TabsContent value="custos" className="mt-4">
                  <ConteudoCustosTab conteudoId={data.id} conteudoNome={data.descricao} />
                </TabsContent>
              </Tabs>
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
