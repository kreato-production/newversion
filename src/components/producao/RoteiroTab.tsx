import { useState, useEffect } from 'react';
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

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

const PERIODOS = ['Dia', 'Noite', 'Manhã', 'Tarde', 'Madrugada'];
const RITMOS = ['Dramático', 'Cena Rápida', 'Contemplativa'];
const TIPOS_AMBIENTE = ['Externo', 'Interno'];

export const RoteiroTab = ({ gravacaoId }: RoteiroTabProps) => {
  const [cenas, setCenas] = useState<Cena[]>([]);
  const [elenco, setElenco] = useState<ElencoMembro[]>([]);
  const [figurantes, setFigurantes] = useState<Pessoa[]>([]);
  const [expandedCenas, setExpandedCenas] = useState<Set<string>>(new Set());
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

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
    toast.success('Cena adicionada com sucesso!');
  };

  const handleRemoveCena = (id: string) => {
    const newCenas = cenas
      .filter(c => c.id !== id)
      .map((c, index) => ({ ...c, ordem: index + 1 }));
    saveCenas(newCenas);
    toast.success('Cena removida com sucesso!');
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

  return (
    <div className="space-y-4 py-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Roteiro de Gravação</h3>
          <p className="text-sm text-muted-foreground">
            Organize a ordem das cenas a serem gravadas
          </p>
        </div>
        <Button onClick={handleAddCena} className="gradient-primary hover:opacity-90">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Cena
        </Button>
      </div>

      {cenas.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground mb-4">Nenhuma cena cadastrada</p>
          <Button variant="outline" onClick={handleAddCena}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar primeira cena
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
                          ? `Cap. ${cena.capitulo} - Cena ${cena.numeroCena}`
                          : `Cena ${cena.ordem}`}
                      </CardTitle>
                      {cena.tipoAmbiente && (
                        <Badge variant={cena.tipoAmbiente === 'Externo' ? 'default' : 'secondary'}>
                          {cena.tipoAmbiente}
                        </Badge>
                      )}
                      {cena.periodo && (
                        <Badge variant="outline">{cena.periodo}</Badge>
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
                        <Label>Capítulo</Label>
                        <Input
                          value={cena.capitulo}
                          onChange={(e) => handleUpdateCena(cena.id, 'capitulo', e.target.value)}
                          placeholder="Ex: 01"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Número da Cena</Label>
                        <Input
                          value={cena.numeroCena}
                          onChange={(e) => handleUpdateCena(cena.id, 'numeroCena', e.target.value)}
                          placeholder="Ex: 15"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Ambiente</Label>
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
                        <Label>Tipo de Ambiente</Label>
                        <Select
                          value={cena.tipoAmbiente}
                          onValueChange={(value) => handleUpdateCena(cena.id, 'tipoAmbiente', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            {TIPOS_AMBIENTE.map((tipo) => (
                              <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Período</Label>
                        <Select
                          value={cena.periodo}
                          onValueChange={(value) => handleUpdateCena(cena.id, 'periodo', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            {PERIODOS.map((periodo) => (
                              <SelectItem key={periodo} value={periodo}>{periodo}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Ritmo</Label>
                        <Select
                          value={cena.ritmo}
                          onValueChange={(value) => handleUpdateCena(cena.id, 'ritmo', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            {RITMOS.map((ritmo) => (
                              <SelectItem key={ritmo} value={ritmo}>{ritmo}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Linha 3: Local, Tempo */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Local da Gravação</Label>
                        <Input
                          value={cena.localGravacao}
                          onChange={(e) => handleUpdateCena(cena.id, 'localGravacao', e.target.value)}
                          placeholder="Ex: Estúdio A, Locação externa..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Tempo Aproximado</Label>
                        <Input
                          value={cena.tempoAproximado}
                          onChange={(e) => handleUpdateCena(cena.id, 'tempoAproximado', e.target.value)}
                          placeholder="Ex: 5 minutos"
                        />
                      </div>
                    </div>

                    {/* Personagens em Cena */}
                    <div className="space-y-2">
                      <Label>Personagens em Cena (do Elenco)</Label>
                      <div className="flex flex-wrap gap-2 p-3 border rounded-md bg-muted/30 max-h-40 overflow-y-auto">
                        {elenco.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            Nenhum elenco cadastrado. Adicione membros ao elenco no tabulador "Elenco".
                          </p>
                        ) : (
                          elenco.map((membro) => (
                            <div key={membro.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`${cena.id}-personagem-${membro.id}`}
                                checked={cena.personagens.includes(membro.id)}
                                onCheckedChange={() => handlePersonagemToggle(cena.id, membro.id)}
                              />
                              <label
                                htmlFor={`${cena.id}-personagem-${membro.id}`}
                                className="text-sm cursor-pointer"
                              >
                                {getElencoDisplayName(membro)}
                              </label>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Figurantes */}
                    <div className="space-y-2">
                      <Label>Figurantes (Pessoas classificadas como Figurante)</Label>
                      <div className="flex flex-wrap gap-2 p-3 border rounded-md bg-muted/30 max-h-40 overflow-y-auto">
                        {figurantes.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            Nenhuma pessoa classificada como "Figurante". Cadastre pessoas no módulo Recursos &gt; Pessoas.
                          </p>
                        ) : (
                          figurantes.map((pessoa) => (
                            <div key={pessoa.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`${cena.id}-figurante-${pessoa.id}`}
                                checked={cena.figurantes.includes(pessoa.id)}
                                onCheckedChange={() => handleFiguranteToggle(cena.id, pessoa.id)}
                              />
                              <label
                                htmlFor={`${cena.id}-figurante-${pessoa.id}`}
                                className="text-sm cursor-pointer"
                              >
                                {getFiguranteDisplayName(pessoa)}
                              </label>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Descrição da Cena */}
                    <div className="space-y-2">
                      <Label>Descrição da Cena</Label>
                      <Textarea
                        value={cena.descricao}
                        onChange={(e) => handleUpdateCena(cena.id, 'descricao', e.target.value)}
                        placeholder="Descreva a cena em detalhes..."
                        rows={4}
                        className="resize-y min-h-[100px]"
                      />
                      <p className="text-xs text-muted-foreground">
                        Use marcações de texto: *texto* para itálico, **texto** para negrito
                      </p>
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
