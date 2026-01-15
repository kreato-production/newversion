// Matriz de permissões base do sistema
// Estrutura: Módulo > Sub-módulo 1 > Sub-módulo 2 > Campo
// Cada item tem: ação (visible/invisible), somenteLeitura, incluir, alterar, excluir

export interface PermissionItem {
  id: string;
  modulo: string;
  subModulo1: string;
  subModulo2: string;
  campo: string;
  acao: 'visible' | 'invisible';
  somenteLeitura: boolean;
  incluir: boolean;
  alterar: boolean;
  excluir: boolean;
  tipo: 'modulo' | 'submodulo1' | 'submodulo2' | 'campo';
}

export interface PerfilPermissoes {
  perfilId: string;
  permissoes: PermissionItem[];
}

// Função para gerar ID único para cada item de permissão
const generatePermissionId = (modulo: string, subModulo1: string, subModulo2: string, campo: string): string => {
  return `${modulo}_${subModulo1}_${subModulo2}_${campo}`.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
};

// Matriz base de permissões do sistema
export const basePermissionsMatrix: Omit<PermissionItem, 'id'>[] = [
  // Dashboard
  { modulo: 'Dashboard', subModulo1: '-', subModulo2: '-', campo: '-', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'modulo' },
  
  // Produção
  { modulo: 'Produção', subModulo1: '-', subModulo2: '-', campo: '-', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'modulo' },
  
  // Produção > Conteúdo
  { modulo: 'Produção', subModulo1: 'Conteúdo', subModulo2: '-', campo: '-', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'submodulo1' },
  { modulo: 'Produção', subModulo1: 'Conteúdo', subModulo2: '-', campo: 'Código Externo', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Produção', subModulo1: 'Conteúdo', subModulo2: '-', campo: 'Descrição', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Produção', subModulo1: 'Conteúdo', subModulo2: '-', campo: 'Qtd.Episódios', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Produção', subModulo1: 'Conteúdo', subModulo2: '-', campo: 'Unidade de Negócio', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Produção', subModulo1: 'Conteúdo', subModulo2: '-', campo: 'Centro de Lucro', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Produção', subModulo1: 'Conteúdo', subModulo2: '-', campo: 'Tipo de Conteúdo', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Produção', subModulo1: 'Conteúdo', subModulo2: '-', campo: 'Classificação', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Produção', subModulo1: 'Conteúdo', subModulo2: '-', campo: 'Ano de Produção', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Produção', subModulo1: 'Conteúdo', subModulo2: '-', campo: 'Descrição / Sinopse', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Produção', subModulo1: 'Conteúdo', subModulo2: '-', campo: 'Botão "Gerar"', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Produção', subModulo1: 'Conteúdo', subModulo2: '-', campo: 'Tabulador "Gravações"', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Produção', subModulo1: 'Conteúdo', subModulo2: '-', campo: 'Tabulador "Elenco"', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Produção', subModulo1: 'Conteúdo', subModulo2: '-', campo: 'Tabulador "Custos"', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  
  // Produção > Gravação
  { modulo: 'Produção', subModulo1: 'Gravação', subModulo2: '-', campo: '-', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'submodulo1' },
  { modulo: 'Produção', subModulo1: 'Gravação', subModulo2: '-', campo: 'Código', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Produção', subModulo1: 'Gravação', subModulo2: '-', campo: 'Código Externo', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Produção', subModulo1: 'Gravação', subModulo2: '-', campo: 'Nome', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Produção', subModulo1: 'Gravação', subModulo2: '-', campo: 'Unidade de Negócio', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Produção', subModulo1: 'Gravação', subModulo2: '-', campo: 'Centro de Lucro', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Produção', subModulo1: 'Gravação', subModulo2: '-', campo: 'Tipo de Conteúdo', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Produção', subModulo1: 'Gravação', subModulo2: '-', campo: 'Classificação', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Produção', subModulo1: 'Gravação', subModulo2: '-', campo: 'Status', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Produção', subModulo1: 'Gravação', subModulo2: '-', campo: 'Conteúdo', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Produção', subModulo1: 'Gravação', subModulo2: '-', campo: 'Data Prevista', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Produção', subModulo1: 'Gravação', subModulo2: '-', campo: 'Descrição', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Produção', subModulo1: 'Gravação', subModulo2: '-', campo: 'Tabulador "Roteiro"', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Produção', subModulo1: 'Gravação', subModulo2: '-', campo: 'Tabulador "Recursos"', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Produção', subModulo1: 'Gravação', subModulo2: '-', campo: 'Tabulador "Elenco"', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Produção', subModulo1: 'Gravação', subModulo2: '-', campo: 'Tabulador "Convidados"', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Produção', subModulo1: 'Gravação', subModulo2: '-', campo: 'Tabulador "Figurinos"', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Produção', subModulo1: 'Gravação', subModulo2: '-', campo: 'Tabulador "Terceiros"', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Produção', subModulo1: 'Gravação', subModulo2: '-', campo: 'Tabulador "Custos"', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  
  // Produção > Tarefas
  { modulo: 'Produção', subModulo1: 'Tarefas', subModulo2: '-', campo: '-', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'submodulo1' },
  { modulo: 'Produção', subModulo1: 'Tarefas', subModulo2: '-', campo: 'Título da Tarefa', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Produção', subModulo1: 'Tarefas', subModulo2: '-', campo: 'Descrição', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Produção', subModulo1: 'Tarefas', subModulo2: '-', campo: 'Gravação', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Produção', subModulo1: 'Tarefas', subModulo2: '-', campo: 'Status', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Produção', subModulo1: 'Tarefas', subModulo2: '-', campo: 'Responsável', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Produção', subModulo1: 'Tarefas', subModulo2: '-', campo: 'Prioridade', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Produção', subModulo1: 'Tarefas', subModulo2: '-', campo: 'Data Início', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Produção', subModulo1: 'Tarefas', subModulo2: '-', campo: 'Data Limite', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Produção', subModulo1: 'Tarefas', subModulo2: '-', campo: 'Observações', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  
  // Produção > Mapas
  { modulo: 'Produção', subModulo1: 'Mapas', subModulo2: '-', campo: '-', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'submodulo1' },
  { modulo: 'Produção', subModulo1: 'Mapas', subModulo2: 'Vista "Recursos Físicos"', campo: '-', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'submodulo2' },
  { modulo: 'Produção', subModulo1: 'Mapas', subModulo2: 'Vista "Recursos Humanos"', campo: '-', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'submodulo2' },
  
  // Produção > Parametrizações
  { modulo: 'Produção', subModulo1: 'Parametrizações', subModulo2: 'Tipo de gravação', campo: '-', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'submodulo2' },
  { modulo: 'Produção', subModulo1: 'Parametrizações', subModulo2: 'Tipo de gravação', campo: 'Código Externo', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Produção', subModulo1: 'Parametrizações', subModulo2: 'Tipo de gravação', campo: 'Nome', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Produção', subModulo1: 'Parametrizações', subModulo2: 'Tipo de gravação', campo: 'Descrição', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  
  { modulo: 'Produção', subModulo1: 'Parametrizações', subModulo2: 'Classificação', campo: '-', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'submodulo2' },
  { modulo: 'Produção', subModulo1: 'Parametrizações', subModulo2: 'Classificação', campo: 'Código Externo', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Produção', subModulo1: 'Parametrizações', subModulo2: 'Classificação', campo: 'Nome', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Produção', subModulo1: 'Parametrizações', subModulo2: 'Classificação', campo: 'Descrição', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  
  { modulo: 'Produção', subModulo1: 'Parametrizações', subModulo2: 'Status de Gravação', campo: '-', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'submodulo2' },
  { modulo: 'Produção', subModulo1: 'Parametrizações', subModulo2: 'Status de Gravação', campo: 'Código Externo', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Produção', subModulo1: 'Parametrizações', subModulo2: 'Status de Gravação', campo: 'Nome', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Produção', subModulo1: 'Parametrizações', subModulo2: 'Status de Gravação', campo: 'Cor', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Produção', subModulo1: 'Parametrizações', subModulo2: 'Status de Gravação', campo: 'Descrição', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  
  { modulo: 'Produção', subModulo1: 'Parametrizações', subModulo2: 'Status da Tarefa', campo: '-', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'submodulo2' },
  { modulo: 'Produção', subModulo1: 'Parametrizações', subModulo2: 'Status da Tarefa', campo: 'Código', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Produção', subModulo1: 'Parametrizações', subModulo2: 'Status da Tarefa', campo: 'Nome', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Produção', subModulo1: 'Parametrizações', subModulo2: 'Status da Tarefa', campo: 'Cor', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Produção', subModulo1: 'Parametrizações', subModulo2: 'Status da Tarefa', campo: 'Descrição', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  
  // Recursos
  { modulo: 'Recursos', subModulo1: '-', subModulo2: '-', campo: '-', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'modulo' },
  
  // Recursos > Recursos Humanos
  { modulo: 'Recursos', subModulo1: 'Recursos Humanos', subModulo2: '-', campo: '-', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'submodulo1' },
  { modulo: 'Recursos', subModulo1: 'Recursos Humanos', subModulo2: '-', campo: 'Foto', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Recursos Humanos', subModulo2: '-', campo: 'Código Externo', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Recursos Humanos', subModulo2: '-', campo: 'Nome', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Recursos Humanos', subModulo2: '-', campo: 'Sobrenome', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Recursos Humanos', subModulo2: '-', campo: 'E-mail', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Recursos Humanos', subModulo2: '-', campo: 'Telefone', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Recursos Humanos', subModulo2: '-', campo: 'Sexo', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Recursos Humanos', subModulo2: '-', campo: 'Data de Nascimento', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Recursos Humanos', subModulo2: '-', campo: 'Data de Contratação', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Recursos Humanos', subModulo2: '-', campo: 'Custo/Hora', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Recursos Humanos', subModulo2: '-', campo: 'Departamento', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Recursos Humanos', subModulo2: '-', campo: 'Função', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Recursos Humanos', subModulo2: '-', campo: 'Status', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Recursos Humanos', subModulo2: '-', campo: 'Botão "Adicionar Anexo"', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Recursos Humanos', subModulo2: '-', campo: 'Tabulador "Ausências"', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  
  // Recursos > Recursos Técnicos
  { modulo: 'Recursos', subModulo1: 'Recursos Técnicos', subModulo2: '-', campo: '-', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'submodulo1' },
  { modulo: 'Recursos', subModulo1: 'Recursos Técnicos', subModulo2: '-', campo: 'Código Externo', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Recursos Técnicos', subModulo2: '-', campo: 'Nome', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Recursos Técnicos', subModulo2: '-', campo: 'Função do Operador', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  
  // Recursos > Recursos Físicos
  { modulo: 'Recursos', subModulo1: 'Recursos Físicos', subModulo2: '-', campo: '-', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'submodulo1' },
  { modulo: 'Recursos', subModulo1: 'Recursos Físicos', subModulo2: '-', campo: 'Código Externo', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Recursos Físicos', subModulo2: '-', campo: 'Custo/Hora', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Recursos Físicos', subModulo2: '-', campo: 'Nome', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  
  // Recursos > Fornecedores
  { modulo: 'Recursos', subModulo1: 'Fornecedores', subModulo2: '-', campo: '-', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'submodulo1' },
  { modulo: 'Recursos', subModulo1: 'Fornecedores', subModulo2: '-', campo: 'Código Externo', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Fornecedores', subModulo2: '-', campo: 'Nome', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Fornecedores', subModulo2: '-', campo: 'Categoria', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Fornecedores', subModulo2: '-', campo: 'E-mail', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Fornecedores', subModulo2: '-', campo: 'País', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Fornecedores', subModulo2: '-', campo: 'Identificação Fiscal', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Fornecedores', subModulo2: '-', campo: 'Descrição', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Fornecedores', subModulo2: '-', campo: 'Tabulador "Dados Gerais"', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Fornecedores', subModulo2: '-', campo: 'Tabulador "Serviços"', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  
  // Recursos > Pessoas
  { modulo: 'Recursos', subModulo1: 'Pessoas', subModulo2: '-', campo: '-', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'submodulo1' },
  { modulo: 'Recursos', subModulo1: 'Pessoas', subModulo2: '-', campo: 'Código Externo', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Pessoas', subModulo2: '-', campo: 'Classificação', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Pessoas', subModulo2: '-', campo: 'Nome', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Pessoas', subModulo2: '-', campo: 'Sobrenome', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Pessoas', subModulo2: '-', campo: 'Nome de Trabalho', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Pessoas', subModulo2: '-', campo: 'Data de Nascimento', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Pessoas', subModulo2: '-', campo: 'Sexo', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Pessoas', subModulo2: '-', campo: 'CPF/Documento', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Pessoas', subModulo2: '-', campo: 'E-mail', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Pessoas', subModulo2: '-', campo: 'Telefone', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Pessoas', subModulo2: '-', campo: 'Endereço', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Pessoas', subModulo2: '-', campo: 'Cidade', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Pessoas', subModulo2: '-', campo: 'Estado', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Pessoas', subModulo2: '-', campo: 'CEP', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Pessoas', subModulo2: '-', campo: 'Status', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Pessoas', subModulo2: '-', campo: 'Observações', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  
  // Recursos > Figurinos
  { modulo: 'Recursos', subModulo1: 'Figurinos', subModulo2: '-', campo: '-', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'submodulo1' },
  { modulo: 'Recursos', subModulo1: 'Figurinos', subModulo2: '-', campo: 'Código Externo', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Figurinos', subModulo2: '-', campo: 'Código do figurino', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Figurinos', subModulo2: '-', campo: 'Descrição', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Figurinos', subModulo2: '-', campo: 'Tipo de Figurino', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Figurinos', subModulo2: '-', campo: 'Material', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Figurinos', subModulo2: '-', campo: 'Tamanho da Peça', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Figurinos', subModulo2: '-', campo: 'Cor Predominante', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Figurinos', subModulo2: '-', campo: 'Cor Secundária', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Figurinos', subModulo2: '-', campo: 'Imagens', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  
  // Recursos > Parametrizações
  { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Cargos', campo: '-', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'submodulo2' },
  { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Cargos', campo: 'Código Externo', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Cargos', campo: 'Nome', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Cargos', campo: 'Descrição', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  
  { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Departamentos', campo: '-', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'submodulo2' },
  { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Departamentos', campo: 'Código Externo', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Departamentos', campo: 'Nome', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Departamentos', campo: 'Descrição', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  
  { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Funções', campo: '-', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'submodulo2' },
  { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Funções', campo: 'Código Externo', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Funções', campo: 'Nome', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Funções', campo: 'Descrição', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  
  { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Serviços', campo: '-', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'submodulo2' },
  { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Serviços', campo: 'Código Externo', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Serviços', campo: 'Nome', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Serviços', campo: 'Descrição', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  
  { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Categoria de Fornecedores', campo: '-', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'submodulo2' },
  { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Categoria de Fornecedores', campo: 'Código Externo', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Categoria de Fornecedores', campo: 'Nome', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Categoria de Fornecedores', campo: 'Descrição', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  
  { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Classificação Pessoas', campo: '-', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'submodulo2' },
  { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Classificação Pessoas', campo: 'Código Externo', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Classificação Pessoas', campo: 'Nome', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Classificação Pessoas', campo: 'Descrição', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  
  { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Tipo Figurino', campo: '-', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'submodulo2' },
  { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Tipo Figurino', campo: 'Código Externo', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Tipo Figurino', campo: 'Nome', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Tipo Figurino', campo: 'Descrição', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  
  { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Material', campo: '-', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'submodulo2' },
  { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Material', campo: 'Código Externo', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Material', campo: 'Nome', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Material', campo: 'Descrição', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  
  // Administração
  { modulo: 'Administração', subModulo1: '-', subModulo2: '-', campo: '-', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'modulo' },
  
  // Administração > Unidade de Negócio
  { modulo: 'Administração', subModulo1: 'Unidade de Negócio', subModulo2: '-', campo: '-', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'submodulo1' },
  { modulo: 'Administração', subModulo1: 'Unidade de Negócio', subModulo2: '-', campo: 'Logotipo', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Administração', subModulo1: 'Unidade de Negócio', subModulo2: '-', campo: 'Código Externo', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Administração', subModulo1: 'Unidade de Negócio', subModulo2: '-', campo: 'Nome', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Administração', subModulo1: 'Unidade de Negócio', subModulo2: '-', campo: 'Descrição', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  
  // Administração > Centro de Lucro
  { modulo: 'Administração', subModulo1: 'Centro de Lucro', subModulo2: '-', campo: '-', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'submodulo1' },
  { modulo: 'Administração', subModulo1: 'Centro de Lucro', subModulo2: '-', campo: 'Código Externo', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Administração', subModulo1: 'Centro de Lucro', subModulo2: '-', campo: 'Status', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Administração', subModulo1: 'Centro de Lucro', subModulo2: '-', campo: 'Nome', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Administração', subModulo1: 'Centro de Lucro', subModulo2: '-', campo: 'Centro de Lucro Pai', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Administração', subModulo1: 'Centro de Lucro', subModulo2: '-', campo: 'Descrição', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  
  // Administração > Usuários
  { modulo: 'Administração', subModulo1: 'Usuários', subModulo2: '-', campo: '-', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'submodulo1' },
  { modulo: 'Administração', subModulo1: 'Usuários', subModulo2: '-', campo: 'Código Externo', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Administração', subModulo1: 'Usuários', subModulo2: '-', campo: 'Nome', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Administração', subModulo1: 'Usuários', subModulo2: '-', campo: 'E-mail', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Administração', subModulo1: 'Usuários', subModulo2: '-', campo: 'Usuário', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Administração', subModulo1: 'Usuários', subModulo2: '-', campo: 'Perfil de Acesso', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Administração', subModulo1: 'Usuários', subModulo2: '-', campo: 'Tabulador "Dados Gerais"', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Administração', subModulo1: 'Usuários', subModulo2: '-', campo: 'Tabulador "Unidade de Negócio"', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
];

// Gera a matriz com IDs
export const getPermissionsMatrixWithIds = (): PermissionItem[] => {
  return basePermissionsMatrix.map((item) => ({
    ...item,
    id: generatePermissionId(item.modulo, item.subModulo1, item.subModulo2, item.campo),
  }));
};

// Cria permissões padrão para um novo perfil (REGRA 1)
export const createDefaultPermissions = (perfilId: string): PerfilPermissoes => {
  return {
    perfilId,
    permissoes: getPermissionsMatrixWithIds(),
  };
};

// Clona permissões de um perfil existente
export const clonePermissions = (sourcePerfilId: string, targetPerfilId: string): PerfilPermissoes | null => {
  const stored = localStorage.getItem('kreato_perfil_permissoes');
  if (!stored) return null;
  
  const allPermissions: PerfilPermissoes[] = JSON.parse(stored);
  const sourcePermissions = allPermissions.find(p => p.perfilId === sourcePerfilId);
  
  if (!sourcePermissions) return null;
  
  return {
    perfilId: targetPerfilId,
    permissoes: sourcePermissions.permissoes.map(p => ({ ...p })),
  };
};

// Salva permissões de um perfil
export const savePerfilPermissions = (perfilPermissoes: PerfilPermissoes): void => {
  const stored = localStorage.getItem('kreato_perfil_permissoes');
  const allPermissions: PerfilPermissoes[] = stored ? JSON.parse(stored) : [];
  
  const existingIndex = allPermissions.findIndex(p => p.perfilId === perfilPermissoes.perfilId);
  
  if (existingIndex >= 0) {
    allPermissions[existingIndex] = perfilPermissoes;
  } else {
    allPermissions.push(perfilPermissoes);
  }
  
  localStorage.setItem('kreato_perfil_permissoes', JSON.stringify(allPermissions));
};

// Obtém permissões de um perfil
export const getPerfilPermissions = (perfilId: string): PerfilPermissoes | null => {
  const stored = localStorage.getItem('kreato_perfil_permissoes');
  if (!stored) return null;
  
  const allPermissions: PerfilPermissoes[] = JSON.parse(stored);
  return allPermissions.find(p => p.perfilId === perfilId) || null;
};

// Sincroniza a matriz de permissões (REGRA 4) - adiciona novos campos que possam ter sido criados
export const syncPermissionsMatrix = (perfilId: string): PerfilPermissoes => {
  const currentMatrix = getPermissionsMatrixWithIds();
  const existingPermissions = getPerfilPermissions(perfilId);
  
  if (!existingPermissions) {
    return createDefaultPermissions(perfilId);
  }
  
  const existingIds = new Set(existingPermissions.permissoes.map(p => p.id));
  const updatedPermissions = [...existingPermissions.permissoes];
  
  // Adiciona novos itens que não existem
  currentMatrix.forEach(item => {
    if (!existingIds.has(item.id)) {
      updatedPermissions.push(item);
    }
  });
  
  // Remove itens que não existem mais na matriz base
  const currentIds = new Set(currentMatrix.map(p => p.id));
  const filteredPermissions = updatedPermissions.filter(p => currentIds.has(p.id));
  
  const syncedPermissions: PerfilPermissoes = {
    perfilId,
    permissoes: filteredPermissions,
  };
  
  savePerfilPermissions(syncedPermissions);
  return syncedPermissions;
};

// Obtém módulos únicos
export const getModulos = (): string[] => {
  const modulos = new Set(basePermissionsMatrix.map(p => p.modulo));
  return Array.from(modulos);
};

// Obtém sub-módulos 1 de um módulo
export const getSubModulos1 = (modulo: string): string[] => {
  const subModulos = new Set(
    basePermissionsMatrix
      .filter(p => p.modulo === modulo && p.subModulo1 !== '-')
      .map(p => p.subModulo1)
  );
  return Array.from(subModulos);
};

// Obtém sub-módulos 2 de um sub-módulo 1
export const getSubModulos2 = (modulo: string, subModulo1: string): string[] => {
  const subModulos = new Set(
    basePermissionsMatrix
      .filter(p => p.modulo === modulo && p.subModulo1 === subModulo1 && p.subModulo2 !== '-')
      .map(p => p.subModulo2)
  );
  return Array.from(subModulos);
};
