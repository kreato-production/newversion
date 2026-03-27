export interface UsuarioApiModel {
  id: string;
  codigoExterno: string;
  nome: string;
  email: string;
  usuario: string;
  senha: string;
  foto?: string;
  perfil: string;
  descricao: string;
  status: 'Ativo' | 'Inativo' | 'Bloqueado';
  tipoAcesso: string;
  recursoHumanoId?: string;
  dataCadastro: string;
  usuarioCadastro: string;
  tenantId?: string | null;
  role?: 'GLOBAL_ADMIN' | 'TENANT_ADMIN' | 'USER';
}
