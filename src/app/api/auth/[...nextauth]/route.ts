/**
 * Route handler do Auth.js v5.
 *
 * Processa todos os requests de autenticação:
 *  GET  /api/auth/session
 *  GET  /api/auth/csrf
 *  GET  /api/auth/providers
 *  GET  /api/auth/callback/:provider
 *  GET  /api/auth/signin/:provider
 *  POST /api/auth/signin/:provider
 *  POST /api/auth/signout
 */

export { GET, POST } from '@/auth-handlers';
