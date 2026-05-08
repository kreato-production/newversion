#!/usr/bin/env node
/**
 * Kreato Production — Instalador principal (cross-platform)
 * Node.js 18+ required. Executar a partir da raiz do projeto.
 */
import { createInterface } from 'node:readline/promises';
import { randomBytes } from 'node:crypto';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { platform } from 'node:os';

// ─── Paths ────────────────────────────────────────────────────────────────────

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const IS_WIN = platform() === 'win32';
const NPM = IS_WIN ? 'npm.cmd' : 'npm';
const NPX = IS_WIN ? 'npx.cmd' : 'npx';

// ─── Terminal ─────────────────────────────────────────────────────────────────

const USE_COLOR = process.stdout.isTTY !== false;
const C = {
  reset:  USE_COLOR ? '\x1b[0m'  : '',
  bold:   USE_COLOR ? '\x1b[1m'  : '',
  cyan:   USE_COLOR ? '\x1b[36m' : '',
  green:  USE_COLOR ? '\x1b[32m' : '',
  yellow: USE_COLOR ? '\x1b[33m' : '',
  red:    USE_COLOR ? '\x1b[31m' : '',
  blue:   USE_COLOR ? '\x1b[34m' : '',
};
const c = (k, t) => `${C[k]}${t}${C.reset}`;

function step(msg)  { console.log(`\n${c('cyan', '▶')} ${c('bold', msg)}`); }
function ok(msg)    { console.log(`  ${c('green',  '✓')} ${msg}`); }
function info(msg)  { console.log(`  ${c('blue',   '→')} ${msg}`); }
function warn(msg)  { console.log(`  ${c('yellow', '⚠')} ${msg}`); }
function fail(msg)  { console.error(`\n  ${c('red', '✗ ERRO:')} ${msg}\n`); process.exit(1); }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function run(cmd, opts = {}) {
  execSync(cmd, { cwd: ROOT, stdio: 'inherit', ...opts });
}

function tryRun(cmd, opts = {}) {
  try { execSync(cmd, { cwd: ROOT, stdio: 'ignore', ...opts }); return true; }
  catch { return false; }
}

