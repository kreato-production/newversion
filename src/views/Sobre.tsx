'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Server,
  Monitor,
  Database,
  Shield,
  TestTube2,
  Layers,
  Container,
  Wrench,
  Download,
  Loader2,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TechItem {
  name: string;
  version?: string;
  description: string;
  badge?: string;
}

interface TechSection {
  title: string;
  icon: React.ElementType;
  items: TechItem[];
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const infrastructure: TechSection = {
  title: 'Infraestrutura',
  icon: Container,
  items: [
    { name: 'Docker / Docker Compose', description: 'Orquestração local dos serviços' },
    { name: 'PostgreSQL', version: '16 Alpine', description: 'Banco de dados relacional principal' },
    { name: 'Keycloak', version: '24.0', description: 'Identity Provider para SSO via OIDC (opcional)', badge: 'Opcional' },
  ],
};

const backend: TechSection[] = [
  {
    title: 'Runtime e Framework',
    icon: Server,
    items: [
      { name: 'Node.js', description: 'Runtime JavaScript' },
      { name: 'TypeScript', version: '^5.8', description: 'Linguagem tipada' },
      { name: 'Fastify', version: '^5.2', description: 'Framework HTTP de alta performance, schema-first' },
      { name: 'tsx', version: '^4.19', description: 'Execução de TypeScript com hot-reload em desenvolvimento' },
    ],
  },
  {
    title: 'Banco de Dados',
    icon: Database,
    items: [
      { name: 'Prisma ORM', version: '^6.6', description: 'Modelagem de schema, migrations e client gerado' },
      { name: 'PostgreSQL', version: '16', description: 'Banco relacional via Docker' },
    ],
  },
  {
    title: 'Plugins Fastify',
    icon: Layers,
    items: [
      { name: '@fastify/cookie', description: 'Leitura e escrita de cookies HttpOnly' },
      { name: '@fastify/cors', description: 'Controle de CORS para o frontend' },
      { name: '@fastify/helmet', description: 'Headers de segurança HTTP' },
      { name: '@fastify/rate-limit', description: 'Limitação de requisições por IP' },
      { name: '@fastify/swagger', description: 'Geração automática da spec OpenAPI' },
      { name: '@fastify/swagger-ui', description: 'Interface visual da documentação da API' },
    ],
  },
  {
    title: 'Autenticação e Segurança',
    icon: Shield,
    items: [
      { name: 'jose', version: '^6.2', description: 'Geração e validação de JWTs (RS256/HS256)' },
      { name: 'scrypt', description: 'Hash de senhas (Node built-in)' },
      { name: 'SHA-256', description: 'Hash de tokens de revogação (Node built-in)' },
      { name: 'OIDC Discovery', description: 'Validação de tokens Keycloak' },
      { name: 'Cookies HttpOnly', description: 'Armazenamento de access e refresh tokens' },
    ],
  },
  {
    title: 'Validação',
    icon: Wrench,
    items: [
      { name: 'Zod', version: '^3.24', description: 'Validação de schemas de request/response e variáveis de ambiente' },
    ],
  },
  {
    title: 'Testes',
    icon: TestTube2,
    items: [
      { name: 'Vitest', version: '^3.0', description: 'Framework de testes unitários e de integração' },
    ],
  },
];

const frontend: TechSection[] = [
  {
    title: 'Runtime e Framework',
    icon: Monitor,
    items: [
      { name: 'React', version: '^18.3', description: 'Biblioteca de UI' },
      { name: 'Next.js', version: '^16.2', description: 'Framework full-stack com App Router, SSR e API Routes', badge: 'Turbopack' },
      { name: 'TypeScript', version: '^5.8', description: 'Linguagem tipada' },
    ],
  },
  {
    title: 'Autenticação',
    icon: Shield,
    items: [
      { name: 'NextAuth.js (Auth.js v5)', version: '^5.0.0-beta.30', description: 'Sessão JWT via cookies HttpOnly, Credentials provider, Keycloak OIDC' },
      { name: '@auth/prisma-adapter', version: '^2.11', description: 'Persistência de contas OAuth e tokens no banco' },
    ],
  },
  {
    title: 'Estilo e UI',
    icon: Layers,
    items: [
      { name: 'Tailwind CSS', version: '^3.4', description: 'Framework CSS utilitário' },
      { name: 'shadcn/ui', description: 'Componentes acessíveis baseados em Radix UI + Tailwind' },
      { name: 'Radix UI', description: 'Primitivos de UI acessíveis (Dialog, Select, Tooltip, etc.)' },
      { name: 'lucide-react', version: '^0.462', description: 'Ícones SVG em React' },
      { name: 'next-themes', version: '^0.3', description: 'Alternância dark/light mode' },
      { name: 'sonner', version: '^1.7', description: 'Notificações toast' },
      { name: 'cmdk', version: '^1.1', description: 'Paleta de comandos (Command Menu)' },
      { name: 'vaul', version: '^0.9', description: 'Drawer (gaveta) para mobile' },
      { name: 'embla-carousel-react', version: '^8.6', description: 'Carrossel de conteúdo' },
    ],
  },
  {
    title: 'Formulários e Validação',
    icon: Wrench,
    items: [
      { name: 'React Hook Form', version: '^7.61', description: 'Gerenciamento de formulários' },
      { name: '@hookform/resolvers', version: '^3.10', description: 'Integração com Zod' },
      { name: 'Zod', version: '^3.25', description: 'Validação de schemas de formulários e API' },
    ],
  },
  {
    title: 'Data Fetching e Estado',
    icon: Database,
    items: [
      { name: 'TanStack Query', version: '^5.83', description: 'Cache, sincronização e gerenciamento de estado server-side' },
    ],
  },
  {
    title: 'Visualização e Exportação',
    icon: Layers,
    items: [
      { name: 'Recharts', version: '^2.15', description: 'Gráficos e visualizações de dados' },
      { name: 'jsPDF', version: '^4.0', description: 'Geração de arquivos PDF no browser' },
      { name: 'jspdf-autotable', version: '^5.0', description: 'Tabelas em PDF via jsPDF' },
      { name: 'html2canvas', version: '^1.4', description: 'Captura de elementos HTML como imagem' },
      { name: 'xlsx', version: '^0.18', description: 'Leitura e escrita de planilhas Excel' },
      { name: 'Tiptap', version: '^3.15', description: 'Editor de texto rico (ProseMirror-based)' },
    ],
  },
  {
    title: 'Testes',
    icon: TestTube2,
    items: [
      { name: 'Vitest', version: '^3.2', description: 'Framework de testes' },
      { name: '@testing-library/react', version: '^16.0', description: 'Testes de componentes React' },
      { name: '@testing-library/jest-dom', version: '^6.6', description: 'Matchers de DOM para testes' },
      { name: 'jsdom', version: '^20.0', description: 'Simulação de DOM nos testes' },
    ],
  },
  {
    title: 'Qualidade de Código',
    icon: Wrench,
    items: [
      { name: 'ESLint', version: '^9.32', description: 'Linting de TypeScript/React' },
      { name: 'Prettier', version: '^3.8', description: 'Formatação automática de código' },
      { name: 'Husky', version: '^9.1', description: 'Git hooks para validação pré-commit' },
      { name: 'lint-staged', version: '^16.4', description: 'Linting somente nos arquivos alterados no commit' },
    ],
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function TechCard({ section }: { section: TechSection }) {
  const Icon = section.icon;
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
          {section.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {section.items.map((item) => (
          <div key={item.name} className="flex items-start justify-between gap-3 text-sm">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium">{item.name}</span>
                {item.version && (
                  <span className="text-xs text-muted-foreground font-mono">{item.version}</span>
                )}
                {item.badge && (
                  <Badge variant="secondary" className="text-xs px-1.5 py-0">
                    {item.badge}
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground text-xs mt-0.5">{item.description}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ─── PDF Export ───────────────────────────────────────────────────────────────

async function exportToPdf() {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;
  let y = margin;

  const addTitle = (text: string) => {
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(text, margin, y);
    y += 8;
  };

  const addSubtitle = (text: string) => {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(text, margin, y);
    y += 8;
  };

  const addSectionHeader = (text: string) => {
    if (y > 260) { doc.addPage(); y = margin; }
    y += 4;
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(text, margin, y);
    y += 2;
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y, pageW - margin, y);
    y += 5;
  };

  const addTable = (title: string, items: TechItem[]) => {
    if (y > 240) { doc.addPage(); y = margin; }
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    doc.text(title, margin, y);
    y += 3;

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Tecnologia', 'Versão', 'Descrição']],
      body: items.map((i) => [i.name, i.version ?? '-', i.description]),
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: [51, 65, 85], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 48 }, 1: { cellWidth: 22 } },
      didDrawPage: () => { y = margin; },
    });

    y = (doc as typeof doc & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
  };

  // ── Capa ──
  addTitle('Kreato - Stack Tecnologica');
  addSubtitle('Sistema de Gestao de Producao | Documento gerado em ' + new Date().toLocaleDateString('pt-BR'));

  // ── Arquitetura ──
  addSectionHeader('Arquitetura');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  const arch = [
    'Monorepo com duas aplicacoes independentes (frontend / backend).',
    '',
    'Frontend  ->  Next.js 16 | App Router | React 18 | Auth.js v5 | shadcn/ui | localhost:3000',
    'Backend   ->  Fastify 5 | Prisma 6 | PostgreSQL 16 | JWT | multi-tenancy | localhost:3333',
    '',
    'Fluxo de autenticacao:',
    'Browser -> Cookie HttpOnly (authjs.session-token) -> Next.js (Auth.js JWT)',
    'Next.js -> X-Internal-Token (HMAC) -> Fastify -> PostgreSQL (Prisma)',
  ];
  for (const line of arch) {
    if (y > 270) { doc.addPage(); y = margin; }
    doc.text(line, margin, y);
    y += 4.5;
  }

  // ── Infraestrutura ──
  addSectionHeader('Infraestrutura');
  addTable(infrastructure.title, infrastructure.items);

  // ── Backend ──
  addSectionHeader('Backend');
  for (const section of backend) {
    addTable(section.title, section.items);
  }

  // ── Frontend ──
  addSectionHeader('Frontend');
  for (const section of frontend) {
    addTable(section.title, section.items);
  }

  // ── Padrões ──
  addSectionHeader('Padrões e Convenções');
  const padroes = [
    ['Repository -> Service -> Routes', 'Padrao de camadas no backend por modulo'],
    ['Injecao de Dependencia', 'buildApp(options?) aceita repositorios in-memory nos testes'],
    ['Multi-tenancy', 'Isolamento por tenantId em todos os recursos protegidos'],
    ['Paginacao Padronizada', '{ data, total } com ?limit= e ?offset= em todos os endpoints de lista'],
    ['App Router (Next.js)', 'Server Components, Client Components e API Routes coexistindo'],
    ['Proxy Interno', 'Next.js -> /api/proxy/* -> Fastify com X-Internal-Token HMAC'],
  ];
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Padrão', 'Descrição']],
    body: padroes,
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: [51, 65, 85], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 } },
  });

  // ── Rodapé em todas as páginas ──
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(`Kreato — Stack Tecnológica`, margin, 291);
    doc.text(`Página ${i} de ${totalPages}`, pageW - margin, 291, { align: 'right' });
  }

  doc.save('kreato-tecnologias.pdf');
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function SobrePage() {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    await exportToPdf();
    setExporting(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Sobre o Sistema</h1>
          <p className="text-muted-foreground mt-1">
            Stack tecnológica e arquitetura do Kreato — Sistema de Gestão de Produção.
          </p>
        </div>
        <Button onClick={handleExport} disabled={exporting} variant="outline" size="sm" className="shrink-0">
          {exporting ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Exportando...</>
          ) : (
            <><Download className="h-4 w-4 mr-2" />Exportar PDF</>
          )}
        </Button>
      </div>

      {/* Arquitetura */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Layers className="h-4 w-4 text-muted-foreground" />
            Arquitetura
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            Monorepo com duas aplicações independentes que se comunicam via API REST.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-lg border bg-muted/40 p-4 space-y-1">
              <div className="flex items-center gap-2">
                <Monitor className="h-4 w-4 text-blue-500" />
                <span className="font-semibold">Frontend</span>
                <Badge variant="outline" className="text-xs">Next.js 16</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                App Router, Server Components, Auth.js v5, shadcn/ui, TanStack Query
              </p>
              <p className="text-xs font-mono text-muted-foreground">localhost:3000</p>
            </div>
            <div className="rounded-lg border bg-muted/40 p-4 space-y-1">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-green-500" />
                <span className="font-semibold">Backend</span>
                <Badge variant="outline" className="text-xs">Fastify 5</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Fastify 5, Prisma 6, PostgreSQL, JWT, multi-tenancy
              </p>
              <p className="text-xs font-mono text-muted-foreground">localhost:3333</p>
            </div>
          </div>
          <div className="rounded-lg border bg-muted/40 p-4 space-y-1">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-orange-500" />
              <span className="font-semibold text-sm">Fluxo de Autenticação</span>
            </div>
            <p className="text-xs text-muted-foreground font-mono leading-relaxed">
              Browser → Cookie HttpOnly (authjs.session-token) → Next.js (Auth.js JWT)<br />
              Next.js → X-Internal-Token (HMAC) → Fastify → PostgreSQL (Prisma)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Infraestrutura */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Container className="h-5 w-5 text-muted-foreground" />
          Infraestrutura
        </h2>
        <TechCard section={infrastructure} />
      </div>

      <Separator />

      {/* Backend */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Server className="h-5 w-5 text-muted-foreground" />
          Backend
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {backend.map((section) => (
            <TechCard key={section.title} section={section} />
          ))}
        </div>
      </div>

      <Separator />

      {/* Frontend */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Monitor className="h-5 w-5 text-muted-foreground" />
          Frontend
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {frontend.map((section) => (
            <TechCard key={section.title} section={section} />
          ))}
        </div>
      </div>

      <Separator />

      {/* Padrões */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Wrench className="h-5 w-5 text-muted-foreground" />
          Padrões e Convenções
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { title: 'Repository → Service → Routes', desc: 'Padrão de camadas no backend por módulo' },
            { title: 'Injeção de Dependência', desc: 'buildApp(options?) aceita repositórios in-memory nos testes' },
            { title: 'Multi-tenancy', desc: 'Isolamento por tenantId em todos os recursos protegidos' },
            { title: 'Paginação Padronizada', desc: '{ data, total } com ?limit= e ?offset= em todos os endpoints de lista' },
            { title: 'App Router (Next.js)', desc: 'Server Components, Client Components e API Routes coexistindo' },
            { title: 'Proxy Interno', desc: 'Next.js → /api/proxy/* → Fastify com X-Internal-Token HMAC' },
          ].map((p) => (
            <div key={p.title} className="rounded-lg border bg-muted/40 p-3 space-y-1">
              <p className="text-sm font-medium">{p.title}</p>
              <p className="text-xs text-muted-foreground">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
