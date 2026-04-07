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
    async jwt({ token }) { return token; },
    async session({ session, token }) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const t = token as any;
      if (t.userId) session.user.id = t.userId as string;
      return session;
    },
  },
});
