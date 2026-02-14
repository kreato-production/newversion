import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { Pessoa } from '@/pages/recursos/Pessoas';
import { Camera } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { PessoaGravacoesTab } from './PessoaGravacoesTab';
import { useFormFieldConfig, FieldAsterisk } from '@/hooks/useFormFieldConfig';

interface PessoaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Pessoa) => void;
  data?: Pessoa | null;
}

interface Classificacao {
  id: string;
  nome: string;
}

const estadosBrasileiros = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const emptyFormData: Omit<Pessoa, 'id' | 'dataCadastro' | 'usuarioCadastro'> = {
  codigoExterno: '',
  nome: '',
  sobrenome: '',
  nomeTrabalho: '',
  foto: '',
  dataNascimento: '',
  sexo: '',
  telefone: '',
  email: '',
  classificacao: '',
  classificacaoId: '',
  documento: '',
  endereco: '',
  cidade: '',
  estado: '',
  cep: '',
  observacoes: '',
  status: 'Ativo',
};

export const PessoaFormModal = ({
  isOpen,
  onClose,
  onSave,
  data,
}: PessoaFormModalProps) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<Omit<Pessoa, 'id' | 'dataCadastro' | 'usuarioCadastro'>>(emptyFormData);
  const [classificacoes, setClassificacoes] = useState<Classificacao[]>([]);
  const { getAsterisk, validateRequired, showValidationError } = useFormFieldConfig('pessoa');

  useEffect(() => {
    if (isOpen) {
      if (data) {
        setFormData({
          codigoExterno: data.codigoExterno,
          nome: data.nome,
          sobrenome: data.sobrenome,
          nomeTrabalho: data.nomeTrabalho || '',
          foto: data.foto || '',
          dataNascimento: data.dataNascimento,
          sexo: data.sexo,
          telefone: data.telefone,
          email: data.email,
          classificacao: data.classificacao,
          classificacaoId: data.classificacaoId || '',
          documento: data.documento,
          endereco: data.endereco,
          cidade: data.cidade,
          estado: data.estado,
          cep: data.cep,
          observacoes: data.observacoes,
          status: data.status,
        });
      } else {
        setFormData({ ...emptyFormData });
      }

      // Load classificações from Supabase
      const fetchClassificacoes = async () => {
        const { data: cats } = await supabase
          .from('classificacoes_pessoa')
          .select('id, nome')
          .order('nome');
        setClassificacoes(cats || []);
      };
      fetchClassificacoes();
    }
  }, [isOpen, data]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, foto: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const fieldLabels: Record<string, string> = {
    codigoExterno: 'Código Externo', classificacao: 'Classificação', nome: 'Nome', sobrenome: 'Sobrenome',
    nomeTrabalho: 'Nome de Trabalho', dataNascimento: 'Data de Nascimento', sexo: 'Sexo',
    documento: 'Documento', email: 'E-mail', telefone: 'Telefone', endereco: 'Endereço',
    cidade: 'Cidade', estado: 'Estado', cep: 'CEP', observacoes: 'Observações', status: 'Status',
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const missing = validateRequired(formData as any, fieldLabels);
    if (missing.length > 0) {
      showValidationError(missing);
      return;
    }

    const pessoaData: Pessoa = {
      id: data?.id || crypto.randomUUID(),
      ...formData,
      dataCadastro: data?.dataCadastro || new Date().toISOString(),
      usuarioCadastro: data?.usuarioCadastro || user?.nome || 'Sistema',
    };

    onSave(pessoaData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[900px] max-w-[900px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{data ? 'Editar Pessoa' : 'Nova Pessoa'}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="dados" className="w-full">
          <TabsList className="flex w-full">
            <TabsTrigger value="dados" className="flex-1">Dados Gerais</TabsTrigger>
            <TabsTrigger value="gravacoes" disabled={!data} className="flex-1">Gravações</TabsTrigger>
          </TabsList>

          <TabsContent value="dados">
            <form onSubmit={handleSubmit} className="space-y-6 mt-4">
              {/* Photo */}
              <div className="flex justify-center">
                <div className="relative">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={formData.foto} />
                    <AvatarFallback className="text-xl gradient-brand text-primary-foreground">
                      {formData.nome?.charAt(0) || 'P'}{formData.sobrenome?.charAt(0) || ''}
                    </AvatarFallback>
                  </Avatar>
                  <label className="absolute bottom-0 right-0 p-1.5 bg-primary rounded-full cursor-pointer hover:bg-primary/90 transition-colors">
                    <Camera className="w-4 h-4 text-primary-foreground" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="codigoExterno">Código Externo <FieldAsterisk type={getAsterisk('codigoExterno')} /></Label>
                  <Input
                    id="codigoExterno"
                    value={formData.codigoExterno}
                    onChange={(e) => setFormData({ ...formData, codigoExterno: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="classificacao">Classificação <FieldAsterisk type={getAsterisk('classificacao')} /></Label>
                  <Select
                    value={formData.classificacaoId || ''}
                    onValueChange={(value) => {
                      const selected = classificacoes.find(c => c.id === value);
                      setFormData({ ...formData, classificacaoId: value, classificacao: selected?.nome || '' });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a classificação" />
                    </SelectTrigger>
                    <SelectContent>
                      {classificacoes.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome <FieldAsterisk type={getAsterisk('nome')} /></Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sobrenome">Sobrenome <FieldAsterisk type={getAsterisk('sobrenome')} /></Label>
                  <Input
                    id="sobrenome"
                    value={formData.sobrenome}
                    onChange={(e) => setFormData({ ...formData, sobrenome: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nomeTrabalho">Nome de Trabalho <FieldAsterisk type={getAsterisk('nomeTrabalho')} /></Label>
                <Input
                  id="nomeTrabalho"
                  value={formData.nomeTrabalho}
                  onChange={(e) => setFormData({ ...formData, nomeTrabalho: e.target.value })}
                  placeholder="Nome artístico ou de trabalho"
                />
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
                  <Label htmlFor="sexo">Sexo <FieldAsterisk type={getAsterisk('sexo')} /></Label>
                  <Select
                    value={formData.sexo}
                    onValueChange={(value) => setFormData({ ...formData, sexo: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Masculino">Masculino</SelectItem>
                      <SelectItem value="Feminino">Feminino</SelectItem>
                      <SelectItem value="Outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="documento">CPF/Documento <FieldAsterisk type={getAsterisk('documento')} /></Label>
                  <Input
                    id="documento"
                    value={formData.documento}
                    onChange={(e) => setFormData({ ...formData, documento: e.target.value })}
                  />
                </div>
              </div>

              {/* Contact */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail <FieldAsterisk type={getAsterisk('email')} /></Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Label htmlFor="endereco">Endereço <FieldAsterisk type={getAsterisk('endereco')} /></Label>
                <Input
                  id="endereco"
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cidade">Cidade <FieldAsterisk type={getAsterisk('cidade')} /></Label>
                  <Input
                    id="cidade"
                    value={formData.cidade}
                    onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estado">Estado <FieldAsterisk type={getAsterisk('estado')} /></Label>
                  <Select
                    value={formData.estado}
                    onValueChange={(value) => setFormData({ ...formData, estado: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {estadosBrasileiros.map((uf) => (
                        <SelectItem key={uf} value={uf}>
                          {uf}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cep">CEP <FieldAsterisk type={getAsterisk('cep')} /></Label>
                  <Input
                    id="cep"
                    value={formData.cep}
                    onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                  />
                </div>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">Status <FieldAsterisk type={getAsterisk('status')} /></Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as 'Ativo' | 'Inativo' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ativo">Ativo</SelectItem>
                    <SelectItem value="Inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Observations */}
              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações <FieldAsterisk type={getAsterisk('observacoes')} /></Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {data ? 'Salvar' : 'Cadastrar'}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="gravacoes">
            {data && <PessoaGravacoesTab pessoaId={data.id} />}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
