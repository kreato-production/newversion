/**
 * Repository de sessões autenticadas via Keycloak (BFF pattern).
 *
 * Os tokens Keycloak são armazenados ENCRIPTADOS no banco (AES-256-GCM).
 * O cookie do browser carrega apenas o UUID da sessão — nunca os tokens.
 *
 * Ciclo de vida de uma sessão:
 *  1. Criada no /auth/callback após troca de code por tokens
 *  2. Lida a cada request autenticado (middleware de sessão)
 *  3. Tokens atualizados quando o access token expira (refresh proativo)
 *  4. Deletada no logout ou quando o refresh token expira
 */

import { prisma } from '../../lib/prisma.js';
import { encryptToken, decryptToken } from '../../lib/security/session-crypto.js';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type CreateSessionInput = {
  userId: string;
  keycloakSub: string;
  /** Access token em plaintext (será encriptado antes de salvar) */
  accessToken: string;
  /** Refresh token em plaintext (será encriptado antes de salvar) */
  refreshToken: string;
  /** ID token em plaintext (opcional) */
  idToken?: string;
  /** Quando a sessão expira (geralmente = expiração do refresh token) */
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
};

export type UpdateSessionTokensInput = {
  accessToken: string;
  refreshToken: string;
  idToken?: string;
  expiresAt: Date;
};

/** Sessão com tokens já decriptados, pronta para uso pelo middleware. */
export type SessionRecord = {
  id: string;
  userId: string;
  keycloakSub: string;
  accessToken: string;
  refreshToken: string;
  idToken: string | undefined;
  expiresAt: Date;
};

// ─── Interface ────────────────────────────────────────────────────────────────

export interface SessionRepository {
  /** Cria sessão e retorna o session_id (vai no cookie). */
  createSession(input: CreateSessionInput): Promise<string>;

  /** Busca sessão por id. Retorna null se não existir. */
  findById(id: string): Promise<SessionRecord | null>;

  /** Atualiza tokens após refresh proativo. */
  updateTokens(id: string, input: UpdateSessionTokensInput): Promise<void>;

  /** Remove uma sessão (logout). Silencioso se não existir. */
  deleteSession(id: string): Promise<void>;

  /** Remove todas as sessões de um usuário (force-logout). */
  deleteByUserId(userId: string): Promise<void>;

  /** Remove sessões expiradas (limpeza periódica). Retorna o número removido. */
  deleteExpiredSessions(): Promise<number>;
}

// ─── Implementação Prisma ─────────────────────────────────────────────────────

export class PrismaSessionRepository implements SessionRepository {
  /**
   * @param key Buffer de 32 bytes (AES-256) derivado do SESSION_SECRET.
   *            Deve ser gerado uma vez na inicialização do app e reutilizado.
   */
  constructor(private readonly key: Buffer) {}

  async createSession(input: CreateSessionInput): Promise<string> {
    const session = await prisma.keycloakSession.create({
      data: {
        userId: input.userId,
        keycloakSub: input.keycloakSub,
        accessToken: encryptToken(this.key, input.accessToken),
        refreshToken: encryptToken(this.key, input.refreshToken),
        idToken: input.idToken ? encryptToken(this.key, input.idToken) : null,
        expiresAt: input.expiresAt,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      },
      select: { id: true },
    });

    return session.id;
  }

  async findById(id: string): Promise<SessionRecord | null> {
    const session = await prisma.keycloakSession.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        keycloakSub: true,
        accessToken: true,
        refreshToken: true,
        idToken: true,
        expiresAt: true,
      },
    });

    if (!session) return null;

    return {
      id: session.id,
      userId: session.userId,
      keycloakSub: session.keycloakSub,
      accessToken: decryptToken(this.key, session.accessToken),
      refreshToken: decryptToken(this.key, session.refreshToken),
      idToken: session.idToken ? decryptToken(this.key, session.idToken) : undefined,
      expiresAt: session.expiresAt,
    };
  }

  async updateTokens(id: string, input: UpdateSessionTokensInput): Promise<void> {
    await prisma.keycloakSession.update({
      where: { id },
      data: {
        accessToken: encryptToken(this.key, input.accessToken),
        refreshToken: encryptToken(this.key, input.refreshToken),
        ...(input.idToken ? { idToken: encryptToken(this.key, input.idToken) } : {}),
        expiresAt: input.expiresAt,
      },
    });
  }

  async deleteSession(id: string): Promise<void> {
    // Silencioso: não lança se a sessão não existir (P2025)
    await prisma.keycloakSession.delete({ where: { id } }).catch(() => {});
  }

  async deleteByUserId(userId: string): Promise<void> {
    await prisma.keycloakSession.deleteMany({ where: { userId } });
  }

  async deleteExpiredSessions(): Promise<number> {
    const result = await prisma.keycloakSession.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    return result.count;
  }
}
