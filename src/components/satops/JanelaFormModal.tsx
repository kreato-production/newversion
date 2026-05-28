'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Loader2, Plus, Trash2, UserCircle, FilePlus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ModalNavigation, type ModalNavigationProps } from '@/components/shared/ModalNavigation';
import {
  ApiSatOpsRepository,
  type SateliteApiItem,
  type JanelaApiItem,
  type JanelaResponsavel,
  type GrelhaPrograma,
} from '@/modules/satops/satops.api.repository';
import { apiRequest } from '@/lib/api/http';
import {
  ApiIncidenciasGravacaoRepository,
  type IncidenciaGravacaoApiItem,
} from '@/modules/incidencias-gravacao/incidencias-gravacao.api';
import type { IncidenciaParametroApiItem } from '@/modules/parametrizacoes/parametrizacoes.api.repository';
import { ApiParametrizacoesRepository } from '@/modules/parametrizacoes/parametrizacoes.api.repository';
import { IncidenciaGravacaoFormModal } from '@/components/producao/IncidenciaGravacaoFormModal';

const incidenciasRepo = new ApiIncidenciasGravacaoRepository();
const parametrizacoesRepo = new ApiParametrizacoesRepository();

// ─── Types ────────────────────────────────────────────────────────────────────

type RecursoTecnicoOption = { id: string; nome: string };
type RecursoHumanoOption = {
  id: string;
  nome: string;
  sobrenome: string;
  telefone: string | null;
  email: string | null;
  foto: string | null;
};

const TIPO_EVENTO_OPTIONS = ['Grelha de Programas', 'Outro'] as const;
const DISPONIBILIDADE_OPTIONS = ['24/7', 'Durante evento'] as const;

// ─── Props ────────────────────────────────────────────────────────────────────

interface JanelaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: JanelaApiItem) => Promise<void>;
  data?: JanelaApiItem | null;
  readOnly?: boolean;
  navigation?: ModalNavigationProps;
}

// ─── Form state ───────────────────────────────────────────────────────────────

type FormState = {
  sateliteId: string;
  sateliteNome: string;
  dataEvento: string;
  tipoEvento: string;
  canal: string;
  tituloEvento: string;
  programaId: string;
  programaNome: string;
  aberturaPrevia: string;
  aberturaReal: string;
  confirmacaoNocId: string;
  confirmacaoNocNome: string;
  fechoPrevisto: string;
  fechoReal: string;
  simulacao: boolean;
};

const EMPTY_FORM: FormState = {
  sateliteId: '',
  sateliteNome: '',
  dataEvento: '',
  tipoEvento: '',
  canal: '',
  tituloEvento: '',
  programaId: '',
  programaNome: '',
  aberturaPrevia: '',
  aberturaReal: '',
  confirmacaoNocId: '',
  confirmacaoNocNome: '',
  fechoPrevisto: '',
  fechoReal: '',
  simulacao: false,
};

const repository = new ApiSatOpsRepository();

// ─── Component ────────────────────────────────────────────────────────────────

