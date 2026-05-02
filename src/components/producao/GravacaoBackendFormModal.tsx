import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SearchableSelect } from '@/components/shared/SearchableSelect';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePermissions } from '@/hooks/usePermissions';
import { conteudosRepository } from '@/modules/conteudos/conteudos.repository.provider';
import { ApiParametrizacoesRepository } from '@/modules/parametrizacoes/parametrizacoes.api.repository';
import type { Gravacao, GravacaoInput } from '@/modules/gravacoes/gravacoes.types';
import type { Conteudo } from '@/modules/conteudos/conteudos.types';
import { ModalNavigation, type ModalNavigationProps } from '@/components/shared/ModalNavigation';
import { GravacaoReportGenerator } from './GravacaoReportGenerator';
import { RecursosTab } from './RecursosTab';
import { GravacaoTarefasTab } from './GravacaoTarefasTab';
import { GravacaoIncidenciasTab } from './GravacaoIncidenciasTab';
import { TerceirosTab } from './TerceirosTab';
import { ElencoTab } from './ElencoTab';
import { ConvidadosTab } from './ConvidadosTab';
import FigurinosTab from './FigurinosTab';
import { RoteiroTab } from './RoteiroTab';
import { CustosTab } from './CustosTab';

interface GravacaoBackendFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: GravacaoInput) => Promise<void>;
  data?: Gravacao | null;
  readOnly?: boolean;
  navigation?: ModalNavigationProps;
}

const parametrizacoesRepository = new ApiParametrizacoesRepository();

function generateCodigoGravacao(): string {
  const currentYear = new Date().getFullYear();
  return `${currentYear}${Math.floor(Math.random() * 90000 + 10000)}`;
}

type CentroLucroOption = { id: string; nome: string; parentId: string | null; status: string };

function buildHierarchy(
  items: CentroLucroOption[],
  parentId: string | null = null,
  level = 0,
): { id: string; nome: string; displayName: string }[] {
  return items
    .filter((item) => item.parentId === parentId)
    .flatMap((child) => {
      const prefix = level > 0 ? `${'| '.repeat(level - 1)}|- ` : '';
      return [
        { id: child.id, nome: child.nome, displayName: `${prefix}${child.nome}` },
        ...buildHierarchy(items, child.id, level + 1),
      ];
    });
}

