import { useState, useEffect, forwardRef, useCallback } from 'react';
import { format, parse } from 'date-fns';
import { ptBR, enUS, es } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
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
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePermissions } from '@/hooks/usePermissions';
import { type Gravacao, generateCodigoGravacao } from '@/pages/producao/GravacaoList';
import { RecursosTab } from './RecursosTab';
import { CustosTab } from './CustosTab';
import { TerceirosTab } from './TerceirosTab';
import { ConvidadosTab } from './ConvidadosTab';
import FigurinosTab from './FigurinosTab';
import { ElencoTab } from './ElencoTab';
import { RoteiroTab } from './RoteiroTab';
import { GravacaoTarefasTab } from './GravacaoTarefasTab';
import { GravacaoReportGenerator } from './GravacaoReportGenerator';
import { GravacaoIncidenciasTab } from './GravacaoIncidenciasTab';
import { cn } from '@/lib/utils';
import { DialogActionBar } from '@/components/shared/DialogActionBar';
import { supabase } from '@/integrations/supabase/client';
import { getCurrencyByCode } from '@/lib/currencies';
import { useFormFieldConfig, FieldAsterisk } from '@/hooks/useFormFieldConfig';
import { SearchableSelect } from '@/components/shared/SearchableSelect';


interface GravacaoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Gravacao) => void;
  data?: Gravacao | null;
  readOnly?: boolean;
}

const localeMap = {
  pt: ptBR,
  en: enUS,
  es: es,
};

