'use client';

import { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  KeyRound,
  Globe,
  Server,
  Layers,
  ArrowRight,
  ArrowDown,
  Download,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Cookie,
  Fingerprint,
  Network,
  Database,
  FileKey,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

// ─── PDF Export ───────────────────────────────────────────────────────────────

async function exportToPdf() {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;
  let y = margin;

  const checkPage = (needed = 20) => {
    if (y + needed > 280) {
      doc.addPage();
      y = margin;
    }
  };
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
    y += 10;
  };
  const addSection = (text: string) => {
    checkPage(14);
    y += 4;
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(text, margin, y);
    y += 2;
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y, pageW - margin, y);
    y += 6;
  };
  const addParagraph = (text: string) => {
    checkPage(8);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    const lines = doc.splitTextToSize(text, pageW - margin * 2) as string[];
    doc.text(lines, margin, y);
    y += lines.length * 4.5 + 3;
  };
  const addLabel = (text: string) => {
    checkPage(8);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text(text.toUpperCase(), margin, y);
    y += 5;
  };
  const addFlow = (steps: { label: string; sub: string }[]) => {
    checkPage(18);
    const boxW = 36;
    const boxH = 12;
    const arrowW = 8;
    const totalW = steps.length * boxW + (steps.length - 1) * arrowW;
    let x = margin + Math.max(0, (pageW - margin * 2 - totalW) / 2);
    const colors: [number, number, number][] = [
      [148, 163, 184],
      [96, 165, 250],
      [74, 222, 128],
      [251, 146, 60],
      [192, 132, 252],
    ];
    steps.forEach((step, i) => {
      const [r, g, b] = colors[i % colors.length];
      doc.setDrawColor(r, g, b);
      doc.setLineWidth(0.5);
      doc.roundedRect(x, y, boxW, boxH, 2, 2, 'S');
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(step.label, x + boxW / 2, y + 4.5, { align: 'center' });
      doc.setFontSize(6);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(step.sub, x + boxW / 2, y + 8.5, { align: 'center' });
      x += boxW;
      if (i < steps.length - 1) {
        doc.setDrawColor(148, 163, 184);
        doc.setLineWidth(0.3);
        doc.line(x + 1, y + boxH / 2, x + arrowW - 1, y + boxH / 2);
        doc.triangle(
          x + arrowW - 1,
          y + boxH / 2 - 1.5,
          x + arrowW - 1,
          y + boxH / 2 + 1.5,
          x + arrowW + 1,
          y + boxH / 2,
          'F',
        );
        x += arrowW;
      }
    });
    y += boxH + 5;
  };

  // Capa
  addTitle('Kreato - Seguranca da Aplicacao');
  addSubtitle(
    'Modelo de defesa em profundidade, fluxos e controles | ' +
      new Date().toLocaleDateString('pt-BR'),
  );

  // Modelo de defesa
  addSection('Modelo de Defesa em Profundidade');
  addParagraph(
    'O sistema implementa seguranca em 6 camadas independentes. O comprometimento de uma camada nao invalida as demais.',
  );
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Camada', 'Controles']],
    body: [
      ['Rede', 'HOST=127.0.0.1 em producao, CORS whitelist, firewall de porta'],
      ['Transporte', 'HTTPS/TLS obrigatorio, HSTS max-age=63072000, flag Secure nos cookies'],
      ['Frontend', 'CSP, X-Frame-Options, X-Content-Type-Options, middleware JWT'],
      ['Aplicacao', 'Rate limiting global 300/min + por usuario 10/15min, validacao Zod'],
      ['Autenticacao', 'JWT HMAC-SHA256, cookie HttpOnly, revalidacao anti-revogacao 5min'],
      ['Dados', 'Scrypt para senhas, AES-256-GCM para tokens, isolamento multi-tenant'],
    ],
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: [51, 65, 85], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 32 } },
  });
  y = (doc as typeof doc & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  // Fluxos
  addSection('Fluxos de Autenticacao');
  addLabel('Login com Credenciais');
  addFlow([
    { label: 'Browser', sub: 'usuario + senha' },
    { label: 'Next.js', sub: 'Auth.js authorize()' },
    { label: 'Fastify', sub: '/auth/login' },
    { label: 'PostgreSQL', sub: 'scrypt verify' },
  ]);
  addParagraph(
    'Credenciais validadas via scrypt (16 bytes salt, 64 bytes key). Auth.js assina o JWT com AUTH_SECRET (HMAC-SHA256) e define cookie HttpOnly.',
  );

  addLabel('Request Autenticado via Proxy');
  addFlow([
    { label: 'Browser', sub: 'Cookie JWT' },
    { label: 'Middleware', sub: 'proxy.ts / auth()' },
    { label: 'Next.js', sub: '/api/proxy/*' },
    { label: 'Fastify', sub: 'X-Internal-Token' },
  ]);
  addParagraph(
    'Middleware valida assinatura JWT (Auth.js edge). Proxy gera X-Internal-Token (HMAC, 30s TTL) para autenticar Next.js -> Fastify sem expor o cookie ao browser.',
  );

  // Sessao
  addSection('Gestao de Sessao');
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Atributo', 'Valor', 'Justificativa']],
    body: [
      ['Algoritmo', 'HMAC-SHA256', 'Resistente a timing-attack via timingSafeEqual'],
      ['Duracao', '7 dias', 'Renovado silenciosamente 1x/dia'],
      ['Cookie', 'HttpOnly + SameSite=Lax', 'Inacessivel ao JS; CSRF via formularios bloqueado'],
      ['Flag Secure', 'NEXTAUTH_COOKIE_SECURE', 'Configuravel por ambiente (staging vs prod)'],
      [
        'Anti-revogacao',
        'DB check a cada 5min',
        'Contas desativadas sao barradas sem aguardar expiracao do token',
      ],
      [
        'Logout',
        'Cookie zerado + redirect',
        'signOut() do Auth.js limpa cookie; Fastify limpa kreato_access_token',
      ],
    ],
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: [51, 65, 85], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 36 }, 1: { cellWidth: 36 } },
  });
  y = (doc as typeof doc & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  // Controle de acesso
  addSection('Controle de Acesso');
  addParagraph(
    'RBAC com 3 roles: GLOBAL_ADMIN (sem tenant), TENANT_ADMIN (admin de uma empresa), USER (operacional). Toda rota Fastify usa createAuthenticate + requireTenantAccess como preHandler.',
  );
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Verificacao', 'Onde', 'Mecanismo']],
    body: [
      ['Identidade', 'Fastify preHandler', 'createAuthenticate valida JWT ou X-Internal-Token'],
      ['Role', 'Fastify preHandler', 'createRequireRole([GLOBAL_ADMIN, TENANT_ADMIN])'],
      ['Tenant', 'Fastify preHandler', 'requireTenantAccess garante tenantId no contexto'],
      ['Isolamento', 'Service layer', 'Toda query filtra por actor.tenantId'],
      ['IDOR', 'Service + Repository', 'ensureSameTenant() valida ownership antes de operar'],
      [
        'Permissoes',
        '/api/user/permissions',
        'Permissoes granulares por modulo/campo buscadas pos-login',
      ],
    ],
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: [51, 65, 85], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 32 } },
  });
  y = (doc as typeof doc & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  // Criptografia
  addSection('Criptografia e Segredos');
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Uso', 'Algoritmo', 'Parametros']],
    body: [
      ['Hash de senhas', 'scrypt', 'salt=16B aleatório, keylen=64B'],
      ['Tokens Keycloak', 'AES-256-GCM', 'IV=12B por operacao, authTag=16B'],
      ['JWT legado', 'HMAC-SHA256', 'timingSafeEqual na verificacao'],
      ['X-Internal-Token', 'HMAC-SHA256 (jose)', 'TTL=30s, iss=kreato-nextjs, aud=kreato-fastify'],
      ['Refresh token storage', 'SHA-256 do token', 'Apenas o hash e armazenado no banco'],
      ['Swagger Basic Auth', 'timingSafeEqual', 'Buffer padded para evitar leak por comprimento'],
    ],
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: [51, 65, 85], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 42 }, 1: { cellWidth: 30 } },
  });
  y = (doc as typeof doc & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  // Rodape
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text('Kreato - Seguranca da Aplicacao', margin, 291);
    doc.text(`Pagina ${i} de ${totalPages}`, pageW - margin, 291, { align: 'right' });
  }

  doc.save('kreato-seguranca.pdf');
}

