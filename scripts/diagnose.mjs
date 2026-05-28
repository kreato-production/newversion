import { Client } from 'ssh2';
import { readFileSync, existsSync } from 'fs';
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
  console.log('📋 PM2 — processos em execução');
  console.log('═'.repeat(60));
  await run(conn, 'pm2 list', { ignoreError: true });

  console.log('\n' + '═'.repeat(60));
  console.log('🔍 Usuário admin_global no banco');
  console.log('═'.repeat(60));
  await run(conn, `sudo -u postgres psql -d kreato_db -c "SELECT id, usuario, role, status, \\"tenantId\\" FROM public.\\"User\\" WHERE usuario = 'admin_global';" 2>&1`, { ignoreError: true });

  console.log('\n' + '═'.repeat(60));
  console.log('🔑 Teste de login via API (admin_global / Admin@123)');
  console.log('═'.repeat(60));
  const loginOut = await run(conn, `curl -s -X POST http://localhost:3333/auth/login -H "Content-Type: application/json" -d '{"usuario":"admin_global","password":"Admin@123"}'`, { ignoreError: true });

  // Extrai o accessToken do output
  let accessToken = '';
  try {
    const parsed = JSON.parse(loginOut);
    accessToken = parsed.accessToken ?? '';
    console.log('\n✅ Login OK — role:', parsed.user?.role ?? '?');
    console.log('   enabledModules:', JSON.stringify(parsed.user?.enabledModules ?? []));
  } catch {
    console.log('\n❌ Falha ao parsear resposta de login');
  }

  if (accessToken) {
    console.log('\n' + '═'.repeat(60));
    console.log('🔒 GET /auth/permissions (Bearer token direto)');
    console.log('═'.repeat(60));
    await run(conn, `curl -s http://localhost:3333/auth/permissions -H "Authorization: Bearer ${accessToken}"`, { ignoreError: true });

    console.log('\n' + '═'.repeat(60));
    console.log('🏢 GET /tenants (Bearer token direto)');
    console.log('═'.repeat(60));
    await run(conn, `curl -s http://localhost:3333/tenants -H "Authorization: Bearer ${accessToken}"`, { ignoreError: true });

    console.log('\n' + '═'.repeat(60));
    console.log('➕ POST /tenants — cria tenant de teste (Bearer direto)');
    console.log('═'.repeat(60));
    const createOut = await run(conn, `curl -s -X POST http://localhost:3333/tenants -H "Authorization: Bearer ${accessToken}" -H "Content-Type: application/json" -d '{"nome":"Tenant Diagnostico","plano":"Mensal","status":"Ativo","notas":"criado pelo diagnose"}'`, { ignoreError: true });
    let createdId = '';
    try {
      const created = JSON.parse(createOut);
      createdId = created.id ?? '';
    } catch {}

    if (createdId) {
      console.log('\n' + '═'.repeat(60));
      console.log('🗑️  DELETE /tenants/:id — exclui tenant de teste');
      console.log('═'.repeat(60));
      await run(conn, `curl -s -o /dev/null -w "%{http_code}" -X DELETE http://localhost:3333/tenants/${createdId} -H "Authorization: Bearer ${accessToken}"`, { ignoreError: true });
      console.log(' (esperado: 204)');
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log('📄 Últimas 20 linhas de log do backend (PM2)');
  console.log('═'.repeat(60));
  await run(conn, 'pm2 logs kreato-backend --nostream --lines 20 2>&1', { ignoreError: true });

  console.log('\n' + '═'.repeat(60));
  console.log('📄 Últimas 20 linhas de log do frontend (PM2)');
  console.log('═'.repeat(60));
  await run(conn, 'pm2 logs kreato-frontend --nostream --lines 20 2>&1', { ignoreError: true });

  console.log('\n' + '═'.repeat(60));
  console.log('🌐 Variáveis de ambiente relevantes no servidor');
  console.log('═'.repeat(60));
  await run(conn, `grep -E "NEXT_PUBLIC|INTERNAL_FASTIFY|DATABASE|AUTH_URL|INTERNAL_SERVICE" ${APP_DIR}/.env ${APP_DIR}/.env.production 2>/dev/null | grep -v PASSWORD | grep -v SECRET | grep -v AUTH_SECRET | grep -v NEXTAUTH_SECRET`, { ignoreError: true });

  conn.end();
}

diagnose().catch((err) => {
  console.error('❌ Falha:', err.message);
  process.exit(1);
});
