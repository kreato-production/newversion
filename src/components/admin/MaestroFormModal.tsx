'use client';

import { useEffect, useRef, useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Paperclip, X, FileText, Play } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ColorPicker } from '@/components/shared/ColorPicker';
import { ModalNavigation, type ModalNavigationProps } from '@/components/shared/ModalNavigation';
import type { Maestro, SaveMaestroInput, EsquemaTipo } from '@/modules/maestro/maestro.api';
import { CodeEditor, linguagemToLang } from '@/components/ui/CodeEditor';
import type { ExecResultPayload } from '@/components/admin/ExecResultDialog';

// ─── Types ────────────────────────────────────────────────────────────────────

type Anexo = { name: string; url: string; size: number };

interface MaestroFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: SaveMaestroInput) => Promise<void>;
  onExecute?: (id: string) => Promise<ExecResultPayload>;
  data?: Maestro | null;
  navigation?: ModalNavigationProps;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LINGUAGENS = ['API', 'JSON', 'XML', 'HTML', 'YAML', 'Outro'];

const MODULOS_SISTEMA: { grupo: string; modulos: string[] }[] = [
  {
    grupo: 'Produção',
    modulos: [
      'Programas',
      'Conteúdo',
      'Templates',
      'Gravação',
      'Tarefas',
      'Incidências de Gravação',
      'Mapas',
      'Grelha de Programação',
    ],
  },
  {
    grupo: 'Recursos',
    modulos: [
      'Recursos Humanos',
      'Recursos Técnicos',
      'Recursos Físicos',
      'Fornecedores',
      'Pessoas',
      'Escalas',
      'Espaços',
    ],
  },
  {
    grupo: 'Financeiro',
    modulos: ['Contas a Pagar', 'Apropriação de Custos', 'Orçamento'],
  },
  {
    grupo: 'Administração',
    modulos: [
      'Unidades de Negócio',
      'Centros de Custos',
      'Usuários',
      'Perfis de Acesso',
      'Formulários',
      'Maestro',
    ],
  },
];

const AUTH_TIPOS = [
  'Inherit auth from parent',
  'No Auth',
  'Basic Auth',
  'Bearer Token',
  'JWT Bearer',
  'Digest Auth',
  'OAuth 1.0',
  'OAuth 2.0',
  'Hawk Authentication',
  'AWS Signature',
  'NTLM Authentication',
  'API Key',
  'Akamai EdgeGrid',
  'ASAP (Atlassian)',
];

const DIAS_SEMANA = [
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' },
  { value: 0, label: 'Domingo' },
];

const EMPTY: SaveMaestroInput = {
  codigoExterno: '',
  nome: '',
  cor: '#6366f1',
  status: 'Ativo',
  tipo: 'Provys - API Rest',
  modulo: null,
  descricao: '',
  endpoint: '',
  authTipo: 'No Auth',
  authUsuario: '',
  authSenha: '',
  jsonChamada: '',
  jsonLinguagem: 'JSON',
  esquemaTipo: null,
  esquemaDataInicio: '',
  esquemaHoraInicio: '',
  esquemaDias: null,
  esquemaDiasSemana: [],
};

// ─── Component ────────────────────────────────────────────────────────────────

