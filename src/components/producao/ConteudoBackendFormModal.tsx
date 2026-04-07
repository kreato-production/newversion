import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { SearchableSelect } from '@/components/shared/SearchableSelect';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/usePermissions';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { getCurrencyByCode } from '@/lib/currencies';
import { conteudosRepository } from '@/modules/conteudos/conteudos.repository.provider';
import { conteudosRelacionamentosApi } from '@/modules/conteudos/conteudos-relacionamentos.api';
import {
  generateCodigoConteudo,
  type Conteudo,
  type ConteudoInput,
} from '@/modules/conteudos/conteudos.types';
import { gravacoesRepository } from '@/modules/gravacoes/gravacoes.repository.provider';
import type { Gravacao } from '@/modules/gravacoes/gravacoes.types';
import { ElencoTab } from './ElencoTab';
import { ModalNavigation, type ModalNavigationProps } from '@/components/shared/ModalNavigation';
import { ConteudoRecursosTab } from './ConteudoRecursosTab';
import { ConteudoTerceirosTab } from './ConteudoTerceirosTab';
import { ConteudoCustosBackendTab } from './ConteudoCustosBackendTab';

interface ConteudoBackendFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ConteudoInput) => Promise<void>;
  data?: Conteudo | null;
  readOnly?: boolean;
  navigation?: ModalNavigationProps;
}

type FormState = {
  codigoExterno: string;
  descricao: string;
  quantidadeEpisodios: string;
  centroLucro: string;
  unidadeNegocio: string;
  programaId: string;
  tipoConteudo: string;
  classificacao: string;
  anoProducao: string;
  sinopse: string;
  orcamento: string;
  tabelaPrecoId: string;
  frequenciaDataInicio: string;
  frequenciaDataFim: string;
  frequenciaDiasSemana: number[];
};

const DAY_LABELS = [
  { value: 0, label: 'Dom' },
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sab' },
];

function calculateFrequencyDates(startStr: string, endStr: string, days: number[]): string[] {
  if (!startStr || !endStr || days.length === 0) return [];
  const start = parseISO(startStr);
  const end = parseISO(endStr);
  const dates: string[] = [];
  const totalDays = differenceInDays(end, start);
  for (let i = 0; i <= totalDays; i += 1) {
    const current = addDays(start, i);
    if (days.includes(getDay(current))) {
      dates.push(format(current, 'yyyy-MM-dd'));
    }
  }
  return dates;
}

