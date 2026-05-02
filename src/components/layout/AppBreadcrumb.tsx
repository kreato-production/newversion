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

// ─── Label maps ──────────────────────────────────────────────────────────────

const MODULE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  producao: 'Produção',
  recursos: 'Recursos',
  financeiro: 'Financeiro',
  admin: 'Administração',
  global: 'Global',
  'api-docs': 'API',
  arquitetura: 'Arquitetura',
  sobre: 'Sobre o Sistema',
};

const MODULE_PATHS: Record<string, string> = {
  producao: '/module/producao',
  recursos: '/module/recursos',
  financeiro: '/module/financeiro',
  admin: '/module/admin',
  global: '/module/global',
};

const SUB_LABELS: Record<string, string> = {
  // Produção — principais
  programas: 'Programas',
  conteudo: 'Conteúdo',
  gravacao: 'Gravações',
  tarefas: 'Tarefas',
  incidencias: 'Incidências',
  mapas: 'Mapas',
  // Produção — parametrizações
  'tipos-gravacao': 'Tipos de Gravação',
  classificacao: 'Classificação',
  status: 'Status de Gravação',
  'status-tarefa': 'Status de Tarefa',
  'tabelas-preco': 'Tabelas de Preço',
  'categorias-incidencia': 'Cat. de Incidência',
  'severidades-incidencia': 'Sev. de Incidência',
  'impactos-incidencia': 'Imp. de Incidência',
  // Recursos — principais
  humanos: 'Rec. Humanos',
  tecnicos: 'Rec. Técnicos',
  fisicos: 'Rec. Físicos',
  fornecedores: 'Fornecedores',
  pessoas: 'Pessoas',
  figurinos: 'Figurinos',
  equipes: 'Equipes',
  // Recursos — parametrizações
  cargos: 'Cargos',
  departamentos: 'Departamentos',
  funcoes: 'Funções',
  feriados: 'Feriados',
  turnos: 'Turnos',
  servicos: 'Serviços',
  'categoria-fornecedores': 'Cat. Fornecedores',
  'classificacao-pessoas': 'Class. de Pessoas',
  'tipo-figurino': 'Tipo de Figurino',
  material: 'Material',
  // Financeiro
  'status-contas-pagar': 'Status de Contas a Pagar',
  'tipos-documentos': 'Tipos de Documentos',
  'tipos-pagamento': 'Tipos de Pagamentos',
  'categorias-despesa': 'Categorias de Despesas',
  'formas-pagamento': 'Formas de Pagamento',
  // Admin
  unidades: 'Unidades de Negócio',
  'centros-lucro': 'Centros de Custos',
  usuarios: 'Usuários',
  perfis: 'Perfis de Acesso',
  formularios: 'Formulários',
  // Global
  tenants: 'Tenants',
};

// Sub-items that belong to a "Parametrizações" group
const PARAM_SLUGS = new Set([
  'tipos-gravacao',
  'classificacao',
  'status',
  'status-tarefa',
  'tabelas-preco',
  'categorias-incidencia',
  'severidades-incidencia',
  'impactos-incidencia',
  'cargos',
  'departamentos',
  'funcoes',
  'feriados',
  'turnos',
  'servicos',
  'categoria-fornecedores',
  'classificacao-pessoas',
  'tipo-figurino',
  'material',
  'status-contas-pagar',
  'tipos-documentos',
  'tipos-pagamento',
  'categorias-despesa',
  'formas-pagamento',
]);

// ─── Types ────────────────────────────────────────────────────────────────────

interface Crumb {
  label: string;
  href?: string;
}

// ─── Builder ─────────────────────────────────────────────────────────────────

function buildCrumbs(pathname: string): Crumb[] {
  const parts = pathname.split('/').filter(Boolean);

  if (parts.length === 0 || parts[0] === 'dashboard') {
    return [{ label: 'Dashboard' }];
  }

  // /module/producao → [Produção]
  if (parts[0] === 'module') {
    const key = parts[1];
    return [{ label: MODULE_LABELS[key] ?? key }];
  }

  const [module, sub, ...rest] = parts;
  const crumbs: Crumb[] = [];

  // Module level
  const moduleLabel = MODULE_LABELS[module];
  if (moduleLabel) {
    crumbs.push({
      label: moduleLabel,
      href: sub ? MODULE_PATHS[module] : undefined,
    });
  }

  // Sub level
  if (sub) {
    // If sub is a parametrizações item, insert the group crumb
    if (PARAM_SLUGS.has(sub)) {
      crumbs.push({ label: 'Parametrizações' });
    }

    const subLabel = SUB_LABELS[sub] ?? sub;
    crumbs.push({
      label: subLabel,
      href: rest.length > 0 ? `/${module}/${sub}` : undefined,
    });
  }

  // Deeper segments (e.g. detail/edit pages with an id)
  rest.forEach((part, i) => {
    const isLast = i === rest.length - 1;
    // Try to resolve as a label; if it looks like a UUID/ID, show "Detalhe"
    const isId = /^[0-9a-f-]{8,}$/i.test(part);
    crumbs.push({
      label: isId ? 'Detalhe' : (SUB_LABELS[part] ?? part),
      href: isLast ? undefined : `/${[module, sub, ...rest.slice(0, i + 1)].join('/')}`,
    });
  });

  return crumbs;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AppBreadcrumb() {
  const pathname = usePathname();
  const crumbs = buildCrumbs(pathname);

  if (crumbs.length === 0) return null;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;

          return (
            <span key={index} className="flex items-center gap-1.5">
              {index > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {isLast || !crumb.href ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </span>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
