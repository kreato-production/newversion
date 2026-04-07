'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Monitor, Server, Database, Shield, ArrowRight, Layers, Container, Download, Loader2 } from 'lucide-react';

// ─── PDF Export ───────────────────────────────────────────────────────────────

async function exportToPdf() {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;
  let y = margin;

  const checkPage = (needed = 20) => {
    if (y + needed > 280) { doc.addPage(); y = margin; }
  };

  const addTitle = (text: string) => {
    doc.setFontSize(18); doc.setFont('helvetica', 'bold'); doc.setTextColor(15, 23, 42);
    doc.text(text, margin, y); y += 8;
  };

  const addSubtitle = (text: string) => {
    doc.setFontSize(11); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 116, 139);
    doc.text(text, margin, y); y += 10;
  };

  const addSection = (text: string) => {
    checkPage(14);
    y += 4;
    doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.setTextColor(15, 23, 42);
    doc.text(text, margin, y); y += 2;
    doc.setDrawColor(226, 232, 240); doc.line(margin, y, pageW - margin, y); y += 6;
  };

  const addParagraph = (text: string) => {
    checkPage(8);
    doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(71, 85, 105);
    const lines = doc.splitTextToSize(text, pageW - margin * 2) as string[];
    doc.text(lines, margin, y); y += lines.length * 4.5 + 3;
  };

  const addLabel = (text: string) => {
    checkPage(8);
    doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(100, 116, 139);
    doc.text(text.toUpperCase(), margin, y); y += 5;
  };

  const addFlow = (steps: { label: string; sub: string }[]) => {
    checkPage(18);
    const boxW = 36; const boxH = 12; const arrowW = 8;
    const totalW = steps.length * boxW + (steps.length - 1) * arrowW;
    let x = margin + Math.max(0, (pageW - margin * 2 - totalW) / 2);
    const colors: [number, number, number][] = [
      [148, 163, 184], [96, 165, 250], [74, 222, 128], [251, 146, 60], [192, 132, 252],
    ];
    steps.forEach((step, i) => {
      const [r, g, b] = colors[i % colors.length];
      doc.setDrawColor(r, g, b); doc.setLineWidth(0.5);
      doc.roundedRect(x, y, boxW, boxH, 2, 2, 'S');
      doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(15, 23, 42);
      doc.text(step.label, x + boxW / 2, y + 4.5, { align: 'center' });
      doc.setFontSize(6); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 116, 139);
      doc.text(step.sub, x + boxW / 2, y + 8.5, { align: 'center' });
      x += boxW;
      if (i < steps.length - 1) {
        doc.setDrawColor(148, 163, 184); doc.setLineWidth(0.3);
        doc.line(x + 1, y + boxH / 2, x + arrowW - 1, y + boxH / 2);
        doc.triangle(x + arrowW - 1, y + boxH / 2 - 1.5, x + arrowW - 1, y + boxH / 2 + 1.5, x + arrowW + 1, y + boxH / 2, 'F');
        x += arrowW;
      }
    });
    y += boxH + 5;
  };

  // ── Capa ──
  addTitle('Kreato - Arquitetura do Sistema');
  addSubtitle('Visao geral da estrutura tecnica, fluxos e padroes | ' + new Date().toLocaleDateString('pt-BR'));

  // ── Visao Geral ──
  addSection('Visao Geral - Monorepo');
  addParagraph('O Kreato e organizado como um monorepo com duas aplicacoes independentes que se comunicam via API REST. Cada app tem seu proprio package.json, dependencias e processo de build.');

  autoTable(doc, {
    startY: y, margin: { left: margin, right: margin },
    head: [['App', 'Tecnologias', 'Porta']],
    body: [
      ['Frontend (raiz/)', 'Next.js 16 | React 18 | TypeScript | Auth.js v5 | shadcn/ui | TanStack Query', 'localhost:3000'],
      ['Backend (backend/)', 'Fastify 5 | TypeScript ESM | Prisma 6 | PostgreSQL 16 | JWT | multi-tenancy', 'localhost:3333'],
    ],
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: [51, 65, 85], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 38 }, 2: { cellWidth: 28 } },
  });
  y = (doc as typeof doc & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  // ── Fluxos ──
  addSection('Fluxos de Autenticacao e Request');

  addLabel('Login');
  addFlow([
    { label: 'Browser', sub: 'Credenciais' },
    { label: 'Next.js', sub: '/api/auth/signin' },
    { label: 'Fastify', sub: '/auth/login' },
    { label: 'PostgreSQL', sub: 'Valida hash' },
  ]);
  addParagraph('Fastify valida credenciais via scrypt. Auth.js cria o JWT e seta o cookie authjs.session-token (HttpOnly).');

  addLabel('Request Autenticado (Client Component)');
  addFlow([
    { label: 'Browser', sub: 'Cookie JWT' },
    { label: 'Next.js', sub: '/api/proxy/*' },
    { label: 'Fastify', sub: 'X-Internal-Token' },
    { label: 'PostgreSQL', sub: 'Prisma ORM' },
  ]);
  addParagraph('O proxy Next.js le a sessao Auth.js, gera um X-Internal-Token (HMAC) e encaminha ao Fastify. O browser nunca acessa o backend diretamente.');

  addLabel('Request em Server Component');
  addFlow([
    { label: 'Next.js', sub: 'Server Component' },
    { label: 'auth()', sub: 'Auth.js token' },
    { label: 'Fastify', sub: 'X-Internal-Token' },
  ]);
  addParagraph('Server Components chamam auth() diretamente para ler a sessao, sem passar pelo proxy.');

  // ── Modulos Backend ──
  addSection('Padrao de Modulos - Backend');
  addParagraph('Cada funcionalidade de negocio e isolada em um modulo com tres camadas:');

  autoTable(doc, {
    startY: y, margin: { left: margin, right: margin },
    head: [['#', 'Camada', 'Arquivo', 'Responsabilidade']],
    body: [
      ['1', 'Repository', '<modulo>.repository.ts', 'Interface + implementacao Prisma. Testes usam implementacoes InMemory.'],
      ['2', 'Service', '<modulo>.service.ts', 'Logica de negocio. Recebe o repository via constructor. Enforca isolamento de tenantId.'],
      ['3', 'Routes', 'routes/index.ts', 'Plugin Fastify. Valida schema com Zod, chama o service, retorna resposta.'],
    ],
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: [51, 65, 85], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 0: { cellWidth: 8 }, 1: { fontStyle: 'bold', cellWidth: 24 }, 2: { cellWidth: 42 } },
  });
  y = (doc as typeof doc & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  // ── Multi-tenancy ──
  addSection('Multi-tenancy');
  addParagraph('Cada tenant (empresa cliente) tem seus dados isolados. O isolamento e garantido em multiplas camadas:');

  autoTable(doc, {
    startY: y, margin: { left: margin, right: margin },
    head: [['Camada', 'Mecanismo']],
    body: [
      ['JWT', 'O token carrega tenantId do usuario, definido no login.'],
      ['Middleware Fastify', 'requireTenantAccess valida que o usuario pertence ao tenant da rota.'],
      ['Service', 'Todos os metodos de listagem e criacao filtram por actor.tenantId.'],
      ['Repository', 'Todas as queries Prisma incluem WHERE tenantId = ?.'],
      ['GLOBAL_ADMIN', 'Usuarios com role GLOBAL_ADMIN tem tenantId = null e passam por todos os filtros.'],
    ],
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: [51, 65, 85], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } },
  });
  y = (doc as typeof doc & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  // ── Banco de Dados ──
  addSection('Banco de Dados e Paginacao');
  addParagraph('PostgreSQL 16 gerenciado via Prisma ORM. O schema fica em backend/prisma/schema.prisma e e compartilhado entre o backend e o frontend (Auth.js PrismaAdapter).');
  addParagraph('Paginacao padrao: GET /recurso?limit=50&offset=0 | Retorno: { data: T[], total: number } | limit max: 200 | Implementado via prisma.$transaction([count, findMany])');

  // ── Rodape ──
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7); doc.setTextColor(148, 163, 184);
    doc.text('Kreato - Arquitetura do Sistema', margin, 291);
    doc.text(`Pagina ${i} de ${totalPages}`, pageW - margin, 291, { align: 'right' });
  }

  doc.save('kreato-arquitetura.pdf');
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function FlowStep({ label, sub, color }: { label: string; sub?: string; color: string }) {
  return (
    <div className={`rounded-lg border-2 ${color} px-4 py-3 text-center min-w-[120px]`}>
      <p className="text-sm font-semibold">{label}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

function Arrow() {
  return <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function ArquiteturaPage() {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    await exportToPdf();
    setExporting(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Arquitetura do Sistema</h1>
          <p className="text-muted-foreground mt-1">
            Visão geral da estrutura técnica, fluxos e padrões do Kreato.
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

      {/* Visão Geral */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Layers className="h-4 w-4 text-muted-foreground" />
            Visão Geral — Monorepo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            O Kreato é organizado como um monorepo com duas aplicações independentes que se comunicam via API REST. Cada app tem seu próprio <code className="text-xs bg-muted px-1 py-0.5 rounded">package.json</code>, dependências e processo de build.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-lg border bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Monitor className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="font-semibold text-sm">Frontend</span>
                <Badge variant="outline" className="text-xs">raiz/</Badge>
              </div>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>Next.js 16 com App Router</li>
                <li>React 18 + TypeScript</li>
                <li>Auth.js v5 (sessão JWT)</li>
                <li>shadcn/ui + Tailwind CSS</li>
                <li>TanStack Query</li>
              </ul>
              <p className="text-xs font-mono text-blue-600 dark:text-blue-400">localhost:3000</p>
            </div>
            <div className="rounded-lg border bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="font-semibold text-sm">Backend</span>
                <Badge variant="outline" className="text-xs">backend/</Badge>
              </div>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>Fastify 5 com TypeScript (ESM)</li>
                <li>Prisma 6 + PostgreSQL 16</li>
                <li>JWT com cookies HttpOnly</li>
                <li>Multi-tenancy por tenantId</li>
                <li>Repository → Service → Routes</li>
              </ul>
              <p className="text-xs font-mono text-green-600 dark:text-green-400">localhost:3333</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fluxo de Autenticação */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4 text-muted-foreground" />
            Fluxo de Autenticação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm text-muted-foreground">
            Autenticação baseada em JWT armazenado em cookie HttpOnly. O Next.js atua como BFF (Backend for Frontend), gerando um token interno antes de chamar o Fastify.
          </p>

          {/* Login flow */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Login</p>
            <div className="flex flex-wrap items-center gap-2">
              <FlowStep label="Browser" sub="Credenciais" color="border-slate-300 dark:border-slate-700" />
              <Arrow />
              <FlowStep label="Next.js" sub="/api/auth/signin" color="border-blue-300 dark:border-blue-800" />
              <Arrow />
              <FlowStep label="Fastify" sub="/auth/login" color="border-green-300 dark:border-green-800" />
              <Arrow />
              <FlowStep label="PostgreSQL" sub="Valida hash" color="border-orange-300 dark:border-orange-800" />
            </div>
            <p className="text-xs text-muted-foreground pl-1">
              Fastify valida credenciais via scrypt, retorna dados do usuário. Auth.js cria o JWT e seta o cookie <code className="bg-muted px-1 rounded">authjs.session-token</code> (HttpOnly).
            </p>
          </div>

          <Separator />

          {/* Request flow */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Request Autenticado (Client Component)</p>
            <div className="flex flex-wrap items-center gap-2">
              <FlowStep label="Browser" sub="Cookie JWT" color="border-slate-300 dark:border-slate-700" />
              <Arrow />
              <FlowStep label="Next.js" sub="/api/proxy/*" color="border-blue-300 dark:border-blue-800" />
              <Arrow />
              <FlowStep label="Fastify" sub="X-Internal-Token" color="border-green-300 dark:border-green-800" />
              <Arrow />
              <FlowStep label="PostgreSQL" sub="Prisma ORM" color="border-orange-300 dark:border-orange-800" />
            </div>
            <p className="text-xs text-muted-foreground pl-1">
              O proxy Next.js lê a sessão Auth.js (cookie HttpOnly), gera um <code className="bg-muted px-1 rounded">X-Internal-Token</code> (HMAC) e encaminha ao Fastify — o browser nunca acessa o backend diretamente.
            </p>
          </div>

          <Separator />

          {/* Server Component flow */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Request em Server Component</p>
            <div className="flex flex-wrap items-center gap-2">
              <FlowStep label="Next.js" sub="Server Component" color="border-blue-300 dark:border-blue-800" />
              <Arrow />
              <FlowStep label="auth()" sub="Auth.js token" color="border-purple-300 dark:border-purple-800" />
              <Arrow />
              <FlowStep label="Fastify" sub="X-Internal-Token" color="border-green-300 dark:border-green-800" />
            </div>
            <p className="text-xs text-muted-foreground pl-1">
              Server Components chamam <code className="bg-muted px-1 rounded">auth()</code> diretamente para ler a sessão, sem passar pelo proxy.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Padrão de Módulos Backend */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Server className="h-4 w-4 text-muted-foreground" />
            Padrão de Módulos — Backend
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Cada funcionalidade de negócio é isolada em um módulo com três camadas:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                step: '1',
                name: 'Repository',
                file: '<modulo>.repository.ts',
                desc: 'Interface + implementação Prisma. Isola o acesso ao banco. Testes usam implementações InMemory.',
                color: 'border-l-orange-400',
              },
              {
                step: '2',
                name: 'Service',
                file: '<modulo>.service.ts',
                desc: 'Lógica de negócio. Recebe o repository via constructor (injeção de dependência). Enforça isolamento de tenantId.',
                color: 'border-l-blue-400',
              },
              {
                step: '3',
                name: 'Routes',
                file: 'routes/index.ts',
                desc: 'Plugin Fastify. Valida schema com Zod, chama o service, retorna resposta. Usa createAuthenticate e requireTenantAccess.',
                color: 'border-l-green-400',
              },
            ].map((layer) => (
              <div key={layer.step} className={`rounded-lg border border-l-4 ${layer.color} bg-muted/30 p-3 space-y-1`}>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-muted-foreground">#{layer.step}</span>
                  <span className="font-semibold text-sm">{layer.name}</span>
                </div>
                <code className="text-xs text-muted-foreground block">{layer.file}</code>
                <p className="text-xs text-muted-foreground">{layer.desc}</p>
              </div>
            ))}
          </div>
          <div className="rounded-lg bg-muted/40 p-3 text-xs font-mono text-muted-foreground">
            <p className="font-semibold text-foreground mb-1">Estrutura de arquivos</p>
            <p>backend/src/modules/&lt;modulo&gt;/</p>
            <p className="pl-4">&lt;modulo&gt;.repository.ts</p>
            <p className="pl-4">&lt;modulo&gt;.service.ts</p>
            <p className="pl-4">routes/index.ts</p>
          </div>
        </CardContent>
      </Card>

      {/* Multi-tenancy */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Container className="h-4 w-4 text-muted-foreground" />
            Multi-tenancy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            Cada tenant (empresa cliente) tem seus dados isolados. O isolamento é garantido em múltiplas camadas:
          </p>
          <div className="space-y-2">
            {[
              { layer: 'JWT', desc: 'O token carrega tenantId do usuário, definido no login.' },
              { layer: 'Middleware Fastify', desc: 'requireTenantAccess valida que o usuário pertence ao tenant da rota.' },
              { layer: 'Service', desc: 'Todos os métodos de listagem e criação filtram por actor.tenantId.' },
              { layer: 'Repository', desc: 'Todas as queries Prisma incluem WHERE tenantId = ?.' },
              { layer: 'GLOBAL_ADMIN', desc: 'Usuários com role GLOBAL_ADMIN têm tenantId = null e passam por todos os filtros.' },
            ].map((item) => (
              <div key={item.layer} className="flex gap-3 items-start">
                <Badge variant="secondary" className="text-xs shrink-0 mt-0.5">{item.layer}</Badge>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Banco de Dados */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="h-4 w-4 text-muted-foreground" />
            Banco de Dados e Paginacao
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            PostgreSQL 16 gerenciado via <strong className="text-foreground">Prisma ORM</strong>. O schema fica em <code className="text-xs bg-muted px-1 rounded">backend/prisma/schema.prisma</code> e é compartilhado entre o backend e o frontend (Auth.js PrismaAdapter).
          </p>
          <div className="rounded-lg bg-muted/40 p-3 space-y-1 text-xs font-mono">
            <p className="font-semibold text-foreground text-sm font-sans">Paginacao padrao</p>
            <p>GET /recurso?limit=50&amp;offset=0</p>
            <p className="text-muted-foreground">{'// Retorno: { data: T[], total: number }'}</p>
            <p className="text-muted-foreground">{'// limit max: 200 | default: 50'}</p>
            <p className="text-muted-foreground">{'// Implementado via prisma.$transaction([count, findMany])'}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