export const ConteudoBackendFormModal = ({
  isOpen,
  onClose,
  onSave,
  data,
  readOnly = false,
  navigation,
}: ConteudoBackendFormModalProps) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const { isVisible } = usePermissions();
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState<FormState>({
    codigoExterno: '',
    descricao: '',
    quantidadeEpisodios: '',
    centroLucro: '',
    unidadeNegocio: '',
    programaId: '',
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
  const [centrosLucro, setCentrosLucro] = useState<
    { id: string; nome: string; parentId: string | null; status: string }[]
  >([]);
  const [unidades, setUnidades] = useState<{ id: string; nome: string; moeda?: string | null }[]>(
    [],
  );
  const [tipos, setTipos] = useState<{ id: string; nome: string }[]>([]);
  const [classificacoes, setClassificacoes] = useState<{ id: string; nome: string }[]>([]);
  const [statusList, setStatusList] = useState<{ id: string; nome: string; cor: string }[]>([]);
  const [centroLucroUnidades, setCentroLucroUnidades] = useState<
    { centroLucroId: string; unidadeNegocioId: string }[]
  >([]);
  const [tabelasPreco, setTabelasPreco] = useState<
    { id: string; nome: string; unidadeNegocioId: string | null }[]
  >([]);
  const [programas, setProgramas] = useState<
    { id: string; nome: string; unidadeNegocioId: string | null }[]
  >([]);
  const [gravacoes, setGravacoes] = useState<Gravacao[]>([]);

  const filteredCentrosLucro = useMemo(() => {
    if (!formData.unidadeNegocio) return [];
    const unidade = unidades.find((item) => item.nome === formData.unidadeNegocio);
    if (!unidade) return [];
    const allowedCentroIds = new Set(
      centroLucroUnidades
        .filter((item) => item.unidadeNegocioId === unidade.id)
        .map((item) => item.centroLucroId),
    );
    return centrosLucro.filter((item) => allowedCentroIds.has(item.id));
  }, [centroLucroUnidades, centrosLucro, formData.unidadeNegocio, unidades]);

  const filteredProgramas = useMemo(() => {
    if (!formData.unidadeNegocio) return [];
    const unidade = unidades.find((item) => item.nome === formData.unidadeNegocio);
    if (!unidade) return [];
    return programas.filter((item) => item.unidadeNegocioId === unidade.id);
  }, [formData.unidadeNegocio, programas, unidades]);

  const filteredTabelasPreco = useMemo(() => {
    if (!formData.unidadeNegocio) return [];
    const unidade = unidades.find((item) => item.nome === formData.unidadeNegocio);
    if (!unidade) return [];
    return tabelasPreco.filter((item) => item.unidadeNegocioId === unidade.id);
  }, [formData.unidadeNegocio, tabelasPreco, unidades]);

  const selectedCurrency = useMemo(() => {
    const unidade = unidades.find((item) => item.nome === formData.unidadeNegocio);
    return unidade?.moeda || 'BRL';
  }, [formData.unidadeNegocio, unidades]);

  const hierarchicalCentros = useMemo(() => {
    const buildHierarchy = (
      items: typeof filteredCentrosLucro,
      parentId: string | null = null,
      level = 0,
    ): { id: string; nome: string; displayName: string }[] => {
      const children = items.filter((item) => item.parentId === parentId);
      return children.flatMap((child) => {
        const prefix = level > 0 ? `${'| '.repeat(level - 1)}|- ` : '';
        return [
          { id: child.id, nome: child.nome, displayName: `${prefix}${child.nome}` },
          ...buildHierarchy(items, child.id, level + 1),
        ];
      });
    };

    return buildHierarchy(filteredCentrosLucro);
  }, [filteredCentrosLucro]);

  const frequencyDates = useMemo(
    () =>
      calculateFrequencyDates(
        formData.frequenciaDataInicio,
        formData.frequenciaDataFim,
        formData.frequenciaDiasSemana,
      ),
    [formData.frequenciaDataFim, formData.frequenciaDataInicio, formData.frequenciaDiasSemana],
  );

  useEffect(() => {
    if (frequencyDates.length > 0) {
      setFormData((prev) => ({ ...prev, quantidadeEpisodios: String(frequencyDates.length) }));
    }
  }, [frequencyDates]);

  const loadOptions = useCallback(async () => {
    try {
      const options = await conteudosRepository.listOptions(user?.unidadeIds);
      setCentrosLucro(options.centrosLucro);
      setUnidades(options.unidades);
      setTipos(options.tipos);
      setClassificacoes(options.classificacoes);
      setStatusList(options.statusList);
      setCentroLucroUnidades(options.centroLucroUnidades);
      setTabelasPreco(options.tabelasPreco);
      setProgramas(options.programas);
    } catch (error) {
      console.error('Error loading conteudo backend options:', error);
      toast({
        title: t('common.error'),
        description: 'Erro ao carregar as opcoes do conteudo.',
        variant: 'destructive',
      });
    }
  }, [t, toast, user?.unidadeIds]);

  const loadGravacoes = useCallback(
    async (conteudoId: string) => {
      try {
        const items = await gravacoesRepository.list(user?.unidadeIds);
        setGravacoes(items.filter((item) => item.conteudoId === conteudoId));
      } catch (error) {
        console.error('Error loading conteudo gravacoes:', error);
        setGravacoes([]);
      }
    },
    [user?.unidadeIds],
  );

  useEffect(() => {
    if (!isOpen) return;
    void loadOptions();
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
        programaId: data.programaId || '',
        tipoConteudo: data.tipoConteudo || '',
        classificacao: data.classificacao || '',
        anoProducao: data.anoProducao || '',
        sinopse: data.sinopse || '',
        orcamento: String(data.orcamento || ''),
        tabelaPrecoId: data.tabelaPrecoId || '',
        frequenciaDataInicio: data.frequenciaDataInicio || '',
        frequenciaDataFim: data.frequenciaDataFim || '',
        frequenciaDiasSemana: data.frequenciaDiasSemana || [],
      });
      void loadGravacoes(data.id);
      return;
    }

    setFormData({
      codigoExterno: generateCodigoConteudo(),
      descricao: '',
      quantidadeEpisodios: '',
      centroLucro: '',
      unidadeNegocio: '',
      programaId: '',
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
  }, [data, isOpen, loadGravacoes]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const unidadeSelecionada = unidades.find((item) => item.nome === formData.unidadeNegocio);
    const centroSelecionado = filteredCentrosLucro.find(
      (item) => item.nome === formData.centroLucro,
    );
    const tipoSelecionado = tipos.find((item) => item.nome === formData.tipoConteudo);
    const classificacaoSelecionada = classificacoes.find(
      (item) => item.nome === formData.classificacao,
    );

    if (!formData.descricao.trim()) {
      toast({
        title: t('common.error'),
        description: t('field.descriptionRequired'),
        variant: 'destructive',
      });
      return;
    }

    const payload: ConteudoInput = {
      id: data?.id,
      codigoExterno: formData.codigoExterno,
      descricao: formData.descricao,
      quantidadeEpisodios: parseInt(formData.quantidadeEpisodios, 10) || 0,
      centroLucro: formData.centroLucro,
      centroLucroId: centroSelecionado?.id || data?.centroLucroId,
      unidadeNegocio: formData.unidadeNegocio,
      unidadeNegocioId: unidadeSelecionada?.id || data?.unidadeNegocioId,
      programaId: formData.programaId || undefined,
      tipoConteudo: formData.tipoConteudo,
      tipoConteudoId: tipoSelecionado?.id || data?.tipoConteudoId,
      classificacao: formData.classificacao,
      classificacaoId: classificacaoSelecionada?.id || data?.classificacaoId,
      anoProducao: formData.anoProducao,
      sinopse: formData.sinopse,
      tabelaPrecoId: formData.tabelaPrecoId || undefined,
      frequenciaDataInicio: formData.frequenciaDataInicio || undefined,
      frequenciaDataFim: formData.frequenciaDataFim || undefined,
      frequenciaDiasSemana:
        formData.frequenciaDiasSemana.length > 0 ? formData.frequenciaDiasSemana : undefined,
      orcamento: parseFloat(formData.orcamento) || 0,
    };

    try {
      await onSave(payload);
      onClose();
    } catch {
      // intentional
    }
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

    const quantidade = parseInt(formData.quantidadeEpisodios, 10);
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
      const response = await conteudosRelacionamentosApi.generateGravacoes(data.id);
      const novasGravacoes = response.items.map(
        (item) =>
          ({
            id: item.id,
            codigo: item.codigo,
            codigoExterno: item.codigoExterno || '',
            nome: item.nome,
            unidadeNegocioId: data.unidadeNegocioId || '',
            unidadeNegocio: formData.unidadeNegocio,
            centroLucro: formData.centroLucro,
            classificacao: formData.classificacao,
            tipoConteudo: formData.tipoConteudo,
            descricao: '',
            status: item.status || '',
            dataPrevista: item.dataPrevista || '',
            dataCadastro: item.dataCadastro
              ? new Date(item.dataCadastro).toLocaleDateString('pt-BR')
              : '',
            conteudoId: data.id,
            orcamento: 0,
            programaId: formData.programaId || '',
            programa: '',
          }) as Gravacao,
      );

      setGravacoes((prev) => [...prev, ...novasGravacoes]);
      toast({
        title: t('common.success'),
        description: `${novasGravacoes.length} ${t('field.recordingsGenerated')}`,
      });
    } catch (error) {
      console.error('Error generating conteudo gravacoes:', error);
      toast({
        title: t('common.error'),
        description: t('field.contentSaveError'),
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getStatusColor = (statusNome: string) =>
    statusList.find((item) => item.nome === statusNome)?.cor;

  const visibleTabs: { value: string; label: string }[] = [
    { value: 'dadosGerais', label: t('contentTab.generalData') },
  ];
  if (data) {
    if (isVisible('ProduÃ§Ã£o', 'ConteÃºdo', '-', 'Tabulador "GravaÃ§Ãµes"'))
      visibleTabs.push({ value: 'gravacoes', label: t('field.recordings') });
    if (isVisible('ProduÃ§Ã£o', 'ConteÃºdo', '-', 'Tabulador "Elenco"'))
      visibleTabs.push({ value: 'elenco', label: t('field.cast') });
    if (isVisible('ProduÃ§Ã£o', 'ConteÃºdo', '-', 'Tabulador "Recursos TÃ©cnicos"'))
      visibleTabs.push({ value: 'recursosTecnicos', label: t('contentTab.technicalResources') });
    if (isVisible('ProduÃ§Ã£o', 'ConteÃºdo', '-', 'Tabulador "Recursos FÃ­sicos"'))
      visibleTabs.push({ value: 'recursosFisicos', label: t('contentTab.physicalResources') });
    if (isVisible('ProduÃ§Ã£o', 'ConteÃºdo', '-', 'Tabulador "Terceiros"'))
      visibleTabs.push({ value: 'terceiros', label: t('contentTab.thirdParties') });
    if (isVisible('ProduÃ§Ã£o', 'ConteÃºdo', '-', 'Tabulador "Custos"'))
      visibleTabs.push({ value: 'custos', label: t('field.costs') });
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

        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4 mt-4">
          <Tabs defaultValue="dadosGerais" className="w-full">
            <TabsList
              className="grid w-full"
              style={{ gridTemplateColumns: `repeat(${visibleTabs.length}, minmax(0, 1fr))` }}
            >
              {visibleTabs.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="dadosGerais" className="mt-4 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="codigoExterno">{t('common.externalCode')}</Label>
                  <Input
                    id="codigoExterno"
                    value={formData.codigoExterno}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        codigoExterno: event.target.value.slice(0, 10),
                      }))
                    }
                    maxLength={10}
                    disabled={readOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descricao">{t('common.description')}</Label>
                  <Input
                    id="descricao"
                    value={formData.descricao}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        descricao: event.target.value.slice(0, 100),
                      }))
                    }
                    maxLength={100}
                    disabled={readOnly}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantidadeEpisodios">{t('content.episodes')}</Label>
                  <Input
                    id="quantidadeEpisodios"
                    type="number"
                    value={formData.quantidadeEpisodios}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        quantidadeEpisodios: event.target.value.slice(0, 5),
                      }))
                    }
                    readOnly={frequencyDates.length > 0 || readOnly}
                    className={frequencyDates.length > 0 ? 'bg-muted' : ''}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>{t('recordings.businessUnit')}</Label>
                  <SearchableSelect
                    options={unidades.map((item) => ({ value: item.nome, label: item.nome }))}
                    value={formData.unidadeNegocio}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        unidadeNegocio: value,
                        centroLucro: '',
                        tabelaPrecoId: '',
                        programaId: '',
                      }))
                    }
                    placeholder={t('common.select')}
                    searchPlaceholder="Pesquisar unidade..."
                    disabled={readOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('recordings.profitCenter')}</Label>
                  <SearchableSelect
                    options={hierarchicalCentros.map((item) => ({
                      value: item.nome,
                      label: item.nome,
                      displayLabel: item.displayName,
                    }))}
                    value={formData.centroLucro}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, centroLucro: value }))
                    }
                    placeholder={
                      !formData.unidadeNegocio ? t('field.selectUnitFirst') : t('common.select')
                    }
                    searchPlaceholder="Pesquisar centro de custos..."
                    disabled={!formData.unidadeNegocio || readOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tabela de Preco</Label>
                  <SearchableSelect
                    options={filteredTabelasPreco.map((item) => ({
                      value: item.id,
                      label: item.nome,
                    }))}
                    value={formData.tabelaPrecoId}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, tabelaPrecoId: value }))
                    }
                    placeholder={
                      !formData.unidadeNegocio ? t('field.selectUnitFirst') : t('common.select')
                    }
                    searchPlaceholder="Pesquisar tabela de preco..."
                    disabled={!formData.unidadeNegocio || readOnly}
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Programa</Label>
                  <SearchableSelect
                    options={filteredProgramas.map((item) => ({
                      value: item.id,
                      label: item.nome,
                    }))}
                    value={formData.programaId}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, programaId: value }))
                    }
                    placeholder={
                      !formData.unidadeNegocio ? t('field.selectUnitFirst') : t('common.select')
                    }
                    searchPlaceholder="Pesquisar programa..."
                    disabled={!formData.unidadeNegocio || readOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('content.contentType')}</Label>
                  <SearchableSelect
                    options={tipos.map((item) => ({ value: item.nome, label: item.nome }))}
                    value={formData.tipoConteudo}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, tipoConteudo: value }))
                    }
                    placeholder={t('common.select')}
                    searchPlaceholder="Pesquisar tipo..."
                    disabled={readOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('content.classification')}</Label>
                  <SearchableSelect
                    options={classificacoes.map((item) => ({ value: item.nome, label: item.nome }))}
                    value={formData.classificacao}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, classificacao: value }))
                    }
                    placeholder={t('common.select')}
                    searchPlaceholder="Pesquisar classificacao..."
                    disabled={readOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="anoProducao">{t('content.productionYear')}</Label>
                  <Input
                    id="anoProducao"
                    value={formData.anoProducao}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        anoProducao: event.target.value.slice(0, 4),
                      }))
                    }
                    maxLength={4}
                    disabled={readOnly}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sinopse">{t('content.synopsis')}</Label>
                  <Textarea
                    id="sinopse"
                    value={formData.sinopse}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, sinopse: event.target.value }))
                    }
                    rows={3}
                    disabled={readOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orcamento">
                    {t('field.budget')} (
                    {getCurrencyByCode(selectedCurrency)?.symbol || selectedCurrency})
                  </Label>
                  <Input
                    id="orcamento"
                    type="number"
                    value={formData.orcamento}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, orcamento: event.target.value }))
                    }
                    disabled={!formData.unidadeNegocio || readOnly}
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t">
                <Label className="text-sm font-semibold">Frequencia Semanal</Label>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Data Inicio</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(
                            'w-full justify-start text-left font-normal h-8 text-xs',
                            !formData.frequenciaDataInicio && 'text-muted-foreground',
                          )}
                          disabled={readOnly}
                        >
                          <CalendarIcon className="mr-2 h-3 w-3" />
                          {formData.frequenciaDataInicio
                            ? format(parseISO(formData.frequenciaDataInicio), 'dd/MM/yyyy')
                            : 'Selecione'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={
                            formData.frequenciaDataInicio
                              ? parseISO(formData.frequenciaDataInicio)
                              : undefined
                          }
                          onSelect={(date) =>
                            setFormData((prev) => ({
                              ...prev,
                              frequenciaDataInicio: date ? format(date, 'yyyy-MM-dd') : '',
                            }))
                          }
                          initialFocus
                          className="p-3 pointer-events-auto"
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Data Fim</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(
                            'w-full justify-start text-left font-normal h-8 text-xs',
                            !formData.frequenciaDataFim && 'text-muted-foreground',
                          )}
                          disabled={readOnly}
                        >
                          <CalendarIcon className="mr-2 h-3 w-3" />
                          {formData.frequenciaDataFim
                            ? format(parseISO(formData.frequenciaDataFim), 'dd/MM/yyyy')
                            : 'Selecione'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={
                            formData.frequenciaDataFim
                              ? parseISO(formData.frequenciaDataFim)
                              : undefined
                          }
                          onSelect={(date) =>
                            setFormData((prev) => ({
                              ...prev,
                              frequenciaDataFim: date ? format(date, 'yyyy-MM-dd') : '',
                            }))
                          }
                          disabled={(date) =>
                            formData.frequenciaDataInicio
                              ? date < parseISO(formData.frequenciaDataInicio)
                              : false
                          }
                          initialFocus
                          className="p-3 pointer-events-auto"
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Dias da Semana</Label>
                    <div className="flex gap-2 flex-wrap pt-1">
                      {DAY_LABELS.map((day) => (
                        <label key={day.value} className="flex items-center gap-1 cursor-pointer">
                          <Checkbox
                            checked={formData.frequenciaDiasSemana.includes(day.value)}
                            onCheckedChange={(checked) => {
                              if (readOnly) return;
                              setFormData((prev) => ({
                                ...prev,
                                frequenciaDiasSemana: checked
                                  ? [...prev.frequenciaDiasSemana, day.value].sort()
                                  : prev.frequenciaDiasSemana.filter((item) => item !== day.value),
                              }));
                            }}
                            disabled={readOnly}
                          />
                          <span className="text-xs">{day.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                {frequencyDates.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {frequencyDates.length} episodio(s) calculado(s) no periodo selecionado
                  </p>
                )}
              </div>
            </TabsContent>

            {data && isVisible('ProduÃ§Ã£o', 'ConteÃºdo', '-', 'Tabulador "GravaÃ§Ãµes"') && (
              <TabsContent value="gravacoes" className="mt-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">{t('content.contentRecordings')}</h3>
                  <Button
                    type="button"
                    onClick={() => void handleGenerateGravacoes()}
                    disabled={isGenerating || readOnly}
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
                                {gravacao.dataPrevista
                                  ? format(parseISO(gravacao.dataPrevista), 'dd/MM/yyyy')
                                  : '-'}
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

            {data && isVisible('ProduÃ§Ã£o', 'ConteÃºdo', '-', 'Tabulador "Elenco"') && (
              <TabsContent value="elenco" className="mt-4">
                <ElencoTab entityId={data.id} storagePrefix="conteudo" />
              </TabsContent>
            )}
            {data &&
              isVisible('ProduÃ§Ã£o', 'ConteÃºdo', '-', 'Tabulador "Recursos TÃ©cnicos"') && (
                <TabsContent value="recursosTecnicos" className="mt-4">
                  <ConteudoRecursosTab
                    conteudoId={data.id}
                    tabelaPrecoId={formData.tabelaPrecoId}
                    moeda={selectedCurrency}
                    readOnly={readOnly}
                    tipo="tecnico"
                  />
                </TabsContent>
              )}
            {data && isVisible('ProduÃ§Ã£o', 'ConteÃºdo', '-', 'Tabulador "Recursos FÃ­sicos"') && (
              <TabsContent value="recursosFisicos" className="mt-4">
                <ConteudoRecursosTab
                  conteudoId={data.id}
                  tabelaPrecoId={formData.tabelaPrecoId}
                  moeda={selectedCurrency}
                  readOnly={readOnly}
                  tipo="fisico"
                />
              </TabsContent>
            )}
            {data && isVisible('ProduÃ§Ã£o', 'ConteÃºdo', '-', 'Tabulador "Terceiros"') && (
              <TabsContent value="terceiros" className="mt-4">
                <ConteudoTerceirosTab
                  conteudoId={data.id}
                  moeda={selectedCurrency}
                  readOnly={readOnly}
                />
              </TabsContent>
            )}
            {data && isVisible('ProduÃ§Ã£o', 'ConteÃºdo', '-', 'Tabulador "Custos"') && (
              <TabsContent value="custos" className="mt-4">
                <ConteudoCustosBackendTab conteudoId={data.id} conteudoNome={data.descricao} />
              </TabsContent>
            )}
          </Tabs>

          <DialogFooter className={navigation ? 'sm:justify-between' : undefined}>
            {navigation && <ModalNavigation {...navigation} />}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                {readOnly ? t('common.close') || 'Fechar' : t('common.cancel')}
              </Button>
              {!readOnly && (
                <Button type="submit" className="gradient-primary hover:opacity-90">
                  {t('common.save')}
                </Button>
              )}
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
