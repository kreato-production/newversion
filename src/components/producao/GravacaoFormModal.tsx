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
  });

  const [unidades, setUnidades] = useState<{ id: string; nome: string; moeda?: string | null }[]>([]);
  const [centrosLucro, setCentrosLucro] = useState<{ id: string; nome: string; parentId: string | null; status: string; codigoExterno?: string }[]>([]);
  const [centroLucroUnidades, setCentroLucroUnidades] = useState<{ centro_lucro_id: string; unidade_negocio_id: string }[]>([]);
  const [classificacoes, setClassificacoes] = useState<{ id: string; nome: string }[]>([]);
  const [tipos, setTipos] = useState<{ id: string; nome: string }[]>([]);
  const [statusList, setStatusList] = useState<{ id: string; nome: string }[]>([]);
  const [conteudos, setConteudos] = useState<{ id: string; descricao: string }[]>([]);

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

  // Filtrar centros de lucro pela unidade de negócio selecionada
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
      const [unidadesRes, centrosRes, centroLucroUnidadesRes, classificacoesRes, tiposRes, statusRes, conteudosRes] = await Promise.all([
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
    } catch (err) {
      console.error('Error fetching dropdown data:', err);
    }
  }, [session]);

  useEffect(() => {
    if (isOpen) {
      fetchDropdownData();
    }
  }, [isOpen, fetchDropdownData]);

  // Guarda o status inicial do data para garantir persistência
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
      });
      // Converter string de data para Date (suporta ISO yyyy-MM-dd e BR dd/MM/yyyy)
      if (data.dataPrevista) {
        try {
          let parsedDate: Date | undefined;
          
          // Check if it's ISO format (yyyy-MM-dd)
          if (/^\d{4}-\d{2}-\d{2}/.test(data.dataPrevista)) {
            parsedDate = new Date(data.dataPrevista);
          } else if (/^\d{2}\/\d{2}\/\d{4}/.test(data.dataPrevista)) {
            // Brazilian format dd/MM/yyyy
            parsedDate = parse(data.dataPrevista, 'dd/MM/yyyy', new Date());
          }
          
          // Validate the parsed date
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
      // Gerar novo código para nova gravação
      const novoCodigo = generateCodigoGravacao();
      setCodigoGerado(novoCodigo);
      
      // Find initial status (is_inicial = true)
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
      });
      setDataPrevista(undefined);
    }
  }, [data, isOpen]);

  // Auto-assign initial status for new recordings once statusList is loaded
  useEffect(() => {
    if (!isOpen || data || statusList.length === 0) return;
    // Only set if status is still empty (not yet assigned)
    setFormData(prev => {
      if (prev.status) return prev;
      const inicialStatus = statusList.find((s: any) => s.is_inicial === true);
      if (inicialStatus) {
        return { ...prev, status: inicialStatus.nome };
      }
      return prev;
    });
  }, [isOpen, data, statusList]);

  // Garante que o status atual esteja na lista para o Select renderizar corretamente
  useEffect(() => {
    if (!isOpen || !incomingStatus) return;
    
    setStatusList((prev) => {
      if (prev.some((s) => s.nome === incomingStatus)) return prev;
      // Adiciona temporariamente o status para o Select conseguir exibir
      return [{ id: '__temp__', nome: incomingStatus }, ...prev];
    });
  }, [isOpen, incomingStatus]);

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

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>{t('recordings.businessUnit')} <FieldAsterisk type={getAsterisk('unidadeNegocio')} /></Label>
                  <Select
                    value={formData.unidadeNegocio}
                    onValueChange={(value) => setFormData({ ...formData, unidadeNegocio: value, centroLucro: '' })}
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
                      <SelectValue placeholder={!formData.unidadeNegocio ? 'Selecione uma unidade de negócio primeiro' : t('common.select')} />
                    </SelectTrigger>
                    <SelectContent>
                      {centrosLucroHierarquicos.length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          Nenhum centro de lucro associado a esta unidade
                        </div>
                      ) : (
                        centrosLucroHierarquicos.map((cl) => (
                          <SelectItem key={cl.id} value={cl.nome}>
                            <span className="font-mono whitespace-pre">{cl.displayName}</span>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
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
                      {tipos.map((tipo) => (
                        <SelectItem key={tipo.id} value={tipo.nome}>{tipo.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
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
                  <Label>{t('common.status')} <FieldAsterisk type={getAsterisk('status')} /></Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('common.select')} />
                    </SelectTrigger>
                    <SelectContent>
                      {statusList.map((s) => (
                        <SelectItem key={s.id} value={s.nome}>{s.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('content.title')} <FieldAsterisk type={getAsterisk('conteudoId')} /></Label>
                  <Select
                    value={formData.conteudoId || "__none__"}
                    onValueChange={(value) => setFormData({ ...formData, conteudoId: value === "__none__" ? "" : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('common.select')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">{t('common.none')}</SelectItem>
                      {conteudos.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.descricao}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('recordings.expectedDate')} <FieldAsterisk type={getAsterisk('dataPrevista')} /></Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dataPrevista && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dataPrevista ? format(dataPrevista, "dd/MM/yyyy") : t('common.select')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dataPrevista}
                        onSelect={setDataPrevista}
                        initialFocus
                        locale={currentLocale}
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="descricao">{t('common.description')} <FieldAsterisk type={getAsterisk('descricao')} /></Label>
                  <Textarea
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    rows={3}
                    placeholder={t('common.description') + '...'}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orcamento">
                    Orçamento {selectedCurrency && `(${getCurrencyByCode(selectedCurrency)?.symbol || selectedCurrency})`} <FieldAsterisk type={getAsterisk('orcamento')} />
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

          {isVisible('Produção', 'Gravação', '-', 'Tabulador "Roteiro"') && (
            <TabsContent value="roteiro">
              {data && <RoteiroTab gravacaoId={data.id} />}
            </TabsContent>
          )}

          {isVisible('Produção', 'Gravação', '-', 'Tabulador "Recursos"') && (
            <TabsContent value="recursos">
              {data && <RecursosTab gravacaoId={data.id} />}
            </TabsContent>
          )}

          {isVisible('Produção', 'Gravação', '-', 'Tabulador "Elenco"') && (
            <TabsContent value="elenco">
              {data && <ElencoTab entityId={data.id} storagePrefix="gravacao" />}
            </TabsContent>
          )}

          {isVisible('Produção', 'Gravação', '-', 'Tabulador "Convidados"') && (
            <TabsContent value="convidados">
              {data && <ConvidadosTab gravacaoId={data.id} />}
            </TabsContent>
          )}

          {isVisible('Produção', 'Gravação', '-', 'Tabulador "Figurinos"') && (
            <TabsContent value="figurinos">
              {data && <FigurinosTab gravacaoId={data.id} />}
            </TabsContent>
          )}

          {isVisible('Produção', 'Gravação', '-', 'Tabulador "Terceiros"') && (
            <TabsContent value="terceiros">
              {data && <TerceirosTab gravacaoId={data.id} />}
            </TabsContent>
          )}

          {isVisible('Produção', 'Gravação', '-', 'Tabulador "Custos"') && (
            <TabsContent value="custos">
              {data && <CustosTab gravacaoId={data.id} />}
            </TabsContent>
          )}

          <TabsContent value="tarefas">
            {data && <GravacaoTarefasTab gravacaoId={data.id} />}
          </TabsContent>

          {isVisible('Produção', 'Gravação', '-', 'Tabulador "Incidências"') && (
            <TabsContent value="incidencias">
              {data && <GravacaoIncidenciasTab gravacaoId={data.id} />}
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
});

GravacaoFormModal.displayName = 'GravacaoFormModal';