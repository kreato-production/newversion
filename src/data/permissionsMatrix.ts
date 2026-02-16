// Matriz de permissões base do sistema
// Estrutura: Módulo > Sub-módulo 1 > Sub-módulo 2 > Campo
// Cada item tem: ação (visible/invisible), somenteLeitura, incluir, alterar, excluir

import { supabase } from '@/integrations/supabase/client';

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
  { modulo: 'Produção', subModulo1: 'Conteúdo', subModulo2: '-', campo: 'Tabela de Preço', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Produção', subModulo1: 'Conteúdo', subModulo2: '-', campo: 'Tabulador "Recursos Técnicos"', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Produção', subModulo1: 'Conteúdo', subModulo2: '-', campo: 'Tabulador "Recursos Físicos"', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Produção', subModulo1: 'Conteúdo', subModulo2: '-', campo: 'Tabulador "Terceiros"', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Produção', subModulo1: 'Conteúdo', subModulo2: '-', campo: 'Frequência Semanal', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  
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
  
  { modulo: 'Produção', subModulo1: 'Parametrizações', subModulo2: 'Tabelas de Preços', campo: '-', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'submodulo2' },
  { modulo: 'Produção', subModulo1: 'Parametrizações', subModulo2: 'Tabelas de Preços', campo: 'Código Externo', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Produção', subModulo1: 'Parametrizações', subModulo2: 'Tabelas de Preços', campo: 'Nome', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Produção', subModulo1: 'Parametrizações', subModulo2: 'Tabelas de Preços', campo: 'Unidade de Negócio', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Produção', subModulo1: 'Parametrizações', subModulo2: 'Tabelas de Preços', campo: 'Status', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Produção', subModulo1: 'Parametrizações', subModulo2: 'Tabelas de Preços', campo: 'Vigência', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Produção', subModulo1: 'Parametrizações', subModulo2: 'Tabelas de Preços', campo: 'Descrição', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Produção', subModulo1: 'Parametrizações', subModulo2: 'Tabelas de Preços', campo: 'Tabulador "Recursos Técnicos"', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Produção', subModulo1: 'Parametrizações', subModulo2: 'Tabelas de Preços', campo: 'Tabulador "Recursos Físicos"', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  
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
  { modulo: 'Recursos', subModulo1: 'Recursos Físicos', subModulo2: '-', campo: 'Tabulador "Disponibilidade"', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  
  // Recursos > Pessoas
  { modulo: 'Recursos', subModulo1: 'Pessoas', subModulo2: '-', campo: '-', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'submodulo1' },
  { modulo: 'Recursos', subModulo1: 'Pessoas', subModulo2: '-', campo: 'Foto', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Pessoas', subModulo2: '-', campo: 'Código Externo', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Pessoas', subModulo2: '-', campo: 'Nome', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Pessoas', subModulo2: '-', campo: 'Sobrenome', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Pessoas', subModulo2: '-', campo: 'Nome Trabalho', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Pessoas', subModulo2: '-', campo: 'Documento', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Pessoas', subModulo2: '-', campo: 'Data de Nascimento', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Pessoas', subModulo2: '-', campo: 'Sexo', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Pessoas', subModulo2: '-', campo: 'E-mail', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Pessoas', subModulo2: '-', campo: 'Telefone', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Pessoas', subModulo2: '-', campo: 'Endereço', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Pessoas', subModulo2: '-', campo: 'CEP', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Pessoas', subModulo2: '-', campo: 'Cidade', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Pessoas', subModulo2: '-', campo: 'Estado', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Pessoas', subModulo2: '-', campo: 'Classificação', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Pessoas', subModulo2: '-', campo: 'Observações', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Pessoas', subModulo2: '-', campo: 'Status', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  
  // Recursos > Figurinos
  { modulo: 'Recursos', subModulo1: 'Figurinos', subModulo2: '-', campo: '-', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'submodulo1' },
  { modulo: 'Recursos', subModulo1: 'Figurinos', subModulo2: '-', campo: 'Código', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Figurinos', subModulo2: '-', campo: 'Código Externo', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Figurinos', subModulo2: '-', campo: 'Descrição', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Figurinos', subModulo2: '-', campo: 'Tipo de Figurino', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Figurinos', subModulo2: '-', campo: 'Material', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Figurinos', subModulo2: '-', campo: 'Tamanho', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Figurinos', subModulo2: '-', campo: 'Cor Predominante', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Figurinos', subModulo2: '-', campo: 'Cor Secundária', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Figurinos', subModulo2: '-', campo: 'Botão "Adicionar Imagem"', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  
  // Recursos > Equipes
  { modulo: 'Recursos', subModulo1: 'Equipes', subModulo2: '-', campo: '-', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'submodulo1' },
  { modulo: 'Recursos', subModulo1: 'Equipes', subModulo2: '-', campo: 'Código', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Equipes', subModulo2: '-', campo: 'Descrição', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Equipes', subModulo2: '-', campo: 'Tabulador "Membros"', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  
  // Recursos > Fornecedores
  { modulo: 'Recursos', subModulo1: 'Fornecedores', subModulo2: '-', campo: '-', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'submodulo1' },
  { modulo: 'Recursos', subModulo1: 'Fornecedores', subModulo2: '-', campo: 'Código Externo', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Fornecedores', subModulo2: '-', campo: 'Nome', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Fornecedores', subModulo2: '-', campo: 'Identificação Fiscal', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Fornecedores', subModulo2: '-', campo: 'Categoria', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Fornecedores', subModulo2: '-', campo: 'E-mail', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Fornecedores', subModulo2: '-', campo: 'País', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Fornecedores', subModulo2: '-', campo: 'Descrição', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Fornecedores', subModulo2: '-', campo: 'Tabulador "Serviços"', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  
  // Recursos > Parametrizações
  { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Departamentos', campo: '-', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'submodulo2' },
  { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Departamentos', campo: 'Código Externo', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Departamentos', campo: 'Nome', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Departamentos', campo: 'Descrição', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Departamentos', campo: 'Funções', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  
  { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Funções', campo: '-', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'submodulo2' },
  { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Funções', campo: 'Código Externo', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Funções', campo: 'Nome', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Funções', campo: 'Descrição', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  
  { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Cargos', campo: '-', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'submodulo2' },
  { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Cargos', campo: 'Código Externo', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Cargos', campo: 'Nome', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Cargos', campo: 'Descrição', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  
  { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Classificação de Pessoas', campo: '-', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'submodulo2' },
  { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Classificação de Pessoas', campo: 'Código Externo', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Classificação de Pessoas', campo: 'Nome', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Classificação de Pessoas', campo: 'Descrição', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  
  { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Tipo de Figurino', campo: '-', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'submodulo2' },
  { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Tipo de Figurino', campo: 'Código Externo', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Tipo de Figurino', campo: 'Nome', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Tipo de Figurino', campo: 'Descrição', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Tipo de Figurino', campo: 'Status', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  
  { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Material', campo: '-', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'submodulo2' },
  { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Material', campo: 'Código Externo', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Material', campo: 'Nome', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Material', campo: 'Descrição', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Material', campo: 'Status', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  
  { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Categoria de Fornecedores', campo: '-', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'submodulo2' },
  { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Categoria de Fornecedores', campo: 'Código Externo', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Categoria de Fornecedores', campo: 'Nome', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Categoria de Fornecedores', campo: 'Descrição', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  
  { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Serviços', campo: '-', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'submodulo2' },
  { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Serviços', campo: 'Código Externo', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Serviços', campo: 'Nome', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Recursos', subModulo1: 'Parametrizações', subModulo2: 'Serviços', campo: 'Descrição', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  
  // Administração
  { modulo: 'Administração', subModulo1: '-', subModulo2: '-', campo: '-', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'modulo' },
  
  // Administração > Usuários
  { modulo: 'Administração', subModulo1: 'Usuários', subModulo2: '-', campo: '-', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'submodulo1' },
  { modulo: 'Administração', subModulo1: 'Usuários', subModulo2: '-', campo: 'Foto', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Administração', subModulo1: 'Usuários', subModulo2: '-', campo: 'Código Externo', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Administração', subModulo1: 'Usuários', subModulo2: '-', campo: 'Nome', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Administração', subModulo1: 'Usuários', subModulo2: '-', campo: 'Usuário', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Administração', subModulo1: 'Usuários', subModulo2: '-', campo: 'E-mail', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Administração', subModulo1: 'Usuários', subModulo2: '-', campo: 'Perfil de Acesso', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Administração', subModulo1: 'Usuários', subModulo2: '-', campo: 'Tipo de Acesso', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Administração', subModulo1: 'Usuários', subModulo2: '-', campo: 'Recurso Humano', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Administração', subModulo1: 'Usuários', subModulo2: '-', campo: 'Unidades de Negócio', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Administração', subModulo1: 'Usuários', subModulo2: '-', campo: 'Tabulador "Equipes"', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Administração', subModulo1: 'Usuários', subModulo2: '-', campo: 'Descrição', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  
  // Administração > Perfis de Acesso
  { modulo: 'Administração', subModulo1: 'Perfis de Acesso', subModulo2: '-', campo: '-', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'submodulo1' },
  { modulo: 'Administração', subModulo1: 'Perfis de Acesso', subModulo2: '-', campo: 'Código Externo', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Administração', subModulo1: 'Perfis de Acesso', subModulo2: '-', campo: 'Nome', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Administração', subModulo1: 'Perfis de Acesso', subModulo2: '-', campo: 'Descrição', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Administração', subModulo1: 'Perfis de Acesso', subModulo2: '-', campo: 'Tabulador "Permissões"', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  
  // Administração > Unidades de Negócio
  { modulo: 'Administração', subModulo1: 'Unidades de Negócio', subModulo2: '-', campo: '-', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'submodulo1' },
  { modulo: 'Administração', subModulo1: 'Unidades de Negócio', subModulo2: '-', campo: 'Código Externo', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Administração', subModulo1: 'Unidades de Negócio', subModulo2: '-', campo: 'Nome', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Administração', subModulo1: 'Unidades de Negócio', subModulo2: '-', campo: 'Descrição', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  
  // Administração > Centros de Lucro
  { modulo: 'Administração', subModulo1: 'Centros de Lucro', subModulo2: '-', campo: '-', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'submodulo1' },
  { modulo: 'Administração', subModulo1: 'Centros de Lucro', subModulo2: '-', campo: 'Código Externo', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Administração', subModulo1: 'Centros de Lucro', subModulo2: '-', campo: 'Nome', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Administração', subModulo1: 'Centros de Lucro', subModulo2: '-', campo: 'Descrição', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Administração', subModulo1: 'Centros de Lucro', subModulo2: '-', campo: 'Status', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  { modulo: 'Administração', subModulo1: 'Centros de Lucro', subModulo2: '-', campo: 'Centro de Lucro Superior', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'campo' },
  
  // Administração > Formulários
  { modulo: 'Administração', subModulo1: 'Formulários', subModulo2: '-', campo: '-', acao: 'visible', somenteLeitura: false, incluir: true, alterar: true, excluir: true, tipo: 'submodulo1' },
];

// Gera a matriz com IDs
export const getPermissionsMatrixWithIds = (): PermissionItem[] => {
  return basePermissionsMatrix.map(item => ({
    ...item,
    id: generatePermissionId(item.modulo, item.subModulo1, item.subModulo2, item.campo),
  }));
};

// Cria permissões padrão para um novo perfil
export const createDefaultPermissions = (perfilId: string): PerfilPermissoes => {
  return {
    perfilId,
    permissoes: getPermissionsMatrixWithIds(),
  };
};

// Clona permissões de um perfil para outro (async version using Supabase)
export const clonePermissionsAsync = async (sourcePerfilId: string, targetPerfilId: string): Promise<PerfilPermissoes | null> => {
  const { data: sourceData } = await supabase
    .from('perfil_permissoes')
    .select('*')
    .eq('perfil_id', sourcePerfilId);

  if (!sourceData || sourceData.length === 0) return null;

  const clonedPermissions: PermissionItem[] = sourceData.map(p => ({
    id: generatePermissionId(p.modulo, p.sub_modulo1 || '-', p.sub_modulo2 || '-', p.campo || '-'),
    modulo: p.modulo,
    subModulo1: p.sub_modulo1 || '-',
    subModulo2: p.sub_modulo2 || '-',
    campo: p.campo || '-',
    acao: p.acao as 'visible' | 'invisible',
    somenteLeitura: p.somente_leitura || false,
    incluir: p.incluir !== false,
    alterar: p.alterar !== false,
    excluir: p.excluir !== false,
    tipo: p.tipo as 'modulo' | 'submodulo1' | 'submodulo2' | 'campo',
  }));

  return {
    perfilId: targetPerfilId,
    permissoes: clonedPermissions,
  };
};

// Legacy sync version for backward compatibility
export const clonePermissions = (sourcePerfilId: string, targetPerfilId: string): PerfilPermissoes | null => {
  // This is a fallback - prefer clonePermissionsAsync
  console.warn('clonePermissions is deprecated, use clonePermissionsAsync instead');
  return null;
};

// Salva permissões de um perfil no Supabase
export const savePerfilPermissionsAsync = async (perfilPermissoes: PerfilPermissoes): Promise<void> => {
  const { perfilId, permissoes } = perfilPermissoes;

  // Delete existing permissions for this profile
  await supabase.from('perfil_permissoes').delete().eq('perfil_id', perfilId);

  // Insert new permissions
  const dbPermissions = permissoes.map(p => ({
    perfil_id: perfilId,
    modulo: p.modulo,
    sub_modulo1: p.subModulo1,
    sub_modulo2: p.subModulo2,
    campo: p.campo,
    acao: p.acao,
    somente_leitura: p.somenteLeitura,
    incluir: p.incluir,
    alterar: p.alterar,
    excluir: p.excluir,
    tipo: p.tipo,
  }));

  if (dbPermissions.length > 0) {
    await supabase.from('perfil_permissoes').insert(dbPermissions);
  }
};

// Legacy sync version - deprecated
export const savePerfilPermissions = (perfilPermissoes: PerfilPermissoes): void => {
  // Fire and forget async version for backward compatibility
  savePerfilPermissionsAsync(perfilPermissoes).catch(console.error);
};

// Obtém permissões de um perfil do Supabase
export const getPerfilPermissionsAsync = async (perfilId: string): Promise<PerfilPermissoes | null> => {
  const { data } = await supabase
    .from('perfil_permissoes')
    .select('*')
    .eq('perfil_id', perfilId);

  if (!data || data.length === 0) return null;

  const permissoes: PermissionItem[] = data.map(p => ({
    id: generatePermissionId(p.modulo, p.sub_modulo1 || '-', p.sub_modulo2 || '-', p.campo || '-'),
    modulo: p.modulo,
    subModulo1: p.sub_modulo1 || '-',
    subModulo2: p.sub_modulo2 || '-',
    campo: p.campo || '-',
    acao: p.acao as 'visible' | 'invisible',
    somenteLeitura: p.somente_leitura || false,
    incluir: p.incluir !== false,
    alterar: p.alterar !== false,
    excluir: p.excluir !== false,
    tipo: p.tipo as 'modulo' | 'submodulo1' | 'submodulo2' | 'campo',
  }));

  return { perfilId, permissoes };
};

// Legacy sync version - deprecated
export const getPerfilPermissions = (perfilId: string): PerfilPermissoes | null => {
  console.warn('getPerfilPermissions is deprecated, use getPerfilPermissionsAsync instead');
  return null;
};

// Sincroniza a matriz de permissões (REGRA 4) - adiciona novos campos que possam ter sido criados
export const syncPermissionsMatrixAsync = async (perfilId: string): Promise<PerfilPermissoes> => {
  const currentMatrix = getPermissionsMatrixWithIds();
  const existingPermissions = await getPerfilPermissionsAsync(perfilId);

  if (!existingPermissions) {
    const defaultPerms = createDefaultPermissions(perfilId);
    await savePerfilPermissionsAsync(defaultPerms);
    return defaultPerms;
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

  await savePerfilPermissionsAsync(syncedPermissions);
  return syncedPermissions;
};

// Legacy sync version
export const syncPermissionsMatrix = (perfilId: string): PerfilPermissoes => {
  console.warn('syncPermissionsMatrix is deprecated, use syncPermissionsMatrixAsync instead');
  return createDefaultPermissions(perfilId);
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
