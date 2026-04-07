import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SearchableSelect } from '@/components/shared/SearchableSelect';
import { PessoaGravacoesTab } from './PessoaGravacoesTab';
import { Camera } from 'lucide-react';
import { pessoasRepository } from '@/modules/pessoas/pessoas.repository.provider';
import type {
  ClassificacaoPessoaOption,
  Pessoa,
  PessoaInput,
} from '@/modules/pessoas/pessoas.types';
import { ModalNavigation, type ModalNavigationProps } from '@/components/shared/ModalNavigation';

interface PessoaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: PessoaInput) => Promise<void>;
  data?: Pessoa | null;
  readOnly?: boolean;
  navigation?: ModalNavigationProps;
}

const estadosBrasileiros = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
];

const emptyFormData: PessoaInput = {
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
  readOnly = false,
  navigation,
}: PessoaFormModalProps) => {
  const [formData, setFormData] = useState<PessoaInput>(emptyFormData);
  const [classificacoes, setClassificacoes] = useState<ClassificacaoPessoaOption[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadOptions = async () => {
      if (!isOpen) {
        return;
      }

      const options = await pessoasRepository.listOptions();
      setClassificacoes(options.classificacoes);
    };

    void loadOptions();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (data) {
      setFormData({
        id: data.id,
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
      return;
    }

    setFormData(emptyFormData);
  }, [data, isOpen]);

  const estadoOptions = useMemo(
    () => estadosBrasileiros.map((uf) => ({ value: uf, label: uf })),
    [],
  );

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((current) => ({ ...current, foto: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (readOnly || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(formData);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[900px] max-w-[900px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{data ? 'Editar Pessoa' : 'Nova Pessoa'}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="dados" className="w-full">
          <TabsList className="flex w-full">
            <TabsTrigger value="dados" className="flex-1">
              Dados Gerais
            </TabsTrigger>
            <TabsTrigger value="gravacoes" disabled={!data} className="flex-1">
              Gravações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dados">
            <form onSubmit={handleSubmit} className="space-y-6 mt-4">
              <div className="flex justify-center">
                <div className="relative">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={formData.foto} />
                    <AvatarFallback className="text-xl gradient-brand text-primary-foreground">
                      {formData.nome?.charAt(0) || 'P'}
                      {formData.sobrenome?.charAt(0) || ''}
                    </AvatarFallback>
                  </Avatar>
                  {!readOnly && (
                    <label className="absolute bottom-0 right-0 p-1.5 bg-primary rounded-full cursor-pointer hover:bg-primary/90 transition-colors">
                      <Camera className="w-4 h-4 text-primary-foreground" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="codigoExterno">Código Externo</Label>
                  <Input
                    id="codigoExterno"
                    value={formData.codigoExterno}
                    disabled={readOnly}
                    onChange={(event) =>
                      setFormData({ ...formData, codigoExterno: event.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="classificacao">Classificação</Label>
                  <SearchableSelect
                    options={classificacoes.map((item) => ({ value: item.id, label: item.nome }))}
                    value={formData.classificacaoId || ''}
                    onValueChange={(value) => {
                      const selected = classificacoes.find((item) => item.id === value);
                      setFormData({
                        ...formData,
                        classificacaoId: value,
                        classificacao: selected?.nome || '',
                      });
                    }}
                    placeholder="Selecione a classificação"
                    searchPlaceholder="Pesquisar classificação..."
                    disabled={readOnly}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    required
                    disabled={readOnly}
                    onChange={(event) => setFormData({ ...formData, nome: event.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sobrenome">Sobrenome</Label>
                  <Input
                    id="sobrenome"
                    value={formData.sobrenome}
                    required
                    disabled={readOnly}
                    onChange={(event) =>
                      setFormData({ ...formData, sobrenome: event.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nomeTrabalho">Nome de Trabalho</Label>
                <Input
                  id="nomeTrabalho"
                  value={formData.nomeTrabalho}
                  disabled={readOnly}
                  placeholder="Nome artístico ou de trabalho"
                  onChange={(event) =>
                    setFormData({ ...formData, nomeTrabalho: event.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dataNascimento">Data de Nascimento</Label>
                  <Input
                    id="dataNascimento"
                    type="date"
                    value={formData.dataNascimento}
                    disabled={readOnly}
                    onChange={(event) =>
                      setFormData({ ...formData, dataNascimento: event.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sexo">Sexo</Label>
                  <SearchableSelect
                    options={[
                      { value: 'Masculino', label: 'Masculino' },
                      { value: 'Feminino', label: 'Feminino' },
                      { value: 'Outro', label: 'Outro' },
                    ]}
                    value={formData.sexo}
                    onValueChange={(value) => setFormData({ ...formData, sexo: value })}
                    placeholder="Selecione"
                    searchPlaceholder="Pesquisar..."
                    disabled={readOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="documento">CPF/Documento</Label>
                  <Input
                    id="documento"
                    value={formData.documento}
                    disabled={readOnly}
                    onChange={(event) =>
                      setFormData({ ...formData, documento: event.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    disabled={readOnly}
                    onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    disabled={readOnly}
                    onChange={(event) => setFormData({ ...formData, telefone: event.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  value={formData.endereco}
                  disabled={readOnly}
                  onChange={(event) => setFormData({ ...formData, endereco: event.target.value })}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input
                    id="cidade"
                    value={formData.cidade}
                    disabled={readOnly}
                    onChange={(event) => setFormData({ ...formData, cidade: event.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estado">Estado</Label>
                  <SearchableSelect
                    options={estadoOptions}
                    value={formData.estado}
                    onValueChange={(value) => setFormData({ ...formData, estado: value })}
                    placeholder="Selecione"
                    searchPlaceholder="Pesquisar estado..."
                    disabled={readOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cep">CEP</Label>
                  <Input
                    id="cep"
                    value={formData.cep}
                    disabled={readOnly}
                    onChange={(event) => setFormData({ ...formData, cep: event.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <SearchableSelect
                  options={[
                    { value: 'Ativo', label: 'Ativo' },
                    { value: 'Inativo', label: 'Inativo' },
                  ]}
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value as 'Ativo' | 'Inativo' })
                  }
                  placeholder="Selecione"
                  disabled={readOnly}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  rows={3}
                  value={formData.observacoes}
                  disabled={readOnly}
                  onChange={(event) =>
                    setFormData({ ...formData, observacoes: event.target.value })
                  }
                />
              </div>

              <div className={`flex ${navigation ? 'justify-between' : 'justify-end'} gap-3`}>
                {navigation && <ModalNavigation {...navigation} />}
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={onClose}>
                    {readOnly ? 'Fechar' : 'Cancelar'}
                  </Button>
                  {!readOnly && (
                    <Button type="submit" disabled={isSubmitting}>
                      {data ? 'Salvar' : 'Cadastrar'}
                    </Button>
                  )}
                </div>
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
