import { useState, useEffect } from 'react';
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp, Check, X } from 'lucide-react';
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

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
  classificacao?: string;
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
}

export const RoteiroTab = ({ gravacaoId }: RoteiroTabProps) => {
  const { t, language } = useLanguage();
  const [cenas, setCenas] = useState<Cena[]>([]);
  const [elenco, setElenco] = useState<ElencoMembro[]>([]);
  const [figurantes, setFigurantes] = useState<Pessoa[]>([]);
  const [expandedCenas, setExpandedCenas] = useState<Set<string>>(new Set());
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Translated options based on language
  const PERIODOS = [
    { value: 'Dia', label: t('script.day') },
    { value: 'Noite', label: t('script.night') },
    { value: 'Manhã', label: t('script.morning') },
    { value: 'Tarde', label: t('script.afternoon') },
    { value: 'Madrugada', label: t('script.dawn') },
  ];

  const RITMOS = [
    { value: 'Dramático', label: t('script.dramatic') },
    { value: 'Cena Rápida', label: t('script.fastScene') },
    { value: 'Contemplativa', label: t('script.contemplative') },
  ];

  const TIPOS_AMBIENTE = [
    { value: 'Externo', label: t('script.external') },
    { value: 'Interno', label: t('script.internal') },
  ];

  useEffect(() => {
    // Carregar cenas do localStorage
    const storedCenas = localStorage.getItem(`kreato_roteiro_${gravacaoId}`);
    if (storedCenas) {
      setCenas(JSON.parse(storedCenas));
    }

    // Carregar elenco da gravação para seleção de personagens
    const storedElenco = localStorage.getItem(`kreato_gravacao_elenco_${gravacaoId}`);
    if (storedElenco) {
      setElenco(JSON.parse(storedElenco));
    }

    // Carregar pessoas classificadas como "Figurante" ou "Figurantes"
    const storedPessoas = localStorage.getItem('kreato_pessoas');
    if (storedPessoas) {
      const allPessoas: Pessoa[] = JSON.parse(storedPessoas);
      const figurantesOnly = allPessoas.filter(p => 
        p.status === 'Ativo' && 
        p.classificacao?.toLowerCase().includes('figurante')
      );
      setFigurantes(figurantesOnly);
    }
  }, [gravacaoId]);

  const saveCenas = (newCenas: Cena[]) => {
    localStorage.setItem(`kreato_roteiro_${gravacaoId}`, JSON.stringify(newCenas));
    setCenas(newCenas);
  };

  const handleAddCena = () => {
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
    const newCenas = [...cenas, novaCena];
    saveCenas(newCenas);
    setExpandedCenas(new Set([...expandedCenas, novaCena.id]));
    toast.success(t('script.sceneAdded'));
  };

  const handleRemoveCena = (id: string) => {
    const newCenas = cenas
      .filter(c => c.id !== id)
      .map((c, index) => ({ ...c, ordem: index + 1 }));
    saveCenas(newCenas);
    toast.success(t('script.sceneRemoved'));
  };

  const handleUpdateCena = (id: string, field: keyof Cena, value: any) => {
    const newCenas = cenas.map(c => 
      c.id === id ? { ...c, [field]: value } : c
    );
    saveCenas(newCenas);
  };

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedCenas);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedCenas(newExpanded);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    const newCenas = [...cenas];
    const draggedItem = newCenas[draggedIndex];
    newCenas.splice(draggedIndex, 1);
    newCenas.splice(index, 0, draggedItem);
    
    // Atualizar ordem
    const reorderedCenas = newCenas.map((c, i) => ({ ...c, ordem: i + 1 }));
    saveCenas(reorderedCenas);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handlePersonagemToggle = (cenaId: string, elencoId: string) => {
    const cena = cenas.find(c => c.id === cenaId);
    if (!cena) return;
    
    const newPersonagens = cena.personagens.includes(elencoId)
      ? cena.personagens.filter(p => p !== elencoId)
      : [...cena.personagens, elencoId];
    
    handleUpdateCena(cenaId, 'personagens', newPersonagens);
  };

  const handleFiguranteToggle = (cenaId: string, figuranteId: string) => {
    const cena = cenas.find(c => c.id === cenaId);
    if (!cena) return;
    
    const newFigurantes = cena.figurantes.includes(figuranteId)
      ? cena.figurantes.filter(f => f !== figuranteId)
      : [...cena.figurantes, figuranteId];
    
    handleUpdateCena(cenaId, 'figurantes', newFigurantes);
  };

  const getElencoDisplayName = (membro: ElencoMembro) => {
    const atorName = membro.nomeTrabalho || membro.nome;
    return `${membro.personagem} (${atorName})`;
  };

  const getFiguranteDisplayName = (pessoa: Pessoa) => {
    return pessoa.nomeTrabalho || `${pessoa.nome} ${pessoa.sobrenome || ''}`.trim();
  };

  const getDisplayLabel = (value: string, options: { value: string; label: string }[]) => {
    const option = options.find(o => o.value === value);
    return option?.label || value;
  };

  return (
    <div className="space-y-4 py-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">{t('script.title')}</h3>
          <p className="text-sm text-muted-foreground">
            {t('script.description')}
          </p>
        </div>
        <Button onClick={handleAddCena} className="gradient-primary hover:opacity-90">
          <Plus className="h-4 w-4 mr-2" />
          {t('script.addScene')}
        </Button>
      </div>

      {cenas.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground mb-4">{t('script.noScenes')}</p>
          <Button variant="outline" onClick={handleAddCena}>
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
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`transition-all ${draggedIndex === index ? 'opacity-50 scale-95' : ''}`}
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
                          ? `${t('script.chapter').slice(0,3)}. ${cena.capitulo} - ${t('script.scene')} ${cena.numeroCena}`
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
                        onClick={() => handleRemoveCena(cena.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleExpanded(cena.id)}
                        >
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
                    {/* Linha 1: Capítulo, Número da Cena, Ambiente */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>{t('script.chapter')}</Label>
                        <Input
                          value={cena.capitulo}
                          onChange={(e) => handleUpdateCena(cena.id, 'capitulo', e.target.value)}
                          placeholder="Ex: 01"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('script.sceneNumber')}</Label>
                        <Input
                          value={cena.numeroCena}
                          onChange={(e) => handleUpdateCena(cena.id, 'numeroCena', e.target.value)}
                          placeholder="Ex: 15"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('script.environment')}</Label>
                        <Input
                          value={cena.ambiente}
                          onChange={(e) => handleUpdateCena(cena.id, 'ambiente', e.target.value)}
                          placeholder="Ex: Sala de estar"
                        />
                      </div>
                    </div>

                    {/* Linha 2: Tipo Ambiente, Período, Ritmo */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>{t('script.environmentType')}</Label>
                        <Select
                          value={cena.tipoAmbiente}
                          onValueChange={(value) => handleUpdateCena(cena.id, 'tipoAmbiente', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t('common.select')} />
                          </SelectTrigger>
                          <SelectContent>
                            {TIPOS_AMBIENTE.map((tipo) => (
                              <SelectItem key={tipo.value} value={tipo.value}>{tipo.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>{t('script.period')}</Label>
                        <Select
                          value={cena.periodo}
                          onValueChange={(value) => handleUpdateCena(cena.id, 'periodo', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t('common.select')} />
                          </SelectTrigger>
                          <SelectContent>
                            {PERIODOS.map((periodo) => (
                              <SelectItem key={periodo.value} value={periodo.value}>{periodo.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>{t('script.rhythm')}</Label>
                        <Select
                          value={cena.ritmo}
                          onValueChange={(value) => handleUpdateCena(cena.id, 'ritmo', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t('common.select')} />
                          </SelectTrigger>
                          <SelectContent>
                            {RITMOS.map((ritmo) => (
                              <SelectItem key={ritmo.value} value={ritmo.value}>{ritmo.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Linha 3: Local, Tempo */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{t('script.recordingLocation')}</Label>
                        <Input
                          value={cena.localGravacao}
                          onChange={(e) => handleUpdateCena(cena.id, 'localGravacao', e.target.value)}
                          placeholder="Ex: Estúdio A, Locação externa..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('script.approximateTime')}</Label>
                        <Input
                          value={cena.tempoAproximado}
                          onChange={(e) => handleUpdateCena(cena.id, 'tempoAproximado', e.target.value)}
                          placeholder="Ex: 5 minutos"
                        />
                      </div>
                    </div>

                    {/* Personagens em Cena */}
                    <div className="space-y-2">
                      <Label>{t('script.charactersInScene')}</Label>
                      {elenco.length === 0 ? (
                        <p className="text-sm text-muted-foreground p-3 border rounded-md bg-muted/30">
                          {t('script.noCast')}
                        </p>
                      ) : (
                        <div className="space-y-2">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full justify-start">
                                <Plus className="h-4 w-4 mr-2" />
                                {t('script.selectCharacters')}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-0 bg-popover" align="start">
                              <Command>
                                <CommandInput placeholder={t('script.searchCharacter')} />
                                <CommandList>
                                  <CommandEmpty>{t('common.noResults')}</CommandEmpty>
                                  <CommandGroup>
                                    {elenco
                                      .filter(m => !cena.personagens.includes(m.id))
                                      .map((membro) => (
                                        <CommandItem
                                          key={membro.id}
                                          value={getElencoDisplayName(membro)}
                                          onSelect={() => handlePersonagemToggle(cena.id, membro.id)}
                                        >
                                          <Check className={cn("mr-2 h-4 w-4", "opacity-0")} />
                                          {getElencoDisplayName(membro)}
                                        </CommandItem>
                                      ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          {cena.personagens.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {cena.personagens.map((pId) => {
                                const membro = elenco.find(e => e.id === pId);
                                if (!membro) return null;
                                return (
                                  <Badge key={pId} variant="secondary" className="flex items-center gap-1">
                                    {getElencoDisplayName(membro)}
                                    <button
                                      onClick={() => handlePersonagemToggle(cena.id, pId)}
                                      className="ml-1 hover:text-destructive"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </Badge>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Figurantes */}
                    <div className="space-y-2">
                      <Label>{t('script.extras')}</Label>
                      {figurantes.length === 0 ? (
                        <p className="text-sm text-muted-foreground p-3 border rounded-md bg-muted/30">
                          {t('script.noExtras')}
                        </p>
                      ) : (
                        <div className="space-y-2">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full justify-start">
                                <Plus className="h-4 w-4 mr-2" />
                                {t('script.selectExtras')}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-0 bg-popover" align="start">
                              <Command>
                                <CommandInput placeholder={t('script.searchExtra')} />
                                <CommandList>
                                  <CommandEmpty>{t('common.noResults')}</CommandEmpty>
                                  <CommandGroup>
                                    {figurantes
                                      .filter(f => !cena.figurantes.includes(f.id))
                                      .map((pessoa) => (
                                        <CommandItem
                                          key={pessoa.id}
                                          value={getFiguranteDisplayName(pessoa)}
                                          onSelect={() => handleFiguranteToggle(cena.id, pessoa.id)}
                                        >
                                          <Check className={cn("mr-2 h-4 w-4", "opacity-0")} />
                                          {getFiguranteDisplayName(pessoa)}
                                        </CommandItem>
                                      ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          {cena.figurantes.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {cena.figurantes.map((fId) => {
                                const pessoa = figurantes.find(f => f.id === fId);
                                if (!pessoa) return null;
                                return (
                                  <Badge key={fId} variant="secondary" className="flex items-center gap-1">
                                    {getFiguranteDisplayName(pessoa)}
                                    <button
                                      onClick={() => handleFiguranteToggle(cena.id, fId)}
                                      className="ml-1 hover:text-destructive"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </Badge>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Descrição da Cena */}
                    <div className="space-y-2">
                      <Label>{t('script.sceneDescription')}</Label>
                      <RichTextEditor
                        value={cena.descricao}
                        onChange={(value) => handleUpdateCena(cena.id, 'descricao', value)}
                        placeholder={t('script.sceneDescription') + '...'}
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