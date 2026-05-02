'use client';

import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Shield,
  Film,
  Users,
  DollarSign,
  Settings2,
  Search,
  Copy,
  Check,
  Terminal,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
type AuthLevel = 'public' | 'user' | 'admin';

interface Endpoint {
  method: HttpMethod;
  path: string;
  description: string;
  auth?: AuthLevel;
  queryParams?: string;
  body?: string;
  response?: string;
}

interface ApiModule {
  id: string;
  name: string;
  description: string;
  endpoints: Endpoint[];
}

interface ApiGroup {
  id: string;
  name: string;
  icon: React.ElementType;
  modules: ApiModule[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BASE_URL = 'http://localhost:3333';

const METHOD_STYLE: Record<HttpMethod, string> = {
  GET: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  POST: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  PUT: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  DELETE: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  PATCH: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
};

const AUTH_BADGE: Record<AuthLevel, { label: string; style: string }> = {
  public: {
    label: 'Público',
    style: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  },
  user: {
    label: 'Autenticado',
    style: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  },
  admin: {
    label: 'Admin',
    style: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  },
};

// ─── API Data ─────────────────────────────────────────────────────────────────

const API_GROUPS: ApiGroup[] = [
  {
    id: 'auth',
    name: 'Autenticação',
    icon: Shield,
    modules: [
      {
        id: 'auth',
        name: 'Auth',
        description:
          'Login, renovação de token e informações do usuário autenticado. Tokens são enviados via cookie httpOnly.',
        endpoints: [
          {
            method: 'POST',
            path: '/auth/login',
            description:
              'Autentica o usuário. Retorna accessToken e refreshToken e seta cookies httpOnly.',
            auth: 'public',
            body: JSON.stringify({ usuario: 'admin@kreato.com', password: 'senha123' }, null, 2),
            response: JSON.stringify(
              {
                accessToken: '<jwt>',
                refreshToken: '<jwt>',
                user: {
                  id: 'uuid',
                  email: 'admin@kreato.com',
                  role: 'TENANT_ADMIN',
                  tenantId: 'uuid',
                },
              },
              null,
              2,
            ),
          },
          {
            method: 'POST',
            path: '/auth/refresh',
            description:
              'Renova o accessToken. Aceita refreshToken via body ou via cookie kreato_refresh_token.',
            auth: 'public',
            body: JSON.stringify({ refreshToken: '<refresh_token>' }, null, 2),
            response: JSON.stringify(
              { accessToken: '<novo_jwt>', refreshToken: '<novo_jwt>' },
              null,
              2,
            ),
          },
          {
            method: 'GET',
            path: '/auth/me',
            description: 'Retorna os dados do usuário autenticado na sessão atual.',
            auth: 'user',
            response: JSON.stringify(
              {
                user: {
                  id: 'uuid',
                  email: 'admin@kreato.com',
                  role: 'TENANT_ADMIN',
                  tenantId: 'uuid',
                },
              },
              null,
              2,
            ),
          },
          {
            method: 'GET',
            path: '/auth/admin-access',
            description:
              'Verifica se o usuário possui perfil de administrador (GLOBAL_ADMIN ou TENANT_ADMIN).',
            auth: 'admin',
            response: JSON.stringify({ ok: true }, null, 2),
          },
        ],
      },
    ],
  },
  {
    id: 'producao',
    name: 'Produção',
    icon: Film,
    modules: [
      {
        id: 'programas',
        name: 'Programas',
        description:
          'Gestão de programas de TV/Rádio. Base hierárquica para conteúdos e gravações.',
        endpoints: [
          {
            method: 'GET',
            path: '/programas',
            description: 'Lista todos os programas do tenant com paginação.',
            auth: 'user',
            queryParams: 'limit=50&offset=0',
            response: JSON.stringify(
              { data: [{ id: 'uuid', nome: 'Jornal Nacional', descricao: '...' }], total: 1 },
              null,
              2,
            ),
          },
          {
            method: 'POST',
            path: '/programas',
            description: 'Cria um novo programa.',
            auth: 'admin',
            body: JSON.stringify(
              { nome: 'Jornal Nacional', descricao: 'Telejornal de horário nobre' },
              null,
              2,
            ),
          },
          {
            method: 'PUT',
            path: '/programas/:id',
            description: 'Atualiza um programa existente.',
            auth: 'admin',
            body: JSON.stringify(
              { nome: 'Jornal Nacional Atualizado', descricao: 'Descrição revisada' },
              null,
              2,
            ),
          },
          {
            method: 'DELETE',
            path: '/programas/:id',
            description: 'Remove um programa. Retorna 204 No Content.',
            auth: 'admin',
          },
        ],
      },
      {
        id: 'conteudos',
        name: 'Conteúdos',
        description:
          'Episódios e conteúdos vinculados a programas, com recursos associados e terceiros.',
        endpoints: [
          {
            method: 'GET',
            path: '/conteudos',
            description: 'Lista todos os conteúdos do tenant.',
            auth: 'user',
            queryParams: 'limit=100&offset=0',
            response: JSON.stringify(
              { data: [{ id: 'uuid', titulo: 'Ep. 01', programaId: 'uuid', numero: 1 }], total: 1 },
              null,
              2,
            ),
          },
          {
            method: 'GET',
            path: '/conteudos/options',
            description: 'Lista simplificada de conteúdos para uso em selects.',
            auth: 'user',
            response: JSON.stringify([{ id: 'uuid', label: 'Ep. 01 — Jornal Nacional' }], null, 2),
          },
          {
            method: 'POST',
            path: '/conteudos',
            description: 'Cria um novo conteúdo.',
            auth: 'admin',
            body: JSON.stringify(
              { programaId: 'uuid', titulo: 'Episódio 01', numero: 1, duracao: 60 },
              null,
              2,
            ),
          },
          {
            method: 'PUT',
            path: '/conteudos/:id',
            description: 'Atualiza um conteúdo.',
            auth: 'admin',
            body: JSON.stringify({ titulo: 'Episódio 01 — Revisado', duracao: 65 }, null, 2),
          },
          {
            method: 'DELETE',
            path: '/conteudos/:id',
            description: 'Remove um conteúdo. Retorna 204 No Content.',
            auth: 'admin',
          },
          {
            method: 'GET',
            path: '/conteudos/:id/recursos',
            description:
              'Lista recursos associados ao conteúdo. Filtre por tipo (tecnico ou fisico).',
            auth: 'user',
            queryParams: 'tipo=tecnico&tabelaPrecoId=uuid',
          },
          {
            method: 'POST',
            path: '/conteudos/:id/recursos',
            description: 'Associa um recurso ao conteúdo.',
            auth: 'admin',
            queryParams: 'tipo=tecnico',
            body: JSON.stringify({ recursoId: 'uuid', quantidade: 1, observacao: '' }, null, 2),
          },
          {
            method: 'PUT',
            path: '/conteudos/:id/recursos/:itemId',
            description: 'Atualiza um recurso associado ao conteúdo.',
            auth: 'admin',
            queryParams: 'tipo=tecnico',
            body: JSON.stringify({ quantidade: 2 }, null, 2),
          },
          {
            method: 'DELETE',
            path: '/conteudos/:id/recursos/:itemId',
            description: 'Remove a associação de um recurso do conteúdo.',
            auth: 'admin',
            queryParams: 'tipo=tecnico',
          },
        ],
      },
      {
        id: 'gravacoes',
        name: 'Gravações',
        description: 'Gravações agendadas com recursos, figurinos, elenco, convidados e roteiro.',
        endpoints: [
          {
            method: 'GET',
            path: '/gravacoes',
            description: 'Lista gravações do tenant com paginação.',
            auth: 'user',
            queryParams: 'limit=50&offset=0',
            response: JSON.stringify(
              {
                data: [{ id: 'uuid', conteudoId: 'uuid', dataInicio: '2025-06-01T08:00:00Z' }],
                total: 1,
              },
              null,
              2,
            ),
          },
          {
            method: 'POST',
            path: '/gravacoes',
            description: 'Cria uma nova gravação.',
            auth: 'admin',
            body: JSON.stringify(
              {
                conteudoId: 'uuid',
                dataInicio: '2025-06-01T08:00:00Z',
                dataFim: '2025-06-01T12:00:00Z',
                recursoFisicoId: 'uuid',
              },
              null,
              2,
            ),
          },
          {
            method: 'PUT',
            path: '/gravacoes/:id',
            description: 'Atualiza uma gravação.',
            auth: 'admin',
            body: JSON.stringify(
              { dataInicio: '2025-06-02T09:00:00Z', dataFim: '2025-06-02T13:00:00Z' },
              null,
              2,
            ),
          },
          {
            method: 'DELETE',
            path: '/gravacoes/:id',
            description: 'Remove uma gravação. Retorna 204 No Content.',
            auth: 'admin',
          },
          {
            method: 'GET',
            path: '/gravacoes/:id/figurinos',
            description: 'Lista figurinos associados à gravação.',
            auth: 'user',
          },
          {
            method: 'POST',
            path: '/gravacoes/:id/figurinos',
            description: 'Associa um figurino a uma pessoa na gravação.',
            auth: 'admin',
            body: JSON.stringify({ figurinoId: 'uuid', pessoaId: 'uuid' }, null, 2),
          },
          {
            method: 'GET',
            path: '/gravacoes/:id/roteiro',
            description: 'Retorna o roteiro (cenas/blocos) da gravação.',
            auth: 'user',
          },
          {
            method: 'GET',
            path: '/gravacoes/:id/alocacoes',
            description: 'Lista alocações de recursos humanos/técnicos na gravação.',
            auth: 'user',
          },
          {
            method: 'GET',
            path: '/gravacoes/:id/tarefas',
            description: 'Lista tarefas vinculadas a uma gravação específica.',
            auth: 'user',
          },
          {
            method: 'GET',
            path: '/gravacoes/:id/terceiros',
            description: 'Lista terceiros/prestadores associados à gravação.',
            auth: 'user',
          },
        ],
      },
      {
        id: 'tarefas',
        name: 'Tarefas',
        description: 'Tarefas de produção, opcionalmente vinculadas a gravações.',
        endpoints: [
          {
            method: 'GET',
            path: '/tarefas',
            description: 'Lista todas as tarefas do tenant.',
            auth: 'user',
            queryParams: 'limit=200&offset=0',
          },
          {
            method: 'GET',
            path: '/tarefas/options',
            description: 'Lista simplificada de tarefas para selects.',
            auth: 'user',
          },
          {
            method: 'GET',
            path: '/gravacoes/:id/tarefas',
            description: 'Lista tarefas de uma gravação específica.',
            auth: 'user',
          },
          {
            method: 'POST',
            path: '/tarefas',
            description: 'Cria uma nova tarefa.',
            auth: 'user',
            body: JSON.stringify(
              {
                titulo: 'Preparar cenário',
                gravacaoId: 'uuid',
                responsavelId: 'uuid',
                prazo: '2025-05-30',
                statusId: 'uuid',
              },
              null,
              2,
            ),
          },
          {
            method: 'PUT',
            path: '/tarefas/:id',
            description: 'Atualiza uma tarefa.',
            auth: 'user',
            body: JSON.stringify({ titulo: 'Cenário atualizado', statusId: 'uuid' }, null, 2),
          },
          {
            method: 'DELETE',
            path: '/tarefas/:id',
            description: 'Remove uma tarefa. Retorna 204 No Content.',
            auth: 'user',
          },
        ],
      },
    ],
  },
  {
    id: 'recursos',
    name: 'Recursos',
    icon: Users,
    modules: [
      {
        id: 'recursos-humanos',
        name: 'Recursos Humanos',
        description:
          'Colaboradores, técnicos e apresentadores disponíveis para alocação em gravações.',
        endpoints: [
          {
            method: 'GET',
            path: '/recursos-humanos',
            description: 'Lista recursos humanos do tenant com paginação.',
            auth: 'user',
            queryParams: 'limit=200&offset=0',
          },
          {
            method: 'GET',
            path: '/recursos-humanos/options',
            description: 'Lista simplificada para selects.',
            auth: 'user',
          },
          {
            method: 'GET',
            path: '/recursos-humanos/ocupacao',
            description: 'Retorna ocupação dos recursos em um intervalo de datas.',
            auth: 'user',
            queryParams: 'dataInicio=2025-06-01&dataFim=2025-06-30',
          },
          {
            method: 'POST',
            path: '/recursos-humanos',
            description: 'Cadastra um novo recurso humano.',
            auth: 'admin',
            body: JSON.stringify(
              { pessoaId: 'uuid', funcaoId: 'uuid', departamentoId: 'uuid', turnoId: 'uuid' },
              null,
              2,
            ),
          },
          {
            method: 'PUT',
            path: '/recursos-humanos/:id',
            description: 'Atualiza um recurso humano.',
            auth: 'admin',
            body: JSON.stringify({ turnoId: 'uuid' }, null, 2),
          },
          {
            method: 'DELETE',
            path: '/recursos-humanos/:id',
            description: 'Remove um recurso humano. Retorna 204 No Content.',
            auth: 'admin',
          },
        ],
      },
      {
        id: 'recursos-fisicos',
        name: 'Recursos Físicos',
        description: 'Estúdios, salas e espaços físicos para gravação.',
        endpoints: [
          {
            method: 'GET',
            path: '/recursos-fisicos',
            description: 'Lista recursos físicos do tenant.',
            auth: 'user',
            queryParams: 'limit=200&offset=0',
          },
          {
            method: 'GET',
            path: '/recursos-fisicos/ocupacao',
            description: 'Retorna ocupação dos recursos físicos em um período.',
            auth: 'user',
            queryParams: 'dataInicio=2025-06-01&dataFim=2025-06-30',
          },
          {
            method: 'POST',
            path: '/recursos-fisicos',
            description: 'Cadastra um recurso físico.',
            auth: 'admin',
            body: JSON.stringify({ nome: 'Estúdio A', capacidade: 50, unidadeId: 'uuid' }, null, 2),
          },
          {
            method: 'PUT',
            path: '/recursos-fisicos/:id',
            description: 'Atualiza um recurso físico.',
            auth: 'admin',
            body: JSON.stringify({ nome: 'Estúdio A — Renovado', capacidade: 60 }, null, 2),
          },
          {
            method: 'DELETE',
            path: '/recursos-fisicos/:id',
            description: 'Remove um recurso físico. Retorna 204 No Content.',
            auth: 'admin',
          },
        ],
      },
      {
        id: 'recursos-tecnicos',
        name: 'Recursos Técnicos',
        description: 'Equipamentos técnicos como câmeras, iluminação e áudio.',
        endpoints: [
          {
            method: 'GET',
            path: '/recursos-tecnicos',
            description: 'Lista recursos técnicos do tenant.',
            auth: 'user',
            queryParams: 'limit=200&offset=0',
          },
          {
            method: 'GET',
            path: '/recursos-tecnicos/options',
            description: 'Lista simplificada para selects.',
            auth: 'user',
          },
          {
            method: 'POST',
            path: '/recursos-tecnicos',
            description: 'Cadastra um recurso técnico.',
            auth: 'admin',
            body: JSON.stringify(
              { nome: 'Câmera Sony A7', patrimonio: 'PAT-001', categoriaId: 'uuid' },
              null,
              2,
            ),
          },
          {
            method: 'PUT',
            path: '/recursos-tecnicos/:id',
            description: 'Atualiza um recurso técnico.',
            auth: 'admin',
            body: JSON.stringify({ nome: 'Câmera Sony A7 IV' }, null, 2),
          },
          {
            method: 'DELETE',
            path: '/recursos-tecnicos/:id',
            description: 'Remove um recurso técnico. Retorna 204 No Content.',
            auth: 'admin',
          },
        ],
      },
      {
        id: 'pessoas',
        name: 'Pessoas',
        description: 'Cadastro de pessoas físicas (apresentadores, técnicos, convidados).',
        endpoints: [
          {
            method: 'GET',
            path: '/pessoas',
            description: 'Lista pessoas do tenant.',
            auth: 'user',
            queryParams: 'limit=200&offset=0',
          },
          {
            method: 'GET',
            path: '/pessoas/options',
            description: 'Lista simplificada para selects.',
            auth: 'user',
          },
          {
            method: 'GET',
            path: '/pessoas/:id/gravacoes',
            description: 'Lista gravações em que a pessoa participou.',
            auth: 'user',
          },
          {
            method: 'POST',
            path: '/pessoas',
            description: 'Cadastra uma pessoa.',
            auth: 'admin',
            body: JSON.stringify(
              { nome: 'William Bonner', email: 'william@rede.com', classificacaoId: 'uuid' },
              null,
              2,
            ),
          },
          {
            method: 'PUT',
            path: '/pessoas/:id',
            description: 'Atualiza uma pessoa.',
            auth: 'admin',
            body: JSON.stringify({ nome: 'William Bonner', email: 'w.bonner@rede.com' }, null, 2),
          },
          {
            method: 'DELETE',
            path: '/pessoas/:id',
            description: 'Remove uma pessoa. Retorna 204 No Content.',
            auth: 'admin',
          },
        ],
      },
      {
        id: 'equipes',
        name: 'Equipes',
        description: 'Grupos de trabalho com membros associados.',
        endpoints: [
          {
            method: 'GET',
            path: '/equipes',
            description: 'Lista equipes do tenant.',
            auth: 'user',
            queryParams: 'limit=50&offset=0',
          },
          {
            method: 'POST',
            path: '/equipes',
            description: 'Cria uma equipe.',
            auth: 'admin',
            body: JSON.stringify(
              { nome: 'Equipe de Câmera', descricao: 'Operadores de câmera' },
              null,
              2,
            ),
          },
          {
            method: 'PUT',
            path: '/equipes/:id',
            description: 'Atualiza uma equipe.',
            auth: 'admin',
            body: JSON.stringify({ nome: 'Equipe de Câmera — 2025' }, null, 2),
          },
          {
            method: 'DELETE',
            path: '/equipes/:id',
            description: 'Remove uma equipe. Retorna 204 No Content.',
            auth: 'admin',
          },
          {
            method: 'GET',
            path: '/equipes/:id/membros',
            description: 'Lista membros de uma equipe.',
            auth: 'user',
          },
          {
            method: 'POST',
            path: '/equipes/:id/membros',
            description: 'Adiciona um membro à equipe.',
            auth: 'admin',
            body: JSON.stringify({ targetId: 'uuid-do-recurso-humano' }, null, 2),
          },
          {
            method: 'DELETE',
            path: '/equipes/:id/membros/:targetId',
            description: 'Remove um membro da equipe. Retorna 204 No Content.',
            auth: 'admin',
          },
        ],
      },
      {
        id: 'fornecedores',
        name: 'Fornecedores',
        description: 'Empresas e prestadores de serviços externos.',
        endpoints: [
          {
            method: 'GET',
            path: '/fornecedores',
            description: 'Lista fornecedores do tenant.',
            auth: 'user',
            queryParams: 'limit=200&offset=0',
          },
          {
            method: 'GET',
            path: '/fornecedores/options',
            description: 'Lista simplificada para selects.',
            auth: 'user',
          },
          {
            method: 'POST',
            path: '/fornecedores',
            description: 'Cadastra um fornecedor.',
            auth: 'admin',
            body: JSON.stringify(
              {
                razaoSocial: 'Produtora XYZ Ltda',
                cnpj: '12.345.678/0001-99',
                categoriaId: 'uuid',
              },
              null,
              2,
            ),
          },
          {
            method: 'PUT',
            path: '/fornecedores/:id',
            description: 'Atualiza um fornecedor.',
            auth: 'admin',
          },
          {
            method: 'DELETE',
            path: '/fornecedores/:id',
            description: 'Remove um fornecedor. Retorna 204 No Content.',
            auth: 'admin',
          },
          {
            method: 'GET',
            path: '/fornecedores/:id/servicos',
            description: 'Lista serviços prestados pelo fornecedor.',
            auth: 'user',
          },
          {
            method: 'POST',
            path: '/fornecedores/:id/servicos',
            description: 'Adiciona um serviço ao fornecedor.',
            auth: 'admin',
            body: JSON.stringify({ servicoId: 'uuid', valorUnitario: 1500.0 }, null, 2),
          },
        ],
      },
      {
        id: 'escalas',
        name: 'Escalas',
        description: 'Escalas de trabalho com colaboradores por função.',
        endpoints: [
          {
            method: 'GET',
            path: '/escalas',
            description: 'Lista escalas do tenant.',
            auth: 'user',
            queryParams: 'limit=200&offset=0',
          },
          {
            method: 'POST',
            path: '/escalas',
            description: 'Cria uma escala.',
            auth: 'admin',
            body: JSON.stringify(
              { nome: 'Escala Semana 23', dataInicio: '2025-06-02', dataFim: '2025-06-08' },
              null,
              2,
            ),
          },
          {
            method: 'PUT',
            path: '/escalas/:id',
            description: 'Atualiza uma escala.',
            auth: 'admin',
          },
          {
            method: 'DELETE',
            path: '/escalas/:id',
            description: 'Remove uma escala. Retorna 204 No Content.',
            auth: 'admin',
          },
          {
            method: 'GET',
            path: '/escalas/:id/colaboradores',
            description: 'Lista colaboradores alocados na escala.',
            auth: 'user',
          },
          {
            method: 'PUT',
            path: '/escalas/:id/colaboradores',
            description: 'Define/substitui os colaboradores da escala.',
            auth: 'admin',
            body: JSON.stringify(
              { colaboradores: [{ recursoHumanoId: 'uuid', funcaoId: 'uuid' }] },
              null,
              2,
            ),
          },
          {
            method: 'GET',
            path: '/escalas/opcoes/funcoes',
            description: 'Lista funções disponíveis para escalas.',
            auth: 'user',
          },
          {
            method: 'GET',
            path: '/escalas/opcoes/colaboradores',
            description: 'Lista colaboradores disponíveis por função.',
            auth: 'user',
            queryParams: 'funcaoId=uuid',
          },
        ],
      },
      {
        id: 'turnos',
        name: 'Turnos',
        description: 'Turnos de trabalho (matutino, vespertino, noturno etc.).',
        endpoints: [
          {
            method: 'GET',
            path: '/turnos',
            description: 'Lista turnos do tenant.',
            auth: 'user',
            queryParams: 'limit=200&offset=0',
          },
          {
            method: 'POST',
            path: '/turnos',
            description: 'Cria um turno.',
            auth: 'admin',
            body: JSON.stringify(
              { nome: 'Matutino', horaInicio: '06:00', horaFim: '14:00' },
              null,
              2,
            ),
          },
          {
            method: 'PUT',
            path: '/turnos/:id',
            description: 'Atualiza um turno.',
            auth: 'admin',
          },
          {
            method: 'DELETE',
            path: '/turnos/:id',
            description: 'Remove um turno. Retorna 204 No Content.',
            auth: 'admin',
          },
        ],
      },
      {
        id: 'departamentos',
        name: 'Departamentos',
        description: 'Departamentos da organização com funções associadas.',
        endpoints: [
          {
            method: 'GET',
            path: '/departamentos',
            description: 'Lista departamentos do tenant.',
            auth: 'user',
            queryParams: 'limit=200&offset=0',
          },
          {
            method: 'POST',
            path: '/departamentos',
            description: 'Cria um departamento.',
            auth: 'admin',
            body: JSON.stringify(
              { nome: 'Jornalismo', descricao: 'Departamento de jornalismo' },
              null,
              2,
            ),
          },
          {
            method: 'PUT',
            path: '/departamentos/:id',
            description: 'Atualiza um departamento.',
            auth: 'admin',
          },
          {
            method: 'DELETE',
            path: '/departamentos/:id',
            description: 'Remove um departamento. Retorna 204 No Content.',
            auth: 'admin',
          },
          {
            method: 'GET',
            path: '/departamentos/:id/funcoes',
            description: 'Lista funções vinculadas ao departamento.',
            auth: 'user',
          },
          {
            method: 'POST',
            path: '/departamentos/:id/funcoes',
            description: 'Associa uma função ao departamento.',
            auth: 'admin',
            body: JSON.stringify({ funcaoId: 'uuid' }, null, 2),
          },
          {
            method: 'DELETE',
            path: '/departamentos/:id/funcoes/:associacaoId',
            description: 'Remove a associação de uma função do departamento.',
            auth: 'admin',
          },
        ],
      },
      {
        id: 'feriados',
        name: 'Feriados',
        description: 'Feriados nacionais, estaduais e municipais para controle de escala.',
        endpoints: [
          {
            method: 'GET',
            path: '/feriados',
            description: 'Lista feriados do tenant.',
            auth: 'user',
            queryParams: 'limit=200&offset=0',
          },
          {
            method: 'POST',
            path: '/feriados',
            description: 'Cadastra um feriado.',
            auth: 'admin',
            body: JSON.stringify({ nome: 'Natal', data: '2025-12-25', tipo: 'NACIONAL' }, null, 2),
          },
          {
            method: 'PUT',
            path: '/feriados/:id',
            description: 'Atualiza um feriado.',
            auth: 'admin',
          },
          {
            method: 'DELETE',
            path: '/feriados/:id',
            description: 'Remove um feriado. Retorna 204 No Content.',
            auth: 'admin',
          },
        ],
      },
      {
        id: 'figurinos',
        name: 'Figurinos',
        description: 'Roupas e acessórios disponíveis para uso em gravações.',
        endpoints: [
          {
            method: 'GET',
            path: '/figurinos',
            description: 'Lista figurinos do tenant.',
            auth: 'user',
            queryParams: 'limit=200&offset=0',
          },
          {
            method: 'GET',
            path: '/figurinos/options',
            description: 'Lista simplificada para selects.',
            auth: 'user',
          },
          {
            method: 'POST',
            path: '/figurinos',
            description: 'Cadastra um figurino.',
            auth: 'admin',
            body: JSON.stringify(
              { descricao: 'Terno azul marinho', tipoId: 'uuid', tamanho: 'M' },
              null,
              2,
            ),
          },
          {
            method: 'PUT',
            path: '/figurinos/:id',
            description: 'Atualiza um figurino.',
            auth: 'admin',
          },
          {
            method: 'DELETE',
            path: '/figurinos/:id',
            description: 'Remove um figurino. Retorna 204 No Content.',
            auth: 'admin',
          },
        ],
      },
    ],
  },
  {
    id: 'financeiro',
    name: 'Financeiro',
    icon: DollarSign,
    modules: [
      {
        id: 'contas-pagar',
        name: 'Contas a Pagar',
        description: 'Lançamentos financeiros de despesas e pagamentos.',
        endpoints: [
          {
            method: 'GET',
            path: '/contas-pagar',
            description: 'Lista contas a pagar do tenant.',
            auth: 'user',
            queryParams: 'limit=200&offset=0',
          },
          {
            method: 'POST',
            path: '/contas-pagar',
            description: 'Registra uma conta a pagar.',
            auth: 'user',
            body: JSON.stringify(
              {
                descricao: 'Locação estúdio',
                valor: 5000.0,
                dataVencimento: '2025-06-15',
                fornecedorId: 'uuid',
                categoriaId: 'uuid',
                statusId: 'uuid',
              },
              null,
              2,
            ),
          },
          {
            method: 'PUT',
            path: '/contas-pagar/:id',
            description: 'Atualiza uma conta a pagar.',
            auth: 'user',
            body: JSON.stringify({ status: 'pago', dataPagamento: '2025-06-10' }, null, 2),
          },
          {
            method: 'DELETE',
            path: '/contas-pagar/:id',
            description: 'Remove uma conta a pagar. Retorna 204 No Content.',
            auth: 'user',
          },
        ],
      },
      {
        id: 'apropriacoes-custo',
        name: 'Apropriações de Custo',
        description: 'Relatório de custos apropriados por centro de lucro e unidade.',
        endpoints: [
          {
            method: 'GET',
            path: '/financeiro/apropriacoes-custo',
            description: 'Retorna custos apropriados. Filtre por ano, centro de lucro e unidade.',
            auth: 'user',
            queryParams: 'ano=2025&centroLucroId=uuid&unidadeId=uuid',
            response: JSON.stringify(
              { data: [{ mes: 6, total: 45000.0, categorias: [] }] },
              null,
              2,
            ),
          },
        ],
      },
      {
        id: 'tabelas-preco',
        name: 'Tabelas de Preço',
        description: 'Tabelas de preço por recurso técnico ou físico.',
        endpoints: [
          {
            method: 'GET',
            path: '/tabelas-preco',
            description: 'Lista tabelas de preço do tenant.',
            auth: 'user',
          },
          {
            method: 'GET',
            path: '/tabelas-preco/options',
            description: 'Lista simplificada para selects.',
            auth: 'user',
          },
          {
            method: 'POST',
            path: '/tabelas-preco',
            description: 'Cria uma tabela de preço.',
            auth: 'admin',
            body: JSON.stringify({ nome: 'Tabela 2025', vigencia: '2025-01-01' }, null, 2),
          },
          {
            method: 'PUT',
            path: '/tabelas-preco/:id',
            description: 'Atualiza uma tabela de preço.',
            auth: 'admin',
          },
          {
            method: 'DELETE',
            path: '/tabelas-preco/:id',
            description: 'Remove uma tabela de preço. Retorna 204 No Content.',
            auth: 'admin',
          },
          {
            method: 'GET',
            path: '/tabelas-preco/:id/recursos/:tipo',
            description: 'Lista recursos de uma tabela de preço. tipo: tecnico | fisico',
            auth: 'user',
          },
          {
            method: 'POST',
            path: '/tabelas-preco/:id/recursos/:tipo',
            description: 'Adiciona um recurso à tabela de preço.',
            auth: 'admin',
            body: JSON.stringify(
              { recursoId: 'uuid', valorUnitario: 250.0, unidade: 'hora' },
              null,
              2,
            ),
          },
          {
            method: 'DELETE',
            path: '/tabelas-preco/:id/recursos/:tipo/:itemId',
            description: 'Remove um recurso da tabela de preço.',
            auth: 'admin',
          },
        ],
      },
    ],
  },
  {
    id: 'admin',
    name: 'Administração',
    icon: Settings2,
    modules: [
      {
        id: 'users',
        name: 'Usuários',
        description: 'Gestão de usuários do tenant com perfis, unidades e programas.',
        endpoints: [
          {
            method: 'GET',
            path: '/users',
            description: 'Lista usuários do tenant. Requer perfil admin.',
            auth: 'admin',
            queryParams: 'limit=50&offset=0',
          },
          {
            method: 'POST',
            path: '/users',
            description: 'Cria um usuário no tenant.',
            auth: 'admin',
            body: JSON.stringify(
              {
                nome: 'João Silva',
                email: 'joao@kreato.com',
                password: 'senha123',
                role: 'TENANT_USER',
              },
              null,
              2,
            ),
          },
          {
            method: 'PUT',
            path: '/users/:id',
            description: 'Atualiza um usuário.',
            auth: 'admin',
            body: JSON.stringify({ nome: 'João da Silva', role: 'TENANT_ADMIN' }, null, 2),
          },
          {
            method: 'DELETE',
            path: '/users/:id',
            description: 'Remove um usuário. Retorna 204 No Content.',
            auth: 'admin',
          },
          {
            method: 'GET',
            path: '/users/:id/unidades',
            description: 'Lista unidades acessíveis ao usuário.',
            auth: 'admin',
          },
          {
            method: 'POST',
            path: '/users/:id/unidades',
            description: 'Concede acesso do usuário a uma unidade.',
            auth: 'admin',
            body: JSON.stringify({ targetId: 'uuid-da-unidade' }, null, 2),
          },
          {
            method: 'DELETE',
            path: '/users/:id/unidades/:targetId',
            description: 'Revoga acesso do usuário a uma unidade.',
            auth: 'admin',
          },
          {
            method: 'GET',
            path: '/users/:id/programas',
            description: 'Lista programas acessíveis ao usuário.',
            auth: 'admin',
          },
          {
            method: 'POST',
            path: '/users/:id/programas',
            description: 'Concede acesso do usuário a um programa.',
            auth: 'admin',
            body: JSON.stringify({ targetId: 'uuid-do-programa' }, null, 2),
          },
          {
            method: 'DELETE',
            path: '/users/:id/programas/:targetId',
            description: 'Revoga acesso do usuário a um programa.',
            auth: 'admin',
          },
        ],
      },
      {
        id: 'unidades',
        name: 'Unidades',
        description: 'Unidades de negócio (emissoras, filiais, sedes).',
        endpoints: [
          {
            method: 'GET',
            path: '/unidades',
            description: 'Lista unidades do tenant.',
            auth: 'user',
            queryParams: 'limit=50&offset=0',
          },
          {
            method: 'POST',
            path: '/unidades',
            description: 'Cria uma unidade.',
            auth: 'admin',
            body: JSON.stringify(
              { nome: 'Sede Rio de Janeiro', sigla: 'RJ', cidade: 'Rio de Janeiro', uf: 'RJ' },
              null,
              2,
            ),
          },
          {
            method: 'PUT',
            path: '/unidades/:id',
            description: 'Atualiza uma unidade.',
            auth: 'admin',
          },
          {
            method: 'DELETE',
            path: '/unidades/:id',
            description: 'Remove uma unidade. Retorna 204 No Content.',
            auth: 'admin',
          },
        ],
      },
      {
        id: 'parametrizacoes',
        name: 'Parametrizações',
        description:
          'Tabelas de domínio: status, tipos, classificações. Seguem o padrão GET /parametrizacoes/:entidade e POST/PUT/DELETE /parametrizacoes/:entidade/:id.',
        endpoints: [
          {
            method: 'GET',
            path: '/parametrizacoes/status-gravacao',
            description: 'Lista status de gravações.',
            auth: 'user',
          },
          {
            method: 'GET',
            path: '/parametrizacoes/tipos-gravacao',
            description: 'Lista tipos de gravação.',
            auth: 'user',
          },
          {
            method: 'GET',
            path: '/parametrizacoes/classificacoes-conteudo',
            description: 'Lista classificações de conteúdo.',
            auth: 'user',
          },
          {
            method: 'POST',
            path: '/parametrizacoes/status-gravacao',
            description: 'Cria um status de gravação.',
            auth: 'admin',
            body: JSON.stringify({ nome: 'Em Edição', cor: '#f59e0b', ordem: 3 }, null, 2),
          },
          {
            method: 'PUT',
            path: '/parametrizacoes/status-gravacao/:id',
            description: 'Atualiza um status de gravação.',
            auth: 'admin',
          },
          {
            method: 'DELETE',
            path: '/parametrizacoes/status-gravacao/:id',
            description: 'Remove um status de gravação.',
            auth: 'admin',
          },
        ],
      },
      {
        id: 'parametros',
        name: 'Parâmetros',
        description: 'Configurações genéricas do sistema por chave de armazenamento.',
        endpoints: [
          {
            method: 'GET',
            path: '/parametros/:storageKey',
            description: 'Busca a configuração pela chave. Ex: /parametros/config-producao',
            auth: 'user',
            response: JSON.stringify(
              { storageKey: 'config-producao', value: { diasAntecedencia: 7 } },
              null,
              2,
            ),
          },
          {
            method: 'PUT',
            path: '/parametros/:storageKey',
            description: 'Salva ou atualiza a configuração pela chave.',
            auth: 'admin',
            body: JSON.stringify({ diasAntecedencia: 14, notificarEmail: true }, null, 2),
          },
        ],
      },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildCurl(endpoint: Endpoint): string {
  const url = `${BASE_URL}${endpoint.path}${endpoint.queryParams ? '?' + endpoint.queryParams : ''}`;
  const lines: string[] = [`curl -X ${endpoint.method} "${url}"`];
  if (endpoint.auth !== 'public') {
    lines.push('  -H "Authorization: Bearer <seu_token>"');
  }
  if (endpoint.body) {
    lines.push('  -H "Content-Type: application/json"');
    lines.push(`  -d '${JSON.stringify(JSON.parse(endpoint.body))}'`);
  }
  return lines.join(' \\\n');
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CopyButton({ text, id }: { text: string; id: string }) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function copy() {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={copy} title="Copiar">
      {copiedId === id ? (
        <Check className="h-3.5 w-3.5 text-green-500" />
      ) : (
        <Copy className="h-3.5 w-3.5 text-muted-foreground" />
      )}
    </Button>
  );
}

function EndpointCard({
  endpoint,
  idx,
  moduleId,
}: {
  endpoint: Endpoint;
  idx: number;
  moduleId: string;
}) {
  const [open, setOpen] = useState(false);
  const curlStr = buildCurl(endpoint);
  const auth = endpoint.auth ?? 'user';

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/40 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <span
          className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-mono font-semibold min-w-[54px] justify-center ${METHOD_STYLE[endpoint.method]}`}
        >
          {endpoint.method}
        </span>
        <code className="text-sm font-mono text-foreground flex-1 text-left">{endpoint.path}</code>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${AUTH_BADGE[auth].style}`}>
          {AUTH_BADGE[auth].label}
        </span>
        {open ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="border-t px-4 py-4 space-y-4 bg-muted/20">
          <p className="text-sm text-muted-foreground">{endpoint.description}</p>

          {endpoint.queryParams && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">Query params</p>
              <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                ?{endpoint.queryParams}
              </code>
            </div>
          )}

          {endpoint.body && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">Body (JSON)</p>
              <pre className="text-xs bg-muted rounded-md p-3 overflow-x-auto font-mono leading-relaxed">
                {endpoint.body}
              </pre>
            </div>
          )}

          {endpoint.response && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">Resposta</p>
              <pre className="text-xs bg-muted rounded-md p-3 overflow-x-auto font-mono leading-relaxed">
                {endpoint.response}
              </pre>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <Terminal className="h-3.5 w-3.5" />
                Exemplo cURL
              </p>
              <CopyButton text={curlStr} id={`${moduleId}-${idx}`} />
            </div>
            <pre className="text-xs bg-zinc-900 text-zinc-100 dark:bg-zinc-950 rounded-md p-3 overflow-x-auto font-mono leading-relaxed">
              {curlStr}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ApiDocsPage() {
  const [search, setSearch] = useState('');

  const filteredGroups = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return API_GROUPS;
    return API_GROUPS.map((group) => ({
      ...group,
      modules: group.modules
        .map((mod) => ({
          ...mod,
          endpoints: mod.endpoints.filter(
            (ep) =>
              ep.path.toLowerCase().includes(q) ||
              ep.method.toLowerCase().includes(q) ||
              ep.description.toLowerCase().includes(q) ||
              mod.name.toLowerCase().includes(q),
          ),
        }))
        .filter((mod) => mod.endpoints.length > 0),
    })).filter((group) => group.modules.length > 0);
  }, [search]);

  const totalEndpoints = useMemo(
    () => API_GROUPS.flatMap((g) => g.modules).flatMap((m) => m.endpoints).length,
    [],
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Referência da API</h1>
        <p className="mt-1 text-muted-foreground text-sm">
          Documentação dos endpoints REST do backend Kreato. Base URL:{' '}
          <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{BASE_URL}</code>
        </p>
      </div>

      {/* Auth info card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4 text-indigo-500" />
            Autenticação
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-3 text-muted-foreground">
          <p>
            A maioria dos endpoints exige autenticação via{' '}
            <strong className="text-foreground">Bearer Token</strong> no header{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded font-mono">Authorization</code>,
            ou via cookie httpOnly{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded font-mono">
              kreato_access_token
            </code>{' '}
            (setado automaticamente pelo login).
          </p>
          <div className="flex flex-wrap gap-3 text-xs">
            {Object.entries(AUTH_BADGE).map(([key, val]) => (
              <span
                key={key}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium ${val.style}`}
              >
                {val.label}
              </span>
            ))}
          </div>
          <p className="text-xs">
            Endpoints marcados como <strong className="text-foreground">Admin</strong> requerem role{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded font-mono">GLOBAL_ADMIN</code> ou{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded font-mono">TENANT_ADMIN</code>.
            Rate limit no login: 10 req / 15 min.
          </p>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder={`Buscar entre ${totalEndpoints} endpoints…`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Groups */}
      {filteredGroups.length === 0 && (
        <p className="text-center text-muted-foreground py-12 text-sm">
          Nenhum endpoint encontrado para "{search}".
        </p>
      )}

      {filteredGroups.map((group) => {
        const Icon = group.icon;
        return (
          <section key={group.id} className="space-y-4">
            <div className="flex items-center gap-2">
              <Icon className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">{group.name}</h2>
              <Badge variant="secondary" className="text-xs">
                {group.modules.reduce((acc, m) => acc + m.endpoints.length, 0)} endpoints
              </Badge>
            </div>

            <Accordion type="multiple" className="space-y-2">
              {group.modules.map((mod) => (
                <AccordionItem
                  key={mod.id}
                  value={mod.id}
                  className="border rounded-lg px-0 overflow-hidden"
                >
                  <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/40 [&[data-state=open]]:bg-muted/40">
                    <div className="flex items-center gap-3 text-left">
                      <span className="font-medium">{mod.name}</span>
                      <Badge variant="outline" className="text-xs font-normal">
                        {mod.endpoints.length} endpoint{mod.endpoints.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 pt-2 space-y-3">
                    <p className="text-sm text-muted-foreground">{mod.description}</p>
                    {mod.endpoints.map((ep, idx) => (
                      <EndpointCard key={idx} endpoint={ep} idx={idx} moduleId={mod.id} />
                    ))}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        );
      })}
    </div>
  );
}