export const GravacaoBackendFormModal = ({
  isOpen,
  onClose,
  onSave,
  data,
  readOnly = false,
  navigation,
}: GravacaoBackendFormModalProps) => {
  const { t } = useLanguage();
  const { isVisible } = usePermissions();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<GravacaoInput>({
    codigo: '',
    codigoExterno: '',
    nome: '',
    unidadeNegocioId: '',
    centroLucro: '',
    classificacao: '',
    tipoConteudo: '',
    descricao: '',
    status: '',
    dataPrevista: '',
    conteudoId: '',
    orcamento: 0,
    programaId: '',
  });

  // Option lists
  const [unidades, setUnidades] = useState<{ id: string; nome: string }[]>([]);
  const [centrosLucro, setCentrosLucro] = useState<CentroLucroOption[]>([]);
  const [centroLucroUnidades, setCentroLucroUnidades] = useState<
    { centroLucroId: string; unidadeNegocioId: string }[]
  >([]);
  const [programas, setProgramas] = useState<
    { id: string; nome: string; unidadeNegocioId: string }[]
  >([]);
  const [tipos, setTipos] = useState<{ id: string; nome: string }[]>([]);
  const [classificacoes, setClassificacoes] = useState<{ id: string; nome: string }[]>([]);
  const [statusOptions, setStatusOptions] = useState<{ id: string; nome: string }[]>([]);
  const [conteudos, setConteudos] = useState<Conteudo[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    Promise.all([
      conteudosRepository.listOptions(),
      parametrizacoesRepository.listStatusGravacao(),
      conteudosRepository.list(),
    ])
      .then(([options, statusData, conteudosData]) => {
        setUnidades(options.unidades.map((u) => ({ id: u.id, nome: u.nome })));
        setCentrosLucro(options.centrosLucro);
        setCentroLucroUnidades(options.centroLucroUnidades);
        setTipos(options.tipos);
        setClassificacoes(options.classificacoes);
        setProgramas(
          options.programas.map((p) => ({
            id: p.id,
            nome: p.nome,
            unidadeNegocioId: p.unidadeNegocioId || '',
          })),
        );
        setStatusOptions(statusData.data);
        setConteudos(conteudosData);
      })
      .catch((err) => console.error('Error loading gravacao form options:', err));
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    if (data) {
      setFormData({
        id: data.id,
        codigo: data.codigo,
        codigoExterno: data.codigoExterno,
        nome: data.nome,
        unidadeNegocioId: data.unidadeNegocioId || '',
        centroLucro: data.centroLucro,
        classificacao: data.classificacao,
        tipoConteudo: data.tipoConteudo,
        descricao: data.descricao,
        status: data.status,
        dataPrevista: data.dataPrevista,
        conteudoId: data.conteudoId || '',
        orcamento: data.orcamento || 0,
        programaId: data.programaId || '',
      });
      return;
    }

    setFormData({
      codigo: generateCodigoGravacao(),
      codigoExterno: '',
      nome: '',
      unidadeNegocioId: '',
      centroLucro: '',
      classificacao: '',
      tipoConteudo: '',
      descricao: '',
      status: statusOptions.find((s) => s.nome === 'Planejada')?.nome ?? '',
      dataPrevista: '',
      conteudoId: '',
      orcamento: 0,
      programaId: '',
    });
  }, [data, isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredCentrosLucro = useMemo(() => {
    if (!formData.unidadeNegocioId) return centrosLucro;
    const allowed = new Set(
      centroLucroUnidades
        .filter((item) => item.unidadeNegocioId === formData.unidadeNegocioId)
        .map((item) => item.centroLucroId),
    );
    return centrosLucro.filter((item) => allowed.has(item.id));
  }, [centroLucroUnidades, centrosLucro, formData.unidadeNegocioId]);

  const hierarchicalCentros = useMemo(
    () => buildHierarchy(filteredCentrosLucro),
    [filteredCentrosLucro],
  );

  const filteredProgramas = useMemo(
    () =>
      formData.unidadeNegocioId
        ? programas.filter((p) => p.unidadeNegocioId === formData.unidadeNegocioId)
        : programas,
    [formData.unidadeNegocioId, programas],
  );

  const filteredConteudos = useMemo(
    () =>
      formData.unidadeNegocioId
        ? conteudos.filter((c) => c.unidadeNegocioId === formData.unidadeNegocioId)
        : conteudos,
    [conteudos, formData.unidadeNegocioId],
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch {
      // keep modal open on error
    } finally {
      setIsSaving(false);
    }
  };

  const visibleTabs: { value: string; label: string }[] = [
    { value: 'dadosGerais', label: 'Dados Gerais' },
  ];
  if (data) {
    if (isVisible('Produção', 'Gravação', '-', 'Tabulador "Espaços"'))
      visibleTabs.push({ value: 'espacos', label: 'Espaços' });
    if (isVisible('Produção', 'Gravação', '-', 'Tabulador "Recursos"'))
      visibleTabs.push({ value: 'recursos', label: 'Recursos' });
    if (isVisible('Produção', 'Gravação', '-', 'Tabulador "Tarefas"'))
      visibleTabs.push({ value: 'tarefas', label: 'Tarefas' });
    if (isVisible('Produção', 'Gravação', '-', 'Tabulador "Incidências de Gravação"'))
      visibleTabs.push({ value: 'incidencias', label: 'Incidências de Gravação' });
    if (isVisible('Produção', 'Gravação', '-', 'Tabulador "Terceiros"'))
      visibleTabs.push({ value: 'terceiros', label: 'Terceiros' });
    if (isVisible('Produção', 'Gravação', '-', 'Tabulador "Despesas"'))
      visibleTabs.push({ value: 'despesas', label: 'Despesas' });
    if (isVisible('Produção', 'Gravação', '-', 'Tabulador "Elenco"'))
      visibleTabs.push({ value: 'elenco', label: 'Elenco' });
    if (isVisible('Produção', 'Gravação', '-', 'Tabulador "Convidados"'))
      visibleTabs.push({ value: 'convidados', label: 'Convidados' });
    if (isVisible('Produção', 'Gravação', '-', 'Tabulador "Figurinos"'))
      visibleTabs.push({ value: 'figurinos', label: 'Figurinos' });
    if (isVisible('Produção', 'Gravação', '-', 'Tabulador "Roteiro"'))
      visibleTabs.push({ value: 'roteiro', label: 'Roteiro' });
    if (isVisible('Produção', 'Gravação', '-', 'Tabulador "Custos"'))
      visibleTabs.push({ value: 'custos', label: 'Custos' });
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[1400px] max-w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{data ? 'Editar Gravação' : 'Nova Gravação'}</DialogTitle>
            {data && <GravacaoReportGenerator gravacaoId={data.id} />}
          </div>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            void handleSubmit(e);
          }}
          className="space-y-4"
        >
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
              {/* Row 1: Código | Código Externo | Nome */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>{t('common.code')}</Label>
                  <Input value={formData.codigo} readOnly className="bg-muted font-mono" />
                </div>
                <div className="space-y-2">
                  <Label>{t('common.externalCode')}</Label>
                  <Input
                    value={formData.codigoExterno}
                    onChange={(e) => setFormData({ ...formData, codigoExterno: e.target.value })}
                    disabled={readOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('common.name')}</Label>
                  <Input
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    required
                    disabled={readOnly}
                  />
                </div>
              </div>

              {/* Row 2: Unidade | Centro de Custos | Programa | Tipo de Conteúdo */}
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Unidade de Negócio</Label>
                  <SearchableSelect
                    options={unidades.map((u) => ({ value: u.id, label: u.nome }))}
                    value={formData.unidadeNegocioId || ''}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        unidadeNegocioId: value,
                        programaId: '',
                        centroLucro: '',
                        conteudoId: '',
                      })
                    }
                    placeholder={t('common.select')}
                    searchPlaceholder="Pesquisar unidade..."
                    disabled={readOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Centro de Custos</Label>
                  <SearchableSelect
                    options={hierarchicalCentros.map((c) => ({
                      value: c.nome,
                      label: c.nome,
                      displayLabel: c.displayName,
                    }))}
                    value={formData.centroLucro || ''}
                    onValueChange={(value) => setFormData({ ...formData, centroLucro: value })}
                    placeholder={t('common.select')}
                    searchPlaceholder="Pesquisar centro de custos..."
                    disabled={readOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Programa</Label>
                  <SearchableSelect
                    options={filteredProgramas.map((p) => ({ value: p.id, label: p.nome }))}
                    value={formData.programaId || ''}
                    onValueChange={(value) => setFormData({ ...formData, programaId: value })}
                    placeholder={t('common.select')}
                    searchPlaceholder="Pesquisar programa..."
                    disabled={readOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Conteúdo</Label>
                  <SearchableSelect
                    options={tipos.map((tp) => ({ value: tp.nome, label: tp.nome }))}
                    value={formData.tipoConteudo || ''}
                    onValueChange={(value) => setFormData({ ...formData, tipoConteudo: value })}
                    placeholder={t('common.select')}
                    searchPlaceholder="Pesquisar tipo..."
                    disabled={readOnly}
                  />
                </div>
              </div>

              {/* Row 3: Classificação | Status | Conteúdo | Data Prevista */}
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Classificação</Label>
                  <SearchableSelect
                    options={classificacoes.map((c) => ({ value: c.nome, label: c.nome }))}
                    value={formData.classificacao || ''}
                    onValueChange={(value) => setFormData({ ...formData, classificacao: value })}
                    placeholder={t('common.select')}
                    searchPlaceholder="Pesquisar classificação..."
                    disabled={readOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <SearchableSelect
                    options={statusOptions.map((s) => ({ value: s.nome, label: s.nome }))}
                    value={formData.status || ''}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                    placeholder={t('common.select')}
                    searchPlaceholder="Pesquisar status..."
                    disabled={readOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Conteúdo</Label>
                  <SearchableSelect
                    options={filteredConteudos.map((c) => ({ value: c.id, label: c.descricao }))}
                    value={formData.conteudoId || ''}
                    onValueChange={(value) => setFormData({ ...formData, conteudoId: value })}
                    placeholder={t('common.select')}
                    searchPlaceholder="Pesquisar conteúdo..."
                    disabled={readOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('recordings.expectedDate')}</Label>
                  <Input
                    type="date"
                    value={formData.dataPrevista}
                    onChange={(e) => setFormData({ ...formData, dataPrevista: e.target.value })}
                    disabled={readOnly}
                  />
                </div>
              </div>

              {/* Row 4: Orçamento | Descrição */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('field.budget') || 'Orçamento'}</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.orcamento || 0}
                    onChange={(e) =>
                      setFormData({ ...formData, orcamento: Number(e.target.value) })
                    }
                    disabled={readOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('common.description')}</Label>
                  <Textarea
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    rows={3}
                    disabled={readOnly}
                  />
                </div>
              </div>

              {/* Row 5 (read-only, only when editing): Data de Cadastro */}
              {data && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Usuário de Cadastro</Label>
                    <Input value="" disabled className="bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <Label>Data de Cadastro</Label>
                    <Input
                      value={
                        data.dataCadastro
                          ? new Date(data.dataCadastro).toLocaleDateString('pt-BR')
                          : ''
                      }
                      disabled
                      className="bg-muted"
                    />
                  </div>
                </div>
              )}
            </TabsContent>

            {data && isVisible('Produção', 'Gravação', '-', 'Tabulador "Espaços"') && (
              <TabsContent value="espacos" className="mt-4">
                <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                  Módulo de Espaços em desenvolvimento.
                </div>
              </TabsContent>
            )}

            {data && isVisible('Produção', 'Gravação', '-', 'Tabulador "Recursos"') && (
              <TabsContent value="recursos" className="mt-4">
                <RecursosTab gravacaoId={data.id} />
              </TabsContent>
            )}

            {data && isVisible('Produção', 'Gravação', '-', 'Tabulador "Tarefas"') && (
              <TabsContent value="tarefas" className="mt-4">
                <GravacaoTarefasTab gravacaoId={data.id} />
              </TabsContent>
            )}

            {data &&
              isVisible('Produção', 'Gravação', '-', 'Tabulador "Incidências de Gravação"') && (
                <TabsContent value="incidencias" className="mt-4">
                  <GravacaoIncidenciasTab gravacaoId={data.id} />
                </TabsContent>
              )}

            {data && isVisible('Produção', 'Gravação', '-', 'Tabulador "Terceiros"') && (
              <TabsContent value="terceiros" className="mt-4">
                <TerceirosTab gravacaoId={data.id} />
              </TabsContent>
            )}

            {data && isVisible('Produção', 'Gravação', '-', 'Tabulador "Despesas"') && (
              <TabsContent value="despesas" className="mt-4">
                <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                  Módulo de Despesas em desenvolvimento.
                </div>
              </TabsContent>
            )}

            {data && isVisible('Produção', 'Gravação', '-', 'Tabulador "Elenco"') && (
              <TabsContent value="elenco" className="mt-4">
                <ElencoTab entityId={data.id} storagePrefix="gravacao" />
              </TabsContent>
            )}

            {data && isVisible('Produção', 'Gravação', '-', 'Tabulador "Convidados"') && (
              <TabsContent value="convidados" className="mt-4">
                <ConvidadosTab gravacaoId={data.id} />
              </TabsContent>
            )}

            {data && isVisible('Produção', 'Gravação', '-', 'Tabulador "Figurinos"') && (
              <TabsContent value="figurinos" className="mt-4">
                <FigurinosTab gravacaoId={data.id} />
              </TabsContent>
            )}

            {data && isVisible('Produção', 'Gravação', '-', 'Tabulador "Roteiro"') && (
              <TabsContent value="roteiro" className="mt-4">
                <RoteiroTab gravacaoId={data.id} conteudoId={data.conteudoId ?? undefined} />
              </TabsContent>
            )}

            {data && isVisible('Produção', 'Gravação', '-', 'Tabulador "Custos"') && (
              <TabsContent value="custos" className="mt-4">
                <CustosTab gravacaoId={data.id} />
              </TabsContent>
            )}
          </Tabs>

          <DialogFooter className={navigation ? 'sm:justify-between' : undefined}>
            {navigation && <ModalNavigation {...navigation} />}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
                {readOnly ? 'Fechar' : t('common.cancel')}
              </Button>
              {!readOnly && (
                <Button
                  type="submit"
                  className="gradient-primary hover:opacity-90"
                  disabled={isSaving}
                >
                  {isSaving ? 'Salvando...' : t('common.save')}
                </Button>
              )}
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
