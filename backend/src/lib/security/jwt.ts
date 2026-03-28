import { createHmac, timingSafeEqual } from 'node:crypto';

export type JwtPayload = {
  sub: string;
  type: 'access' | 'refresh';
  role: string;
  tenantId?: string | null;
  jti?: string;
  exp: number;
  iat: number;
};

function base64UrlEncode(value: string | Buffer): string {
  return Buffer.from(value)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (normalized.length % 4 || 4)) % 4);
  return Buffer.from(`${normalized}${padding}`, 'base64').toString('utf8');
}

export function signJwt(payload: Omit<JwtPayload, 'iat' | 'exp'>, secret: string, ttlSeconds: number, now = new Date()): string {
  const iat = Math.floor(now.getTime() / 1000);
  const exp = iat + ttlSeconds;
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64UrlEncode(JSON.stringify({ ...payload, iat, exp }));
  const content = `${header}.${body}`;
  const signature = base64UrlEncode(createHmac('sha256', secret).update(content).digest());
  return `${content}.${signature}`;
}

export function verifyJwt(token: string, secret: string, now = new Date()): JwtPayload {
  const [header, body, signature] = token.split('.');

  if (!header || !body || !signature) {
    throw new Error('Invalid token format');
  }

  const content = `${header}.${body}`;
  const expectedSignature = createHmac('sha256', secret).update(content).digest();
  const receivedSignature = Buffer.from(signature.replace(/-/g, '+').replace(/_/g, '/'), 'base64');

  if (expectedSignature.length !== receivedSignature.length || !timingSafeEqual(expectedSignature, receivedSignature)) {
    throw new Error('Invalid token signature');
  }

  const payload = JSON.parse(base64UrlDecode(body)) as JwtPayload;
  const nowInSeconds = Math.floor(now.getTime() / 1000);

  if (payload.exp <= nowInSeconds) {
    throw new Error('Token expired');
  }

  return payload;
}
