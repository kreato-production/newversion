'use client';

import { usePathname } from 'next/navigation';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useLanguage } from '@/contexts/LanguageContext';

interface Segment {
  label: string;
  href?: string;
}

const MODULE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  producao: 'Produção',
  recursos: 'Recursos',
  admin: 'Administração',
  global: 'Global',
  module: '',
};

const SUB_LABELS: Record<string, string> = {
  programas: 'Programas',
  conteudo: 'Conteúdo',
  gravacao: 'Gravações',
  tarefas: 'Tarefas',
  incidencias: 'Incidências',
  mapas: 'Mapas',
  'tipos-gravacao': 'Tipos de Gravação',
  classificacao: 'Classificação',
  status: 'Status de Gravação',
  'status-tarefa': 'Status de Tarefa',
  'tabelas-preco': 'Tabelas de Preço',
  'categorias-incidencia': 'Categorias de Incidência',
  'severidades-incidencia': 'Severidades de Incidência',
  'impactos-incidencia': 'Impactos de Incidência',
  humanos: 'Recursos Humanos',
  tecnicos: 'Recursos Técnicos',
  fisicos: 'Recursos Físicos',
  fornecedores: 'Fornecedores',
  pessoas: 'Pessoas',
  figurinos: 'Figurinos',
  equipes: 'Equipes',
  cargos: 'Cargos',
  departamentos: 'Departamentos',
  funcoes: 'Funções',
  servicos: 'Serviços',
  'categoria-fornecedores': 'Categoria de Fornecedores',
  'classificacao-pessoas': 'Classificação de Pessoas',
  'tipo-figurino': 'Tipo de Figurino',
  material: 'Material',
  unidades: 'Unidades de Negócio',
  'centros-lucro': 'Centros de Custos',
  usuarios: 'Usuários',
  perfis: 'Perfis de Acesso',
  formularios: 'Formulários',
  tenants: 'Tenants',
};

function buildSegments(pathname: string): Segment[] {
  const parts = pathname.split('/').filter(Boolean);

  if (parts.length === 0) return [{ label: 'Home' }];

  // /module/producao → [Produção]
  if (parts[0] === 'module' && parts[1]) {
    const label = MODULE_LABELS[parts[1]] ?? parts[1];
    return [{ label }];
  }

  const segments: Segment[] = [];

  // First segment: module
  const moduleLabel = MODULE_LABELS[parts[0]];
  if (moduleLabel !== undefined && moduleLabel !== '') {
    const modulePath = `/module/${parts[0]}`;
    segments.push({
      label: moduleLabel,
      href: parts.length > 1 ? modulePath : undefined,
    });
  } else if (parts[0] !== 'module') {
    segments.push({
      label: parts[0].charAt(0).toUpperCase() + parts[0].slice(1),
      href: parts.length > 1 ? `/${parts[0]}` : undefined,
    });
  }

  // Subsequent segments
  for (let i = 1; i < parts.length; i++) {
    const label = SUB_LABELS[parts[i]] ?? parts[i];
    const isLast = i === parts.length - 1;
    segments.push({
      label,
      href: isLast ? undefined : `/${parts.slice(0, i + 1).join('/')}`,
    });
  }

  return segments;
}

export function AppBreadcrumb() {
  const pathname = usePathname();
  const segments = buildSegments(pathname);

  if (segments.length === 0) return null;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1;

          return (
            <span key={index} className="flex items-center gap-1.5">
              {index > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {isLast || !segment.href ? (
                  <BreadcrumbPage>{segment.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={segment.href}>{segment.label}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </span>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
