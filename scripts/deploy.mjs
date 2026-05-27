/**
 * deploy.mjs — Pipeline de deploy para o servidor de produção Kreato
 *
 * O que faz:
 *   1. Lê metadados locais (versão, commit hash, data)
 *   2. SSH no servidor remoto
 *   3. git pull origin main
 *   4. Atualiza NEXT_PUBLIC_APP_* no .env do servidor
 *   5. npm ci + npm run build (frontend)
 *   6. npm ci + npm run build (backend)
 *   7. pm2 restart all
 *
 * Credenciais: lidas de .deploy.env (nunca commitar este arquivo)
 * Formato do .deploy.env:
 *   DEPLOY_HOST=45.147.251.171
 *   DEPLOY_USER=root
 *   DEPLOY_PASSWORD=sua_senha_aqui
 *   DEPLOY_APP_DIR=/opt/kreato
 */

import { Client } from 'ssh2';
import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ─── Carrega credenciais de .deploy.env ──────────────────────────────────────

function loadDeployEnv() {
  const envFile = resolve(ROOT, '.deploy.env');
  if (!existsSync(envFile)) {
    console.error('\n❌  Arquivo .deploy.env não encontrado.');
    console.error('   Crie o arquivo com o conteúdo abaixo e tente novamente:\n');
    console.error('   DEPLOY_HOST=45.147.251.171');
    console.error('   DEPLOY_USER=root');
    console.error('   DEPLOY_PASSWORD=sua_senha');
    console.error('   DEPLOY_APP_DIR=/opt/kreato\n');
    process.exit(1);
  }

  const lines = readFileSync(envFile, 'utf-8').split('\n');
  const env = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }
  return env;
}

const deployEnv = loadDeployEnv();
const HOST     = deployEnv.DEPLOY_HOST     || '45.147.251.171';
const USER     = deployEnv.DEPLOY_USER     || 'root';
const PASSWORD = deployEnv.DEPLOY_PASSWORD || '';
const APP_DIR  = deployEnv.DEPLOY_APP_DIR  || '/opt/kreato';

if (!PASSWORD) {
  console.error('\n❌  DEPLOY_PASSWORD não definido em .deploy.env\n');
  process.exit(1);
}

// ─── Metadados locais ─────────────────────────────────────────────────────────

const gitHash = execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim();
const now = new Date();
const day   = String(now.getDate()).padStart(2, '0');
const month = String(now.getMonth() + 1).padStart(2, '0');
const year  = now.getFullYear();
const publishedAt = `${day}/${month}/${year}`;

const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf-8'));
const version = pkg.version && pkg.version !== '0.0.0' ? pkg.version : '0.1.0';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function runCommand(conn, cmd, { ignoreError = false, label } = {}) {
  return new Promise((res, rej) => {
    if (label) {
      console.log(`\n${'─'.repeat(60)}`);
      console.log(`► ${label}`);
      console.log('─'.repeat(60));
    }
    let out = '';
    let err = '';
    conn.exec(cmd, (execErr, stream) => {
      if (execErr) return rej(execErr);
      stream.on('data',        (d) => { out += d; process.stdout.write(d.toString()); });
      stream.stderr.on('data', (d) => { err += d; process.stderr.write(d.toString()); });
      stream.on('close', (code) => {
        if (code !== 0 && !ignoreError) rej(new Error(`Saiu com código ${code}: ${err || out}`));
        else res(out.trim());
      });
    });
  });
}

// ─── Deploy ───────────────────────────────────────────────────────────────────

async function deploy() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log(  '║           🚀  KREATO — PIPELINE DE DEPLOY               ║');
  console.log(  '╚══════════════════════════════════════════════════════════╝');
  console.log(`\n  Servidor : ${HOST}`);
  console.log(`  Diretório: ${APP_DIR}`);
  console.log(`  Versão   : ${version}`);
  console.log(`  Release  : ${gitHash}`);
  console.log(`  Publicado: ${publishedAt}`);

  // Conecta SSH
  const conn = new Client();
  await new Promise((res, rej) => {
    conn.on('ready', res).on('error', rej).connect({
      host: HOST,
      port: 22,
      username: USER,
      password: PASSWORD,
      readyTimeout: 30_000,
    });
  });
  console.log('\n✅  SSH conectado!');

  try {
    // 1. Git pull
    await runCommand(conn,
      `cd ${APP_DIR} && git pull origin main`,
      { label: '1/5 — Git pull' }
    );

    // 2. Atualiza metadados no .env do servidor
    //    Se a chave existe → sed substitui; senão → append
    const setEnvLine = (key, val) =>
      `grep -q "^${key}=" ${APP_DIR}/.env 2>/dev/null ` +
      `&& sed -i "s|^${key}=.*|${key}=${val}|" ${APP_DIR}/.env ` +
      `|| echo "${key}=${val}" >> ${APP_DIR}/.env`;

    const envCmd = [
      setEnvLine('NEXT_PUBLIC_APP_VERSION',      version),
      setEnvLine('NEXT_PUBLIC_APP_RELEASE',      gitHash),
      setEnvLine('NEXT_PUBLIC_APP_PUBLISHED_AT', publishedAt),
    ].join(' && ');

    await runCommand(conn, envCmd, { label: '2/5 — Atualiza metadados no .env' });

    // 3. Dependências + build do frontend
    await runCommand(conn,
      `cd ${APP_DIR} && npm ci --prefer-offline`,
      { label: '3/5 — npm ci (frontend)' }
    );
    await runCommand(conn,
      `cd ${APP_DIR} && npm run build`,
      { label: '3/5 — npm run build (frontend)' }
    );

    // 4. Dependências + build do backend
    await runCommand(conn,
      `cd ${APP_DIR}/backend && npm ci --prefer-offline`,
      { label: '4/5 — npm ci (backend)' }
    );
    await runCommand(conn,
      `cd ${APP_DIR}/backend && npm run build`,
      { label: '4/5 — npm run build (backend)' }
    );

    // 5. Reinicia PM2
    await runCommand(conn,
      `pm2 restart all && pm2 save`,
      { label: '5/5 — Restart PM2', ignoreError: true }
    );

    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log(  '║  ✅  Deploy concluído com sucesso!                       ║');
    console.log(`║     Versão ${version} · ${gitHash} · ${publishedAt}`.padEnd(61) + '║');
    console.log(  '╚══════════════════════════════════════════════════════════╝\n');
  } finally {
    conn.end();
  }
}

deploy().catch((err) => {
  console.error('\n❌  Falha no deploy:', err.message);
  process.exit(1);
});