export const GravacaoFormModal = forwardRef<HTMLDivElement, GravacaoFormModalProps>(({
  isOpen,
  onClose,
  onSave,
  data,
  readOnly = false,
}, ref) => {
  const { user, session } = useAuth();
  const { t, language, formatDate } = useLanguage();
  const { isVisible } = usePermissions();
  const { getAsterisk, validateRequired, showValidationError } = useFormFieldConfig('gravacao');
  const [codigoGerado, setCodigoGerado] = useState('');
  const [dataPrevista, setDataPrevista] = useState<Date | undefined>(undefined);
  const [formData, setFormData] = useState({
    codigoExterno: '',
    nome: '',
    unidadeNegocio: '',
    centroLucro: '',
    classificacao: '',
    tipoConteudo: '',
    descricao: '',
    status: '',
    conteudoId: '',
    orcamento: '',
    programaId: '',
  });

  const [unidades, setUnidades] = useState<{ id: string; nome: string; moeda?: string | null }[]>([]);
  const [centrosLucro, setCentrosLucro] = useState<{ id: string; nome: string; parentId: string | null; status: string; codigoExterno?: string }[]>([]);
  const [centroLucroUnidades, setCentroLucroUnidades] = useState<{ centro_lucro_id: string; unidade_negocio_id: string }[]>([]);
  const [classificacoes, setClassificacoes] = useState<{ id: string; nome: string }[]>([]);
  const [tipos, setTipos] = useState<{ id: string; nome: string }[]>([]);
  const [statusList, setStatusList] = useState<{ id: string; nome: string }[]>([]);
  const [conteudos, setConteudos] = useState<{ id: string; descricao: string }[]>([]);
  const [programas, setProgramas] = useState<{ id: string; nome: string; unidadeNegocioId: string | null }[]>([]);
  const [filteredProgramas, setFilteredProgramas] = useState<{ id: string; nome: string }[]>([]);

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

  const getFilteredCentrosLucro = () => {
    if (!formData.unidadeNegocio) return [];
    
    const unidadeSelecionada = unidades.find(u => u.nome === formData.unidadeNegocio);
    if (!unidadeSelecionada) return [];
    
    const centrosAssociados = centroLucroUnidades
      .filter(clu => clu.unidade_negocio_id === unidadeSelecionada.id)
      .map(clu => clu.centro_lucro_id);
    
    return centrosLucro.filter(cl => centrosAssociados.includes(cl.id));
  };

  const filteredCentrosLucro = getFilteredCentrosLucro();
  const centrosLucroHierarquicos = buildHierarchy(filteredCentrosLucro);

  const fetchDropdownData = useCallback(async () => {
    if (!session) return;

    try {
      const [unidadesRes, centrosRes, centroLucroUnidadesRes, classificacoesRes, tiposRes, statusRes, conteudosRes, programasRes] = await Promise.all([
        (() => {
          let q = supabase.from('unidades_negocio').select('id, nome, moeda');
          if (user?.unidadeIds && user.unidadeIds.length > 0) q = q.in('id', user.unidadeIds);
          return q.order('nome');
        })(),
        supabase.from('centros_lucro').select('id, nome, parent_id, status').eq('status', 'Ativo').order('nome'),
        supabase.from('centro_lucro_unidades').select('centro_lucro_id, unidade_negocio_id'),
        supabase.from('classificacoes').select('id, nome').order('nome'),
        supabase.from('tipos_gravacao').select('id, nome').order('nome'),
        supabase.from('status_gravacao').select('id, nome, is_inicial').order('nome'),
        supabase.from('conteudos').select('id, descricao').order('descricao'),
        supabase.from('programas').select('id, nome, unidade_negocio_id').order('nome'),
      ]);

      setUnidades((unidadesRes.data || []).map(u => ({ id: u.id, nome: u.nome, moeda: u.moeda })));
      setCentrosLucro((centrosRes.data || []).map((c: any) => ({
        id: c.id,
        nome: c.nome,
        parentId: c.parent_id,
        status: c.status,
      })));
      setCentroLucroUnidades(centroLucroUnidadesRes.data || []);
      setClassificacoes(classificacoesRes.data || []);
      setTipos(tiposRes.data || []);
      setStatusList(statusRes.data || []);
      setConteudos(conteudosRes.data || []);
      setProgramas((programasRes.data || []).map((p: any) => ({ id: p.id, nome: p.nome, unidadeNegocioId: p.unidade_negocio_id })));
    } catch (err) {
      console.error('Error fetching dropdown data:', err);
    }
  }, [session]);

  useEffect(() => {
    if (isOpen) {
      fetchDropdownData();
    }
  }, [isOpen, fetchDropdownData]);

  const incomingStatus = data?.status || '';

  useEffect(() => {
    if (!isOpen) return;
    
    if (data) {
      setCodigoGerado(data.codigo || '');
      setFormData({
        codigoExterno: data.codigoExterno || '',
        nome: data.nome || '',
        unidadeNegocio: data.unidadeNegocio || '',
        centroLucro: (data as any).centroLucro || '',
        classificacao: data.classificacao || '',
        tipoConteudo: data.tipoConteudo || '',
        descricao: data.descricao || '',
        status: data.status || '',
        conteudoId: data.conteudoId || '',
        orcamento: String((data as any).orcamento || ''),
        programaId: data.programaId || '',
      });
      if (data.dataPrevista) {
        try {
          let parsedDate: Date | undefined;
          
          if (/^\d{4}-\d{2}-\d{2}/.test(data.dataPrevista)) {
            parsedDate = new Date(data.dataPrevista);
          } else if (/^\d{2}\/\d{2}\/\d{4}/.test(data.dataPrevista)) {
            parsedDate = parse(data.dataPrevista, 'dd/MM/yyyy', new Date());
          }
          
          if (parsedDate && !isNaN(parsedDate.getTime())) {
            setDataPrevista(parsedDate);
          } else {
            setDataPrevista(undefined);
          }
        } catch {
          setDataPrevista(undefined);
        }
      } else {
        setDataPrevista(undefined);
      }
    } else {
      const novoCodigo = generateCodigoGravacao();
      setCodigoGerado(novoCodigo);
      
      const inicialStatus = statusList.find((s: any) => s.is_inicial === true);
      
      setFormData({
        codigoExterno: '',
        nome: '',
        unidadeNegocio: '',
        centroLucro: '',
        classificacao: '',
        tipoConteudo: '',
        descricao: '',
        status: inicialStatus?.nome || '',
        conteudoId: '',
        orcamento: '',
        programaId: '',
      });
      setDataPrevista(undefined);
    }
  }, [data, isOpen]);

  useEffect(() => {
    if (!isOpen || data || statusList.length === 0) return;
    setFormData(prev => {
      if (prev.status) return prev;
      const inicialStatus = statusList.find((s: any) => s.is_inicial === true);
      if (inicialStatus) {
        return { ...prev, status: inicialStatus.nome };
      }
      return prev;
    });
  }, [isOpen, data, statusList]);

  useEffect(() => {
    if (!isOpen || !incomingStatus) return;
    
    setStatusList((prev) => {
      if (prev.some((s) => s.nome === incomingStatus)) return prev;
      return [{ id: '__temp__', nome: incomingStatus }, ...prev];
    });
  }, [isOpen, incomingStatus]);

  // Filter programas by selected unidade
  useEffect(() => {
    if (!formData.unidadeNegocio) { setFilteredProgramas([]); return; }
    const unidadeSelecionada = unidades.find(u => u.nome === formData.unidadeNegocio);
    if (!unidadeSelecionada) { setFilteredProgramas([]); return; }
    setFilteredProgramas(programas.filter(p => p.unidadeNegocioId === unidadeSelecionada.id));
  }, [formData.unidadeNegocio, unidades, programas]);

  const gravacaoFieldLabels: Record<string, string> = {
    codigoExterno: 'Código Externo', nome: 'Nome', unidadeNegocio: 'Unidade de Negócio',
    centroLucro: 'Centro de Lucro', tipoConteudo: 'Tipo de Conteúdo', classificacao: 'Classificação',
    status: 'Status', conteudoId: 'Conteúdo', dataPrevista: 'Data Prevista', descricao: 'Descrição', orcamento: 'Orçamento',
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const dataToValidate = { ...formData, dataPrevista: dataPrevista ? 'set' : '' };
    const missing = validateRequired(dataToValidate, gravacaoFieldLabels);
    if (missing.length > 0) {
      showValidationError(missing);
      return;
    }

    onSave({
      id: data?.id || crypto.randomUUID(),
      codigo: codigoGerado,
      codigoExterno: formData.codigoExterno,
      nome: formData.nome,
      unidadeNegocio: formData.unidadeNegocio,
      centroLucro: formData.centroLucro,
      classificacao: formData.classificacao,
      tipoConteudo: formData.tipoConteudo,
      descricao: formData.descricao,
      status: formData.status,
      conteudoId: formData.conteudoId,
      orcamento: parseFloat(formData.orcamento) || 0,
      programaId: formData.programaId,
      dataPrevista: dataPrevista ? format(dataPrevista, 'dd/MM/yyyy') : '',
      dataCadastro: data?.dataCadastro || new Date().toLocaleDateString('pt-BR'),
      usuarioCadastro: data?.usuarioCadastro || user?.nome || 'Admin',
    });
    onClose();
  };

  const currentLocale = localeMap[language] || ptBR;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[1400px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{data ? t('recordings.edit') : t('recordings.new')}</DialogTitle>
          <DialogDescription>
            {data ? t('recordings.edit') : t('recordings.new')}
          </DialogDescription>
        </DialogHeader>

        {data && (
          <DialogActionBar>
            <GravacaoReportGenerator gravacaoId={data.id} />
          </DialogActionBar>
        )}

        <Tabs defaultValue="dados" className="w-full">
          <TabsList className="flex w-full">
            <TabsTrigger value="dados" className="flex-1">{t('recordings.generalData')}</TabsTrigger>
            {isVisible('Produção', 'Gravação', '-', 'Tabulador "Roteiro"') && (
              <TabsTrigger value="roteiro" disabled={!data} className="flex-1">{t('script.title').split(' ')[0]}</TabsTrigger>
            )}
            {isVisible('Produção', 'Gravação', '-', 'Tabulador "Recursos"') && (
              <TabsTrigger value="recursos" disabled={!data} className="flex-1">{t('recordings.resources')}</TabsTrigger>
            )}
            {isVisible('Produção', 'Gravação', '-', 'Tabulador "Elenco"') && (
              <TabsTrigger value="elenco" disabled={!data} className="flex-1">{t('recordings.cast')}</TabsTrigger>
            )}
            {isVisible('Produção', 'Gravação', '-', 'Tabulador "Convidados"') && (
              <TabsTrigger value="convidados" disabled={!data} className="flex-1">{t('recordings.guests')}</TabsTrigger>
            )}
            {isVisible('Produção', 'Gravação', '-', 'Tabulador "Figurinos"') && (
              <TabsTrigger value="figurinos" disabled={!data} className="flex-1">{t('recordings.costumes')}</TabsTrigger>
            )}
            {isVisible('Produção', 'Gravação', '-', 'Tabulador "Terceiros"') && (
              <TabsTrigger value="terceiros" disabled={!data} className="flex-1">{t('recordings.thirdParties')}</TabsTrigger>
            )}
            {isVisible('Produção', 'Gravação', '-', 'Tabulador "Custos"') && (
              <TabsTrigger value="custos" disabled={!data} className="flex-1">{t('recordings.costs')}</TabsTrigger>
            )}
            <TabsTrigger value="tarefas" disabled={!data} className="flex-1">Tarefas</TabsTrigger>
            {isVisible('Produção', 'Gravação', '-', 'Tabulador "Incidências"') && (
              <TabsTrigger value="incidencias" disabled={!data} className="flex-1">{t('incident.pageTitle')}</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="dados">
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="codigo">{t('common.code')}</Label>
                  <Input
                    id="codigo"
                    value={codigoGerado}
                    readOnly
                    className="bg-muted font-mono font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="codigoExterno">{t('common.externalCode')} <FieldAsterisk type={getAsterisk('codigoExterno')} /></Label>
                  <Input
                    id="codigoExterno"
                    value={formData.codigoExterno}
                    onChange={(e) => setFormData({ ...formData, codigoExterno: e.target.value })}
                    maxLength={10}
                    placeholder={t('common.maxChars')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nome">{t('common.name')} <FieldAsterisk type={getAsterisk('nome')} /></Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    maxLength={100}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>{t('recordings.businessUnit')} <FieldAsterisk type={getAsterisk('unidadeNegocio')} /></Label>
                  <SearchableSelect
                    options={unidades.map(u => ({ value: u.nome, label: u.nome }))}
                    value={formData.unidadeNegocio}
                    onValueChange={(value) => setFormData({ ...formData, unidadeNegocio: value, centroLucro: '', programaId: '' })}
                    placeholder={t('common.select')}
                    searchPlaceholder="Pesquisar unidade..."
                    emptyMessage="Nenhuma unidade encontrada."
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('recordings.profitCenter')} <FieldAsterisk type={getAsterisk('centroLucro')} /></Label>
                  <SearchableSelect
                    options={centrosLucroHierarquicos.map(cl => ({ value: cl.nome, label: cl.nome, displayLabel: cl.displayName }))}
                    value={formData.centroLucro}
                    onValueChange={(value) => setFormData({ ...formData, centroLucro: value })}
                    disabled={!formData.unidadeNegocio}
                    placeholder={!formData.unidadeNegocio ? 'Selecione uma unidade de negócio primeiro' : t('common.select')}
                    searchPlaceholder="Pesquisar centro de lucro..."
                    emptyMessage="Nenhum centro de lucro encontrado."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Programa</Label>
                  <SearchableSelect
                    options={filteredProgramas.map(p => ({ value: p.id, label: p.nome }))}
                    value={formData.programaId}
                    onValueChange={(value) => setFormData({ ...formData, programaId: value })}
                    disabled={!formData.unidadeNegocio}
                    placeholder={!formData.unidadeNegocio ? 'Selecione uma unidade primeiro' : t('common.select')}
                    searchPlaceholder="Pesquisar programa..."
                    emptyMessage="Nenhum programa encontrado."
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('content.contentType')} <FieldAsterisk type={getAsterisk('tipoConteudo')} /></Label>
                  <SearchableSelect
                    options={tipos.map(tipo => ({ value: tipo.nome, label: tipo.nome }))}
                    value={formData.tipoConteudo}
                    onValueChange={(value) => setFormData({ ...formData, tipoConteudo: value })}
                    placeholder={t('common.select')}
                    searchPlaceholder="Pesquisar tipo..."
                    emptyMessage="Nenhum tipo encontrado."
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>{t('content.classification')} <FieldAsterisk type={getAsterisk('classificacao')} /></Label>
                  <SearchableSelect
                    options={classificacoes.map(c => ({ value: c.nome, label: c.nome }))}
                    value={formData.classificacao}
                    onValueChange={(value) => setFormData({ ...formData, classificacao: value })}
                    placeholder={t('common.select')}
                    searchPlaceholder="Pesquisar classificação..."
                    emptyMessage="Nenhuma classificação encontrada."
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('common.status')} <FieldAsterisk type={getAsterisk('status')} /></Label>
                  <SearchableSelect
                    options={statusList.map(s => ({ value: s.nome, label: s.nome }))}
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                    placeholder={t('common.select')}
                    searchPlaceholder="Pesquisar status..."
                    emptyMessage="Nenhum status encontrado."
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('content.title')} <FieldAsterisk type={getAsterisk('conteudoId')} /></Label>
                  <SearchableSelect
                    options={[
                      { value: '__none__', label: t('common.none') || 'Nenhum' },
                      ...conteudos.map(c => ({ value: c.id, label: c.descricao }))
                    ]}
                    value={formData.conteudoId || '__none__'}
                    onValueChange={(value) => setFormData({ ...formData, conteudoId: value === '__none__' ? '' : value })}
                    placeholder={t('common.select')}
                    searchPlaceholder="Pesquisar conteúdo..."
                    emptyMessage="Nenhum conteúdo encontrado."
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('recordings.expectedDate')} <FieldAsterisk type={getAsterisk('dataPrevista')} /></Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal h-8 text-xs",
                          !dataPrevista && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-3 w-3" />
                        {dataPrevista
                          ? format(dataPrevista, 'PPP', { locale: currentLocale })
                          : t('common.select')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-popover" align="start">
                      <Calendar
                        mode="single"
                        selected={dataPrevista}
                        onSelect={setDataPrevista}
                        locale={currentLocale}
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descricao">{t('common.description')} <FieldAsterisk type={getAsterisk('descricao')} /></Label>
                  <Textarea
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    rows={2}
                  />
                </div>
              </div>

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
          </TabsContent>

          {data && isVisible('Produção', 'Gravação', '-', 'Tabulador "Roteiro"') && (
            <TabsContent value="roteiro">
              <RoteiroTab gravacaoId={data.id} conteudoId={formData.conteudoId || undefined} />
            </TabsContent>
          )}

          {data && isVisible('Produção', 'Gravação', '-', 'Tabulador "Recursos"') && (
            <TabsContent value="recursos">
              <RecursosTab gravacaoId={data.id} />
            </TabsContent>
          )}

          {data && isVisible('Produção', 'Gravação', '-', 'Tabulador "Elenco"') && (
            <TabsContent value="elenco">
              <ElencoTab entityId={data.id} storagePrefix="gravacao" />
            </TabsContent>
          )}

          {data && isVisible('Produção', 'Gravação', '-', 'Tabulador "Convidados"') && (
            <TabsContent value="convidados">
              <ConvidadosTab gravacaoId={data.id} />
            </TabsContent>
          )}

          {data && isVisible('Produção', 'Gravação', '-', 'Tabulador "Figurinos"') && (
            <TabsContent value="figurinos">
              <FigurinosTab gravacaoId={data.id} />
            </TabsContent>
          )}

          {data && isVisible('Produção', 'Gravação', '-', 'Tabulador "Terceiros"') && (
            <TabsContent value="terceiros">
              <TerceirosTab gravacaoId={data.id} />
            </TabsContent>
          )}

          {data && isVisible('Produção', 'Gravação', '-', 'Tabulador "Custos"') && (
            <TabsContent value="custos">
              <CustosTab gravacaoId={data.id} />
            </TabsContent>
          )}

          {data && (
            <TabsContent value="tarefas">
              <GravacaoTarefasTab gravacaoId={data.id} />
            </TabsContent>
          )}

          {data && isVisible('Produção', 'Gravação', '-', 'Tabulador "Incidências"') && (
            <TabsContent value="incidencias">
              <GravacaoIncidenciasTab gravacaoId={data.id} />
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
});

GravacaoFormModal.displayName = 'GravacaoFormModal';
