import { useMemo, useState, useEffect } from 'react';
import { Camera, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { FormPage } from '@/components/shared/FormPage';
import { SearchableSelect } from '@/components/shared/SearchableSelect';
import { TagInput } from '@/components/shared/TagInput';
import { PessoaGravacoesTab } from '@/components/recursos/PessoaGravacoesTab';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useRecordForm } from '@/hooks/useRecordForm';
import { useRecordNavigation } from '@/hooks/useRecordNavigation';
import { getCountryOptions, getLanguageOptions, withCurrentValue } from '@/lib/locale-options';
import { pessoasRepository } from '@/modules/pessoas/pessoas.repository.provider';
import { PESSOAS_ROUTES } from '@/modules/pessoas/pessoas.navigation';
import type {
  ClassificacaoPessoaOption,
  Pessoa,
  PessoaInput,
} from '@/modules/pessoas/pessoas.types';

const ESTADOS_BRASILEIROS = [
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

const EMPTY_FORM: PessoaInput = {
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
  paisNascimento: '',
  idiomaNativo: '',
  tags: [],
  status: 'Ativo',
};

function toFormData(data: Pessoa): PessoaInput {
  return {
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
    paisNascimento: data.paisNascimento || '',
    idiomaNativo: data.idiomaNativo || '',
    tags: data.tags ?? [],
    status: data.status,
  };
}

interface PessoaFormProps {
  /** Id of the record being edited; omitted when creating a new one. */
  pessoaId?: string;
}

const PessoaForm = ({ pessoaId }: PessoaFormProps) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { canIncluir, canAlterar } = usePermissions();
  const { goBack, navigation } = useRecordNavigation(PESSOAS_ROUTES, pessoaId);

  const readOnly = pessoaId
    ? !canAlterar('Recursos', 'Pessoas')
    : !canIncluir('Recursos', 'Pessoas');

  const {
    isEditing,
    record,
    formData,
    setFormData,
    update,
    isLoading,
    loadError,
    isSubmitting,
    handleSubmit,
  } = useRecordForm<Pessoa, PessoaInput>({
    id: pessoaId,
    empty: EMPTY_FORM,
    load: (id) => pessoasRepository.getById(id),
    toInput: toFormData,
    save: (input) => pessoasRepository.save({ ...input, tenantId: user?.tenantId ?? null }),
    onSaved: goBack,
    readOnly,
    messages: { created: 'Pessoa cadastrada!', updated: 'Pessoa atualizada!' },
  });

  const [classificacoes, setClassificacoes] = useState<ClassificacaoPessoaOption[]>([]);
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);

  useEffect(() => {
    pessoasRepository
      .listOptions()
      .then((options) => {
        setClassificacoes(options.classificacoes);
        setTagSuggestions(options.tags);
      })
      .catch((error) => console.error('Error loading pessoa options:', error));
  }, []);

  const estadoOptions = useMemo(
    () => ESTADOS_BRASILEIROS.map((uf) => ({ value: uf, label: uf })),
    [],
  );

  const paisOptions = useMemo(
    () => withCurrentValue(getCountryOptions(), formData.paisNascimento),
    [formData.paisNascimento],
  );

  const idiomaOptions = useMemo(
    () => withCurrentValue(getLanguageOptions(), formData.idiomaNativo),
    [formData.idiomaNativo],
  );

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => update('foto', reader.result as string);
    reader.readAsDataURL(file);
  };

  const title = isEditing
    ? record
      ? `${record.nome} ${record.sobrenome}`.trim()
      : 'Editar Pessoa'
    : t('field.newPerson');

  return (
    <FormPage
      title={title}
      description={isEditing ? 'Editar dados da pessoa' : 'Cadastrar uma nova pessoa'}
      formId="pessoa-form"
      onBack={goBack}
      isEditing={isEditing}
      readOnly={readOnly}
      isLoading={isLoading}
      isSubmitting={isSubmitting}
      loadError={loadError}
      notFoundTitle="Pessoa não encontrada"
      notFoundIcon={Users}
      navigation={navigation}
    >
      <Tabs defaultValue="dados" className="w-full">
        <TabsList>
          <TabsTrigger value="dados">Dados Gerais</TabsTrigger>
          <TabsTrigger value="gravacoes" disabled={!isEditing}>
            Gravações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dados">
          <form id="pessoa-form" onSubmit={handleSubmit} className="mt-4">
            <div className="flex flex-col gap-6 lg:flex-row">
              <div className="flex justify-center lg:w-40 lg:shrink-0 lg:justify-start">
                <div className="relative h-fit">
                  <Avatar className="w-28 h-28">
                    <AvatarImage src={formData.foto} />
                    <AvatarFallback className="text-2xl gradient-brand text-primary-foreground">
                      {formData.nome?.charAt(0) || 'P'}
                      {formData.sobrenome?.charAt(0) || ''}
                    </AvatarFallback>
                  </Avatar>
                  {!readOnly && (
                    <label
                      className="absolute bottom-1 right-1 p-1.5 bg-primary rounded-full cursor-pointer hover:bg-primary/90 transition-colors"
                      title="Alterar foto"
                    >
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

              <div className="flex-1 space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="codigoExterno">Código Externo</Label>
                    <Input
                      id="codigoExterno"
                      value={formData.codigoExterno}
                      disabled={readOnly}
                      onChange={(event) => update('codigoExterno', event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="classificacao">Classificação</Label>
                    <SearchableSelect
                      options={classificacoes.map((item) => ({ value: item.id, label: item.nome }))}
                      value={formData.classificacaoId || ''}
                      onValueChange={(value) => {
                        const selected = classificacoes.find((item) => item.id === value);
                        setFormData((current) => ({
                          ...current,
                          classificacaoId: value,
                          classificacao: selected?.nome || '',
                        }));
                      }}
                      placeholder="Selecione a classificação"
                      searchPlaceholder="Pesquisar classificação..."
                      disabled={readOnly}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      required
                      disabled={readOnly}
                      onChange={(event) => update('nome', event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sobrenome">Sobrenome</Label>
                    <Input
                      id="sobrenome"
                      value={formData.sobrenome}
                      required
                      disabled={readOnly}
                      onChange={(event) => update('sobrenome', event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nomeTrabalho">Nome de Trabalho</Label>
                    <Input
                      id="nomeTrabalho"
                      value={formData.nomeTrabalho}
                      disabled={readOnly}
                      placeholder="Nome artístico ou de trabalho"
                      onChange={(event) => update('nomeTrabalho', event.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="dataNascimento">Data de Nascimento</Label>
                    <Input
                      id="dataNascimento"
                      type="date"
                      value={formData.dataNascimento}
                      disabled={readOnly}
                      onChange={(event) => update('dataNascimento', event.target.value)}
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
                      onValueChange={(value) => update('sexo', value)}
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
                      onChange={(event) => update('documento', event.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="paisNascimento">País de Nascimento</Label>
                    <SearchableSelect
                      options={paisOptions}
                      value={formData.paisNascimento}
                      onValueChange={(value) => update('paisNascimento', value)}
                      placeholder="Selecione o país"
                      searchPlaceholder="Pesquisar país..."
                      disabled={readOnly}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="idiomaNativo">Idioma Nativo</Label>
                    <SearchableSelect
                      options={idiomaOptions}
                      value={formData.idiomaNativo}
                      onValueChange={(value) => update('idiomaNativo', value)}
                      placeholder="Selecione o idioma"
                      searchPlaceholder="Pesquisar idioma..."
                      disabled={readOnly}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      disabled={readOnly}
                      onChange={(event) => update('email', event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      value={formData.telefone}
                      disabled={readOnly}
                      onChange={(event) => update('telefone', event.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endereco">Endereço</Label>
                  <Input
                    id="endereco"
                    value={formData.endereco}
                    disabled={readOnly}
                    onChange={(event) => update('endereco', event.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="cidade">Cidade</Label>
                    <Input
                      id="cidade"
                      value={formData.cidade}
                      disabled={readOnly}
                      onChange={(event) => update('cidade', event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estado">Estado</Label>
                    <SearchableSelect
                      options={estadoOptions}
                      value={formData.estado}
                      onValueChange={(value) => update('estado', value)}
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
                      onChange={(event) => update('cep', event.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <SearchableSelect
                      options={[
                        { value: 'Ativo', label: 'Ativo' },
                        { value: 'Inativo', label: 'Inativo' },
                      ]}
                      value={formData.status}
                      onValueChange={(value) => update('status', value as 'Ativo' | 'Inativo')}
                      placeholder="Selecione"
                      disabled={readOnly}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Tags</Label>
                  <TagInput
                    id="tags"
                    value={formData.tags}
                    onChange={(tags) => update('tags', tags)}
                    suggestions={tagSuggestions}
                    placeholder="Ex.: bilíngue, apresentador — Enter ou vírgula para adicionar"
                    disabled={readOnly}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    rows={4}
                    value={formData.observacoes}
                    disabled={readOnly}
                    onChange={(event) => update('observacoes', event.target.value)}
                  />
                </div>
              </div>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="gravacoes">
          {pessoaId && <PessoaGravacoesTab pessoaId={pessoaId} />}
        </TabsContent>
      </Tabs>
    </FormPage>
  );
};

export default PessoaForm;
