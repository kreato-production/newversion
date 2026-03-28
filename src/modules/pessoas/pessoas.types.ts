export interface Pessoa {
  id: string;
  codigoExterno: string;
  nome: string;
  sobrenome: string;
  nomeTrabalho: string;
  foto?: string;
  dataNascimento: string;
  sexo: string;
  telefone: string;
  email: string;
  classificacao: string;
  classificacaoId?: string;
  documento: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  observacoes: string;
  status: 'Ativo' | 'Inativo';
  dataCadastro: string;
  usuarioCadastro: string;
}

export interface PessoaInput {
  id?: string;
  tenantId?: string | null;
  codigoExterno: string;
  nome: string;
  sobrenome: string;
  nomeTrabalho: string;
  foto?: string;
  dataNascimento: string;
  sexo: string;
  telefone: string;
  email: string;
  classificacao: string;
  classificacaoId?: string;
  documento: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  observacoes: string;
  status: 'Ativo' | 'Inativo';
}

export interface ClassificacaoPessoaOption {
  id: string;
  nome: string;
}

export interface GravacaoParticipacao {
  id: string;
  codigo: string;
  nome: string;
  dataPrevista: string;
}
