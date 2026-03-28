import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronUp,
  FileDown,
  GripVertical,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import jsPDF from 'jspdf';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RichTextEditor } from '@/components/shared/RichTextEditor';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { roteiroApi } from '@/modules/roteiro/roteiro.api';

interface Cena {
  id: string;
  ordem: number;
  capitulo: string;
  numeroCena: string;
  ambiente: string;
  tipoAmbiente: 'Externo' | 'Interno' | '';
  periodo: string;
  localGravacao: string;
  personagens: string[];
  figurantes: string[];
  tempoAproximado: string;
  ritmo: string;
  descricao: string;
}

interface Pessoa {
  id: string;
  nome: string;
  sobrenome?: string;
  nomeTrabalho?: string;
  status?: string;
}

interface ElencoMembro {
  id: string;
  pessoaId: string;
  nome: string;
  nomeTrabalho?: string;
  personagem: string;
}

interface RoteiroTabProps {
  gravacaoId: string;
  conteudoId?: string;
}

export const RoteiroTab = ({ gravacaoId, conteudoId }: RoteiroTabProps) => {
  const { t } = useLanguage();
  const [cenas, setCenas] = useState<Cena[]>([]);
  const [elenco, setElenco] = useState<ElencoMembro[]>([]);
  const [figurantes, setFigurantes] = useState<Pessoa[]>([]);
  const [expandedCenas, setExpandedCenas] = useState<Set<string>>(new Set());
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [personagensPopoverOpen, setPersonagensPopoverOpen] = useState<Record<string, boolean>>({});
  const [figurantesPopoverOpen, setFigurantesPopoverOpen] = useState<Record<string, boolean>>({});

  const PERIODOS = useMemo(
    () => [
      { value: 'Dia', label: t('script.day') },
      { value: 'Noite', label: t('script.night') },
      { value: 'Manha', label: t('script.morning') },
      { value: 'Tarde', label: t('script.afternoon') },
      { value: 'Madrugada', label: t('script.dawn') },
    ],
    [t],
  );

  const RITMOS = useMemo(
    () => [
      { value: 'Dramatico', label: t('script.dramatic') },
      { value: 'Cena Rapida', label: t('script.fastScene') },
      { value: 'Contemplativa', label: t('script.contemplative') },
    ],
    [t],
  );

  const TIPOS_AMBIENTE = useMemo(
    () => [
      { value: 'Externo', label: t('script.external') },
      { value: 'Interno', label: t('script.internal') },
    ],
    [t],
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await roteiroApi.list(gravacaoId, conteudoId);

      setCenas(
        data.cenas.map((cena) => ({
          id: cena.id,
          ordem: cena.ordem,
          capitulo: cena.capitulo || '',
          numeroCena: cena.numeroCena || '',
          ambiente: cena.ambiente || '',
          tipoAmbiente: (cena.tipoAmbiente as 'Externo' | 'Interno' | '') || '',
          periodo: cena.periodo || '',
          localGravacao: cena.localGravacao || '',
          personagens: cena.personagens || [],
          figurantes: cena.figurantes || [],
          tempoAproximado: cena.tempoAproximado || '',
          ritmo: cena.ritmo || '',
          descricao: cena.descricao || '',
        })),
      );

      setElenco(
        data.elenco.map((item) => ({
          id: item.id,
          pessoaId: item.pessoaId,
          nome: item.nome,
          nomeTrabalho: item.nomeTrabalho || undefined,
          personagem: item.personagem || '',
        })),
      );

      setFigurantes(
        data.figurantes.map((item) => ({
          id: item.id,
          nome: item.nome,
          sobrenome: item.sobrenome,
          nomeTrabalho: item.nomeTrabalho || undefined,
          status: item.status || undefined,
        })),
      );
    } catch (error) {
      console.error('Erro ao carregar dados do roteiro:', error);
      toast.error('Erro ao carregar roteiro');
    } finally {
      setLoading(false);
    }
  }, [conteudoId, gravacaoId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const persistCena = useCallback(
    async (cena: Cena, isNew = false) => {
      const saved = await roteiroApi.saveCena(gravacaoId, {
        id: isNew ? '' : cena.id,
        ordem: cena.ordem,
        capitulo: cena.capitulo,
        numeroCena: cena.numeroCena,
        ambiente: cena.ambiente,
        tipoAmbiente: cena.tipoAmbiente,
        periodo: cena.periodo,
        localGravacao: cena.localGravacao,
        personagens: cena.personagens,
        figurantes: cena.figurantes,
        tempoAproximado: cena.tempoAproximado,
        ritmo: cena.ritmo,
        descricao: cena.descricao,
      });

      if (isNew && saved.id !== cena.id) {
        setCenas((current) =>
          current.map((item) => (item.id === cena.id ? { ...item, id: saved.id } : item)),
        );
      }
    },
    [gravacaoId],
  );

  const syncOrder = useCallback(
    async (items: Cena[]) => {
      for (const cena of items) {
        await persistCena(cena);
      }
    },
    [persistCena],
  );

  const handleAddCena = async () => {
    const novaCena: Cena = {
      id: crypto.randomUUID(),
      ordem: cenas.length + 1,
      capitulo: '',
      numeroCena: '',
      ambiente: '',
      tipoAmbiente: '',
      periodo: '',
      localGravacao: '',
      personagens: [],
      figurantes: [],
      tempoAproximado: '',
      ritmo: '',
      descricao: '',
    };

    setCenas((current) => [...current, novaCena]);
    setExpandedCenas((current) => new Set([...current, novaCena.id]));

    try {
      await persistCena(novaCena, true);
      toast.success(t('script.sceneAdded'));
    } catch (error) {
      console.error('Erro ao adicionar cena:', error);
      toast.error('Erro ao adicionar cena');
      setCenas((current) => current.filter((item) => item.id !== novaCena.id));
    }
  };

  const handleRemoveCena = async (id: string) => {
    const newCenas = cenas
      .filter((cena) => cena.id !== id)
      .map((cena, index) => ({ ...cena, ordem: index + 1 }));

    setCenas(newCenas);

    try {
      await roteiroApi.removeCena(gravacaoId, id);
      await syncOrder(newCenas);
      toast.success(t('script.sceneRemoved'));
    } catch (error) {
      console.error('Erro ao remover cena:', error);
      toast.error('Erro ao remover cena');
      void loadData();
    }
  };

  const handleUpdateCena = async (id: string, field: keyof Cena, value: string | string[]) => {
    const newCenas = cenas.map((cena) => (cena.id === id ? { ...cena, [field]: value } : cena));
    setCenas(newCenas);

    const updatedCena = newCenas.find((cena) => cena.id === id);
    if (!updatedCena) {
      return;
    }

    try {
      await persistCena(updatedCena);
    } catch (error) {
      console.error('Erro ao salvar cena:', error);
      toast.error('Erro ao salvar cena');
    }
  };

  const toggleExpanded = (id: string) => {
    setExpandedCenas((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = async (event: React.DragEvent, index: number) => {
    event.preventDefault();
    if (draggedIndex === null || draggedIndex === index) {
      return;
    }

    const reordered = [...cenas];
    const [draggedItem] = reordered.splice(draggedIndex, 1);
    reordered.splice(index, 0, draggedItem);

    const ordered = reordered.map((cena, itemIndex) => ({ ...cena, ordem: itemIndex + 1 }));
    setCenas(ordered);
    setDraggedIndex(index);

    try {
      await syncOrder(ordered);
    } catch (error) {
      console.error('Erro ao reordenar cenas:', error);
      toast.error('Erro ao reordenar cenas');
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handlePersonagemToggle = (cenaId: string, elencoId: string) => {
    const cena = cenas.find((item) => item.id === cenaId);
    if (!cena) {
      return;
    }

    const personagens = cena.personagens.includes(elencoId)
      ? cena.personagens.filter((id) => id !== elencoId)
      : [...cena.personagens, elencoId];

    void handleUpdateCena(cenaId, 'personagens', personagens);
  };

  const handleFiguranteToggle = (cenaId: string, figuranteId: string) => {
    const cena = cenas.find((item) => item.id === cenaId);
    if (!cena) {
      return;
    }

    const figurantesIds = cena.figurantes.includes(figuranteId)
      ? cena.figurantes.filter((id) => id !== figuranteId)
      : [...cena.figurantes, figuranteId];

    void handleUpdateCena(cenaId, 'figurantes', figurantesIds);
  };

  const getElencoDisplayName = (membro: ElencoMembro) => {
    const atorNome = membro.nomeTrabalho || membro.nome;
    return `${membro.personagem} (${atorNome})`;
  };

  const getFiguranteDisplayName = (pessoa: Pessoa) =>
    pessoa.nomeTrabalho || `${pessoa.nome} ${pessoa.sobrenome || ''}`.trim();

  const getDisplayLabel = (value: string, options: Array<{ value: string; label: string }>) => {
    const option = options.find((item) => item.value === value);
    return option?.label || value;
  };

  const stripHtml = (html: string) => {
    if (typeof document === 'undefined') {
      return html;
    }

    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const handleExportPDF = () => {
    if (cenas.length === 0) {
      toast.error(t('script.noScenesToExport'));
      return;
    }

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;

    cenas.forEach((cena, index) => {
      if (index > 0) {
        pdf.addPage();
      }

      let y = margin;

      pdf.setFillColor(59, 130, 246);
      pdf.rect(0, 0, pageWidth, 35, 'F');

      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${t('script.scene')} ${cena.ordem}`, margin, 22);

      if (cena.capitulo && cena.numeroCena) {
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        pdf.text(
          `${t('script.chapter')} ${cena.capitulo} - ${t('script.scene')} ${cena.numeroCena}`,
          margin,
          30,
        );
      }

      y = 50;
      pdf.setTextColor(0, 0, 0);

      const infoItems = [
        { label: t('script.environment'), value: cena.ambiente },
        {
          label: t('script.environmentType'),
          value: getDisplayLabel(cena.tipoAmbiente, TIPOS_AMBIENTE),
        },
        { label: t('script.period'), value: getDisplayLabel(cena.periodo, PERIODOS) },
        { label: t('script.rhythm'), value: getDisplayLabel(cena.ritmo, RITMOS) },
        { label: t('script.recordingLocation'), value: cena.localGravacao },
        { label: t('script.approximateTime'), value: cena.tempoAproximado },
      ];

      pdf.setFontSize(10);
      const columnWidth = contentWidth / 2;

      infoItems.forEach((item, itemIndex) => {
        if (!item.value) {
          return;
        }

        const column = itemIndex % 2;
        const x = margin + column * columnWidth;

        if (column === 0 && itemIndex > 0) {
          y += 12;
        }

        pdf.setFont('helvetica', 'bold');
        pdf.text(`${item.label}:`, x, y);
        pdf.setFont('helvetica', 'normal');
        pdf.text(item.value, x + pdf.getTextWidth(`${item.label}: `), y);
      });

      y += 20;

      if (cena.personagens.length > 0) {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11);
        pdf.text(`${t('script.charactersInScene').split(' (')[0]}:`, margin, y);
        y += 6;

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        const personagensText = cena.personagens
          .map((id) => {
            const membro = elenco.find((item) => item.id === id);
            return membro ? getElencoDisplayName(membro) : '';
          })
          .filter(Boolean)
          .join(', ');

        const lines = pdf.splitTextToSize(personagensText, contentWidth);
        pdf.text(lines, margin, y);
        y += lines.length * 5 + 8;
      }

      if (cena.figurantes.length > 0) {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11);
        pdf.text(`${t('script.extras').split(' (')[0]}:`, margin, y);
        y += 6;

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        const figurantesText = cena.figurantes
          .map((id) => {
            const pessoa = figurantes.find((item) => item.id === id);
            return pessoa ? getFiguranteDisplayName(pessoa) : '';
          })
          .filter(Boolean)
          .join(', ');

        const lines = pdf.splitTextToSize(figurantesText, contentWidth);
        pdf.text(lines, margin, y);
        y += lines.length * 5 + 8;
      }

      if (cena.descricao) {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11);
        pdf.text(`${t('script.sceneDescription')}:`, margin, y);
        y += 6;

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        const descricaoText = stripHtml(cena.descricao);
        const descricaoLines = pdf.splitTextToSize(descricaoText, contentWidth);
        const maxLines = Math.floor((pageHeight - y - margin) / 5);
        pdf.text(descricaoLines.slice(0, maxLines), margin, y);
      }

      pdf.setFontSize(8);
      pdf.setTextColor(128, 128, 128);
      pdf.text(
        `${t('script.scene')} ${index + 1} ${t('common.of')} ${cenas.length}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' },
      );
    });

    pdf.save(`roteiro_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success(t('script.exportSuccess'));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 py-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">{t('script.title')}</h3>
          <p className="text-sm text-muted-foreground">{t('script.description')}</p>
        </div>
        <div className="flex gap-2">
          {cenas.length > 0 && (
            <Button variant="outline" onClick={handleExportPDF}>
              <FileDown className="h-4 w-4 mr-2" />
              {t('script.exportPDF')}
            </Button>
          )}
          <Button
            onClick={() => void handleAddCena()}
            className="gradient-primary hover:opacity-90"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('script.addScene')}
          </Button>
        </div>
      </div>

      {cenas.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground mb-4">{t('script.noScenes')}</p>
          <Button variant="outline" onClick={() => void handleAddCena()}>
            <Plus className="h-4 w-4 mr-2" />
            {t('script.addFirstScene')}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {cenas.map((cena, index) => (
            <Card
              key={cena.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(event) => void handleDragOver(event, index)}
              onDragEnd={handleDragEnd}
              className={cn('transition-all', draggedIndex === index && 'opacity-50 scale-95')}
            >
              <Collapsible open={expandedCenas.has(cena.id)}>
                <CardHeader className="py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                      <Badge variant="outline" className="font-mono">
                        #{cena.ordem}
                      </Badge>
                      <CardTitle className="text-base">
                        {cena.capitulo && cena.numeroCena
                          ? `${t('script.chapter').slice(0, 3)}. ${cena.capitulo} - ${t('script.scene')} ${cena.numeroCena}`
                          : `${t('script.scene')} ${cena.ordem}`}
                      </CardTitle>
                      {cena.tipoAmbiente && (
                        <Badge variant={cena.tipoAmbiente === 'Externo' ? 'default' : 'secondary'}>
                          {getDisplayLabel(cena.tipoAmbiente, TIPOS_AMBIENTE)}
                        </Badge>
                      )}
                      {cena.periodo && (
                        <Badge variant="outline">{getDisplayLabel(cena.periodo, PERIODOS)}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => void handleRemoveCena(cena.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => toggleExpanded(cena.id)}>
                          {expandedCenas.has(cena.id) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                  </div>
                </CardHeader>
                <CollapsibleContent>
                  <CardContent className="space-y-4 pt-0">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>{t('script.chapter')}</Label>
                        <Input
                          value={cena.capitulo}
                          onChange={(event) =>
                            void handleUpdateCena(cena.id, 'capitulo', event.target.value)
                          }
                          placeholder="Ex: 01"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('script.sceneNumber')}</Label>
                        <Input
                          value={cena.numeroCena}
                          onChange={(event) =>
                            void handleUpdateCena(cena.id, 'numeroCena', event.target.value)
                          }
                          placeholder="Ex: 15"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('script.environment')}</Label>
                        <Input
                          value={cena.ambiente}
                          onChange={(event) =>
                            void handleUpdateCena(cena.id, 'ambiente', event.target.value)
                          }
                          placeholder={t('script.environmentPlaceholder')}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>{t('script.environmentType')}</Label>
                        <Select
                          value={cena.tipoAmbiente}
                          onValueChange={(value) =>
                            void handleUpdateCena(cena.id, 'tipoAmbiente', value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t('common.select')} />
                          </SelectTrigger>
                          <SelectContent>
                            {TIPOS_AMBIENTE.map((tipo) => (
                              <SelectItem key={tipo.value} value={tipo.value}>
                                {tipo.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>{t('script.period')}</Label>
                        <Select
                          value={cena.periodo}
                          onValueChange={(value) =>
                            void handleUpdateCena(cena.id, 'periodo', value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t('common.select')} />
                          </SelectTrigger>
                          <SelectContent>
                            {PERIODOS.map((periodo) => (
                              <SelectItem key={periodo.value} value={periodo.value}>
                                {periodo.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>{t('script.rhythm')}</Label>
                        <Select
                          value={cena.ritmo}
                          onValueChange={(value) => void handleUpdateCena(cena.id, 'ritmo', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t('common.select')} />
                          </SelectTrigger>
                          <SelectContent>
                            {RITMOS.map((ritmo) => (
                              <SelectItem key={ritmo.value} value={ritmo.value}>
                                {ritmo.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{t('script.recordingLocation')}</Label>
                        <Input
                          value={cena.localGravacao}
                          onChange={(event) =>
                            void handleUpdateCena(cena.id, 'localGravacao', event.target.value)
                          }
                          placeholder={t('script.locationPlaceholder')}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('script.approximateTime')}</Label>
                        <Input
                          value={cena.tempoAproximado}
                          onChange={(event) =>
                            void handleUpdateCena(cena.id, 'tempoAproximado', event.target.value)
                          }
                          placeholder="Ex: 5min"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>
                        {t('script.charactersInScene')} ({cena.personagens.length})
                      </Label>
                      {elenco.length > 0 ? (
                        <Popover
                          open={personagensPopoverOpen[cena.id] || false}
                          onOpenChange={(open) =>
                            setPersonagensPopoverOpen((current) => ({
                              ...current,
                              [cena.id]: open,
                            }))
                          }
                        >
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start">
                              {cena.personagens.length > 0
                                ? `${cena.personagens.length} ${t('script.selectedCharacters')}`
                                : t('script.selectCharacters')}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[400px] p-0" align="start">
                            <Command>
                              <CommandInput placeholder={t('script.searchCharacter')} />
                              <CommandList>
                                <CommandEmpty>{t('script.noCharactersFound')}</CommandEmpty>
                                <CommandGroup>
                                  {elenco.map((membro) => (
                                    <CommandItem
                                      key={membro.id}
                                      onSelect={() => handlePersonagemToggle(cena.id, membro.id)}
                                    >
                                      <div
                                        className={cn(
                                          'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                                          cena.personagens.includes(membro.id)
                                            ? 'bg-primary text-primary-foreground'
                                            : 'opacity-50',
                                        )}
                                      >
                                        {cena.personagens.includes(membro.id) && (
                                          <Check className="h-3 w-3" />
                                        )}
                                      </div>
                                      {getElencoDisplayName(membro)}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          {t('script.noCharactersAvailable')}
                        </p>
                      )}
                      {cena.personagens.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {cena.personagens.map((id) => {
                            const membro = elenco.find((item) => item.id === id);
                            if (!membro) {
                              return null;
                            }

                            return (
                              <Badge
                                key={id}
                                variant="secondary"
                                className="flex items-center gap-1"
                              >
                                {membro.personagem}
                                <X
                                  className="h-3 w-3 cursor-pointer"
                                  onClick={() => handlePersonagemToggle(cena.id, id)}
                                />
                              </Badge>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>
                        {t('script.extras')} ({cena.figurantes.length})
                      </Label>
                      {figurantes.length > 0 ? (
                        <Popover
                          open={figurantesPopoverOpen[cena.id] || false}
                          onOpenChange={(open) =>
                            setFigurantesPopoverOpen((current) => ({ ...current, [cena.id]: open }))
                          }
                        >
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start">
                              {cena.figurantes.length > 0
                                ? `${cena.figurantes.length} ${t('script.selectedExtras')}`
                                : t('script.selectExtras')}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[400px] p-0" align="start">
                            <Command>
                              <CommandInput placeholder={t('script.searchExtra')} />
                              <CommandList>
                                <CommandEmpty>{t('script.noExtrasFound')}</CommandEmpty>
                                <CommandGroup>
                                  {figurantes.map((pessoa) => (
                                    <CommandItem
                                      key={pessoa.id}
                                      onSelect={() => handleFiguranteToggle(cena.id, pessoa.id)}
                                    >
                                      <div
                                        className={cn(
                                          'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                                          cena.figurantes.includes(pessoa.id)
                                            ? 'bg-primary text-primary-foreground'
                                            : 'opacity-50',
                                        )}
                                      >
                                        {cena.figurantes.includes(pessoa.id) && (
                                          <Check className="h-3 w-3" />
                                        )}
                                      </div>
                                      {getFiguranteDisplayName(pessoa)}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          {t('script.noExtrasAvailable')}
                        </p>
                      )}
                      {cena.figurantes.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {cena.figurantes.map((id) => {
                            const pessoa = figurantes.find((item) => item.id === id);
                            if (!pessoa) {
                              return null;
                            }

                            return (
                              <Badge
                                key={id}
                                variant="secondary"
                                className="flex items-center gap-1"
                              >
                                {getFiguranteDisplayName(pessoa)}
                                <X
                                  className="h-3 w-3 cursor-pointer"
                                  onClick={() => handleFiguranteToggle(cena.id, id)}
                                />
                              </Badge>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>{t('script.sceneDescription')}</Label>
                      <RichTextEditor
                        value={cena.descricao}
                        onChange={(value) => void handleUpdateCena(cena.id, 'descricao', value)}
                        placeholder={t('script.descriptionPlaceholder')}
                      />
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
