import { useEffect, useState } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SearchableSelect } from '@/components/shared/SearchableSelect';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePermissions } from '@/hooks/usePermissions';
import { programasRepository } from '@/modules/programas/programas.repository.provider';
import { unidadesRepository } from '@/modules/unidades/unidades.repository.provider';
import type { Gravacao, GravacaoInput } from '@/modules/gravacoes/gravacoes.types';
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

function generateCodigoGravacao(): string {
  const currentYear = new Date().getFullYear();
  return `${currentYear}${Math.floor(Math.random() * 90000 + 10000)}`;
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
  const [unidades, setUnidades] = useState<{ id: string; nome: string }[]>([]);
  const [programas, setProgramas] = useState<
    { id: string; nome: string; unidadeNegocioId: string }[]
  >([]);

  useEffect(() => {
    if (!isOpen) return;

    Promise.all([unidadesRepository.list(''), programasRepository.list()])
      .then(([unidadesData, programasData]) => {
        setUnidades(unidadesData.map((item) => ({ id: item.id, nome: item.nome })));
        setProgramas(
          programasData.map((item) => ({
            id: item.id,
            nome: item.nome,
            unidadeNegocioId: item.unidadeNegocioId || '',
          })),
        );
      })
      .catch((error) => {
        console.error('Error loading gravacao backend form options:', error);
        setUnidades([]);
        setProgramas([]);
      });
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
      status: 'Planejada',
      dataPrevista: '',
      conteudoId: '',
      orcamento: 0,
      programaId: '',
    });
  }, [data, isOpen]);

  const filteredProgramas = programas.filter(
    (programa) =>
      !formData.unidadeNegocioId || programa.unidadeNegocioId === formData.unidadeNegocioId,
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      await onSave(formData);
      onClose();
    } catch {
      // Keep the modal open so the user can adjust the form after a save failure.
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
            <div>
              <DialogTitle>{data ? 'Editar Gravação' : 'Nova Gravação'}</DialogTitle>
              <DialogDescription>
                Fluxo de gravações operando pelo backend próprio.
              </DialogDescription>
            </div>
            {data && <GravacaoReportGenerator gravacaoId={data.id} />}
          </div>
        </DialogHeader>

        <form
          onSubmit={(event) => {
            void handleSubmit(event);
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
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="codigo">{t('common.code')}</Label>
                  <Input
                    id="codigo"
                    value={formData.codigo}
                    readOnly
                    className="bg-muted font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="codigoExterno">{t('common.externalCode')}</Label>
                  <Input
                    id="codigoExterno"
                    value={formData.codigoExterno}
                    onChange={(e) => setFormData({ ...formData, codigoExterno: e.target.value })}
                    disabled={readOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nome">{t('common.name')}</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    required
                    disabled={readOnly}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Unidade de Negócio</Label>
                  <SearchableSelect
                    options={unidades.map((item) => ({ value: item.id, label: item.nome }))}
                    value={formData.unidadeNegocioId || ''}
                    onValueChange={(value) =>
                      setFormData({ ...formData, unidadeNegocioId: value, programaId: '' })
                    }
                    placeholder={t('common.select')}
                    searchPlaceholder="Pesquisar unidade..."
                    emptyMessage="Nenhuma unidade encontrada."
                    disabled={readOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Programa</Label>
                  <SearchableSelect
                    options={filteredProgramas.map((item) => ({
                      value: item.id,
                      label: item.nome,
                    }))}
                    value={formData.programaId || ''}
                    onValueChange={(value) => setFormData({ ...formData, programaId: value })}
                    placeholder={t('common.select')}
                    searchPlaceholder="Pesquisar programa..."
                    emptyMessage="Nenhum programa encontrado."
                    disabled={readOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dataPrevista">{t('recordings.expectedDate')}</Label>
                  <Input
                    id="dataPrevista"
                    type="date"
                    value={formData.dataPrevista}
                    onChange={(e) => setFormData({ ...formData, dataPrevista: e.target.value })}
                    disabled={readOnly}
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="centroLucro">Centro de Custos</Label>
                  <Input
                    id="centroLucro"
                    value={formData.centroLucro}
                    onChange={(e) => setFormData({ ...formData, centroLucro: e.target.value })}
                    disabled={readOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="classificacao">Classificação</Label>
                  <Input
                    id="classificacao"
                    value={formData.classificacao}
                    onChange={(e) => setFormData({ ...formData, classificacao: e.target.value })}
                    disabled={readOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipoConteudo">Tipo de Conteúdo</Label>
                  <Input
                    id="tipoConteudo"
                    value={formData.tipoConteudo}
                    onChange={(e) => setFormData({ ...formData, tipoConteudo: e.target.value })}
                    disabled={readOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Input
                    id="status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    disabled={readOnly}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="orcamento">{t('field.budget') || 'Orçamento'}</Label>
                  <Input
                    id="orcamento"
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
                  <Label htmlFor="conteudoId">Conteúdo Id</Label>
                  <Input
                    id="conteudoId"
                    value={formData.conteudoId || ''}
                    onChange={(e) => setFormData({ ...formData, conteudoId: e.target.value })}
                    disabled={readOnly}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">{t('common.description')}</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  rows={3}
                  disabled={readOnly}
                />
              </div>
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
