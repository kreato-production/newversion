import { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2, Wand2, CalendarIcon } from 'lucide-react';
import { format, parseISO, addDays, getDay, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/usePermissions';
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
import { ConteudoRecursosTab } from './ConteudoRecursosTab';
import { ConteudoTerceirosTab } from './ConteudoTerceirosTab';
import { ElencoTab } from './ElencoTab';
import { supabase } from '@/integrations/supabase/client';
import { getCurrencyByCode } from '@/lib/currencies';
import { useFormFieldConfig, FieldAsterisk } from '@/hooks/useFormFieldConfig';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

interface ConteudoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Conteudo) => void;
  data?: Conteudo | null;
  readOnly?: boolean;
}

export const ConteudoFormModal = ({
  isOpen,
  onClose,
  onSave,
  data,
  readOnly = false,
}: ConteudoFormModalProps) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const { isVisible } = usePermissions();
  const { getAsterisk, validateRequired, showValidationError } = useFormFieldConfig('conteudo');
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
    tabelaPrecoId: '',
    frequenciaDataInicio: '',
    frequenciaDataFim: '',
    frequenciaDiasSemana: [] as number[],
  });

  const [centrosLucro, setCentrosLucro] = useState<{ id: string; nome: string; parentId: string | null; status: string }[]>([]);
  const [filteredCentrosLucro, setFilteredCentrosLucro] = useState<{ id: string; nome: string; parentId: string | null; status: string }[]>([]);
  const [unidades, setUnidades] = useState<{ id: string; nome: string; moeda?: string | null }[]>([]);
  const [tipos, setTipos] = useState<{ id: string; nome: string }[]>([]);
  const [classificacoes, setClassificacoes] = useState<{ id: string; nome: string }[]>([]);
  const [gravacoes, setGravacoes] = useState<Gravacao[]>([]);
  const [statusList, setStatusList] = useState<{ id: string; nome: string; cor: string }[]>([]);
  const [centroLucroUnidades, setCentroLucroUnidades] = useState<{ centro_lucro_id: string; unidade_negocio_id: string }[]>([]);
  const [tabelasPreco, setTabelasPreco] = useState<{ id: string; nome: string; unidadeNegocioId: string | null }[]>([]);
  const [filteredTabelasPreco, setFilteredTabelasPreco] = useState<{ id: string; nome: string }[]>([]);

  const getSelectedCurrency = () => {
    if (!formData.unidadeNegocio) return null;
    const unidade = unidades.find(u => u.nome === formData.unidadeNegocio);
    return unidade?.moeda || 'BRL';
  };

  const selectedCurrency = getSelectedCurrency();

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

  useEffect(() => {
    if (!formData.unidadeNegocio) {
      setFilteredCentrosLucro([]);
      return;
    }
    const unidadeSelecionada = unidades.find(u => u.nome === formData.unidadeNegocio);
    if (!unidadeSelecionada) {
      setFilteredCentrosLucro([]);
      return;
    }
    const centrosAssociados = centroLucroUnidades
      .filter(clu => clu.unidade_negocio_id === unidadeSelecionada.id)
      .map(clu => clu.centro_lucro_id);
    const centrosFiltrados = centrosLucro.filter(cl => centrosAssociados.includes(cl.id));
    setFilteredCentrosLucro(centrosFiltrados);
  }, [formData.unidadeNegocio, unidades, centroLucroUnidades, centrosLucro]);

  useEffect(() => {
    if (!formData.unidadeNegocio) {
      setFilteredTabelasPreco([]);
      return;
    }
    const unidadeSelecionada = unidades.find(u => u.nome === formData.unidadeNegocio);
    if (!unidadeSelecionada) {
      setFilteredTabelasPreco([]);
      return;
    }
    const filtered = tabelasPreco.filter(tp => tp.unidadeNegocioId === unidadeSelecionada.id);
    setFilteredTabelasPreco(filtered);
  }, [formData.unidadeNegocio, unidades, tabelasPreco]);

  const loadOptions = useCallback(async () => {
    try {
      const [centrosRes, statusRes, unidadesRes, tiposRes, classificacoesRes, centroLucroUnidadesRes, tabelasPrecoRes] = await Promise.all([
        supabase.from('centros_lucro').select('id, nome, parent_id, status').eq('status', 'Ativo').order('nome'),
        supabase.from('status_gravacao').select('id, nome, cor').order('nome'),
        (() => {
          let q = supabase.from('unidades_negocio').select('id, nome, moeda');
          if (user?.unidadeIds && user.unidadeIds.length > 0) q = q.in('id', user.unidadeIds);
          return q.order('nome');
        })(),
        supabase.from('tipos_gravacao').select('id, nome').order('nome'),
        supabase.from('classificacoes').select('id, nome').order('nome'),
        supabase.from('centro_lucro_unidades').select('centro_lucro_id, unidade_negocio_id'),
        (supabase as any).from('tabelas_preco').select('id, nome, unidade_negocio_id').eq('status', 'Ativo').order('nome'),
      ]);

      setCentrosLucro((centrosRes.data || []).map(c => ({ id: c.id, nome: c.nome, parentId: c.parent_id, status: c.status || 'Ativo' })));
      setStatusList((statusRes.data || []).map(s => ({ id: s.id, nome: s.nome, cor: s.cor || '#888888' })));
      setUnidades((unidadesRes.data || []).map(u => ({ id: u.id, nome: u.nome, moeda: u.moeda })));
      setTipos(tiposRes.data || []);
      setClassificacoes(classificacoesRes.data || []);
      setCentroLucroUnidades(centroLucroUnidadesRes.data || []);
      setTabelasPreco((tabelasPrecoRes.data || []).map((tp: any) => ({ id: tp.id, nome: tp.nome, unidadeNegocioId: tp.unidade_negocio_id })));
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
        tabelaPrecoId: data.tabelaPrecoId || '',
        frequenciaDataInicio: data.frequenciaDataInicio || '',
        frequenciaDataFim: data.frequenciaDataFim || '',
        frequenciaDiasSemana: data.frequenciaDiasSemana || [],
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
        tabelaPrecoId: '',
        frequenciaDataInicio: '',
        frequenciaDataFim: '',
        frequenciaDiasSemana: [],
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

      // Auto-fix: assign initial status to recordings missing one
      const semStatus = (gData || []).filter((g: any) => !g.status_id);
      if (semStatus.length > 0) {
        const { data: statusInicial } = await supabase
          .from('status_gravacao')
          .select('id, nome, cor')
          .eq('is_inicial', true)
          .maybeSingle();
        
        if (statusInicial) {
          await Promise.all(
            semStatus.map((g: any) =>
              supabase.from('gravacoes').update({ status_id: statusInicial.id }).eq('id', g.id)
            )
          );
          // Update local data with the assigned status
          for (const g of semStatus) {
            g.status_id = statusInicial.id;
            g.status_gravacao = { id: statusInicial.id, nome: statusInicial.nome, cor: statusInicial.cor };
          }
        }
      }

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

  // Calculate dates from weekly frequency
  const calculateFrequencyDates = useCallback((startStr: string, endStr: string, days: number[]): string[] => {
    if (!startStr || !endStr || days.length === 0) return [];
    const start = parseISO(startStr);
    const end = parseISO(endStr);
    const dates: string[] = [];
    const totalDays = differenceInDays(end, start);
    for (let i = 0; i <= totalDays; i++) {
      const current = addDays(start, i);
      // getDay: 0=Sun, 1=Mon... same as our array convention
      if (days.includes(getDay(current))) {
        dates.push(format(current, 'yyyy-MM-dd'));
      }
    }
    return dates;
  }, []);

  // Auto-calculate episodes when frequency changes
  const frequencyDates = useMemo(() => {
    return calculateFrequencyDates(formData.frequenciaDataInicio, formData.frequenciaDataFim, formData.frequenciaDiasSemana);
  }, [formData.frequenciaDataInicio, formData.frequenciaDataFim, formData.frequenciaDiasSemana, calculateFrequencyDates]);

  useEffect(() => {
    if (frequencyDates.length > 0) {
      setFormData(prev => ({ ...prev, quantidadeEpisodios: String(frequencyDates.length) }));
    }
  }, [frequencyDates]);

  const DAY_LABELS = [
    { value: 0, label: 'Dom' },
    { value: 1, label: 'Seg' },
    { value: 2, label: 'Ter' },
    { value: 3, label: 'Qua' },
    { value: 4, label: 'Qui' },
    { value: 5, label: 'Sex' },
    { value: 6, label: 'Sáb' },
  ];

  const conteudoFieldLabels: Record<string, string> = {
    codigoExterno: 'Código Externo', descricao: 'Descrição', quantidadeEpisodios: 'Qtd. Episódios',
    unidadeNegocio: 'Unidade de Negócio', centroLucro: 'Centro de Lucro', tipoConteudo: 'Tipo de Conteúdo',
    classificacao: 'Classificação', anoProducao: 'Ano de Produção', sinopse: 'Sinopse', orcamento: 'Orçamento',
    tabelaPrecoId: 'Tabela de Preço',
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const missing = validateRequired(formData as any, conteudoFieldLabels);
    if (missing.length > 0) {
      showValidationError(missing);
      return;
    }

    if (!formData.descricao.trim()) {
      toast({ title: t('common.error'), description: t('field.descriptionRequired'), variant: 'destructive' });
      return;
    }

    const conteudo: Conteudo = {
      id: data?.id || crypto.randomUUID(),
      codigoExterno: formData.codigoExterno,
      descricao: formData.descricao,
      quantidadeEpisodios: parseInt(formData.quantidadeEpisodios) || 0,
      centroLucro: formData.centroLucro,
      centroLucroId: data?.centroLucroId,
      unidadeNegocio: formData.unidadeNegocio,
      unidadeNegocioId: data?.unidadeNegocioId,
      tipoConteudo: formData.tipoConteudo,
      tipoConteudoId: data?.tipoConteudoId,
      classificacao: formData.classificacao,
      classificacaoId: data?.classificacaoId,
      anoProducao: formData.anoProducao,
      sinopse: formData.sinopse,
      usuarioCadastro: data?.usuarioCadastro || user?.nome || 'Admin',
      dataCadastro: data?.dataCadastro || new Date().toLocaleDateString('pt-BR'),
      tabelaPrecoId: formData.tabelaPrecoId || undefined,
      frequenciaDataInicio: formData.frequenciaDataInicio || undefined,
      frequenciaDataFim: formData.frequenciaDataFim || undefined,
      frequenciaDiasSemana: formData.frequenciaDiasSemana.length > 0 ? formData.frequenciaDiasSemana : undefined,
    };
    
    (conteudo as any).orcamento = parseFloat(formData.orcamento) || 0;

    onSave(conteudo);
    onClose();
  };

  const handleGenerateGravacoes = async () => {
    if (!data?.id) {
      toast({
        title: t('common.error'),
        description: t('field.saveBeforeGenerating'),
        variant: 'destructive',
      });
      return;
    }

    const quantidade = parseInt(formData.quantidadeEpisodios);
    if (!quantidade || quantidade <= 0) {
      toast({
        title: t('common.error'),
        description: t('field.defineEpisodesFirst'),
        variant: 'destructive',
      });
      return;
    }

    if (gravacoes.length >= quantidade) {
      toast({
        title: t('common.error'),
        description: t('field.allRecordingsGenerated'),
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);

    try {
      const novasGravacoes = [];
      const startEpisode = gravacoes.length + 1;
      const numGravacoesGeradas = quantidade - gravacoes.length;
      
      const orcamentoTotal = parseFloat(formData.orcamento) || 0;
      const orcamentoPorGravacao = orcamentoTotal > 0 && numGravacoesGeradas > 0 
        ? orcamentoTotal / quantidade
        : 0;
      
      // Fetch initial status - try is_inicial first, fallback to first status
      let statusInicialId: string | null = null;
      const { data: statusInicial } = await supabase
        .from('status_gravacao')
        .select('id')
        .eq('is_inicial', true)
        .maybeSingle();
      
      if (statusInicial?.id) {
        statusInicialId = statusInicial.id;
      } else {
        // Fallback: get first status ordered by name
        const { data: fallbackStatus } = await supabase
          .from('status_gravacao')
          .select('id')
          .order('nome')
          .limit(1)
          .maybeSingle();
        statusInicialId = fallbackStatus?.id || null;
      }
      
      if (!statusInicialId) {
        console.error('Nenhum status de gravação encontrado no sistema');
      }

      const unidadeSelecionada = unidades.find(u => u.nome === formData.unidadeNegocio);
      const centroSelecionado = centrosLucro.find(c => c.nome === formData.centroLucro);
      const classificacaoSelecionada = classificacoes.find(c => c.nome === formData.classificacao);
      const tipoSelecionado = tipos.find(t => t.nome === formData.tipoConteudo);

      const unidadeNegocioId = unidadeSelecionada?.id || (data as any)?.unidadeNegocioId || null;
      const centroLucroId = centroSelecionado?.id || (data as any)?.centroLucroId || null;
      const classificacaoId = classificacaoSelecionada?.id || (data as any)?.classificacaoId || null;
      const tipoConteudoId = tipoSelecionado?.id || (data as any)?.tipoConteudoId || null;

      // Calculate dates for each episode from frequency
      const allFreqDates = calculateFrequencyDates(formData.frequenciaDataInicio, formData.frequenciaDataFim, formData.frequenciaDiasSemana);

      for (let i = startEpisode; i <= quantidade; i++) {
        // Assign data_prevista from frequency dates (index i-1 for zero-based)
        const dataPrevista = allFreqDates.length > 0 && (i - 1) < allFreqDates.length ? allFreqDates[i - 1] : null;
        
        const insertData = {
          nome: `${formData.descricao} - Episódio ${i}`,
          unidade_negocio_id: unidadeNegocioId,
          centro_lucro_id: centroLucroId,
          classificacao_id: classificacaoId,
          tipo_conteudo_id: tipoConteudoId,
          conteudo_id: data.id,
          created_by: user?.id || null,
          orcamento: orcamentoPorGravacao,
          status_id: statusInicialId,
          data_prevista: dataPrevista,
        };

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

      // Copy content resources to each new gravação
      if (novasGravacoes.length > 0 && data?.id) {
        try {
          const [rtRes, rfRes] = await Promise.all([
            (supabase as any).from('conteudo_recursos_tecnicos').select('recurso_tecnico_id, quantidade').eq('conteudo_id', data.id),
            (supabase as any).from('conteudo_recursos_fisicos').select('recurso_fisico_id, quantidade').eq('conteudo_id', data.id),
          ]);

          const recursosTecnicos = rtRes.data || [];
          const recursosFisicos = rfRes.data || [];

          for (const gravacao of novasGravacoes) {
            const inserts: any[] = [];

            for (const rt of recursosTecnicos) {
              const qty = rt.quantidade || 1;
              for (let q = 0; q < qty; q++) {
                inserts.push({
                  gravacao_id: gravacao.id,
                  recurso_tecnico_id: rt.recurso_tecnico_id,
                  recurso_humano_id: null,
                  recurso_fisico_id: null,
                });
              }
            }

            for (const rf of recursosFisicos) {
              const qty = rf.quantidade || 1;
              for (let q = 0; q < qty; q++) {
                inserts.push({
                  gravacao_id: gravacao.id,
                  recurso_fisico_id: rf.recurso_fisico_id,
                  recurso_tecnico_id: null,
                  recurso_humano_id: null,
                });
              }
            }

            if (inserts.length > 0) {
              const { error: resError } = await (supabase as any)
                .from('gravacao_recursos')
                .insert(inserts);
              if (resError) {
                console.error('Error copying resources to gravacao:', resError);
              }
            }
          }
        } catch (resErr) {
          console.error('Error copying content resources to gravacoes:', resErr);
        }
      }

      setGravacoes([...gravacoes, ...novasGravacoes]);
      toast({
        title: t('common.success'),
        description: `${novasGravacoes.length} ${t('field.recordingsGenerated')}`,
      });
    } catch (err) {
      console.error('Error generating gravacoes:', err);
      toast({
        title: t('common.error'),
        description: t('field.contentSaveError'),
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

  // Count visible tabs to set grid cols
  const visibleTabs: { value: string; label: string }[] = [
    { value: 'dadosGerais', label: 'Dados Gerais' },
  ];
  if (data) {
    if (isVisible('Produção', 'Conteúdo', '-', 'Tabulador "Gravações"')) visibleTabs.push({ value: 'gravacoes', label: t('field.recordings') });
    if (isVisible('Produção', 'Conteúdo', '-', 'Tabulador "Elenco"')) visibleTabs.push({ value: 'elenco', label: t('field.cast') });
    if (isVisible('Produção', 'Conteúdo', '-', 'Tabulador "Recursos Técnicos"')) visibleTabs.push({ value: 'recursosTecnicos', label: 'Recursos Técnicos' });
    if (isVisible('Produção', 'Conteúdo', '-', 'Tabulador "Recursos Físicos"')) visibleTabs.push({ value: 'recursosFisicos', label: 'Recursos Físicos' });
    if (isVisible('Produção', 'Conteúdo', '-', 'Tabulador "Terceiros"')) visibleTabs.push({ value: 'terceiros', label: 'Terceiros' });
    if (isVisible('Produção', 'Conteúdo', '-', 'Tabulador "Custos"')) visibleTabs.push({ value: 'custos', label: t('field.costs') });
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[1500px] max-w-[1500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{data ? t('content.edit') : t('content.new')}</DialogTitle>
          <DialogDescription>
            {data ? t('field.editContentData') : t('field.fillContentData')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <Tabs defaultValue="dadosGerais" className="w-full">
            <TabsList className={`grid w-full`} style={{ gridTemplateColumns: `repeat(${visibleTabs.length}, minmax(0, 1fr))` }}>
              {visibleTabs.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="dadosGerais" className="mt-4 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="codigoExterno">{t('common.externalCode')} <FieldAsterisk type={getAsterisk('codigoExterno')} /></Label>
                  <Input
                    id="codigoExterno"
                    value={formData.codigoExterno}
                    onChange={(e) => setFormData({ ...formData, codigoExterno: e.target.value.slice(0, 10) })}
                    maxLength={10}
                    placeholder="Máx. 10 caracteres"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descricao">{t('common.description')} <FieldAsterisk type={getAsterisk('descricao')} /></Label>
                  <Input
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value.slice(0, 100) })}
                    maxLength={100}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantidadeEpisodios">{t('content.episodes')} <FieldAsterisk type={getAsterisk('quantidadeEpisodios')} /></Label>
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
                    readOnly={frequencyDates.length > 0}
                    className={frequencyDates.length > 0 ? 'bg-muted' : ''}
                  />
                  {frequencyDates.length > 0 && (
                    <p className="text-xs text-muted-foreground">Calculado automaticamente pela frequência semanal</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>{t('recordings.businessUnit')} <FieldAsterisk type={getAsterisk('unidadeNegocio')} /></Label>
                  <Select
                    value={formData.unidadeNegocio}
                    onValueChange={(value) => {
                      setFormData({ ...formData, unidadeNegocio: value, centroLucro: '', tabelaPrecoId: '' });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('common.select')} />
                    </SelectTrigger>
                    <SelectContent>
                      {unidades.map((u) => (
                        <SelectItem key={u.id} value={u.nome}>{u.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('recordings.profitCenter')} <FieldAsterisk type={getAsterisk('centroLucro')} /></Label>
                  <Select
                    value={formData.centroLucro}
                    onValueChange={(value) => setFormData({ ...formData, centroLucro: value })}
                    disabled={!formData.unidadeNegocio}
                  >
                    <SelectTrigger className={!formData.unidadeNegocio ? 'opacity-50 cursor-not-allowed' : ''}>
                      <SelectValue placeholder={!formData.unidadeNegocio ? t('field.selectUnitFirst') : t('common.select')} />
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
                  <Label>Tabela de Preço <FieldAsterisk type={getAsterisk('tabelaPrecoId')} /></Label>
                  <Select
                    value={formData.tabelaPrecoId}
                    onValueChange={(value) => setFormData({ ...formData, tabelaPrecoId: value })}
                    disabled={!formData.unidadeNegocio}
                  >
                    <SelectTrigger className={!formData.unidadeNegocio ? 'opacity-50 cursor-not-allowed' : ''}>
                      <SelectValue placeholder={!formData.unidadeNegocio ? 'Selecione uma Unidade de Negócio primeiro' : t('common.select')} />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredTabelasPreco.map((tp) => (
                        <SelectItem key={tp.id} value={tp.id}>{tp.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>{t('content.contentType')} <FieldAsterisk type={getAsterisk('tipoConteudo')} /></Label>
                  <Select
                    value={formData.tipoConteudo}
                    onValueChange={(value) => setFormData({ ...formData, tipoConteudo: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('common.select')} />
                    </SelectTrigger>
                    <SelectContent>
                      {tipos.map((t) => (
                        <SelectItem key={t.id} value={t.nome}>{t.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('content.classification')} <FieldAsterisk type={getAsterisk('classificacao')} /></Label>
                  <Select
                    value={formData.classificacao}
                    onValueChange={(value) => setFormData({ ...formData, classificacao: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('common.select')} />
                    </SelectTrigger>
                    <SelectContent>
                      {classificacoes.map((c) => (
                        <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="anoProducao">{t('content.productionYear')} <FieldAsterisk type={getAsterisk('anoProducao')} /></Label>
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
                  <Label htmlFor="sinopse">{t('content.synopsis')} <FieldAsterisk type={getAsterisk('sinopse')} /></Label>
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
                    {t('field.budget')} {selectedCurrency && `(${getCurrencyByCode(selectedCurrency)?.symbol || selectedCurrency})`} <FieldAsterisk type={getAsterisk('orcamento')} />
                  </Label>
                  <Input
                    id="orcamento"
                    type="number"
                    value={formData.orcamento}
                    onChange={(e) => setFormData({ ...formData, orcamento: e.target.value })}
                    disabled={!formData.unidadeNegocio}
                    className={!formData.unidadeNegocio ? 'opacity-50 cursor-not-allowed' : ''}
                    placeholder={!formData.unidadeNegocio ? t('field.selectUnitFirst') : t('field.budgetPlaceholder')}
                    step="0.01"
                    min="0"
                  />
                  {!formData.unidadeNegocio && (
                    <p className="text-xs text-muted-foreground">
                      {t('field.selectUnitToEnable')}
                    </p>
                  )}
                </div>
              </div>
              {isVisible('Produção', 'Conteúdo', '-', 'Frequência Semanal') && (
                <div className="space-y-3 pt-4 border-t">
                  <Label className="text-sm font-semibold">Frequência Semanal</Label>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Data Início <FieldAsterisk type={getAsterisk('frequenciaDataInicio')} /></Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn("w-full justify-start text-left font-normal h-8 text-xs", !formData.frequenciaDataInicio && "text-muted-foreground")}
                          >
                            <CalendarIcon className="mr-2 h-3 w-3" />
                            {formData.frequenciaDataInicio ? format(parseISO(formData.frequenciaDataInicio), 'dd/MM/yyyy') : 'Selecione'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={formData.frequenciaDataInicio ? parseISO(formData.frequenciaDataInicio) : undefined}
                            onSelect={(date) => setFormData({ ...formData, frequenciaDataInicio: date ? format(date, 'yyyy-MM-dd') : '' })}
                            initialFocus
                            className="p-3 pointer-events-auto"
                            locale={ptBR}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Data Fim <FieldAsterisk type={getAsterisk('frequenciaDataFim')} /></Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn("w-full justify-start text-left font-normal h-8 text-xs", !formData.frequenciaDataFim && "text-muted-foreground")}
                          >
                            <CalendarIcon className="mr-2 h-3 w-3" />
                            {formData.frequenciaDataFim ? format(parseISO(formData.frequenciaDataFim), 'dd/MM/yyyy') : 'Selecione'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={formData.frequenciaDataFim ? parseISO(formData.frequenciaDataFim) : undefined}
                            onSelect={(date) => setFormData({ ...formData, frequenciaDataFim: date ? format(date, 'yyyy-MM-dd') : '' })}
                            disabled={(date) => formData.frequenciaDataInicio ? date < parseISO(formData.frequenciaDataInicio) : false}
                            initialFocus
                            className="p-3 pointer-events-auto"
                            locale={ptBR}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Dias da Semana <FieldAsterisk type={getAsterisk('frequenciaDiasSemana')} /></Label>
                      <div className="flex gap-2 flex-wrap pt-1">
                        {DAY_LABELS.map((day) => (
                          <label key={day.value} className="flex items-center gap-1 cursor-pointer">
                            <Checkbox
                              checked={formData.frequenciaDiasSemana.includes(day.value)}
                              onCheckedChange={(checked) => {
                                const newDays = checked
                                  ? [...formData.frequenciaDiasSemana, day.value].sort()
                                  : formData.frequenciaDiasSemana.filter(d => d !== day.value);
                                setFormData({ ...formData, frequenciaDiasSemana: newDays });
                              }}
                            />
                            <span className="text-xs">{day.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                  {frequencyDates.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {frequencyDates.length} episódio(s) calculado(s) no período selecionado
                    </p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label>{t('common.registrationUser')}</Label>
                  <Input
                    value={data?.usuarioCadastro || user?.nome || 'Admin'}
                    readOnly
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('common.registrationDate')}</Label>
                  <Input
                    value={data?.dataCadastro || new Date().toLocaleDateString('pt-BR')}
                    readOnly
                    className="bg-muted"
                  />
                </div>
              </div>
            </TabsContent>

            {data && isVisible('Produção', 'Conteúdo', '-', 'Tabulador "Gravações"') && (
              <TabsContent value="gravacoes" className="mt-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">{t('content.contentRecordings')}</h3>
                  <Button
                    type="button"
                    onClick={handleGenerateGravacoes}
                    disabled={isGenerating}
                    className="gradient-primary hover:opacity-90"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {t('common.generating')}
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4 mr-2" />
                        {t('common.generate')}
                      </>
                    )}
                  </Button>
                </div>

                {gravacoes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground border rounded-lg">
                    <p>{t('field.noRecordings')}</p>
                    <p className="text-sm mt-1">{t('field.clickGenerate')}</p>
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden max-h-[300px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                         <TableRow>
                           <TableHead className="w-32">{t('common.code')}</TableHead>
                           <TableHead>{t('common.name')}</TableHead>
                           <TableHead className="w-32">{t('common.status')}</TableHead>
                           <TableHead className="w-32">Data Prevista</TableHead>
                           <TableHead className="w-32">{t('common.registrationDate')}</TableHead>
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
                                  {gravacao.status || t('field.noStatus')}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {gravacao.dataPrevista ? format(parseISO(gravacao.dataPrevista), 'dd/MM/yyyy') : '-'}
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
            )}

            {data && isVisible('Produção', 'Conteúdo', '-', 'Tabulador "Elenco"') && (
              <TabsContent value="elenco" className="mt-4">
                <ElencoTab entityId={data.id} storagePrefix="conteudo" />
              </TabsContent>
            )}
            
            {data && isVisible('Produção', 'Conteúdo', '-', 'Tabulador "Recursos Técnicos"') && (
              <TabsContent value="recursosTecnicos" className="mt-4">
                <ConteudoRecursosTab
                  conteudoId={data.id}
                  tabelaPrecoId={formData.tabelaPrecoId}
                  moeda={selectedCurrency || 'BRL'}
                  readOnly={readOnly}
                  tipo="tecnico"
                />
              </TabsContent>
            )}

            {data && isVisible('Produção', 'Conteúdo', '-', 'Tabulador "Recursos Físicos"') && (
              <TabsContent value="recursosFisicos" className="mt-4">
                <ConteudoRecursosTab
                  conteudoId={data.id}
                  tabelaPrecoId={formData.tabelaPrecoId}
                  moeda={selectedCurrency || 'BRL'}
                  readOnly={readOnly}
                  tipo="fisico"
                />
              </TabsContent>
            )}

            {data && isVisible('Produção', 'Conteúdo', '-', 'Tabulador "Terceiros"') && (
              <TabsContent value="terceiros" className="mt-4">
                <ConteudoTerceirosTab
                  conteudoId={data.id}
                  moeda={selectedCurrency || 'BRL'}
                  readOnly={readOnly}
                />
              </TabsContent>
            )}

            {data && isVisible('Produção', 'Conteúdo', '-', 'Tabulador "Custos"') && (
              <TabsContent value="custos" className="mt-4">
                <ConteudoCustosTab conteudoId={data.id} conteudoNome={data.descricao} />
              </TabsContent>
            )}
          </Tabs>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {readOnly ? t('common.close') || 'Fechar' : t('common.cancel')}
            </Button>
            {!readOnly && (
              <Button type="submit" className="gradient-primary hover:opacity-90">
                {t('common.save')}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