export const JanelaFormModal = ({
  isOpen,
  onClose,
  onSave,
  data,
  readOnly = false,
  navigation,
}: JanelaFormModalProps) => {
  const { user } = useAuth();

  const [formData, setFormData] = useState<FormState>(EMPTY_FORM);
  const [responsaveis, setResponsaveis] = useState<JanelaResponsavel[]>([]);

  // Reference data
  const [satelites, setSatelites] = useState<SateliteApiItem[]>([]);
  const [canais, setCanais] = useState<string[]>([]);
  const [programas, setProgramas] = useState<GrelhaPrograma[]>([]);
  const [recursosTecnicos, setRecursosTecnicos] = useState<RecursoTecnicoOption[]>([]);
  const [recursosHumanos, setRecursosHumanos] = useState<RecursoHumanoOption[]>([]);
  const [loadingRef, setLoadingRef] = useState(false);
  const [loadingProgramas, setLoadingProgramas] = useState(false);

  // Incidências
  const [incidencias, setIncidencias] = useState<IncidenciaGravacaoApiItem[]>([]);
  const [severidades, setSeveridades] = useState<IncidenciaParametroApiItem[]>([]);
  const [impactos, setImpactos] = useState<IncidenciaParametroApiItem[]>([]);
  const [categorias, setCategorias] = useState<IncidenciaParametroApiItem[]>([]);
  const [loadingInc, setLoadingInc] = useState(false);
  const [showIncForm, setShowIncForm] = useState(false);

  // Load reference data on open
  useEffect(() => {
    if (!isOpen) return;

    setLoadingRef(true);
    Promise.all([
      repository.listSatelites(),
      repository.listCanais(),
      apiRequest<{ data: RecursoTecnicoOption[] }>('/recursos-tecnicos?limit=200'),
      apiRequest<{ data: RecursoHumanoOption[] }>('/recursos-humanos?limit=200'),
    ])
      .then(([sats, cns, rts, rhs]) => {
        setSatelites(sats.data);
        setCanais(cns);
        setRecursosTecnicos(rts.data ?? []);
        setRecursosHumanos(rhs.data ?? []);
      })
      .catch(() => {
        /* silently ignore — dropdowns will be empty */
      })
      .finally(() => setLoadingRef(false));
  }, [isOpen]);

  // Carrega incidências associadas a esta janela (isoladas por janela_id)
  const loadIncidencias = useCallback(async (janelaId: string) => {
    setLoadingInc(true);
    try {
      const [incs, sevs, imps, cats] = await Promise.all([
        incidenciasRepo.listByJanela(janelaId),
        parametrizacoesRepo.listSeveridadesIncidencia(),
        parametrizacoesRepo.listImpactosIncidencia(),
        parametrizacoesRepo.listCategoriasIncidencia(),
      ]);
      setIncidencias(incs);
      setSeveridades(sevs.data);
      setImpactos(imps.data);
      setCategorias(cats.data);
    } catch {
      setIncidencias([]);
    } finally {
      setLoadingInc(false);
    }
  }, []);

  // Load programas when canal or data changes
  const loadProgramas = useCallback(async (canal: string, dataEvento: string) => {
    if (!canal || !dataEvento) {
      setProgramas([]);
      return;
    }
    setLoadingProgramas(true);
    try {
      const list = await repository.listProgramas(canal, dataEvento);
      setProgramas(list);
    } catch {
      setProgramas([]);
    } finally {
      setLoadingProgramas(false);
    }
  }, []);

  // Populate form on open
  useEffect(() => {
    if (isOpen) {
      if (data) {
        setFormData({
          sateliteId: data.sateliteId || '',
          sateliteNome: data.sateliteNome || '',
          dataEvento: data.dataEvento || '',
          tipoEvento: data.tipoEvento || '',
          canal: data.canal || '',
          tituloEvento: data.tituloEvento || '',
          programaId: data.programaId || '',
          programaNome: data.programaNome || '',
          aberturaPrevia: data.aberturaPrevia || '',
          aberturaReal: data.aberturaReal || '',
          confirmacaoNocId: data.confirmacaoNocId || '',
          confirmacaoNocNome: data.confirmacaoNocNome || '',
          fechoPrevisto: data.fechoPrevisto || '',
          fechoReal: data.fechoReal || '',
          simulacao: data.simulacao ?? false,
        });
        setResponsaveis(data.responsaveis ?? []);
        if (data.canal && data.dataEvento) {
          void loadProgramas(data.canal, data.dataEvento);
        }
        // Carrega incidências associadas a esta janela (apenas se janela já existe no backend)
        if (data.id) void loadIncidencias(data.id);
      } else {
        setFormData(EMPTY_FORM);
        setResponsaveis([]);
        setProgramas([]);
        setIncidencias([]);
      }
    }
  }, [data, isOpen, loadProgramas]);

  const set = (key: keyof FormState) => (value: string) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const handleSateliteChange = (id: string) => {
    const sat = satelites.find((s) => s.id === id);
    setFormData((prev) => ({ ...prev, sateliteId: id, sateliteNome: sat?.nome ?? '' }));
  };

  const handleCanalChange = (canal: string) => {
    setFormData((prev) => ({ ...prev, canal, programaId: '', programaNome: '' }));
    void loadProgramas(canal, formData.dataEvento);
  };

  const handleDataEventoChange = (dataEvento: string) => {
    setFormData((prev) => ({ ...prev, dataEvento, programaId: '', programaNome: '' }));
    void loadProgramas(formData.canal, dataEvento);
  };

  const handleProgramaChange = (id: string) => {
    const prog = programas.find((p) => p.id === id);
    setFormData((prev) => ({
      ...prev,
      programaId: id,
      programaNome: prog ? (prog.programa ?? prog.nome) : '',
    }));
  };

  const handleNocChange = (id: string) => {
    const rt = recursosTecnicos.find((r) => r.id === id);
    setFormData((prev) => ({ ...prev, confirmacaoNocId: id, confirmacaoNocNome: rt?.nome ?? '' }));
  };

  const handleTipoEventoChange = (tipo: string) => {
    setFormData((prev) => ({
      ...prev,
      tipoEvento: tipo,
      programaId: '',
      programaNome: '',
      tituloEvento: '',
    }));
  };

  // ── Responsáveis ────────────────────────────────────────────────────────────

  const addResponsavel = () => {
    setResponsaveis((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        recursoTecnicoId: '',
        recursoTecnicoNome: '',
        recursoHumanoId: '',
        recursoHumanoNome: '',
        telefone: '',
        email: '',
        foto: null,
        disponibilidade: '',
      },
    ]);
  };

  const removeResponsavel = (id: string) => {
    setResponsaveis((prev) => prev.filter((r) => r.id !== id));
  };

  const updateResponsavelTecnico = (id: string, tecnicoId: string) => {
    const rt = recursosTecnicos.find((r) => r.id === tecnicoId);
    setResponsaveis((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, recursoTecnicoId: tecnicoId, recursoTecnicoNome: rt?.nome ?? '' } : r,
      ),
    );
  };

  const updateResponsavelHumano = (id: string, humanoId: string) => {
    const rh = recursosHumanos.find((r) => r.id === humanoId);
    setResponsaveis((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              recursoHumanoId: humanoId,
              recursoHumanoNome: rh ? `${rh.nome} ${rh.sobrenome}`.trim() : '',
              telefone: rh?.telefone ?? '',
              email: rh?.email ?? '',
              foto: rh?.foto ?? null,
            }
          : r,
      ),
    );
  };

  const updateResponsavelDisponibilidade = (id: string, disponibilidade: string) => {
    setResponsaveis((prev) => prev.map((r) => (r.id === id ? { ...r, disponibilidade } : r)));
  };

  // ── Submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
      id: data?.id || crypto.randomUUID(),
      ...formData,
      responsaveis,
      checklist: data?.checklist ?? null,
      simulacao: formData.simulacao,
      dataCadastro: data?.dataCadastro || new Date().toISOString(),
      usuarioCadastro: data?.usuarioCadastro || user?.nome || '',
    });
    onClose();
  };

  const getCurrentLocalTime = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  };

  const isGrelha = formData.tipoEvento === 'Grelha de Programas';
  const isOutro = formData.tipoEvento === 'Outro';

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-[900px] max-w-[900px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{data ? 'Editar Janela' : 'Nova Janela'}</DialogTitle>
            <DialogDescription>
              Configure os parâmetros da janela de transmissão via satélite.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={(e) => void handleSubmit(e)}>
            <Tabs defaultValue="dados">
              <TabsList className="w-full">
                <TabsTrigger value="dados" className="flex-1">
                  Dados Gerais
                </TabsTrigger>
                <TabsTrigger value="responsaveis" className="flex-1">
                  Responsáveis
                  {responsaveis.length > 0 && (
                    <Badge variant="secondary" className="ml-1.5 text-xs px-1.5 py-0">
                      {responsaveis.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="incidencias" className="flex-1" disabled={!data?.id}>
                  Incidências
                  {incidencias.length > 0 && (
                    <Badge variant="secondary" className="ml-1.5 text-xs px-1.5 py-0">
                      {incidencias.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* ── Dados Gerais ──────────────────────────────────────────────── */}

              <TabsContent value="dados" className="space-y-5 mt-4">
                {data?.id && (
                  <div className="space-y-2">
                    <Label>ID</Label>
                    <Input value={data.id} disabled className="font-mono text-xs" />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>
                      Satélite <span className="text-destructive">*</span>
                    </Label>
                    {loadingRef ? (
                      <div className="flex items-center gap-2 h-10 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
                      </div>
                    ) : (
                      <Select
                        value={formData.sateliteId}
                        onValueChange={handleSateliteChange}
                        disabled={readOnly}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o satélite..." />
                        </SelectTrigger>
                        <SelectContent>
                          {satelites.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dataEvento">
                      Data do Evento <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="dataEvento"
                      type="date"
                      value={formData.dataEvento}
                      onChange={(e) => handleDataEventoChange(e.target.value)}
                      disabled={readOnly}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>
                    Tipo de Evento <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.tipoEvento}
                    onValueChange={handleTipoEventoChange}
                    disabled={readOnly}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo..." />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPO_EVENTO_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Canal — sempre visível quando tipo selecionado */}
                {formData.tipoEvento && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Canal</Label>
                      <Select
                        value={formData.canal}
                        onValueChange={handleCanalChange}
                        disabled={readOnly}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o canal..." />
                        </SelectTrigger>
                        <SelectContent>
                          {canais.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Programa — só para Grelha de Programas */}
                    {isGrelha && (
                      <div className="space-y-2">
                        <Label>Programa</Label>
                        {loadingProgramas ? (
                          <div className="flex items-center gap-2 h-10 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
                          </div>
                        ) : (
                          <Select
                            value={formData.programaId}
                            onValueChange={handleProgramaChange}
                            disabled={readOnly}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o programa..." />
                            </SelectTrigger>
                            <SelectContent>
                              {programas.length === 0 ? (
                                <SelectItem value="__none__" disabled>
                                  {formData.canal && formData.dataEvento
                                    ? 'Nenhum programa encontrado'
                                    : 'Selecione canal e data primeiro'}
                                </SelectItem>
                              ) : (
                                programas.map((p) => (
                                  <SelectItem key={p.id} value={p.id}>
                                    <span className="font-medium">{p.programa ?? p.nome}</span>
                                    {p.episodio && (
                                      <span className="ml-2 text-muted-foreground text-xs">
                                        Ep. {p.episodio}
                                      </span>
                                    )}
                                    {p.horarioInicio && (
                                      <span className="ml-2 text-muted-foreground text-xs">
                                        {p.horarioInicio}
                                      </span>
                                    )}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    )}

                    {/* Título do Evento — só para Outro */}
                    {isOutro && (
                      <div className="space-y-2">
                        <Label htmlFor="tituloEvento">Título do Evento</Label>
                        <Input
                          id="tituloEvento"
                          value={formData.tituloEvento}
                          onChange={(e) => set('tituloEvento')(e.target.value)}
                          maxLength={200}
                          disabled={readOnly}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* ── Abertura da Janela ──────────────────────────────────────── */}

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Separator className="flex-1" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Abertura da Janela
                    </span>
                    <Separator className="flex-1" />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="aberturaPrevia">Abertura Prevista (UTC)</Label>
                      <Input
                        id="aberturaPrevia"
                        type="time"
                        value={formData.aberturaPrevia}
                        onChange={(e) => set('aberturaPrevia')(e.target.value)}
                        disabled={readOnly}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="aberturaReal">Abertura Real (UTC)</Label>
                      <Input
                        id="aberturaReal"
                        type="time"
                        value={formData.aberturaReal}
                        onChange={(e) => set('aberturaReal')(e.target.value)}
                        onClick={() => {
                          if (!formData.aberturaReal && !readOnly)
                            set('aberturaReal')(getCurrentLocalTime());
                        }}
                        disabled={readOnly}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Confirmação NOC</Label>
                      <Select
                        value={formData.confirmacaoNocId}
                        onValueChange={handleNocChange}
                        disabled={readOnly}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {recursosTecnicos.map((rt) => (
                            <SelectItem key={rt.id} value={rt.id}>
                              {rt.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fechoPrevisto">Fecho Previsto (UTC)</Label>
                      <Input
                        id="fechoPrevisto"
                        type="time"
                        value={formData.fechoPrevisto}
                        onChange={(e) => set('fechoPrevisto')(e.target.value)}
                        disabled={readOnly}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fechoReal">Fecho Real (UTC)</Label>
                      <Input
                        id="fechoReal"
                        type="time"
                        value={formData.fechoReal}
                        onChange={(e) => set('fechoReal')(e.target.value)}
                        onClick={() => {
                          if (!formData.fechoReal && !readOnly)
                            set('fechoReal')(getCurrentLocalTime());
                        }}
                        disabled={readOnly}
                      />
                    </div>
                  </div>
                </div>

                {/* ── Simul. flag ─────────────────────────────────────────────── */}
                <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
                  <Checkbox
                    id="simulacao"
                    checked={formData.simulacao}
                    onCheckedChange={(v) =>
                      setFormData((prev) => ({ ...prev, simulacao: v === true }))
                    }
                    disabled={readOnly}
                    className="mt-0.5"
                  />
                  <div className="space-y-0.5">
                    <Label htmlFor="simulacao" className="cursor-pointer font-semibold">
                      Simul.
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Exibe gráfico simulado de sinal NOC quando a janela estiver "Em Direto"
                    </p>
                  </div>
                </div>

                {/* Readonly fields */}
                {data && (
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Usuário de Cadastro</Label>
                      <p className="text-sm">{data.usuarioCadastro || '-'}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Data de Cadastro</Label>
                      <p className="text-sm">
                        {data.dataCadastro
                          ? new Date(data.dataCadastro).toLocaleDateString('pt-BR')
                          : '-'}
                      </p>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* ── Responsáveis ──────────────────────────────────────────────── */}

              <TabsContent value="responsaveis" className="mt-4">
                <div className="space-y-3">
                  {responsaveis.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground border border-dashed rounded-lg">
                      <UserCircle className="h-10 w-10 mb-2 opacity-30" />
                      <p className="text-sm">Nenhum responsável registado</p>
                      {!readOnly && (
                        <p className="text-xs mt-1">
                          Clique em "Adicionar" para incluir responsáveis
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {responsaveis.map((resp, idx) => (
                        <div key={resp.id} className="border rounded-lg p-4 space-y-3 bg-muted/20">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                              Responsável #{idx + 1}
                            </span>
                            {!readOnly && (
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={() => removeResponsavel(resp.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs">Recurso Técnico</Label>
                              <Select
                                value={resp.recursoTecnicoId}
                                onValueChange={(v) => updateResponsavelTecnico(resp.id, v)}
                                disabled={readOnly}
                              >
                                <SelectTrigger className="h-8 text-sm">
                                  <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {recursosTecnicos.map((rt) => (
                                    <SelectItem key={rt.id} value={rt.id}>
                                      {rt.nome}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-1">
                              <Label className="text-xs">Nome (Recurso Humano)</Label>
                              <Select
                                value={resp.recursoHumanoId}
                                onValueChange={(v) => updateResponsavelHumano(resp.id, v)}
                                disabled={readOnly}
                              >
                                <SelectTrigger className="h-8 text-sm">
                                  <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {recursosHumanos.map((rh) => (
                                    <SelectItem key={rh.id} value={rh.id}>
                                      {rh.nome} {rh.sobrenome}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {resp.recursoHumanoId && (
                            <div className="flex items-center gap-4 p-3 bg-background rounded border">
                              <Avatar className="h-10 w-10 shrink-0">
                                <AvatarImage src={resp.foto ?? undefined} />
                                <AvatarFallback className="text-sm font-bold">
                                  {resp.recursoHumanoNome?.charAt(0)?.toUpperCase() ?? '?'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                                {resp.telefone && (
                                  <div>
                                    <span className="text-muted-foreground">Telefone: </span>
                                    <span className="font-mono">{resp.telefone}</span>
                                  </div>
                                )}
                                {resp.email && (
                                  <div>
                                    <span className="text-muted-foreground">E-mail: </span>
                                    <span>{resp.email}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="space-y-1">
                            <Label className="text-xs">Disponibilidade</Label>
                            <Select
                              value={resp.disponibilidade}
                              onValueChange={(v) => updateResponsavelDisponibilidade(resp.id, v)}
                              disabled={readOnly}
                            >
                              <SelectTrigger className="h-8 text-sm">
                                <SelectValue placeholder="Selecione..." />
                              </SelectTrigger>
                              <SelectContent>
                                {DISPONIBILIDADE_OPTIONS.map((opt) => (
                                  <SelectItem key={opt} value={opt}>
                                    {opt}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {!readOnly && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full border-dashed"
                      onClick={addResponsavel}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Responsável
                    </Button>
                  )}
                </div>
              </TabsContent>
              {/* ── Incidências ───────────────────────────────────────────────── */}

              <TabsContent value="incidencias" className="mt-4">
                {/* Botão de registo — apenas para janelas já criadas e não em modo leitura */}
                {data?.id && !readOnly && (
                  <div className="flex justify-end mb-3">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      onClick={() => setShowIncForm(true)}
                    >
                      <FilePlus className="h-3.5 w-3.5" />
                      Registar Incidência
                    </Button>
                  </div>
                )}

                {loadingInc ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : incidencias.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground border border-dashed rounded-lg">
                    <AlertTriangle className="h-10 w-10 mb-2 opacity-25" />
                    <p className="text-sm font-medium">Nenhuma incidência registada</p>
                    <p className="text-xs mt-1">
                      Use o botão acima para registar incidências nesta janela.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      {incidencias.length} incidência{incidencias.length !== 1 ? 's' : ''} registada
                      {incidencias.length !== 1 ? 's' : ''}
                    </p>
                    <div className="rounded-lg border overflow-hidden">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-muted/40 border-b text-muted-foreground">
                            <th className="px-3 py-2 text-left font-medium">Título</th>
                            <th className="px-3 py-2 text-left font-medium w-20">Horário</th>
                            <th className="px-3 py-2 text-left font-medium w-24 hidden sm:table-cell">
                              Severidade
                            </th>
                            <th className="px-3 py-2 text-left font-medium w-24 hidden md:table-cell">
                              Impacto
                            </th>
                            <th className="px-3 py-2 text-left font-medium w-24 hidden md:table-cell">
                              Categoria
                            </th>
                            <th className="px-3 py-2 text-left font-medium w-20 hidden lg:table-cell">
                              Tempo
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {incidencias.map((inc) => {
                            const sev = severidades.find((s) => s.id === inc.severidade_id);
                            const imp = impactos.find((i) => i.id === inc.impacto_id);
                            const cat = categorias.find((c) => c.id === inc.categoria_id);
                            return (
                              <tr key={inc.id} className="hover:bg-muted/30 transition-colors">
                                <td className="px-3 py-2.5">
                                  <p className="font-medium text-foreground">{inc.titulo}</p>
                                  {inc.descricao && (
                                    <p className="text-muted-foreground mt-0.5 line-clamp-2">
                                      {inc.descricao}
                                    </p>
                                  )}
                                </td>
                                <td className="px-3 py-2.5 font-mono text-muted-foreground">
                                  {inc.horario_incidencia || '—'}
                                </td>
                                <td className="px-3 py-2.5 hidden sm:table-cell">
                                  {sev ? (
                                    <Badge
                                      variant="outline"
                                      className="text-[10px]"
                                      style={
                                        sev.cor
                                          ? { borderColor: sev.cor, color: sev.cor }
                                          : undefined
                                      }
                                    >
                                      {sev.titulo}
                                    </Badge>
                                  ) : (
                                    <span className="text-muted-foreground">—</span>
                                  )}
                                </td>
                                <td className="px-3 py-2.5 hidden md:table-cell">
                                  {imp ? (
                                    <Badge variant="outline" className="text-[10px]">
                                      {imp.titulo}
                                    </Badge>
                                  ) : (
                                    <span className="text-muted-foreground">—</span>
                                  )}
                                </td>
                                <td className="px-3 py-2.5 hidden md:table-cell">
                                  {cat ? (
                                    <span className="text-muted-foreground">{cat.titulo}</span>
                                  ) : (
                                    <span className="text-muted-foreground">—</span>
                                  )}
                                </td>
                                <td className="px-3 py-2.5 font-mono text-muted-foreground hidden lg:table-cell">
                                  {inc.tempo_incidencia || '—'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <DialogFooter className={`mt-4 ${navigation ? 'sm:justify-between' : ''}`}>
              {navigation && <ModalNavigation {...navigation} />}
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  {readOnly ? 'Fechar' : 'Cancelar'}
                </Button>
                {!readOnly && (
                  <Button type="submit" className="gradient-primary hover:opacity-90">
                    Salvar
                  </Button>
                )}
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de registo de incidência, ligado a esta janela */}
      {data?.id && (
        <IncidenciaGravacaoFormModal
          isOpen={showIncForm}
          onClose={() => setShowIncForm(false)}
          defaultJanelaId={data.id}
          onSave={async () => {
            setShowIncForm(false);
            if (data.id) void loadIncidencias(data.id);
          }}
        />
      )}
    </>
  );
};

export default JanelaFormModal;
