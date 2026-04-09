/**
 * Configuração leve do Auth.js para uso no middleware (Edge Runtime).
 *
 * NÃO inclui PrismaAdapter nem nenhuma dependência Node.js.
 * Apenas verifica/lê o JWT do cookie para proteger rotas.
 *
 * A config completa (com adapter, callbacks de banco, etc.) está em auth.ts
 * e é usada apenas em Server Components e Route Handlers (Node.js runtime).
 */

import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

export const { auth } = NextAuth({
  secret: process.env.AUTH_SECRET,
  providers: [
    // Credentials declarado para o Auth.js reconhecer o provider.
    // O authorize() nunca é chamado no middleware — apenas a leitura do JWT.
    Credentials({
      credentials: {},
      authorize: () => null,
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token }) {
      if (!('userId' in token) && token.sub) {
        // Compatibilidade com cookies antigos que só tinham o claim padrão `sub`.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (token as any).userId = token.sub;
      }

      return token;
    },
    async session({ session, token }) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const t = token as any;
      if (t.userId || token.sub) session.user.id = (t.userId ?? token.sub) as string;
      if (t.role) session.user.role = t.role;
      if ('tenantId' in t) session.user.tenantId = t.tenantId ?? null;
      if (t.usuario) session.user.usuario = t.usuario;
      return session;
    },
  },
});
