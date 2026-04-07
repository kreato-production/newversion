import { useEffect, useMemo, useRef, useState } from 'react';
import { differenceInDays, format, isWithinInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AlertCircle,
  CalendarOff,
  Clock,
  FileText,
  Loader2,
  Plus,
  Trash2,
  Upload,
  User,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SearchableSelect } from '@/components/shared/SearchableSelect';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { usePermissions } from '@/hooks/usePermissions';
import { recursosHumanosRepository } from '@/modules/recursos-humanos/recursos-humanos.repository.provider';
import { ModalNavigation, type ModalNavigationProps } from '@/components/shared/ModalNavigation';
import type {
  Anexo,
  Ausencia,
  Escala,
  RecursoHumano,
  RecursoHumanoInput,
  RecursoHumanoOptions,
} from '@/modules/recursos-humanos/recursos-humanos.types';

const DIAS = [
  { value: 0, label: 'Dom' },
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sab' },
];
const MOTIVOS = [
  'Ferias',
  'Folga',
  'Licenca Maternidade',
  'Licenca Paternidade',
  'Curso Externo',
  'Viagem de Trabalho',
];
const Asterisk = () => <span className="text-destructive ml-0.5">*</span>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: RecursoHumanoInput) => Promise<void>;
  data?: RecursoHumano | null;
  readOnly?: boolean;
  navigation?: ModalNavigationProps;
}

const emptyForm = (): RecursoHumanoInput => ({
  codigoExterno: '',
  nome: '',
  sobrenome: '',
  foto: '',
  dataNascimento: '',
  sexo: '',
  telefone: '',
  email: '',
  departamento: '',
  departamentoId: '',
  funcao: '',
  funcaoId: '',
  custoHora: 0,
  dataContratacao: '',
  status: 'Ativo',
  anexos: [],
  ausencias: [],
  escalas: [],
});