// ─── Helpers visuais ──────────────────────────────────────────────────────────

function FlowStep({ label, sub, color }: { label: string; sub?: string; color: string }) {
  return (
    <div className={`rounded-lg border-2 ${color} px-4 py-3 text-center min-w-[110px]`}>
      <p className="text-sm font-semibold leading-tight">{label}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{sub}</p>}
    </div>
  );
}

function Arrow({ vertical }: { vertical?: boolean }) {
  if (vertical) return <ArrowDown className="h-4 w-4 text-muted-foreground shrink-0 mx-auto" />;
  return <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />;
}

function LayerRow({
  icon: Icon,
  title,
  items,
  color,
}: {
  icon: React.ElementType;
  title: string;
  items: string[];
  color: string;
}) {
  return (
    <div className={`rounded-lg border-l-4 ${color} bg-muted/20 px-4 py-3 flex gap-4 items-start`}>
      <div className="shrink-0 mt-0.5">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold mb-1">{title}</p>
        <div className="flex flex-wrap gap-1.5">
          {items.map((item) => (
            <Badge key={item} variant="secondary" className="text-xs font-normal">
              {item}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}

function CheckRow({ label, desc, ok = true }: { label: string; desc: string; ok?: boolean }) {
  return (
    <div className="flex gap-3 items-start">
      {ok ? (
        <CheckCircle2 className="h-4 w-4 text-green-500 dark:text-green-400 shrink-0 mt-0.5" />
      ) : (
        <AlertTriangle className="h-4 w-4 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
      )}
      <div>
        <p className="text-sm font-medium leading-tight">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function SegurancaPage() {
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
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-emerald-500" />
            Segurança da Aplicação
          </h1>
          <p className="text-muted-foreground mt-1">
            Modelo de defesa, fluxos de autenticação e controles de segurança do Kreato.
          </p>
        </div>
        <Button
          onClick={handleExport}
          disabled={exporting}
          variant="outline"
          size="sm"
          className="shrink-0"
        >
          {exporting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Exportando...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Exportar PDF
            </>
          )}
        </Button>
      </div>

      {/* Defesa em Profundidade */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Layers className="h-4 w-4 text-muted-foreground" />
            Modelo de Defesa em Profundidade
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground mb-4">
            O sistema implementa{' '}
            <strong className="text-foreground">6 camadas de proteção independentes</strong>. O
            comprometimento de uma camada não invalida as demais — cada barreira precisa ser
            transposta separadamente.
          </p>
          <LayerRow
            icon={Network}
            title="Camada 1 — Rede"
            color="border-l-slate-400"
            items={[
              'HOST=127.0.0.1 em produção',
              'CORS allowlist explícita',
              'Rejeita Origin: null',
              'Firewall de porta',
            ]}
          />
          <LayerRow
            icon={Lock}
            title="Camada 2 — Transporte"
            color="border-l-blue-400"
            items={[
              'HTTPS / TLS',
              'HSTS max-age=63 072 000',
              'NEXTAUTH_COOKIE_SECURE',
              'Cookies SameSite=Lax',
            ]}
          />
          <LayerRow
            icon={Globe}
            title="Camada 3 — Frontend"
            color="border-l-violet-400"
            items={[
              'Content-Security-Policy',
              'X-Frame-Options: SAMEORIGIN',
              'X-Content-Type-Options',
              'Middleware valida JWT (não só cookie)',
            ]}
          />
          <LayerRow
            icon={Server}
            title="Camada 4 — Aplicação"
            color="border-l-orange-400"
            items={[
              'Rate limit global 300 req/min',
              'Rate limit por usuário 10/15 min',
              'Validação Zod em todos os inputs',
              'CSRF: Sec-Fetch-Site check',
              'Open redirect sanitizado',
            ]}
          />
          <LayerRow
            icon={KeyRound}
            title="Camada 5 — Autenticação"
            color="border-l-emerald-400"
            items={[
              'JWT HMAC-SHA256',
              'Cookie HttpOnly',
              'Anti-revogação (DB check 5 min)',
              'X-Internal-Token TTL=30s',
              'timingSafeEqual em todas as comparações',
            ]}
          />
          <LayerRow
            icon={Database}
            title="Camada 6 — Dados"
            color="border-l-rose-400"
            items={[
              'scrypt para senhas',
              'AES-256-GCM para tokens Keycloak',
              'Isolamento por tenantId em toda query',
              'IDOR bloqueado via ensureSameTenant()',
              'Refresh token: apenas hash SHA-256 no banco',
            ]}
          />
        </CardContent>
      </Card>

      {/* Fluxo de Autenticação */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Fingerprint className="h-4 w-4 text-muted-foreground" />
            Fluxos de Autenticação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Login */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Login com credenciais
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <FlowStep
                label="Browser"
                sub="usuário + senha"
                color="border-slate-300 dark:border-slate-700"
              />
              <Arrow />
              <FlowStep
                label="Auth.js"
                sub="authorize()"
                color="border-blue-300 dark:border-blue-800"
              />
              <Arrow />
              <FlowStep
                label="Fastify"
                sub="/auth/login"
                color="border-green-300 dark:border-green-800"
              />
              <Arrow />
              <FlowStep
                label="PostgreSQL"
                sub="scrypt verify"
                color="border-orange-300 dark:border-orange-800"
              />
              <Arrow />
              <FlowStep
                label="JWT Cookie"
                sub="HttpOnly"
                color="border-emerald-300 dark:border-emerald-800"
              />
            </div>
            <p className="text-xs text-muted-foreground pl-1">
              Fastify valida via <code className="bg-muted px-1 rounded">scrypt</code> (salt 16B,
              key 64B). Auth.js assina o JWT com{' '}
              <code className="bg-muted px-1 rounded">AUTH_SECRET</code> e seta{' '}
              <code className="bg-muted px-1 rounded">authjs.session-token</code> como HttpOnly.
              Tokens <strong>não aparecem no body</strong> da resposta.
            </p>
          </div>

          <Separator />

          {/* Request client */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Request autenticado (Client Component)
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <FlowStep
                label="Browser"
                sub="Cookie JWT"
                color="border-slate-300 dark:border-slate-700"
              />
              <Arrow />
              <FlowStep
                label="Middleware"
                sub="proxy.ts / auth()"
                color="border-violet-300 dark:border-violet-800"
              />
              <Arrow />
              <FlowStep
                label="/api/proxy"
                sub="Next.js Route"
                color="border-blue-300 dark:border-blue-800"
              />
              <Arrow />
              <FlowStep
                label="Fastify"
                sub="X-Internal-Token"
                color="border-green-300 dark:border-green-800"
              />
              <Arrow />
              <FlowStep
                label="PostgreSQL"
                sub="Prisma + tenantId"
                color="border-orange-300 dark:border-orange-800"
              />
            </div>
            <p className="text-xs text-muted-foreground pl-1">
              O middleware valida a <strong>assinatura</strong> do JWT (não apenas a presença do
              cookie). O proxy gera um{' '}
              <code className="bg-muted px-1 rounded">X-Internal-Token</code> HMAC de 30s, invisível
              ao browser. O Fastify rejeita qualquer request sem este token ou sem JWT legado
              válido.
            </p>
          </div>

          <Separator />

          {/* Revogação */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Anti-revogação de sessão
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <FlowStep
                label="JWT válido"
                sub="em cookie"
                color="border-slate-300 dark:border-slate-700"
              />
              <Arrow />
              <FlowStep
                label="jwt callback"
                sub="Auth.js"
                color="border-blue-300 dark:border-blue-800"
              />
              <Arrow />
              <FlowStep
                label="DB check"
                sub="a cada 5 min"
                color="border-amber-300 dark:border-amber-800"
              />
              <Arrow />
              <FlowStep
                label="status=ATIVO?"
                sub="PostgreSQL"
                color="border-orange-300 dark:border-orange-800"
              />
              <Arrow />
              <FlowStep
                label="Invalida"
                sub="ou continua"
                color="border-rose-300 dark:border-rose-800"
              />
            </div>
            <p className="text-xs text-muted-foreground pl-1">
              Contas desativadas são barradas em até 5 minutos, sem esperar os 7 dias do JWT
              expirar. Falha de banco não invalida a sessão (degradação graciosa).
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Gestão de Sessão */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Cookie className="h-4 w-4 text-muted-foreground" />
            Gestão de Sessão
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Estratégia JWT com cookie HttpOnly. Sem armazenamento de sessão em banco — stateless por
            design, com ponto de revogação ativo.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: 'Algoritmo', value: 'HMAC-SHA256 (AUTH_SECRET)', icon: '🔐' },
              { label: 'Duração', value: '7 dias — renovado 1×/dia', icon: '⏱' },
              { label: 'Cookie', value: 'HttpOnly + SameSite=Lax', icon: '🍪' },
              { label: 'Flag Secure', value: 'Via NEXTAUTH_COOKIE_SECURE', icon: '🔒' },
              { label: 'Revogação', value: 'DB check a cada 5 minutos', icon: '🚫' },
              { label: 'Logout', value: 'Cookie zerado + redirect /login', icon: '🚪' },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-start gap-3 rounded-lg bg-muted/30 px-3 py-2.5 border"
              >
                <span className="text-base mt-0.5">{item.icon}</span>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {item.label}
                  </p>
                  <p className="text-sm font-medium mt-0.5">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Controle de Acesso */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            Controle de Acesso — RBAC + Multi-tenancy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Três roles de sistema com isolamento completo por tenant em todas as camadas da
            aplicação.
          </p>

          {/* Roles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                role: 'GLOBAL_ADMIN',
                color: 'border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/20',
                badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
                desc: 'tenantId = null. Acessa todos os tenants. Bypassa filtros de tenant. Gerencia licenças.',
              },
              {
                role: 'TENANT_ADMIN',
                color: 'border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20',
                badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
                desc: 'Scoped ao seu tenant. Gerencia usuários, perfis e unidades da empresa.',
              },
              {
                role: 'USER',
                color: 'border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20',
                badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
                desc: 'Acesso operacional. Restrito às permissões definidas no perfil de acesso.',
              },
            ].map((r) => (
              <div key={r.role} className={`rounded-lg border-2 ${r.color} p-3 space-y-1.5`}>
                <span
                  className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full ${r.badge}`}
                >
                  {r.role}
                </span>
                <p className="text-xs text-muted-foreground">{r.desc}</p>
              </div>
            ))}
          </div>

          <Separator />

          {/* Verificações em cadeia */}
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Verificações em cadeia — cada request Fastify
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <FlowStep
              label="Request"
              sub="qualquer rota"
              color="border-slate-300 dark:border-slate-700"
            />
            <Arrow />
            <FlowStep
              label="createAuthenticate"
              sub="JWT ou X-Internal"
              color="border-blue-300 dark:border-blue-800"
            />
            <Arrow />
            <FlowStep
              label="requireRole"
              sub="ADMIN / USER"
              color="border-violet-300 dark:border-violet-800"
            />
            <Arrow />
            <FlowStep
              label="requireTenant"
              sub="tenantId no JWT"
              color="border-orange-300 dark:border-orange-800"
            />
            <Arrow />
            <FlowStep
              label="Service"
              sub="filtra por tenant"
              color="border-green-300 dark:border-green-800"
            />
          </div>

          <Separator />

          {/* Permissões granulares */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Permissões granulares
            </p>
            <p className="text-sm text-muted-foreground">
              Permissões são buscadas pós-login via{' '}
              <code className="bg-muted px-1 rounded text-xs">/api/user/permissions</code> e
              mantidas no contexto do cliente. Cada módulo, sub-módulo e campo pode ser configurado
              individualmente com ações{' '}
              <code className="bg-muted px-1 rounded text-xs">incluir</code>,{' '}
              <code className="bg-muted px-1 rounded text-xs">alterar</code>,{' '}
              <code className="bg-muted px-1 rounded text-xs">excluir</code> e{' '}
              <code className="bg-muted px-1 rounded text-xs">somenteLeitura</code>.
            </p>
            <div className="rounded-lg bg-muted/40 p-3 text-xs font-mono text-muted-foreground space-y-0.5">
              <p className="font-semibold text-foreground font-sans text-sm">
                Estrutura de permissão
              </p>
              <p>{'{ modulo, subModulo1, subModulo2, campo }'}</p>
              <p>{'  acao: "visible" | "invisible"'}</p>
              <p>{'  incluir: boolean, alterar: boolean'}</p>
              <p>{'  excluir: boolean, somenteLeitura: boolean'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Proteções Frontend / Backend em 2 colunas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Frontend */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe className="h-4 w-4 text-muted-foreground" />
              Proteções — Frontend
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <CheckRow
              label="Content-Security-Policy"
              desc="Bloqueia XSS inline em produção. unsafe-eval liberado somente em dev para hot-reload."
            />
            <CheckRow
              label="HSTS (Strict-Transport-Security)"
              desc="max-age=63072000, includeSubDomains, preload. Ativo somente em produção."
            />
            <CheckRow
              label="X-Frame-Options: SAMEORIGIN"
              desc="Protege contra clickjacking de domínios externos."
            />
            <CheckRow
              label="Middleware valida JWT"
              desc="proxy.ts usa auth() do Auth.js — rejeita cookies forjados ou expirados."
            />
            <CheckRow
              label="Open Redirect bloqueado"
              desc="sanitizeRedirect() valida que destino pós-login é path relativo à própria origem."
            />
            <CheckRow
              label="CSRF force-logout protegido"
              desc="/api/clear-session bloqueia Sec-Fetch-Site: cross-site."
            />
          </CardContent>
        </Card>

        {/* Backend */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Server className="h-4 w-4 text-muted-foreground" />
              Proteções — Backend
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <CheckRow
              label="Rate limit global 300 req/min"
              desc="Protege todos os 35+ endpoints contra flooding. Rotas de auth têm limites menores."
            />
            <CheckRow
              label="Rate limit por usuário (login)"
              desc="10 tentativas / 15 min por username. Bloqueia brute-force independente de IP."
            />
            <CheckRow
              label="CORS null-origin rejeitado"
              desc="Requests de iframes sandboxed ou file:// são bloqueados explicitamente."
            />
            <CheckRow
              label="Helmet (headers HTTP)"
              desc="CSP, HSTS, X-Content-Type-Options, Referrer-Policy ativos em produção."
            />
            <CheckRow
              label="X-Request-ID sanitizado"
              desc="Aceita apenas UUID v4. Evita log injection e header injection."
            />
            <CheckRow
              label="Swagger com Basic Auth"
              desc="SWAGGER_ENABLED=true exige credenciais via timingSafeEqual. Off em produção."
            />
          </CardContent>
        </Card>
      </div>

      {/* Criptografia */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileKey className="h-4 w-4 text-muted-foreground" />
            Criptografia e Segredos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left text-xs font-semibold text-muted-foreground pb-2 pr-4">
                    Uso
                  </th>
                  <th className="text-left text-xs font-semibold text-muted-foreground pb-2 pr-4">
                    Algoritmo
                  </th>
                  <th className="text-left text-xs font-semibold text-muted-foreground pb-2">
                    Parâmetros
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {[
                  {
                    uso: 'Hash de senhas',
                    algo: 'scrypt',
                    params: 'salt=16 B aleatório · keylen=64 B',
                  },
                  {
                    uso: 'Tokens Keycloak no banco',
                    algo: 'AES-256-GCM',
                    params: 'IV=12 B por operação · authTag=16 B',
                  },
                  {
                    uso: 'JWT legado (Fastify)',
                    algo: 'HMAC-SHA256',
                    params: 'timingSafeEqual na verificação',
                  },
                  {
                    uso: 'X-Internal-Token',
                    algo: 'HMAC-SHA256 (jose)',
                    params: 'TTL=30 s · iss/aud validados',
                  },
                  {
                    uso: 'Refresh token em banco',
                    algo: 'SHA-256',
                    params: 'Apenas o hash armazenado',
                  },
                  {
                    uso: 'Swagger Basic Auth',
                    algo: 'timingSafeEqual',
                    params: 'Buffer padded para evitar leak de comprimento',
                  },
                  {
                    uso: 'Cookie de sessão (Auth.js)',
                    algo: 'AES-CBC + HMAC-SHA256',
                    params: 'AUTH_SECRET ≥ 32 chars hex',
                  },
                ].map((row) => (
                  <tr key={row.uso} className="hover:bg-muted/30 transition-colors">
                    <td className="py-2 pr-4 font-medium text-sm">{row.uso}</td>
                    <td className="py-2 pr-4">
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{row.algo}</code>
                    </td>
                    <td className="py-2 text-xs text-muted-foreground">{row.params}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Variáveis de Ambiente críticas */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="h-4 w-4 text-muted-foreground" />
            Variáveis de Ambiente — Checklist de Produção
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Variáveis obrigatórias antes de qualquer deploy em produção. Gerar com{' '}
            <code className="bg-muted px-1 rounded text-xs">openssl rand -hex 32</code>.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              { name: 'AUTH_SECRET', hint: 'openssl rand -hex 32', critical: true },
              { name: 'JWT_ACCESS_SECRET', hint: '≥ 32 chars hex', critical: true },
              {
                name: 'JWT_REFRESH_SECRET',
                hint: '≥ 32 chars hex — diferente do access',
                critical: true,
              },
              { name: 'INTERNAL_SERVICE_SECRET', hint: 'openssl rand -hex 32', critical: true },
              { name: 'DATABASE_URL', hint: 'Usar usuário com permissões mínimas', critical: true },
              {
                name: 'SESSION_SECRET',
                hint: 'openssl rand -hex 32 (apenas Keycloak)',
                critical: false,
              },
              {
                name: 'NEXTAUTH_COOKIE_SECURE',
                hint: 'true em produção com HTTPS',
                critical: false,
              },
              { name: 'AUTH_URL', hint: 'URL pública do Next.js (https://)', critical: true },
              { name: 'CORS_ORIGIN', hint: 'URL exata do frontend — sem wildcard', critical: true },
              { name: 'HOST', hint: '127.0.0.1 em produção (default)', critical: false },
            ].map((item) => (
              <div
                key={item.name}
                className="flex items-start gap-2 rounded-lg border bg-muted/20 px-3 py-2"
              >
                <div
                  className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${item.critical ? 'bg-rose-500' : 'bg-amber-400'}`}
                />
                <div>
                  <code className="text-xs font-bold">{item.name}</code>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.hint}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 pt-1">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-rose-500" />
              <span className="text-xs text-muted-foreground">Obrigatória</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-xs text-muted-foreground">Recomendada</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
