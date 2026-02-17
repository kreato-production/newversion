import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
import { SearchableSelect } from '@/components/shared/SearchableSelect';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import type { RecursoHumano, Anexo, Ausencia, Escala } from '@/pages/recursos/RecursosHumanos';
import { Upload, X, User, FileText, Plus, Trash2, CalendarOff, AlertCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { differenceInDays, parseISO, isWithinInterval, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useFormFieldConfig, FieldAsterisk } from '@/hooks/useFormFieldConfig';

const DIAS_SEMANA = [
  { value: 0, label: 'Dom' },
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' },
];

const MOTIVOS_AUSENCIA = [
  'Férias',
  'Folga',
  'Licença Maternidade',
  'Licença Paternidade',
  'Curso Externo',
  'Viagem de Trabalho',
] as const;

interface RecursoHumanoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: RecursoHumano) => void;
  data?: RecursoHumano | null;
  readOnly?: boolean;
}

export const RecursoHumanoFormModal = ({
  isOpen,
  onClose,
  onSave,
  data,
  readOnly = false,
}: RecursoHumanoFormModalProps) => {
  const { user } = useAuth();
  const { isVisible } = usePermissions();
  const { getAsterisk } = useFormFieldConfig('recursoHumano');
  const [departamentos, setDepartamentos] = useState<{ id: string; nome: string }[]>([]);
  const [funcoes, setFuncoes] = useState<{ id: string; nome: string }[]>([]);
  const [funcoesDisponiveis, setFuncoesDisponiveis] = useState<{ id: string; nome: string }[]>([]);
  const [isLoadingFuncoes, setIsLoadingFuncoes] = useState(false);
  const fotoInputRef = useRef<HTMLInputElement>(null);
  const anexoInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState('dados');

  const [formData, setFormData] = useState({
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
    status: 'Ativo' as 'Ativo' | 'Inativo',
  });

  const [anexos, setAnexos] = useState<Anexo[]>([]);
  const [ausencias, setAusencias] = useState<Ausencia[]>([]);
  const [escalas, setEscalas] = useState<Escala[]>([]);

  // Estados para nova ausência
  const [novaAusencia, setNovaAusencia] = useState({
    motivo: '' as Ausencia['motivo'] | '',
    dataInicio: '',
    dataFim: '',
  });

  // Estados para nova escala
  const [novaEscala, setNovaEscala] = useState({
    dataInicio: '',
    horaInicio: '',
    dataFim: '',
    horaFim: '',
    diasSemana: [1, 2, 3, 4, 5] as number[], // Segunda a Sexta por padrão
  });

  // Load departments and all functions
  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const [depRes, funcoesRes] = await Promise.all([
          supabase.from('departamentos').select('id, nome').order('nome'),
          supabase.from('funcoes').select('id, nome').order('nome'),
        ]);
        setDepartamentos(depRes.data || []);
        setFuncoes(funcoesRes.data || []);
      } catch (err) {
        console.error('Error fetching dropdowns:', err);
      }
    };
    if (isOpen) {
      fetchDropdowns();
    }
  }, [isOpen]);

  // Load functions based on selected department
  useEffect(() => {
    const fetchFuncoesPorDepartamento = async () => {
      if (!formData.departamentoId) {
        setFuncoesDisponiveis([]);
        return;
      }

      setIsLoadingFuncoes(true);
      try {
        // Get function IDs associated with the department
        const { data: depFuncoes, error } = await supabase
          .from('departamento_funcoes')
          .select('funcao_id')
          .eq('departamento_id', formData.departamentoId);

        if (error) throw error;

        if (depFuncoes && depFuncoes.length > 0) {
          const funcaoIds = depFuncoes.map((df) => df.funcao_id);
          // Filter available functions based on department association
          const funcoesDoDepto = funcoes.filter((f) => funcaoIds.includes(f.id));
          setFuncoesDisponiveis(funcoesDoDepto);
        } else {
          setFuncoesDisponiveis([]);
        }
      } catch (err) {
        console.error('Error fetching functions for department:', err);
        setFuncoesDisponiveis([]);
      } finally {
        setIsLoadingFuncoes(false);
      }
    };

    fetchFuncoesPorDepartamento();
  }, [formData.departamentoId, funcoes]);

  useEffect(() => {
    if (data) {
      // Find department ID from department name
      const deptoEncontrado = departamentos.find((d) => d.nome === data.departamento);
      setFormData({
        codigoExterno: data.codigoExterno,
        nome: data.nome,
        sobrenome: data.sobrenome,
        foto: data.foto || '',
        dataNascimento: data.dataNascimento,
        sexo: data.sexo,
        telefone: data.telefone,
        email: data.email,
        departamento: data.departamento,
        departamentoId: deptoEncontrado?.id || data.departamentoId || '',
        funcao: data.funcao,
        funcaoId: data.funcaoId || '',
        custoHora: data.custoHora,
        dataContratacao: data.dataContratacao,
        status: data.status,
      });
      setAnexos(data.anexos || []);
      setAusencias(data.ausencias || []);
      setEscalas(data.escalas || []);
    } else {
      setFormData({
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
      });
      setAnexos([]);
      setAusencias([]);
      setEscalas([]);
      setFuncoesDisponiveis([]);
    }
    setActiveTab('dados');
    setNovaAusencia({ motivo: '', dataInicio: '', dataFim: '' });
    setNovaEscala({ dataInicio: '', horaInicio: '', dataFim: '', horaFim: '', diasSemana: [1, 2, 3, 4, 5] });
  }, [data, isOpen, departamentos]);

  // Calcular dias automaticamente
  const diasCalculados = useMemo(() => {
    if (!novaAusencia.dataInicio || !novaAusencia.dataFim) return 0;
    const inicio = parseISO(novaAusencia.dataInicio);
    const fim = parseISO(novaAusencia.dataFim);
    if (fim < inicio) return 0;
    return differenceInDays(fim, inicio) + 1; // +1 para incluir o dia inicial
  }, [novaAusencia.dataInicio, novaAusencia.dataFim]);

  // Verificar sobreposição de datas
  const verificarSobreposicao = (dataInicio: string, dataFim: string, excludeId?: string): boolean => {
    const inicio = parseISO(dataInicio);
    const fim = parseISO(dataFim);

    return ausencias.some((a) => {
      if (excludeId && a.id === excludeId) return false;
      const ausenciaInicio = parseISO(a.dataInicio);
      const ausenciaFim = parseISO(a.dataFim);

      // Verifica se há sobreposição
      return (
        isWithinInterval(inicio, { start: ausenciaInicio, end: ausenciaFim }) ||
        isWithinInterval(fim, { start: ausenciaInicio, end: ausenciaFim }) ||
        isWithinInterval(ausenciaInicio, { start: inicio, end: fim }) ||
        isWithinInterval(ausenciaFim, { start: inicio, end: fim })
      );
    });
  };

  const handleAddAusencia = () => {
    if (!novaAusencia.motivo || !novaAusencia.dataInicio || !novaAusencia.dataFim) {
      toast.error('Preencha todos os campos da ausência');
      return;
    }

    if (parseISO(novaAusencia.dataFim) < parseISO(novaAusencia.dataInicio)) {
      toast.error('A data de fim deve ser maior ou igual à data de início');
      return;
    }

    if (verificarSobreposicao(novaAusencia.dataInicio, novaAusencia.dataFim)) {
      toast.error('As datas informadas se sobrepõem a uma ausência já cadastrada');
      return;
    }

    const nova: Ausencia = {
      id: crypto.randomUUID(),
      motivo: novaAusencia.motivo as Ausencia['motivo'],
      dataInicio: novaAusencia.dataInicio,
      dataFim: novaAusencia.dataFim,
      dias: diasCalculados,
    };

    setAusencias([...ausencias, nova]);
    setNovaAusencia({ motivo: '', dataInicio: '', dataFim: '' });
    toast.success('Ausência adicionada');
  };

  const handleRemoveAusencia = (id: string) => {
    setAusencias(ausencias.filter((a) => a.id !== id));
    toast.success('Ausência removida');
  };

  // Verificar sobreposição de escalas (permite mesmo período de datas com horários diferentes)
  const verificarSobreposicaoEscala = (nova: typeof novaEscala, excludeId?: string): boolean => {
    const novaDataInicio = new Date(nova.dataInicio);
    const novaDataFim = new Date(nova.dataFim);
    const novaHoraInicioMin = nova.horaInicio.split(':').map(Number);
    const novaHoraFimMin = nova.horaFim.split(':').map(Number);
    const novaHI = novaHoraInicioMin[0] * 60 + novaHoraInicioMin[1];
    const novaHF = novaHoraFimMin[0] * 60 + novaHoraFimMin[1];

    return escalas.some((e) => {
      if (excludeId && e.id === excludeId) return false;

      // 1. Verificar sobreposição de período de datas
      const eDataInicio = new Date(e.dataInicio);
      const eDataFim = new Date(e.dataFim);
      const datasSeOverlap = novaDataInicio <= eDataFim && novaDataFim >= eDataInicio;
      if (!datasSeOverlap) return false;

      // 2. Verificar sobreposição de dias da semana
      const diasEmComum = (nova.diasSemana || [1,2,3,4,5]).some(d => (e.diasSemana || [1,2,3,4,5]).includes(d));
      if (!diasEmComum) return false;

      // 3. Verificar sobreposição de faixa horária
      const eHI = e.horaInicio.split(':').map(Number);
      const eHF = e.horaFim.split(':').map(Number);
      const eHIMin = eHI[0] * 60 + eHI[1];
      const eHFMin = eHF[0] * 60 + eHF[1];
      const horariosSeOverlap = novaHI < eHFMin && novaHF > eHIMin;

      return horariosSeOverlap;
    });
  };

  const handleAddEscala = () => {
    if (!novaEscala.dataInicio || !novaEscala.horaInicio || !novaEscala.dataFim || !novaEscala.horaFim) {
      toast.error('Preencha todos os campos da escala');
      return;
    }

    const inicio = new Date(`${novaEscala.dataInicio}T${novaEscala.horaInicio}`);
    const fim = new Date(`${novaEscala.dataFim}T${novaEscala.horaFim}`);

    if (fim <= inicio) {
      toast.error('A data/hora fim deve ser posterior à data/hora início');
      return;
    }

    if (verificarSobreposicaoEscala(novaEscala)) {
      toast.error('O período informado se sobrepõe a uma escala existente');
      return;
    }

    if (novaEscala.diasSemana.length === 0) {
      toast.error('Selecione pelo menos um dia da semana');
      return;
    }

    const nova: Escala = {
      id: crypto.randomUUID(),
      dataInicio: novaEscala.dataInicio,
      horaInicio: novaEscala.horaInicio,
      dataFim: novaEscala.dataFim,
      horaFim: novaEscala.horaFim,
      diasSemana: novaEscala.diasSemana,
    };

    setEscalas([...escalas, nova]);
    setNovaEscala({ dataInicio: '', horaInicio: '', dataFim: '', horaFim: '', diasSemana: [1, 2, 3, 4, 5] });
    toast.success('Escala adicionada');
  };

  const handleRemoveEscala = (id: string) => {
    setEscalas(escalas.filter((e) => e.id !== id));
    toast.success('Escala removida');
  };

  const escalasOrdenadas = useMemo(() => {
    return [...escalas].sort((a, b) => 
      new Date(`${a.dataInicio}T${a.horaInicio}`).getTime() - new Date(`${b.dataInicio}T${b.horaInicio}`).getTime()
    );
  }, [escalas]);

  const handleFotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem (PNG ou JPG)');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('A foto deve ter no máximo 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData({ ...formData, foto: event.target?.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleAnexoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (file.size > 2 * 1024 * 1024) {
        toast.error(`${file.name}: O arquivo deve ter no máximo 2MB`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const novoAnexo: Anexo = {
          id: crypto.randomUUID(),
          nome: file.name,
          tipo: file.type,
          tamanho: file.size,
          dataUrl: event.target?.result as string,
        };
        setAnexos((prev) => [...prev, novoAnexo]);
      };
      reader.readAsDataURL(file);
    });

    if (anexoInputRef.current) {
      anexoInputRef.current.value = '';
    }
  };

  const handleRemoveAnexo = (id: string) => {
    setAnexos((prev) => prev.filter((a) => a.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Find function name from ID for display purposes
    const funcaoSelecionada = funcoesDisponiveis.find(f => f.id === formData.funcaoId);
    
    onSave({
      id: data?.id || crypto.randomUUID(),
      ...formData,
      funcao: funcaoSelecionada?.nome || formData.funcao || '',
      funcaoId: formData.funcaoId || undefined,
      anexos,
      ausencias,
      escalas,
      dataCadastro: data?.dataCadastro || new Date().toLocaleDateString('pt-BR'),
      usuarioCadastro: data?.usuarioCadastro || user?.nome || 'Admin',
    });
    onClose();
  };

  // Ordenar ausências por data de início
  const ausenciasOrdenadas = useMemo(() => {
    return [...ausencias].sort((a, b) => 
      parseISO(a.dataInicio).getTime() - parseISO(b.dataInicio).getTime()
    );
  }, [ausencias]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[900px] max-w-[900px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{data ? 'Editar Colaborador' : 'Novo Colaborador'}</DialogTitle>
          <DialogDescription>
            Preencha os dados do colaborador.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dados">Dados Pessoais</TabsTrigger>
            {isVisible('Recursos', 'Recursos Humanos', '-', 'Tabulador "Ausências"') && (
              <TabsTrigger value="ausencias" className="flex items-center gap-2">
                <CalendarOff className="w-4 h-4" />
                Ausências
                {ausencias.length > 0 && (
                  <span className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
                    {ausencias.length}
                  </span>
                )}
              </TabsTrigger>
            )}
            <TabsTrigger value="escalas" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Escalas
              {escalas.length > 0 && (
                <span className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
                  {escalas.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dados" className="mt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Foto e Dados Básicos */}
              <div className="flex gap-6">
                {/* Upload de Foto */}
                <div className="flex flex-col items-center gap-2">
                  <Label>Foto</Label>
                  <div
                    className="w-28 h-28 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary/50 transition-colors bg-muted/30"
                    onClick={() => fotoInputRef.current?.click()}
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
                    onChange={handleFotoUpload}
                  />
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
                  {formData.foto && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs text-destructive"
                      onClick={() => setFormData({ ...formData, foto: '' })}
                    >
                      Remover
                    </Button>
                  )}
                </div>

                {/* Campos principais */}
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="codigoExterno">Código Externo <FieldAsterisk type={getAsterisk('codigoExterno')} /></Label>
                      <Input
                        id="codigoExterno"
                        value={formData.codigoExterno}
                        onChange={(e) => setFormData({ ...formData, codigoExterno: e.target.value })}
                        maxLength={10}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nome">Nome <FieldAsterisk type={getAsterisk('nome')} /></Label>
                      <Input
                        id="nome"
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        maxLength={100}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sobrenome">Sobrenome <FieldAsterisk type={getAsterisk('sobrenome')} /></Label>
                      <Input
                        id="sobrenome"
                        value={formData.sobrenome}
                        onChange={(e) => setFormData({ ...formData, sobrenome: e.target.value })}
                        maxLength={100}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail <FieldAsterisk type={getAsterisk('email')} /></Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telefone">Telefone <FieldAsterisk type={getAsterisk('telefone')} /></Label>
                      <Input
                        id="telefone"
                        value={formData.telefone}
                        onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Sexo <FieldAsterisk type={getAsterisk('sexo')} /></Label>
                      <SearchableSelect
                        options={[
                          { value: 'Masculino', label: 'Masculino' },
                          { value: 'Feminino', label: 'Feminino' },
                        ]}
                        value={formData.sexo}
                        onValueChange={(value) => setFormData({ ...formData, sexo: value })}
                        placeholder="Selecione..."
                        searchPlaceholder="Pesquisar..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dataNascimento">Data de Nascimento <FieldAsterisk type={getAsterisk('dataNascimento')} /></Label>
                  <Input
                    id="dataNascimento"
                    type="date"
                    value={formData.dataNascimento}
                    onChange={(e) => setFormData({ ...formData, dataNascimento: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dataContratacao">Data de Contratação <FieldAsterisk type={getAsterisk('dataContratacao')} /></Label>
                  <Input
                    id="dataContratacao"
                    type="date"
                    value={formData.dataContratacao}
                    onChange={(e) => setFormData({ ...formData, dataContratacao: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="custoHora">Custo/Hora <FieldAsterisk type={getAsterisk('custoHora')} /></Label>
                  <Input
                    id="custoHora"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.custoHora}
                    onChange={(e) => setFormData({ ...formData, custoHora: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Departamento <FieldAsterisk type={getAsterisk('departamento')} /></Label>
                  <SearchableSelect
                    options={departamentos.map(d => ({ value: d.id, label: d.nome }))}
                    value={formData.departamentoId}
                    onValueChange={(value) => {
                      const depSelecionado = departamentos.find((d) => d.id === value);
                      setFormData({ 
                        ...formData, 
                        departamentoId: value,
                        departamento: depSelecionado?.nome || '',
                        funcao: '',
                        funcaoId: '',
                      });
                    }}
                    placeholder="Selecione..."
                    searchPlaceholder="Pesquisar departamento..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Função <FieldAsterisk type={getAsterisk('funcao')} /></Label>
                  <SearchableSelect
                    options={funcoesDisponiveis.map(f => ({ value: f.id, label: f.nome }))}
                    value={formData.funcaoId}
                    onValueChange={(value) => {
                      const funcaoSelecionada = funcoesDisponiveis.find(f => f.id === value);
                      setFormData({ 
                        ...formData, 
                        funcaoId: value,
                        funcao: funcaoSelecionada?.nome || ''
                      });
                    }}
                    disabled={!formData.departamentoId || isLoadingFuncoes}
                    placeholder={
                      !formData.departamentoId 
                        ? "Selecione um departamento primeiro" 
                        : isLoadingFuncoes 
                          ? "Carregando..." 
                          : funcoesDisponiveis.length === 0 
                            ? "Nenhuma função cadastrada" 
                            : "Selecione..."
                    }
                    searchPlaceholder="Pesquisar função..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status <FieldAsterisk type={getAsterisk('status')} /></Label>
                  <SearchableSelect
                    options={[
                      { value: 'Ativo', label: 'Ativo' },
                      { value: 'Inativo', label: 'Inativo' },
                    ]}
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value as 'Ativo' | 'Inativo' })}
                    placeholder="Selecione..."
                  />
                </div>
              </div>

              {/* Anexos */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Anexos (máx. 2MB por arquivo)</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => anexoInputRef.current?.click()}
                  >
                    <Upload className="w-3 h-3 mr-1" />
                    Adicionar Anexo
                  </Button>
                </div>
                <input
                  ref={anexoInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleAnexoUpload}
                />
                
                {anexos.length > 0 ? (
                  <div className="border rounded-lg p-2 space-y-1 max-h-32 overflow-y-auto">
                    {anexos.map((anexo) => (
                      <div key={anexo.id} className="flex items-center justify-between text-sm bg-muted/30 rounded p-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <span className="truncate">{anexo.nome}</span>
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            ({formatFileSize(anexo.tamanho)})
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive hover:text-destructive flex-shrink-0"
                          onClick={() => handleRemoveAnexo(anexo.id)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border rounded-lg p-4 text-center text-sm text-muted-foreground border-dashed">
                    Nenhum anexo adicionado
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>
                  {readOnly ? 'Fechar' : 'Cancelar'}
                </Button>
                {!readOnly && (
                  <Button type="submit" className="gradient-primary hover:opacity-90">
                    Salvar
                  </Button>
                )}
              </DialogFooter>
            </form>
          </TabsContent>

          {isVisible('Recursos', 'Recursos Humanos', '-', 'Tabulador "Ausências"') && (
          <TabsContent value="ausencias" className="mt-4 space-y-4">
            {/* Formulário para adicionar ausência */}
            <div className="border rounded-lg p-4 bg-muted/20">
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Adicionar Período de Ausência
              </h4>
              <div className="grid grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Motivo <span className="text-destructive">*</span></Label>
                  <SearchableSelect
                    options={MOTIVOS_AUSENCIA.map(m => ({ value: m, label: m }))}
                    value={novaAusencia.motivo}
                    onValueChange={(value) => setNovaAusencia({ ...novaAusencia, motivo: value as Ausencia['motivo'] })}
                    placeholder="Selecione..."
                    searchPlaceholder="Pesquisar motivo..."
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Data Início <span className="text-destructive">*</span></Label>
                  <Input
                    type="date"
                    value={novaAusencia.dataInicio}
                    onChange={(e) => setNovaAusencia({ ...novaAusencia, dataInicio: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Data Fim <span className="text-destructive">*</span></Label>
                  <Input
                    type="date"
                    value={novaAusencia.dataFim}
                    onChange={(e) => setNovaAusencia({ ...novaAusencia, dataFim: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Dias</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={diasCalculados}
                      disabled
                      className="bg-muted"
                    />
                    <Button
                      type="button"
                      onClick={handleAddAusencia}
                      disabled={!novaAusencia.motivo || !novaAusencia.dataInicio || !novaAusencia.dataFim}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Lista de ausências */}
            {ausenciasOrdenadas.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Motivo</TableHead>
                      <TableHead>Data Início</TableHead>
                      <TableHead>Data Fim</TableHead>
                      <TableHead className="text-center">Dias</TableHead>
                      <TableHead className="w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ausenciasOrdenadas.map((ausencia) => (
                      <TableRow key={ausencia.id}>
                        <TableCell className="font-medium">{ausencia.motivo}</TableCell>
                        <TableCell>
                          {format(parseISO(ausencia.dataInicio), 'dd/MM/yyyy', { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          {format(parseISO(ausencia.dataFim), 'dd/MM/yyyy', { locale: ptBR })}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-sm font-medium">
                            {ausencia.dias}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleRemoveAusencia(ausencia.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="border rounded-lg p-8 text-center border-dashed">
                <CalendarOff className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">Nenhuma ausência cadastrada</p>
                <p className="text-sm text-muted-foreground/70">
                  Adicione períodos de férias, folgas ou licenças
                </p>
              </div>
            )}

            {/* Info sobre sobreposição */}
            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>
                O sistema não permite cadastrar ausências com datas sobrepostas. 
                Verifique se o período informado não conflita com ausências já existentes.
              </p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button 
                type="button" 
                className="gradient-primary hover:opacity-90"
                onClick={handleSubmit}
              >
                Salvar
              </Button>
            </DialogFooter>
          </TabsContent>
          )}

          <TabsContent value="escalas" className="mt-4 space-y-4">
            {/* Formulário para adicionar escala */}
            <div className="border rounded-lg p-4 bg-muted/20">
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Adicionar Escala de Trabalho
              </h4>
              <div className="grid grid-cols-5 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Data Início <span className="text-destructive">*</span></Label>
                  <Input
                    type="date"
                    value={novaEscala.dataInicio}
                    onChange={(e) => setNovaEscala({ ...novaEscala, dataInicio: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Hora Início <span className="text-destructive">*</span></Label>
                  <Input
                    type="time"
                    value={novaEscala.horaInicio}
                    onChange={(e) => setNovaEscala({ ...novaEscala, horaInicio: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Data Fim <span className="text-destructive">*</span></Label>
                  <Input
                    type="date"
                    value={novaEscala.dataFim}
                    onChange={(e) => setNovaEscala({ ...novaEscala, dataFim: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Hora Fim <span className="text-destructive">*</span></Label>
                  <Input
                    type="time"
                    value={novaEscala.horaFim}
                    onChange={(e) => setNovaEscala({ ...novaEscala, horaFim: e.target.value })}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    onClick={handleAddEscala}
                    disabled={!novaEscala.dataInicio || !novaEscala.horaInicio || !novaEscala.dataFim || !novaEscala.horaFim}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Dias da semana */}
              <div className="mt-3 pt-3 border-t">
                <Label className="text-xs mb-2 block">Dias da Semana <span className="text-destructive">*</span></Label>
                <div className="flex gap-4 flex-wrap">
                  {DIAS_SEMANA.map((dia) => (
                    <label
                      key={dia.value}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Checkbox
                        checked={novaEscala.diasSemana.includes(dia.value)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setNovaEscala({
                              ...novaEscala,
                              diasSemana: [...novaEscala.diasSemana, dia.value].sort(),
                            });
                          } else {
                            setNovaEscala({
                              ...novaEscala,
                              diasSemana: novaEscala.diasSemana.filter((d) => d !== dia.value),
                            });
                          }
                        }}
                      />
                      <span className="text-sm">{dia.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Lista de escalas */}
            {escalasOrdenadas.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data Início</TableHead>
                      <TableHead>Hora Início</TableHead>
                      <TableHead>Data Fim</TableHead>
                      <TableHead>Hora Fim</TableHead>
                      <TableHead>Dias</TableHead>
                      <TableHead className="w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {escalasOrdenadas.map((escala) => (
                      <TableRow key={escala.id}>
                        <TableCell>
                          {format(parseISO(escala.dataInicio), 'dd/MM/yyyy', { locale: ptBR })}
                        </TableCell>
                        <TableCell>{escala.horaInicio}</TableCell>
                        <TableCell>
                          {format(parseISO(escala.dataFim), 'dd/MM/yyyy', { locale: ptBR })}
                        </TableCell>
                        <TableCell>{escala.horaFim}</TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {escala.diasSemana && escala.diasSemana.length > 0 ? (
                              escala.diasSemana.sort().map((d) => (
                                <span key={d} className="px-1.5 py-0.5 text-[10px] bg-primary/10 text-primary rounded">
                                  {DIAS_SEMANA.find((ds) => ds.value === d)?.label}
                                </span>
                              ))
                            ) : (
                              <span className="text-muted-foreground text-xs">-</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleRemoveEscala(escala.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
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
                <p className="text-sm text-muted-foreground/70">
                  Adicione os horários de trabalho do colaborador
                </p>
              </div>
            )}

            {/* Info sobre sobreposição */}
            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>
                O sistema não permite cadastrar escalas com horários sobrepostos. 
                Verifique se o período informado não conflita com escalas já existentes.
              </p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button 
                type="button" 
                className="gradient-primary hover:opacity-90"
                onClick={handleSubmit}
              >
                Salvar
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
