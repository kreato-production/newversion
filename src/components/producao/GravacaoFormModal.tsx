import { useState, useEffect } from 'react';
import { format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
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
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { type Gravacao, generateCodigoGravacao } from '@/pages/producao/GravacaoList';
import { RecursosTab } from './RecursosTab';
import { CustosTab } from './CustosTab';
import { TerceirosTab } from './TerceirosTab';
import { cn } from '@/lib/utils';

interface GravacaoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Gravacao) => void;
  data?: Gravacao | null;
}

export const GravacaoFormModal = ({
  isOpen,
  onClose,
  onSave,
  data,
}: GravacaoFormModalProps) => {
  const { user } = useAuth();
  const [codigoGerado, setCodigoGerado] = useState('');
  const [dataPrevista, setDataPrevista] = useState<Date | undefined>(undefined);
  const [formData, setFormData] = useState({
    codigoExterno: '',
    nome: '',
    unidadeNegocio: '',
    centroLucro: '',
    classificacao: '',
    tipoConteudo: '',
    descricao: '',
    status: '',
    conteudoId: '',
  });

  const [unidades, setUnidades] = useState<{ id: string; nome: string }[]>([]);
  const [centrosLucro, setCentrosLucro] = useState<{ id: string; nome: string; parentId: string | null; status: string; codigoExterno?: string }[]>([]);

  // Função para construir a hierarquia de centros de lucro
  const buildHierarchy = (items: typeof centrosLucro, parentId: string | null = null, level: number = 0): { id: string; nome: string; displayName: string; level: number }[] => {
    const result: { id: string; nome: string; displayName: string; level: number }[] = [];
    const children = items.filter(item => item.parentId === parentId);
    
    for (const child of children) {
      const prefix = level > 0 ? '│ '.repeat(level - 1) + '├─ ' : '';
      result.push({
        id: child.id,
        nome: child.nome,
        displayName: `${prefix}${child.nome}`,
        level
      });
      result.push(...buildHierarchy(items, child.id, level + 1));
    }
    
    return result;
  };

  const centrosLucroHierarquicos = buildHierarchy(centrosLucro);
  const [classificacoes, setClassificacoes] = useState<{ id: string; nome: string }[]>([]);
  const [tipos, setTipos] = useState<{ id: string; nome: string }[]>([]);
  const [statusList, setStatusList] = useState<{ id: string; nome: string }[]>([]);
  const [conteudos, setConteudos] = useState<{ id: string; descricao: string }[]>([]);

  useEffect(() => {
    const loadOptions = () => {
      const storedUnidades = localStorage.getItem('kreato_unidades_negocio');
      const storedCentrosLucro = localStorage.getItem('kreato_centros_lucro');
      const storedClassificacoes = localStorage.getItem('kreato_classificacao');
      const storedTipos = localStorage.getItem('kreato_tipos_gravacao');
      const storedStatus = localStorage.getItem('kreato_status_gravacao');
      const storedConteudos = localStorage.getItem('kreato_conteudos');

      setUnidades(storedUnidades ? JSON.parse(storedUnidades) : []);
      setCentrosLucro(storedCentrosLucro ? JSON.parse(storedCentrosLucro).filter((cl: { status: string }) => cl.status === 'Ativo') : []);
      setClassificacoes(storedClassificacoes ? JSON.parse(storedClassificacoes) : []);
      setTipos(storedTipos ? JSON.parse(storedTipos) : []);
      setStatusList(storedStatus ? JSON.parse(storedStatus) : []);
      setConteudos(storedConteudos ? JSON.parse(storedConteudos) : []);
    };

    if (isOpen) {
      loadOptions();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    
    if (data) {
      setCodigoGerado(data.codigo || '');
      setFormData({
        codigoExterno: data.codigoExterno || '',
        nome: data.nome || '',
        unidadeNegocio: data.unidadeNegocio || '',
        centroLucro: (data as any).centroLucro || '',
        classificacao: data.classificacao || '',
        tipoConteudo: data.tipoConteudo || '',
        descricao: data.descricao || '',
        status: data.status || '',
        conteudoId: data.conteudoId || '',
      });
      // Converter string de data para Date
      if (data.dataPrevista) {
        try {
          const parsedDate = parse(data.dataPrevista, 'dd/MM/yyyy', new Date());
          setDataPrevista(parsedDate);
        } catch {
          setDataPrevista(undefined);
        }
      } else {
        setDataPrevista(undefined);
      }
    } else {
      // Gerar novo código para nova gravação
      const novoCodigo = generateCodigoGravacao();
      setCodigoGerado(novoCodigo);
      setFormData({
        codigoExterno: '',
        nome: '',
        unidadeNegocio: '',
        centroLucro: '',
        classificacao: '',
        tipoConteudo: '',
        descricao: '',
        status: '',
        conteudoId: '',
      });
      setDataPrevista(undefined);
    }
  }, [data, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: data?.id || crypto.randomUUID(),
      codigo: codigoGerado,
      ...formData,
      dataPrevista: dataPrevista ? format(dataPrevista, 'dd/MM/yyyy') : '',
      dataCadastro: data?.dataCadastro || new Date().toLocaleDateString('pt-BR'),
      usuarioCadastro: data?.usuarioCadastro || user?.nome || 'Admin',
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[95vw] lg:max-w-[1400px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{data ? 'Editar Gravação' : 'Nova Gravação'}</DialogTitle>
          <DialogDescription>
            Preencha os campos para {data ? 'editar' : 'cadastrar'} a gravação.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="dados" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dados">Dados Gerais</TabsTrigger>
            <TabsTrigger value="recursos" disabled={!data}>Recursos</TabsTrigger>
            <TabsTrigger value="terceiros" disabled={!data}>Terceiros</TabsTrigger>
            <TabsTrigger value="custos" disabled={!data}>Custos</TabsTrigger>
          </TabsList>

          <TabsContent value="dados">
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="codigo">Código</Label>
                  <Input
                    id="codigo"
                    value={codigoGerado}
                    readOnly
                    className="bg-muted font-mono font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="codigoExterno">Código Externo</Label>
                  <Input
                    id="codigoExterno"
                    value={formData.codigoExterno}
                    onChange={(e) => setFormData({ ...formData, codigoExterno: e.target.value })}
                    maxLength={10}
                    placeholder="Máx. 10 caracteres"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    maxLength={100}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Unidade de Negócio</Label>
                  <Select
                    value={formData.unidadeNegocio}
                    onValueChange={(value) => setFormData({ ...formData, unidadeNegocio: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {unidades.map((u) => (
                        <SelectItem key={u.id} value={u.nome}>{u.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Centro de Lucro</Label>
                  <Select
                    value={formData.centroLucro}
                    onValueChange={(value) => setFormData({ ...formData, centroLucro: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {centrosLucroHierarquicos.map((cl) => (
                        <SelectItem key={cl.id} value={cl.nome}>
                          <span className="font-mono whitespace-pre">{cl.displayName}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Conteúdo</Label>
                  <Select
                    value={formData.tipoConteudo}
                    onValueChange={(value) => setFormData({ ...formData, tipoConteudo: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {tipos.map((t) => (
                        <SelectItem key={t.id} value={t.nome}>{t.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Classificação</Label>
                  <Select
                    value={formData.classificacao}
                    onValueChange={(value) => setFormData({ ...formData, classificacao: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {classificacoes.map((c) => (
                        <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {statusList.map((s) => (
                        <SelectItem key={s.id} value={s.nome}>{s.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Conteúdo</Label>
                  <Select
                    value={formData.conteudoId || "__none__"}
                    onValueChange={(value) => setFormData({ ...formData, conteudoId: value === "__none__" ? "" : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Nenhum</SelectItem>
                      {conteudos.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.descricao}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Data Prevista</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dataPrevista && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dataPrevista ? format(dataPrevista, "dd/MM/yyyy") : "Selecione..."}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dataPrevista}
                        onSelect={setDataPrevista}
                        initialFocus
                        locale={ptBR}
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  rows={3}
                  placeholder="Descrição do conteúdo..."
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button type="submit" className="gradient-primary hover:opacity-90">
                  Salvar
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="recursos">
            {data && <RecursosTab gravacaoId={data.id} />}
          </TabsContent>

          <TabsContent value="terceiros">
            {data && <TerceirosTab gravacaoId={data.id} />}
          </TabsContent>

          <TabsContent value="custos">
            {data && <CustosTab gravacaoId={data.id} />}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
