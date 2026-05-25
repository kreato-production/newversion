'use client';

import { useCallback, useEffect, useState } from 'react';
import { BookOpen, Loader2, PenLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { GravacaoBackendFormModal } from './GravacaoBackendFormModal';
import { ApiGravacoesRepository } from '@/modules/gravacoes/gravacoes.api.repository';
import { ApiProgramasRepository } from '@/modules/programas/programas.api.repository';
import { ApiParametrizacoesRepository } from '@/modules/parametrizacoes/parametrizacoes.api.repository';
import { ApiGrelhaProgramacaoRepository } from '@/modules/producao/grelha-programacao.api';
import { templatesRepository, type Template } from '@/modules/templates/templates.api';
import type { GravacaoInput } from '@/modules/gravacoes/gravacoes.types';
import type { GrelhaProgramaItem } from '@/modules/producao/grelha-programacao.api';

type Step = 'choice' | 'template-select';

const gravacoesRepo = new ApiGravacoesRepository();
const programasRepo = new ApiProgramasRepository();
const parametrizacoesRepo = new ApiParametrizacoesRepository();
const grelhaRepo = new ApiGrelhaProgramacaoRepository();

interface Props {
  item: GrelhaProgramaItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function GrelhaPlanearModal({ item, onClose, onSuccess }: Props) {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>('choice');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [initialValues, setInitialValues] = useState<Partial<GravacaoInput>>({});
  const [showGravacaoForm, setShowGravacaoForm] = useState(false);

  const isOpen = !!item;

  useEffect(() => {
    if (!isOpen) {
      setStep('choice');
      setInitialValues({});
      setTemplates([]);
      setShowGravacaoForm(false);
    }
  }, [isOpen]);

  const resolveInitialValues = useCallback(async (): Promise<Partial<GravacaoInput>> => {
    if (!item) return {};

    const programaNome = item.programa ?? item.nome ?? '';
    const nome = item.episodio ? `${programaNome} - Ep. ${item.episodio}` : programaNome;
    let programaId: string | undefined;
    let statusNome: string | undefined;

    const [programas, statusData] = await Promise.all([
      programasRepo.list(),
      parametrizacoesRepo.listStatusGravacao(),
    ]);

    const statusInicial = statusData.data.find((s) => s.isInicial);
    if (statusInicial) statusNome = statusInicial.nome;

    if (programaNome) {
      const found = programas.find((p) => p.nome.toLowerCase() === programaNome.toLowerCase());
      if (found) {
        programaId = found.id;
      } else {
        await programasRepo.save({ codigoExterno: '', nome: programaNome, descricao: '' });
        const updated = await programasRepo.list();
        const created = updated.find((p) => p.nome.toLowerCase() === programaNome.toLowerCase());
        programaId = created?.id;
      }
    }

    const descricaoLines: string[] = [
      item.canal && `Canal: ${item.canal}`,
      item.serie && `Série: ${item.serie}`,
      item.idPrograma && `ID Programa: ${item.idPrograma}`,
      item.programa && `Programa: ${item.programa}`,
      item.tipoRequisicao && `Tipo de Requisição: ${item.tipoRequisicao}`,
      item.genero && `Género: ${item.genero}`,
      item.codigoProducao && `Código de Produção: ${item.codigoProducao}`,
      item.tipoAquisicao && `Tipo de Aquisição: ${item.tipoAquisicao}`,
      item.tipoPrograma && `Tipo de Programa: ${item.tipoPrograma}`,
      item.categoria && `Categoria: ${item.categoria}`,
      item.semana && `Semana: ${item.semana}`,
      item.tipoExibicao && `Tipo de Exibição: ${item.tipoExibicao}`,
      item.episodio && `Episódio: ${item.episodio}`,
      item.dataExibicao && `Data de Exibição: ${item.dataExibicao}`,
      item.horarioInicio && `Horário de Início: ${item.horarioInicio}`,
      item.duracao && `Duração: ${item.duracao}`,
      item.statusGrelha && `Status Grelha: ${item.statusGrelha}`,
    ].filter(Boolean) as string[];

    return {
      nome,
      descricao: descricaoLines.join('\n'),
      dataPrevista: item.dataExibicao ?? '',
      programaId,
      status: statusNome,
    };
  }, [item]);

  const handleManual = async () => {
    setResolving(true);
    try {
      const values = await resolveInitialValues();
      setInitialValues(values);
      setShowGravacaoForm(true);
    } catch {
      toast({ title: 'Erro', description: 'Erro ao preparar planeamento', variant: 'destructive' });
    } finally {
      setResolving(false);
    }
  };

  const handleOpenTemplate = async () => {
    setLoadingTemplates(true);
    try {
      const data = await templatesRepository.list();
      setTemplates(data);
      setStep('template-select');
    } catch {
      toast({ title: 'Erro', description: 'Erro ao carregar templates', variant: 'destructive' });
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleSelectTemplate = async (_template: Template) => {
    setResolving(true);
    try {
      const values = await resolveInitialValues();
      setInitialValues(values);
      setStep('choice');
      setShowGravacaoForm(true);
    } catch {
      toast({ title: 'Erro', description: 'Erro ao preparar planeamento', variant: 'destructive' });
    } finally {
      setResolving(false);
    }
  };

  const handleSave = async (data: GravacaoInput) => {
    const gravacao = await gravacoesRepo.save(data);
    if (item?.id && gravacao?.id) {
      await grelhaRepo.linkGravacao(item.id, gravacao.id);
    }
    toast({ title: 'Gravação criada', description: 'Planeamento criado com sucesso.' });
    setShowGravacaoForm(false);
    onSuccess();
    onClose();
  };

  if (!item) return null;

  return (
    <>
      <Dialog
        open={isOpen && !showGravacaoForm}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
      >
        <DialogContent className="max-w-md">
          {step === 'choice' && (
            <>
              <DialogHeader>
                <DialogTitle>Planear Gravação</DialogTitle>
                <DialogDescription>
                  Como deseja criar o planeamento para <strong>{item.nome}</strong>?
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  disabled={resolving}
                  onClick={() => void handleManual()}
                  className="flex flex-col items-center gap-3 rounded-lg border p-5 hover:border-primary hover:bg-primary/5 transition-colors disabled:opacity-50 text-center"
                >
                  {resolving ? (
                    <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
                  ) : (
                    <PenLine className="h-7 w-7 text-primary" />
                  )}
                  <div>
                    <p className="font-semibold text-sm">Manual</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Preencher o formulário de gravação directamente
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  disabled={loadingTemplates || resolving}
                  onClick={() => void handleOpenTemplate()}
                  className="flex flex-col items-center gap-3 rounded-lg border p-5 hover:border-primary hover:bg-primary/5 transition-colors disabled:opacity-50 text-center"
                >
                  {loadingTemplates ? (
                    <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
                  ) : (
                    <BookOpen className="h-7 w-7 text-primary" />
                  )}
                  <div>
                    <p className="font-semibold text-sm">Template</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Utilizar um template existente como base
                    </p>
                  </div>
                </button>
              </div>
            </>
          )}

          {step === 'template-select' && (
            <>
              <DialogHeader>
                <DialogTitle>Selecionar Template</DialogTitle>
                <DialogDescription>
                  Escolha o template a utilizar como base para a gravação.
                </DialogDescription>
              </DialogHeader>

              <div className="max-h-72 overflow-y-auto space-y-1.5 py-1">
                {templates.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    Nenhum template encontrado.
                  </p>
                ) : (
                  templates.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      disabled={resolving}
                      onClick={() => void handleSelectTemplate(t)}
                      className="w-full flex items-start gap-3 rounded-md border px-3 py-2.5 text-left hover:border-primary hover:bg-primary/5 transition-colors disabled:opacity-50"
                    >
                      <BookOpen className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{t.nome}</p>
                        {t.descricao && (
                          <p className="text-xs text-muted-foreground truncate">{t.descricao}</p>
                        )}
                        <p className="text-xs text-muted-foreground">{t.etapas.length} etapa(s)</p>
                      </div>
                    </button>
                  ))
                )}
              </div>

              {resolving && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />A preparar dados...
                </div>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => setStep('choice')}
              >
                Voltar
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>

      <GravacaoBackendFormModal
        isOpen={showGravacaoForm}
        onClose={() => {
          setShowGravacaoForm(false);
          onClose();
        }}
        onSave={handleSave}
        initialValues={initialValues}
      />
    </>
  );
}