export function RecursoHumanoFormModal({ isOpen, onClose, onSave, data, readOnly = false, navigation }: Props) {
  const { isVisible } = usePermissions();
  const fotoInputRef = useRef<HTMLInputElement>(null);
  const anexoInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState('dados');
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [options, setOptions] = useState<RecursoHumanoOptions>({
    departamentos: [],
    funcoes: [],
    departamentoFuncoes: [],
  });
  const [formData, setFormData] = useState<RecursoHumanoInput>(emptyForm());
  const [novaAusencia, setNovaAusencia] = useState({ motivo: '', dataInicio: '', dataFim: '' });
  const [novaEscala, setNovaEscala] = useState({
    dataInicio: '',
    horaInicio: '',
    dataFim: '',
    horaFim: '',
    diasSemana: [1, 2, 3, 4, 5] as number[],
  });

  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;
    setLoadingOptions(true);
    recursosHumanosRepository
      .listOptions()
      .then((value) => mounted && setOptions(value))
      .catch((error) => {
        console.error('Error fetching recursos humanos options:', error);
        toast.error(`Erro ao carregar departamentos e funcoes: ${(error as Error).message}`);
      })
      .finally(() => mounted && setLoadingOptions(false));
    return () => {
      mounted = false;
    };
  }, [isOpen]);

  useEffect(() => {
    setFormData(
      data
        ? {
            id: data.id,
            codigoExterno: data.codigoExterno || '',
            nome: data.nome,
            sobrenome: data.sobrenome,
            foto: data.foto || '',
            dataNascimento: data.dataNascimento || '',
            sexo: data.sexo || '',
            telefone: data.telefone || '',
            email: data.email || '',
            departamento: data.departamento || '',
            departamentoId: data.departamentoId || '',
            funcao: data.funcao || '',
            funcaoId: data.funcaoId || '',
            custoHora: data.custoHora || 0,
            dataContratacao: data.dataContratacao || '',
            status: data.status,
            anexos: data.anexos || [],
            ausencias: data.ausencias || [],
            escalas: data.escalas || [],
          }
        : emptyForm(),
    );
    setActiveTab('dados');
    setNovaAusencia({ motivo: '', dataInicio: '', dataFim: '' });
    setNovaEscala({
      dataInicio: '',
      horaInicio: '',
      dataFim: '',
      horaFim: '',
      diasSemana: [1, 2, 3, 4, 5],
    });
  }, [data, isOpen]);

  const funcoesDisponiveis = useMemo(() => {
    if (!formData.departamentoId) return [];
    const ids = new Set(
      options.departamentoFuncoes
        .filter((item) => item.departamentoId === formData.departamentoId)
        .map((item) => item.funcaoId),
    );
    return options.funcoes.filter((funcao) => ids.has(funcao.id));
  }, [formData.departamentoId, options]);

  const diasCalculados = useMemo(() => {
    if (!novaAusencia.dataInicio || !novaAusencia.dataFim) return 0;
    const inicio = parseISO(novaAusencia.dataInicio);
    const fim = parseISO(novaAusencia.dataFim);
    return fim < inicio ? 0 : differenceInDays(fim, inicio) + 1;
  }, [novaAusencia]);

  const ausenciasOrdenadas = useMemo(
    () =>
      [...formData.ausencias].sort(
        (a, b) => parseISO(a.dataInicio).getTime() - parseISO(b.dataInicio).getTime(),
      ),
    [formData.ausencias],
  );
  const escalasOrdenadas = useMemo(
    () =>
      [...formData.escalas].sort(
        (a, b) =>
          new Date(`${a.dataInicio}T${a.horaInicio}`).getTime() -
          new Date(`${b.dataInicio}T${b.horaInicio}`).getTime(),
      ),
    [formData.escalas],
  );

  const onField = <K extends keyof RecursoHumanoInput>(field: K, value: RecursoHumanoInput[K]) =>
    setFormData((current) => ({ ...current, [field]: value }));

  const addAusencia = () => {
    if (!novaAusencia.motivo || !novaAusencia.dataInicio || !novaAusencia.dataFim)
      return toast.error('Preencha todos os campos da ausencia');
    if (parseISO(novaAusencia.dataFim) < parseISO(novaAusencia.dataInicio))
      return toast.error('A data final deve ser maior ou igual a inicial');
    const sobrepoe = formData.ausencias.some((item) => {
      const inicio = parseISO(item.dataInicio);
      const fim = parseISO(item.dataFim);
      const novoInicio = parseISO(novaAusencia.dataInicio);
      const novoFim = parseISO(novaAusencia.dataFim);
      return (
        isWithinInterval(novoInicio, { start: inicio, end: fim }) ||
        isWithinInterval(novoFim, { start: inicio, end: fim }) ||
        isWithinInterval(inicio, { start: novoInicio, end: novoFim }) ||
        isWithinInterval(fim, { start: novoInicio, end: novoFim })
      );
    });
    if (sobrepoe) return toast.error('As datas informadas se sobrepoem a uma ausencia existente');
    onField('ausencias', [
      ...formData.ausencias,
      {
        id: crypto.randomUUID(),
        motivo: novaAusencia.motivo,
        dataInicio: novaAusencia.dataInicio,
        dataFim: novaAusencia.dataFim,
        dias: diasCalculados,
      },
    ]);
    setNovaAusencia({ motivo: '', dataInicio: '', dataFim: '' });
  };

  const addEscala = () => {
    if (
      !novaEscala.dataInicio ||
      !novaEscala.horaInicio ||
      !novaEscala.dataFim ||
      !novaEscala.horaFim
    )
      return toast.error('Preencha todos os campos da escala');
    if (
      new Date(`${novaEscala.dataFim}T${novaEscala.horaFim}`) <=
      new Date(`${novaEscala.dataInicio}T${novaEscala.horaInicio}`)
    )
      return toast.error('A data/hora final deve ser posterior a inicial');
    if (novaEscala.diasSemana.length === 0)
      return toast.error('Selecione pelo menos um dia da semana');
    const sobrepoe = formData.escalas.some((item) => {
      const dataOverlap =
        new Date(novaEscala.dataInicio) <= new Date(item.dataFim) &&
        new Date(novaEscala.dataFim) >= new Date(item.dataInicio);
      if (!dataOverlap) return false;
      const diasComuns = novaEscala.diasSemana.some((dia) =>
        (item.diasSemana || [1, 2, 3, 4, 5]).includes(dia),
      );
      if (!diasComuns) return false;
      const [nhi, nmi] = novaEscala.horaInicio.split(':').map(Number);
      const [nhf, nmf] = novaEscala.horaFim.split(':').map(Number);
      const [ihi, imi] = item.horaInicio.split(':').map(Number);
      const [ihf, imf] = item.horaFim.split(':').map(Number);
      return nhi * 60 + nmi < ihf * 60 + imf && nhf * 60 + nmf > ihi * 60 + imi;
    });
    if (sobrepoe) return toast.error('O periodo informado se sobrepoe a uma escala existente');
    onField('escalas', [...formData.escalas, { id: crypto.randomUUID(), ...novaEscala }]);
    setNovaEscala({
      dataInicio: '',
      horaInicio: '',
      dataFim: '',
      horaFim: '',
      diasSemana: [1, 2, 3, 4, 5],
    });
  };

  const uploadFoto = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast.error('Selecione uma imagem PNG ou JPG');
    if (file.size > 2 * 1024 * 1024) return toast.error('A foto deve ter no maximo 2MB');
    const reader = new FileReader();
    reader.onload = (loadEvent) => onField('foto', loadEvent.target?.result as string);
    reader.readAsDataURL(file);
  };

  const uploadAnexos = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      if (file.size > 2 * 1024 * 1024)
        return toast.error(`${file.name}: o arquivo deve ter no maximo 2MB`);
      const reader = new FileReader();
      reader.onload = (loadEvent) =>
        onField('anexos', [
          ...formData.anexos,
          {
            id: crypto.randomUUID(),
            nome: file.name,
            tipo: file.type,
            tamanho: file.size,
            dataUrl: loadEvent.target?.result as string,
          },
        ]);
      reader.readAsDataURL(file);
    });
    if (anexoInputRef.current) anexoInputRef.current.value = '';
  };

  const submit = async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!formData.nome.trim() || !formData.sobrenome.trim())
      return toast.error('Nome e sobrenome sao obrigatorios');
    setSaving(true);
    try {
      const funcao = funcoesDisponiveis.find((item) => item.id === formData.funcaoId);
      await onSave({ ...formData, funcao: funcao?.nome || formData.funcao || '' });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const fileSize = (bytes: number) =>
    bytes < 1024
      ? `${bytes} B`
      : bytes < 1024 * 1024
        ? `${(bytes / 1024).toFixed(1)} KB`
        : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[900px] max-w-[900px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{data ? 'Editar Colaborador' : 'Novo Colaborador'}</DialogTitle>
          <DialogDescription>Preencha os dados do colaborador.</DialogDescription>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dados">Dados Pessoais</TabsTrigger>
            {isVisible('Recursos', 'Recursos Humanos', '-', 'Tabulador "Ausencias"') && (
              <TabsTrigger value="ausencias">Ausencias</TabsTrigger>
            )}
            <TabsTrigger value="escalas">Escalas</TabsTrigger>
          </TabsList>

          <TabsContent value="dados" className="mt-4">
            <form onSubmit={submit} className="space-y-4">
              <div className="flex gap-6">
                <div className="flex flex-col items-center gap-2">
                  <Label>Foto</Label>
                  <div
                    className="w-28 h-28 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden cursor-pointer bg-muted/30"
                    onClick={() => !readOnly && fotoInputRef.current?.click()}
                  >
                    {formData.foto ? (
                      <img src={formData.foto} alt="Foto" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-10 h-10 text-muted-foreground/50" />
                    )}
                  </div>
                  <input
                    ref={fotoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    className="hidden"
                    onChange={uploadFoto}
                    disabled={readOnly}
                  />
                  {!readOnly && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => fotoInputRef.current?.click()}
                    >
                      <Upload className="w-3 h-3 mr-1" />
                      Upload
                    </Button>
                  )}
                </div>

                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Codigo Externo</Label>
                      <Input
                        value={formData.codigoExterno}
                        onChange={(e) => onField('codigoExterno', e.target.value)}
                        disabled={readOnly}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>
                        Nome <Asterisk />
                      </Label>
                      <Input
                        value={formData.nome}
                        onChange={(e) => onField('nome', e.target.value)}
                        disabled={readOnly}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>
                        Sobrenome <Asterisk />
                      </Label>
                      <Input
                        value={formData.sobrenome}
                        onChange={(e) => onField('sobrenome', e.target.value)}
                        disabled={readOnly}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Data de Nascimento</Label>
                      <Input
                        type="date"
                        value={formData.dataNascimento}
                        onChange={(e) => onField('dataNascimento', e.target.value)}
                        disabled={readOnly}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Sexo</Label>
                      <SearchableSelect
                        options={[
                          { value: 'Masculino', label: 'Masculino' },
                          { value: 'Feminino', label: 'Feminino' },
                          { value: 'Outro', label: 'Outro' },
                        ]}
                        value={formData.sexo}
                        onValueChange={(value) => onField('sexo', value)}
                        placeholder="Selecione..."
                        disabled={readOnly}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Telefone</Label>
                      <Input
                        value={formData.telefone}
                        onChange={(e) => onField('telefone', e.target.value)}
                        disabled={readOnly}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => onField('email', e.target.value)}
                        disabled={readOnly}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Data de Contratacao</Label>
                      <Input
                        type="date"
                        value={formData.dataContratacao}
                        onChange={(e) => onField('dataContratacao', e.target.value)}
                        disabled={readOnly}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Custo/Hora</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.custoHora}
                        onChange={(e) => onField('custoHora', parseFloat(e.target.value) || 0)}
                        disabled={readOnly}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Departamento</Label>
                      <SearchableSelect
                        options={options.departamentos.map((item) => ({
                          value: item.id,
                          label: item.nome,
                        }))}
                        value={formData.departamentoId}
                        onValueChange={(value) => {
                          const item = options.departamentos.find(
                            (current) => current.id === value,
                          );
                          setFormData((current) => ({
                            ...current,
                            departamentoId: value,
                            departamento: item?.nome || '',
                            funcaoId: '',
                            funcao: '',
                          }));
                        }}
                        placeholder={loadingOptions ? 'Carregando...' : 'Selecione...'}
                        searchPlaceholder="Pesquisar departamento..."
                        disabled={readOnly || loadingOptions}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Funcao</Label>
                      <SearchableSelect
                        options={funcoesDisponiveis.map((item) => ({
                          value: item.id,
                          label: item.nome,
                        }))}
                        value={formData.funcaoId}
                        onValueChange={(value) => {
                          const item = funcoesDisponiveis.find((current) => current.id === value);
                          setFormData((current) => ({
                            ...current,
                            funcaoId: value,
                            funcao: item?.nome || '',
                          }));
                        }}
                        placeholder={
                          !formData.departamentoId
                            ? 'Selecione um departamento primeiro'
                            : loadingOptions
                              ? 'Carregando...'
                              : 'Selecione...'
                        }
                        searchPlaceholder="Pesquisar funcao..."
                        disabled={readOnly || loadingOptions || !formData.departamentoId}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>
                        Status <Asterisk />
                      </Label>
                      <SearchableSelect
                        options={[
                          { value: 'Ativo', label: 'Ativo' },
                          { value: 'Inativo', label: 'Inativo' },
                        ]}
                        value={formData.status}
                        onValueChange={(value) => onField('status', value as 'Ativo' | 'Inativo')}
                        placeholder="Selecione..."
                        disabled={readOnly}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Anexos (max. 2MB por arquivo)</Label>
                        {!readOnly && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => anexoInputRef.current?.click()}
                          >
                            <Upload className="w-3 h-3 mr-1" />
                            Adicionar
                          </Button>
                        )}
                      </div>
                      <input
                        ref={anexoInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={uploadAnexos}
                        disabled={readOnly}
                      />
                      <div className="border rounded-lg p-2 space-y-1 max-h-28 overflow-y-auto">
                        {formData.anexos.length > 0 ? (
                          formData.anexos.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between text-sm bg-muted/30 rounded p-2"
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                <span className="truncate">{item.nome}</span>
                                <span className="text-xs text-muted-foreground flex-shrink-0">
                                  ({fileSize(item.tamanho)})
                                </span>
                              </div>
                              {!readOnly && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-destructive hover:text-destructive"
                                  onClick={() =>
                                    onField(
                                      'anexos',
                                      formData.anexos.filter((current) => current.id !== item.id),
                                    )
                                  }
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="text-center text-sm text-muted-foreground border-dashed py-3">
                            Nenhum anexo adicionado
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter className={navigation ? 'sm:justify-between' : undefined}>
                {navigation && <ModalNavigation {...navigation} />}
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={onClose}>
                    {readOnly ? 'Fechar' : 'Cancelar'}
                  </Button>
                  {!readOnly && (
                    <Button
                      type="submit"
                      className="gradient-primary hover:opacity-90"
                      disabled={saving}
                    >
                      {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Salvar
                    </Button>
                  )}
                </div>
              </DialogFooter>
            </form>
          </TabsContent>

          {isVisible('Recursos', 'Recursos Humanos', '-', 'Tabulador "Ausencias"') && (
            <TabsContent value="ausencias" className="mt-4 space-y-4">
              <div className="border rounded-lg p-4 bg-muted/20">
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Adicionar Periodo de Ausencia
                </h4>
                <div className="grid grid-cols-4 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Motivo</Label>
                    <SearchableSelect
                      options={MOTIVOS.map((item) => ({ value: item, label: item }))}
                      value={novaAusencia.motivo}
                      onValueChange={(value) =>
                        setNovaAusencia((current) => ({ ...current, motivo: value }))
                      }
                      placeholder="Selecione..."
                      searchPlaceholder="Pesquisar motivo..."
                      disabled={readOnly}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Data Inicio</Label>
                    <Input
                      type="date"
                      value={novaAusencia.dataInicio}
                      onChange={(e) =>
                        setNovaAusencia((current) => ({ ...current, dataInicio: e.target.value }))
                      }
                      disabled={readOnly}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Data Fim</Label>
                    <Input
                      type="date"
                      value={novaAusencia.dataFim}
                      onChange={(e) =>
                        setNovaAusencia((current) => ({ ...current, dataFim: e.target.value }))
                      }
                      disabled={readOnly}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Dias</Label>
                    <div className="flex items-center gap-2">
                      <Input type="number" value={diasCalculados} disabled className="bg-muted" />
                      {!readOnly && (
                        <Button
                          type="button"
                          onClick={addAusencia}
                          disabled={
                            !novaAusencia.motivo ||
                            !novaAusencia.dataInicio ||
                            !novaAusencia.dataFim
                          }
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              {ausenciasOrdenadas.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Motivo</TableHead>
                        <TableHead>Data Inicio</TableHead>
                        <TableHead>Data Fim</TableHead>
                        <TableHead className="text-center">Dias</TableHead>
                        <TableHead className="w-16" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ausenciasOrdenadas.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.motivo}</TableCell>
                          <TableCell>
                            {format(parseISO(item.dataInicio), 'dd/MM/yyyy', { locale: ptBR })}
                          </TableCell>
                          <TableCell>
                            {format(parseISO(item.dataFim), 'dd/MM/yyyy', { locale: ptBR })}
                          </TableCell>
                          <TableCell className="text-center">{item.dias}</TableCell>
                          <TableCell>
                            {!readOnly && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() =>
                                  onField(
                                    'ausencias',
                                    formData.ausencias.filter((current) => current.id !== item.id),
                                  )
                                }
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="border rounded-lg p-8 text-center border-dashed">
                  <CalendarOff className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">Nenhuma ausencia cadastrada</p>
                </div>
              )}
              <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>O sistema nao permite cadastrar ausencias com datas sobrepostas.</p>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                {!readOnly && (
                  <Button
                    type="button"
                    className="gradient-primary hover:opacity-90"
                    onClick={() => void submit()}
                    disabled={saving}
                  >
                    {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Salvar
                  </Button>
                )}
              </DialogFooter>
            </TabsContent>
          )}

          <TabsContent value="escalas" className="mt-4 space-y-4">
            <div className="border rounded-lg p-4 bg-muted/20">
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Adicionar Escala de Trabalho
              </h4>
              <div className="grid grid-cols-5 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Data Inicio</Label>
                  <Input
                    type="date"
                    value={novaEscala.dataInicio}
                    onChange={(e) =>
                      setNovaEscala((current) => ({ ...current, dataInicio: e.target.value }))
                    }
                    disabled={readOnly}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Hora Inicio</Label>
                  <Input
                    type="time"
                    value={novaEscala.horaInicio}
                    onChange={(e) =>
                      setNovaEscala((current) => ({ ...current, horaInicio: e.target.value }))
                    }
                    disabled={readOnly}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Data Fim</Label>
                  <Input
                    type="date"
                    value={novaEscala.dataFim}
                    onChange={(e) =>
                      setNovaEscala((current) => ({ ...current, dataFim: e.target.value }))
                    }
                    disabled={readOnly}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Hora Fim</Label>
                  <Input
                    type="time"
                    value={novaEscala.horaFim}
                    onChange={(e) =>
                      setNovaEscala((current) => ({ ...current, horaFim: e.target.value }))
                    }
                    disabled={readOnly}
                  />
                </div>
                <div className="flex items-end">
                  {!readOnly && (
                    <Button
                      type="button"
                      onClick={addEscala}
                      disabled={
                        !novaEscala.dataInicio ||
                        !novaEscala.horaInicio ||
                        !novaEscala.dataFim ||
                        !novaEscala.horaFim
                      }
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="mt-3 pt-3 border-t">
                <Label className="text-xs mb-2 block">Dias da Semana</Label>
                <div className="flex gap-4 flex-wrap">
                  {DIAS.map((dia) => (
                    <label key={dia.value} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={novaEscala.diasSemana.includes(dia.value)}
                        onCheckedChange={(checked) =>
                          setNovaEscala((current) => ({
                            ...current,
                            diasSemana: checked
                              ? [...current.diasSemana, dia.value].sort()
                              : current.diasSemana.filter((item) => item !== dia.value),
                          }))
                        }
                        disabled={readOnly}
                      />
                      <span className="text-sm">{dia.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            {escalasOrdenadas.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data Inicio</TableHead>
                      <TableHead>Hora Inicio</TableHead>
                      <TableHead>Data Fim</TableHead>
                      <TableHead>Hora Fim</TableHead>
                      <TableHead>Dias</TableHead>
                      <TableHead className="w-16" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {escalasOrdenadas.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          {format(parseISO(item.dataInicio), 'dd/MM/yyyy', { locale: ptBR })}
                        </TableCell>
                        <TableCell>{item.horaInicio}</TableCell>
                        <TableCell>
                          {format(parseISO(item.dataFim), 'dd/MM/yyyy', { locale: ptBR })}
                        </TableCell>
                        <TableCell>{item.horaFim}</TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {item.diasSemana.map((dia) => (
                              <span
                                key={dia}
                                className="px-1.5 py-0.5 text-[10px] bg-primary/10 text-primary rounded"
                              >
                                {DIAS.find((current) => current.value === dia)?.label}
                              </span>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          {!readOnly && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() =>
                                onField(
                                  'escalas',
                                  formData.escalas.filter((current) => current.id !== item.id),
                                )
                              }
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="border rounded-lg p-8 text-center border-dashed">
                <Clock className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">Nenhuma escala cadastrada</p>
              </div>
            )}
            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>O sistema nao permite cadastrar escalas com horarios sobrepostos.</p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              {!readOnly && (
                <Button
                  type="button"
                  className="gradient-primary hover:opacity-90"
                  onClick={() => void submit()}
                  disabled={saving}
                >
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Salvar
                </Button>
              )}
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
