/**
 * Seed de instalação: cria o utilizador global Admin_Global.
 * Executar a partir do diretório backend/:
 *   ADMIN_USER=Admin_Global ADMIN_PASSWORD=Admin@123 node scripts/seed-installer.mjs
 */
import { randomBytes, scryptSync } from 'node:crypto';
import { PrismaClient } from '@prisma/client';

const KEY_LENGTH = 64;

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, KEY_LENGTH).toString('hex');
  return `${salt}:${hash}`;
}

const prisma = new PrismaClient();
const username = process.env.ADMIN_USER ?? 'Admin_Global';
const password = process.env.ADMIN_PASSWORD ?? 'Admin@123';
const email = process.env.ADMIN_EMAIL ?? 'admin@kreato.local';

async function main() {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ usuario: username }, { role: 'GLOBAL_ADMIN' }] },
  });

  if (existing) {
    console.log(`Admin global já existe: ${existing.usuario}`);
    return;
  }

  const user = await prisma.user.create({
    data: {
      nome: 'Administrador Global',
      name: 'Administrador Global',
      email,
      usuario: username,
      passwordHash: hashPassword(password),
      role: 'GLOBAL_ADMIN',
      status: 'ATIVO',
      tipoAcesso: 'Administrativo',
      emailVerified: new Date(),
    },
  });

  console.log(`Admin global criado: ${user.usuario}`);
}

main()
  .catch((e) => { console.error('Erro ao criar admin:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
