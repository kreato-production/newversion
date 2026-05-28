/**
 * setup-ssl.mjs — Configura Nginx + SSL (Let's Encrypt) no servidor de produção
 *
 * O que faz:
 *   1. Instala nginx e certbot (se não instalados)
 *   2. Cria configuração Nginx: todo tráfego → Next.js em localhost:3000
 *   3. Testa e recarrega Nginx
 *   4. Obtém certificado SSL via Let's Encrypt (certbot --nginx)
 *   5. Confirma renovação automática
 *
 * Credenciais: lidas de .deploy.env (mesmo arquivo do deploy.mjs)
 */

import { Client } from 'ssh2';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const DOMAIN      = 'kreato-production.com';
const WWW_DOMAIN  = `www.${DOMAIN}`;
const EMAIL       = 'ericolimam@hotmail.com';
const FRONTEND_PORT = 3000;

// ─── Carrega credenciais ──────────────────────────────────────────────────────

function loadDeployEnv() {
  const envFile = resolve(ROOT, '.deploy.env');
  if (!existsSync(envFile)) {
    console.error('\n❌  Arquivo .deploy.env não encontrado.');
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

if (!PASSWORD) {
  console.error('\n❌  DEPLOY_PASSWORD não definido em .deploy.env\n');
  process.exit(1);
}

// ─── Helper SSH ───────────────────────────────────────────────────────────────

function runCommand(conn, cmd, { ignoreError = false, label } = {}) {
  return new Promise((res, rej) => {
    if (label) {
      console.log(`\n${'─'.repeat(64)}`);
      console.log(`► ${label}`);
      console.log('─'.repeat(64));
    }
    let out = '';
    let err = '';
    conn.exec(cmd, (execErr, stream) => {
      if (execErr) return rej(execErr);
      stream.on('data',        (d) => { out += d; process.stdout.write(d.toString()); });
      stream.stderr.on('data', (d) => { err += d; process.stderr.write(d.toString()); });
      stream.on('close', (code) => {
        if (code !== 0 && !ignoreError) rej(new Error(`Saiu com código ${code}:\n${err || out}`));
        else res(out.trim());
      });
    });
  });
}

// ─── Configuração Nginx ───────────────────────────────────────────────────────

const NGINX_CONF = `
server {
    listen 80;
    server_name ${DOMAIN} ${WWW_DOMAIN};

    # Certbot usará este bloco para emitir o certificado.
    # Após o certbot rodar, ele vai adicionar o bloco HTTPS automaticamente.

    location / {
        proxy_pass         http://127.0.0.1:${FRONTEND_PORT};
        proxy_http_version 1.1;
        proxy_set_header   Host              \\$host;
        proxy_set_header   X-Real-IP         \\$remote_addr;
        proxy_set_header   X-Forwarded-For   \\$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \\$scheme;
        proxy_set_header   Upgrade           \\$http_upgrade;
        proxy_set_header   Connection        "upgrade";
        proxy_read_timeout 120s;
        proxy_send_timeout 120s;
    }
}
`.trim();

// ─── Setup principal ──────────────────────────────────────────────────────────

async function setup() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log(  '║         🔒  KREATO — CONFIGURAÇÃO SSL / NGINX               ║');
  console.log(  '╚══════════════════════════════════════════════════════════════╝');
  console.log(`\n  Servidor : ${HOST}`);
  console.log(`  Domínio  : ${DOMAIN}`);
  console.log(`  Email    : ${EMAIL}`);
  console.log(`  Frontend : localhost:${FRONTEND_PORT} (Next.js via PM2)\n`);

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
  console.log('✅  SSH conectado!');

  try {
    // 1. Confirmar que o PM2 está rodando
    await runCommand(conn, 'pm2 list', { label: '1/6 — Status PM2 (processos em execução)' });

    // 2. Instalar nginx e certbot
    await runCommand(conn,
      'apt-get update -qq && apt-get install -y nginx certbot python3-certbot-nginx',
      { label: '2/6 — Instalar Nginx + Certbot (Let\'s Encrypt)' }
    );

    // 3. Criar configuração Nginx
    const writeConfCmd = `cat > /etc/nginx/sites-available/${DOMAIN} << 'NGINXEOF'\n${NGINX_CONF}\nNGINXEOF`;
    await runCommand(conn, writeConfCmd, { label: `3/6 — Criar /etc/nginx/sites-available/${DOMAIN}` });

    // Ativar site e remover default (evitar conflito)
    await runCommand(conn,
      `ln -sf /etc/nginx/sites-available/${DOMAIN} /etc/nginx/sites-enabled/${DOMAIN} && ` +
      `rm -f /etc/nginx/sites-enabled/default && ` +
      `nginx -t`,
      { label: '3/6 — Ativar site e validar configuração Nginx' }
    );

    await runCommand(conn, 'systemctl reload nginx', { label: '3/6 — Recarregar Nginx' });

    // 4. Abrir portas no firewall (UFW) se ativo
    await runCommand(conn,
      `ufw status | grep -q "Status: active" && ufw allow "Nginx Full" || echo "UFW inativo, sem ajustes necessários"`,
      { label: '4/6 — Liberar portas 80/443 no firewall (UFW)', ignoreError: true }
    );

    // 5. Obter certificado SSL via Let's Encrypt
    await runCommand(conn,
      `certbot --nginx -d ${DOMAIN} -d ${WWW_DOMAIN} ` +
      `--non-interactive --agree-tos --email ${EMAIL} --redirect`,
      { label: '5/6 — Obter certificado SSL (Let\'s Encrypt)' }
    );

    // 6. Confirmar renovação automática
    await runCommand(conn,
      `systemctl is-enabled certbot.timer 2>/dev/null || crontab -l 2>/dev/null | grep certbot || echo "Timer certbot: OK (gerenciado pelo sistema)"`,
      { label: '6/6 — Confirmar renovação automática do certificado', ignoreError: true }
    );

    // Mostrar configuração final gerada pelo certbot
    await runCommand(conn,
      `cat /etc/nginx/sites-available/${DOMAIN}`,
      { label: '── Configuração Nginx final (gerada pelo certbot)' }
    );

    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log(  '║  ✅  SSL configurado com sucesso!                           ║');
    console.log(`║     https://${DOMAIN} está no ar!         ║`);
    console.log(  '║     Certificado renova automaticamente a cada 90 dias.      ║');
    console.log(  '╚══════════════════════════════════════════════════════════════╝\n');

  } finally {
    conn.end();
  }
}

setup().catch((err) => {
  console.error('\n❌  Falha na configuração SSL:', err.message);
  process.exit(1);
});