function secret(bytes) {
  return randomBytes(bytes).toString('hex');
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const rl = createInterface({ input: process.stdin, output: process.stdout });

async function ask(prompt, defaultVal = '') {
  const hint = defaultVal ? c('yellow', ` [${defaultVal}]`) : '';
  const ans = await rl.question(`  ${prompt}${hint}: `);
  return ans.trim() || defaultVal;
}

async function askHidden(prompt) {
  process.stdout.write(`  ${prompt}: `);
  const ans = await new Promise((resolve) => {
    let input = '';
    process.stdin.setRawMode?.(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    const onData = (ch) => {
      if (ch === '\n' || ch === '\r' || ch === '') {
        process.stdin.setRawMode?.(false);
        process.stdin.pause();
        process.stdin.removeListener('data', onData);
        process.stdout.write('\n');
        resolve(input);
      } else if (ch === '') {
        process.stdout.write('\n');
        process.exit();
      } else if (ch === '') {
        input = input.slice(0, -1);
      } else {
        input += ch;
        process.stdout.write('*');
      }
    };
    process.stdin.on('data', onData);
  });
  return ans.trim();
}

async function main() {
  // ── Banner ──────────────────────────────────────────────────────────────────
  console.log();
  console.log(c('cyan', '╔══════════════════════════════════════════════╗'));
  console.log(c('cyan', '║') + c('bold', '       KREATO PRODUCTION — INSTALADOR         ') + c('cyan', '║'));
  console.log(c('cyan', '╚══════════════════════════════════════════════╝'));
  console.log();

  // ── 1. Pré-requisitos ───────────────────────────────────────────────────────
  step('Verificando pré-requisitos...');
  const nodeVer = parseInt(process.versions.node.split('.')[0], 10);
  if (nodeVer < 18) fail(`Node.js ${process.versions.node} encontrado. É necessário Node.js 18+.\nDescarregue em https://nodejs.org`);
  ok(`Node.js ${process.versions.node}`);
  if (!tryRun(`${NPM} --version`)) fail('npm não encontrado. Instale Node.js com npm.');
  ok(`npm disponível`);

  // ── 2. Modo de instalação ───────────────────────────────────────────────────
  step('Modo de instalação');
  const modeInput = await ask('Modo  p=produção  d=desenvolvimento', 'p');
  const isProd = modeInput.toLowerCase() !== 'd';
  ok(isProd ? 'Produção (build + pm2)' : 'Desenvolvimento (dev servers)');

  // ── 3. Banco de dados ───────────────────────────────────────────────────────
  step('Configuração do banco de dados PostgreSQL');
  info('A instância PostgreSQL deve estar em execução e o banco deve existir ou ser criável.');
  const dbHost = await ask('Host',           'localhost');
  const dbPort = await ask('Porta',          '5432');
  const dbName = await ask('Nome do banco',  'kreato');
  const dbUser = await ask('Usuário',        'postgres');
  let dbPass;
  try {
    dbPass = await askHidden('Senha');
  } catch {
    dbPass = await ask('Senha (visível — terminal não suporta modo oculto)');
  }
  const dbUrl = `postgresql://${encodeURIComponent(dbUser)}:${encodeURIComponent(dbPass)}@${dbHost}:${dbPort}/${dbName}?schema=public`;
  ok(`Banco configurado: ${dbHost}:${dbPort}/${dbName}`);

  // ── 4. Portas e URLs ────────────────────────────────────────────────────────
  step('Configuração de portas e URLs');
  const frontendPort = await ask('Porta do frontend', '3000');
  const backendPort  = await ask('Porta do backend',  '3333');
  const frontendUrl  = await ask('URL pública do frontend', `http://localhost:${frontendPort}`);
  const backendUrl   = await ask('URL pública do backend',  `http://localhost:${backendPort}`);

  // ── 5. Secrets ──────────────────────────────────────────────────────────────
  step('Gerando credenciais de segurança...');
  const jwtAccess      = secret(48); // 96 hex chars
  const jwtRefresh     = secret(48); // 96 hex chars
  const authSecret     = secret(32); // 64 hex chars (Auth.js)
  const internalSecret = secret(32); // 64 hex chars (Next.js ↔ Fastify)
  const sessionSecret  = secret(32); // 64 hex chars (satisfaz regex /^[0-9a-fA-F]{64}$/)
  ok('Secrets gerados');

  // ── 6. backend/.env ─────────────────────────────────────────────────────────
  step('Criando backend/.env...');
  const backendEnv = `# Gerado pelo instalador Kreato em ${new Date().toISOString()}
NODE_ENV=${isProd ? 'production' : 'development'}
PORT=${backendPort}
HOST=0.0.0.0
SERVICE_NAME=kreato-backend
APP_VERSION=1.0.0

DATABASE_URL=${dbUrl}

CORS_ORIGIN=${frontendUrl}
LOG_LEVEL=info

JWT_ACCESS_SECRET=${jwtAccess}
JWT_REFRESH_SECRET=${jwtRefresh}
JWT_ACCESS_TTL_SECONDS=900
JWT_REFRESH_TTL_SECONDS=604800

KEYCLOAK_AUTH_ENABLED=false
LEGACY_AUTH_ENABLED=true

BACKEND_PUBLIC_URL=${backendUrl}
INTERNAL_SERVICE_SECRET=${internalSecret}

SESSION_SECRET=${sessionSecret}
SESSION_TTL_SECONDS=604800
SESSION_COOKIE_NAME=kreato_session
`;
  writeFileSync(join(ROOT, 'backend', '.env'), backendEnv, 'utf8');
  ok('backend/.env criado');

  // ── 7. .env.local ───────────────────────────────────────────────────────────
  step('Criando .env.local...');
  const frontendEnv = `# Gerado pelo instalador Kreato em ${new Date().toISOString()}
NEXT_PUBLIC_BACKEND_API_URL=${backendUrl}
NEXT_PUBLIC_AUTH_PROVIDER=backend
NEXT_PUBLIC_KEYCLOAK_AUTH_ENABLED=false

DATABASE_URL=${dbUrl}

AUTH_SECRET=${authSecret}
NEXTAUTH_URL=${frontendUrl}

INTERNAL_SERVICE_SECRET=${internalSecret}
INTERNAL_FASTIFY_URL=http://localhost:${backendPort}
`;
  writeFileSync(join(ROOT, '.env.local'), frontendEnv, 'utf8');
  ok('.env.local criado');

  // ── 8. Instalar dependências ────────────────────────────────────────────────
  step('Instalando dependências...');
  info('Frontend (pode demorar alguns minutos)...');
  run(`${NPM} install`);
  info('Backend...');
  run(`${NPM} install --prefix backend`);
  ok('Dependências instaladas');

  // ── 9. Prisma ───────────────────────────────────────────────────────────────
  step('Configurando banco de dados (Prisma)...');
  info('Gerando Prisma Client...');
  run(`${NPM} run backend:prisma:generate`);
  info('Aplicando schema ao banco de dados...');
  run(`${NPX} prisma db push --schema backend/prisma/schema.prisma`, {
    env: { ...process.env, DATABASE_URL: dbUrl },
  });
  ok('Schema aplicado');

  // ── 10. Seed admin ──────────────────────────────────────────────────────────
  step('Criando utilizador administrador global...');
  execSync(`node scripts/seed-installer.mjs`, {
    cwd: join(ROOT, 'backend'),
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: dbUrl, ADMIN_USER: 'Admin_Global', ADMIN_PASSWORD: 'Admin@123' },
  });
  ok('Admin_Global / Admin@123');

  // ── 11. Build produção ──────────────────────────────────────────────────────
  if (isProd) {
    step('Compilando aplicação para produção...');
    info('Backend...');
    run(`${NPM} run backend:build`);
    info('Frontend (pode demorar)...');
    run(`${NPM} run build`);
    ok('Build concluído');

    // ── 12. ecosystem.config.cjs ─────────────────────────────────────────────
    step('Gerando configuração pm2...');
    const ecosystem = `// Gerado pelo instalador Kreato — NÃO editar manualmente
module.exports = {
  apps: [
    {
      name: 'kreato-backend',
      script: './backend/dist/server.js',
      cwd: __dirname,
      env: { NODE_ENV: 'production' },
      watch: false,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      out_file: './.logs/backend.out.log',
      error_file: './.logs/backend.err.log',
    },
    {
      name: 'kreato-frontend',
      script: 'node',
      args: '--max-http-header-size=65536 node_modules/next/dist/bin/next start --port ${frontendPort}',
      cwd: __dirname,
      env: { NODE_ENV: 'production', PORT: '${frontendPort}' },
      watch: false,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      out_file: './.logs/frontend.out.log',
      error_file: './.logs/frontend.err.log',
    },
  ],
};
`;
    writeFileSync(join(ROOT, 'ecosystem.config.cjs'), ecosystem, 'utf8');
    mkdirSync(join(ROOT, '.logs'), { recursive: true });
    ok('ecosystem.config.cjs criado');

    // ── 13. pm2 ──────────────────────────────────────────────────────────────
    step('Configurando pm2...');
    if (!tryRun('pm2 --version')) {
      info('Instalando pm2 globalmente...');
      run(`${NPM} install -g pm2`);
    }
    ok('pm2 disponível');

    step('Iniciando serviços...');
    tryRun('pm2 delete kreato-backend kreato-frontend');
    run('pm2 start ecosystem.config.cjs');
    run('pm2 save');
    ok('Serviços iniciados com pm2');

    // ── 14. Configurar auto-start no boot ─────────────────────────────────
    if (!IS_WIN) {
      info('Para iniciar automaticamente no boot, execute:');
      info(c('cyan', '  pm2 startup') + ' (siga as instruções) → depois: ' + c('cyan', 'pm2 save'));
    } else {
      info('Para iniciar automaticamente no boot (Windows):');
      info(c('cyan', '  pm2-startup install') + ' (instalar pm2-startup) ou usar Task Scheduler');
    }
  }

  // ── 15. Scripts de gestão de serviços ──────────────────────────────────────
  step('Gerando scripts de gestão de serviços...');
  mkdirSync(join(ROOT, '.logs'), { recursive: true });

  // start.sh
  writeFileSync(join(ROOT, 'start.sh'), `#!/usr/bin/env bash
# Kreato Production — Iniciar serviços
ROOT="$(cd "$(dirname "$0")" && pwd)"
if [ -f "$ROOT/ecosystem.config.cjs" ]; then
  pm2 start "$ROOT/ecosystem.config.cjs" --update-env
  echo "Serviços iniciados. Acesse: ${frontendUrl}"
else
  mkdir -p "$ROOT/.logs"
  npm --prefix "$ROOT" run backend:dev > "$ROOT/.logs/backend.out.log" 2>&1 &
  npm --prefix "$ROOT" run dev > "$ROOT/.logs/frontend.out.log" 2>&1 &
  echo "Modo desenvolvimento iniciado. Logs em .logs/"
  echo "Frontend: ${frontendUrl} | Backend: ${backendUrl}"
fi
`, 'utf8');

  // stop.sh
  writeFileSync(join(ROOT, 'stop.sh'), `#!/usr/bin/env bash
# Kreato Production — Parar serviços
if command -v pm2 &>/dev/null; then
  pm2 stop kreato-backend kreato-frontend 2>/dev/null || pm2 stop all
else
  pkill -f "backend/dist/server.js" 2>/dev/null || true
  pkill -f "next start" 2>/dev/null || true
  pkill -f "next dev" 2>/dev/null || true
  echo "Processos terminados"
fi
`, 'utf8');

  // start.bat
  writeFileSync(join(ROOT, 'start.bat'), `@echo off
REM Kreato Production — Iniciar servicos
if exist ecosystem.config.cjs (
  pm2 start ecosystem.config.cjs --update-env
  echo Servicos iniciados. Acesse: ${frontendUrl}
) else (
  if not exist .logs mkdir .logs
  start /B npm run backend:dev > .logs\\backend.out.log 2>&1
  start /B npm run dev > .logs\\frontend.out.log 2>&1
  echo Modo desenvolvimento iniciado. Logs em .logs\\
)
`, 'utf8');

  // stop.bat
  writeFileSync(join(ROOT, 'stop.bat'), `@echo off
REM Kreato Production — Parar servicos
pm2 stop kreato-backend kreato-frontend 2>nul
if errorlevel 1 (
  taskkill /F /IM node.exe /T 2>nul
  echo Processos node terminados
) else (
  echo Servicos parados
)
`, 'utf8');

  // start.ps1
  writeFileSync(join(ROOT, 'start.ps1'), `# Kreato Production - Iniciar servicos (PowerShell)
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
if (Test-Path "$Root\\ecosystem.config.cjs") {
    pm2 start "$Root\\ecosystem.config.cjs" --update-env
    Write-Host "Servicos iniciados. Acesse: ${frontendUrl}" -ForegroundColor Green
} else {
    if (-not (Test-Path "$Root\\.logs")) { New-Item -ItemType Directory "$Root\\.logs" | Out-Null }
    Start-Process -FilePath "npm" -ArgumentList "run backend:dev" -WorkingDirectory $Root -RedirectStandardOutput "$Root\\.logs\\backend.out.log" -NoNewWindow
    Start-Process -FilePath "npm" -ArgumentList "run dev" -WorkingDirectory $Root -RedirectStandardOutput "$Root\\.logs\\frontend.out.log" -NoNewWindow
    Write-Host "Modo desenvolvimento iniciado. Logs em .logs\\" -ForegroundColor Green
}
`, 'utf8');

  // stop.ps1
  writeFileSync(join(ROOT, 'stop.ps1'), `# Kreato Production - Parar servicos (PowerShell)
try {
    pm2 stop kreato-backend kreato-frontend 2>$null
    Write-Host "Servicos parados" -ForegroundColor Green
} catch {
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
    Write-Host "Processos node terminados" -ForegroundColor Yellow
}
`, 'utf8');

  ok('Scripts criados: start.sh, stop.sh, start.bat, stop.bat, start.ps1, stop.ps1');

  rl.close();

  // ── Resumo ──────────────────────────────────────────────────────────────────
  console.log();
  console.log(c('green', '╔══════════════════════════════════════════════╗'));
  console.log(c('green', '║') + c('bold', '        INSTALAÇÃO CONCLUÍDA COM SUCESSO!      ') + c('green', '║'));
  console.log(c('green', '╚══════════════════════════════════════════════╝'));
  console.log();
  console.log(`  ${c('green',  'Frontend :')} ${c('cyan', frontendUrl)}`);
  console.log(`  ${c('green',  'Backend  :')} ${c('cyan', backendUrl)}`);
  console.log(`  ${c('green',  'Login    :')} ${c('bold', 'Admin_Global')} / ${c('bold', 'Admin@123')}`);
  console.log();
  if (isProd) {
    console.log(`  ${c('yellow', 'Gestão de serviços (pm2):')}`);
    console.log(`    ${c('cyan', 'pm2 status')}        — estado dos serviços`);
    console.log(`    ${c('cyan', 'pm2 logs')}          — logs em tempo real`);
    console.log(`    ${c('cyan', 'pm2 restart all')}   — reiniciar`);
    console.log(`    ${c('cyan', 'pm2 stop all')}      — parar`);
    console.log();
    console.log(`  ${c('yellow', 'Ou use os scripts:')}`);
    console.log(`    Linux/macOS: ${c('cyan', 'bash start.sh')} / ${c('cyan', 'bash stop.sh')}`);
    console.log(`    Windows:     ${c('cyan', 'start.bat')} / ${c('cyan', 'stop.bat')}`);
  } else {
    console.log(`  ${c('yellow', 'Iniciar em modo desenvolvimento:')}`);
    console.log(`    Linux/macOS: ${c('cyan', 'bash start.sh')}`);
    console.log(`    Windows:     ${c('cyan', 'start.bat')} ou ${c('cyan', 'powershell .\\start.ps1')}`);
  }
  console.log();
}

main().catch((err) => {
  console.error(c('red', `\nErro fatal: ${err.message}`));
  if (err.stack) console.error(err.stack);
  rl.close();
  process.exit(1);
});
