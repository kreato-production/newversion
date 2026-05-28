import { Client } from 'ssh2';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const envFile = resolve(ROOT, '.deploy.env');
const lines = readFileSync(envFile, 'utf-8').split('\n');
const env = {};
for (const line of lines) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const idx = t.indexOf('=');
  if (idx === -1) continue;
  env[t.slice(0, idx).trim()] = t.slice(idx + 1).trim();
}

const HOST = env.DEPLOY_HOST;
const USER = env.DEPLOY_USER;
const PASSWORD = env.DEPLOY_PASSWORD;
const APP_DIR = env.DEPLOY_APP_DIR || '/opt/kreato';

function run(conn, cmd, { ignoreError = false } = {}) {
  return new Promise((res, rej) => {
    let out = '';
    let err = '';
    conn.exec(cmd, (e, stream) => {
      if (e) return rej(e);
      stream.on('data', (d) => { out += d; process.stdout.write(d.toString()); });
      stream.stderr.on('data', (d) => { err += d; process.stderr.write(d.toString()); });
      stream.on('close', (code) => {
        if (code !== 0 && !ignoreError) rej(new Error(`Exit ${code}`));
        else res(out.trim());
      });
    });
  });
}

async function diagnose() {
  const conn = new Client();
  await new Promise((res, rej) => {
    conn.on('ready', res).on('error', rej).connect({ host: HOST, port: 22, username: USER, password: PASSWORD, readyTimeout: 30000 });
  });
  console.log('✅ SSH conectado\n');

  console.log('═'.repeat(60));
  console.log('🌐 Portas abertas (80, 443, 3000, 3333)');
  console.log('═'.repeat(60));
  await run(conn, 'ss -tlnp | grep -E ":80|:443|:3000|:3333" 2>&1 || netstat -tlnp | grep -E ":80|:443|:3000|:3333" 2>&1', { ignoreError: true });

  console.log('\n' + '═'.repeat(60));
  console.log('🔧 Nginx — está rodando?');
  console.log('═'.repeat(60));
  await run(conn, 'systemctl status nginx 2>&1 | head -20', { ignoreError: true });

  console.log('\n' + '═'.repeat(60));
  console.log('📄 Nginx — configuração de sites habilitados');
  console.log('═'.repeat(60));
  await run(conn, 'ls /etc/nginx/sites-enabled/ 2>/dev/null && cat /etc/nginx/sites-enabled/* 2>/dev/null || echo "Nenhum site nginx encontrado"', { ignoreError: true });

  console.log('\n' + '═'.repeat(60));
  console.log('🔐 SSL/HTTPS — certificados Let\'s Encrypt');
  console.log('═'.repeat(60));
  await run(conn, 'ls /etc/letsencrypt/live/ 2>/dev/null || echo "Nenhum certificado Let\'s Encrypt"', { ignoreError: true });

  console.log('\n' + '═'.repeat(60));
  console.log('⚙️  Configuração PM2 — como o frontend está configurado');
  console.log('═'.repeat(60));
  await run(conn, 'pm2 show kreato-frontend 2>&1 | grep -E "script|cwd|env|NODE_ENV" | head -20', { ignoreError: true });

  console.log('\n' + '═'.repeat(60));
  console.log('🍪 Teste: GET da raiz do Next.js — verifica cookie no Set-Cookie');
  console.log('═'.repeat(60));
  // Testa o login via Next.js (na porta onde roda o frontend Next.js)
  await run(conn, 'ss -tlnp | grep node 2>&1 | head -10', { ignoreError: true });

  console.log('\n' + '═'.repeat(60));
  console.log('📦 .env.production — variáveis não-secretas');
  console.log('═'.repeat(60));
  await run(conn, `cat ${APP_DIR}/.env.production 2>/dev/null | grep -v SECRET | grep -v PASSWORD | grep -v DATABASE_URL`, { ignoreError: true });

  conn.end();
}

diagnose().catch((err) => {
  console.error('❌ Falha:', err.message);
  process.exit(1);
});