export function MaestroFormModal({
  isOpen,
  onClose,
  onSave,
  onExecute,
  data,
  navigation,
}: MaestroFormModalProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<SaveMaestroInput & { id?: string }>(EMPTY);
  const [anexos, setAnexos] = useState<Anexo[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [ultimaExecucao, setUltimaExecucao] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (data) {
      setUltimaExecucao(data.ultimaExecucao ?? null);
      setForm({
        id: data.id,
        codigoExterno: data.codigoExterno ?? '',
        nome: data.nome ?? '',
        cor: data.cor ?? '#6366f1',
        status: data.status ?? 'Ativo',
        tipo: data.tipo ?? 'Provys - API Rest',
        modulo: data.modulo ?? null,
        descricao: data.descricao ?? '',
        endpoint: data.endpoint ?? '',
        authTipo: data.authTipo ?? 'No Auth',
        authUsuario: data.authUsuario ?? '',
        authSenha: data.authSenha ?? '',
        jsonChamada: data.jsonChamada ?? '',
        jsonLinguagem: data.jsonLinguagem ?? 'JSON',
        esquemaTipo: data.esquemaTipo ?? null,
        esquemaDataInicio: data.esquemaDataInicio ?? '',
        esquemaHoraInicio: data.esquemaHoraInicio ?? '',
        esquemaDias: data.esquemaDias ?? null,
        esquemaDiasSemana: data.esquemaDiasSemana ?? [],
      });
    } else {
      setUltimaExecucao(null);
      setForm({ ...EMPTY });
      setAnexos([]);
    }
  }, [isOpen, data]);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const toggleDiaSemana = (dia: number) => {
    const current = form.esquemaDiasSemana ?? [];
    const next = current.includes(dia) ? current.filter((d) => d !== dia) : [...current, dia];
    set('esquemaDiasSemana', next);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAnexos((prev) => [...prev, { name: file.name, url, size: file.size }]);
    e.target.value = '';
  };

  const handleSubmit = async () => {
    if (!form.nome.trim()) return;
    setIsSaving(true);
    try {
      await onSave(form);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleExecute = async () => {
    if (!form.id || !onExecute) return;
    setIsExecuting(true);
    try {
      const res = await onExecute(form.id);
      setUltimaExecucao(res.ultimaExecucao);
    } finally {
      setIsExecuting(false);
    }
  };

  const isEditing = Boolean(data?.id);
  const esquemaTipo = form.esquemaTipo as EsquemaTipo | null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            {form.cor && (
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: form.cor }}
              />
            )}
            {isEditing ? 'Editar Maestro' : 'Novo Maestro'}
            {isEditing && data?.status && (
              <Badge variant={data.status === 'Ativo' ? 'default' : 'secondary'} className="ml-2">
                {data.status}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="geral" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="shrink-0 mx-0 w-fit">
            <TabsTrigger value="geral">Geral</TabsTrigger>
            <TabsTrigger value="esquema">Esquema de Execução</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto pr-1">
            {/* ── Aba Geral ── */}
            <TabsContent value="geral" className="mt-4 space-y-4">
              {/* Id + Código externo */}
              <div className="grid grid-cols-2 gap-4">
                {isEditing && (
                  <div className="space-y-1">
                    <Label className="text-xs">ID (automático)</Label>
                    <Input value={data?.id ?? ''} readOnly className="bg-muted text-xs" />
                  </div>
                )}
                <div className="space-y-1">
                  <Label className="text-xs">Código Externo</Label>
                  <Input
                    value={form.codigoExterno ?? ''}
                    onChange={(e) => set('codigoExterno', e.target.value)}
                    placeholder="Código externo"
                    className="text-xs"
                  />
                </div>
              </div>

              {/* Nome */}
              <div className="space-y-1">
                <Label className="text-xs">Nome *</Label>
                <Input
                  value={form.nome}
                  onChange={(e) => set('nome', e.target.value)}
                  placeholder="Nome da tarefa automática"
                  className="text-xs"
                />
              </div>

              {/* Cor */}
              <div className="space-y-1">
                <Label className="text-xs">Cor</Label>
                <ColorPicker
                  value={form.cor ?? '#6366f1'}
                  onChange={(cor) => set('cor', cor)}
                  previewLabel={form.nome}
                />
              </div>

              {/* Status + Tipo */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs">Status</Label>
                  <Select
                    value={form.status}
                    onValueChange={(v) => set('status', v as 'Ativo' | 'Inativo')}
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ativo">Ativo</SelectItem>
                      <SelectItem value="Inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Tipo</Label>
                  <Select value={form.tipo} onValueChange={(v) => set('tipo', v)}>
                    <SelectTrigger className="text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Provys - API Rest">Provys - API Rest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Módulo do sistema */}
              <div className="space-y-1">
                <Label className="text-xs">Módulo</Label>
                <Select value={form.modulo ?? ''} onValueChange={(v) => set('modulo', v || null)}>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Selecione o módulo relacionado..." />
                  </SelectTrigger>
                  <SelectContent>
                    {MODULOS_SISTEMA.map(({ grupo, modulos }) => (
                      <SelectGroup key={grupo}>
                        <SelectLabel className="text-[10px] uppercase tracking-wider text-muted-foreground px-2">
                          {grupo}
                        </SelectLabel>
                        {modulos.map((m) => (
                          <SelectItem key={m} value={m}>
                            {m}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Endpoint + Auth (Provys - API Rest) */}
              {form.tipo === 'Provys - API Rest' && (
                <div className="space-y-4 rounded-md border p-3 bg-muted/20">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Configuração da API
                  </p>

                  {/* Endpoint URL */}
                  <div className="space-y-1">
                    <Label className="text-xs">Endpoint (URL)</Label>
                    <Input
                      value={form.endpoint ?? ''}
                      onChange={(e) => set('endpoint', e.target.value)}
                      placeholder="https://api.exemplo.com/endpoint"
                      className="text-xs font-mono"
                    />
                  </div>

                  {/* Auth Type */}
                  <div className="space-y-1">
                    <Label className="text-xs">Tipo de Autorização</Label>
                    <Select
                      value={form.authTipo ?? 'No Auth'}
                      onValueChange={(v) => {
                        set('authTipo', v);
                        if (v !== 'Basic Auth') {
                          set('authUsuario', '');
                          set('authSenha', '');
                        }
                      }}
                    >
                      <SelectTrigger className="text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AUTH_TIPOS.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Basic Auth credentials */}
                  {form.authTipo === 'Basic Auth' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs">Usuário</Label>
                        <Input
                          value={form.authUsuario ?? ''}
                          onChange={(e) => set('authUsuario', e.target.value)}
                          placeholder="Usuário"
                          autoComplete="off"
                          className="text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Senha</Label>
                        <Input
                          type="password"
                          value={form.authSenha ?? ''}
                          onChange={(e) => set('authSenha', e.target.value)}
                          placeholder="Senha"
                          autoComplete="new-password"
                          className="text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Descrição */}
              <div className="space-y-1">
                <Label className="text-xs">Descrição</Label>
                <Textarea
                  value={form.descricao ?? ''}
                  onChange={(e) => set('descricao', e.target.value)}
                  placeholder="Breve descrição sobre a tarefa automática"
                  rows={3}
                  className="text-xs resize-none"
                />
              </div>

              {/* Json da chamada + linguagem */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">JSON da Chamada</Label>
                  <Select
                    value={form.jsonLinguagem ?? 'JSON'}
                    onValueChange={(v) => set('jsonLinguagem', v)}
                  >
                    <SelectTrigger className="h-6 text-xs w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LINGUAGENS.map((l) => (
                        <SelectItem key={l} value={l}>
                          {l}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <CodeEditor
                  value={form.jsonChamada ?? ''}
                  onChange={(v) => set('jsonChamada', v)}
                  language={linguagemToLang(form.jsonLinguagem)}
                  placeholder={`Sintaxe da API (${form.jsonLinguagem ?? 'JSON'})`}
                  minHeight={160}
                />
              </div>

              {/* Anexos */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Anexos</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-6 text-xs gap-1"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip className="w-3 h-3" />
                    Adicionar
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
                {anexos.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">Nenhum anexo adicionado.</p>
                ) : (
                  <div className="space-y-1">
                    {anexos.map((a, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 py-1 px-2 rounded border bg-muted/30"
                      >
                        <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span className="text-xs flex-1 truncate">{a.name}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {(a.size / 1024).toFixed(0)} KB
                        </span>
                        <button
                          type="button"
                          onClick={() => setAnexos((prev) => prev.filter((_, j) => j !== i))}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Dados de cadastro + última execução (readonly) */}
              {isEditing && (
                <div className="space-y-3 pt-2 border-t">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Data de Cadastro</Label>
                      <Input
                        value={
                          data?.createdAt
                            ? new Date(data.createdAt).toLocaleDateString('pt-BR')
                            : '-'
                        }
                        readOnly
                        className="bg-muted text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Usuário de Cadastro</Label>
                      <Input
                        value={data?.createdByNome ?? user?.nome ?? '-'}
                        readOnly
                        className="bg-muted text-xs"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Última Execução</Label>
                    <Input
                      value={
                        ultimaExecucao
                          ? new Date(ultimaExecucao).toLocaleString('pt-BR')
                          : 'Nunca executado'
                      }
                      readOnly
                      className="bg-muted text-xs"
                    />
                  </div>
                </div>
              )}
            </TabsContent>

            {/* ── Aba Esquema de Execução ── */}
            <TabsContent value="esquema" className="mt-4 space-y-4">
              {/* Tipo de esquema */}
              <div className="space-y-1">
                <Label className="text-xs">Tipo de Execução</Label>
                <Select
                  value={esquemaTipo ?? ''}
                  onValueChange={(v) => {
                    set('esquemaTipo', (v || null) as EsquemaTipo | null);
                    set('esquemaDiasSemana', []);
                    set('esquemaDias', null);
                  }}
                >
                  <SelectTrigger className="text-xs w-48">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-vez">1 Vez</SelectItem>
                    <SelectItem value="diario">Diário</SelectItem>
                    <SelectItem value="semanal">Semanal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Campos comuns a todos os tipos */}
              {esquemaTipo && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs">Data de Início</Label>
                    <Input
                      type="date"
                      value={form.esquemaDataInicio ?? ''}
                      onChange={(e) => set('esquemaDataInicio', e.target.value)}
                      className="text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Horário de Início</Label>
                    <Input
                      type="time"
                      value={form.esquemaHoraInicio ?? ''}
                      onChange={(e) => set('esquemaHoraInicio', e.target.value)}
                      className="text-xs"
                    />
                  </div>
                </div>
              )}

              {/* Dias (Diário ou Semanal) */}
              {(esquemaTipo === 'diario' || esquemaTipo === 'semanal') && (
                <div className="space-y-1">
                  <Label className="text-xs">Repetir a cada (dias)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={form.esquemaDias ?? ''}
                    onChange={(e) =>
                      set('esquemaDias', e.target.value ? Number(e.target.value) : null)
                    }
                    placeholder="Ex: 1 = todo dia, 2 = a cada 2 dias"
                    className="text-xs w-64"
                  />
                </div>
              )}

              {/* Dias da semana (Semanal) */}
              {esquemaTipo === 'semanal' && (
                <div className="space-y-2">
                  <Label className="text-xs">Dias da Semana</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {DIAS_SEMANA.map(({ value, label }) => (
                      <label
                        key={value}
                        className="flex items-center gap-2 py-1.5 px-3 rounded border cursor-pointer hover:bg-muted/50 transition-colors text-xs"
                      >
                        <Checkbox
                          checked={(form.esquemaDiasSemana ?? []).includes(value)}
                          onCheckedChange={() => toggleDiaSemana(value)}
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {!esquemaTipo && (
                <p className="text-xs text-muted-foreground italic">
                  Selecione um tipo de execução para configurar o agendamento.
                </p>
              )}
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="shrink-0 pt-2 border-t">
          {navigation && <ModalNavigation {...navigation} />}
          <div className="flex-1" />
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSaving || isExecuting}
            className="text-xs"
          >
            Cancelar
          </Button>
          {isEditing && onExecute && (
            <Button
              variant="secondary"
              onClick={handleExecute}
              disabled={isSaving || isExecuting || form.status === 'Inativo'}
              title={
                form.status === 'Inativo' ? 'Tarefa inativa não pode ser executada' : undefined
              }
              className="text-xs gap-1.5"
            >
              {isExecuting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5" />
              )}
              {isExecuting ? 'Executando…' : 'Executar Agora'}
            </Button>
          )}
          <Button
            onClick={handleSubmit}
            disabled={isSaving || isExecuting || !form.nome.trim()}
            className="text-xs"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
            {isEditing ? 'Salvar Alterações' : 'Cadastrar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
