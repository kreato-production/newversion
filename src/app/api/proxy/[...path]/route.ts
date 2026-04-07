/**
 * Proxy Next.js → Fastify.
 *
 * Componentes client ('use client') não podem acessar o JWT Auth.js
 * (cookie HttpOnly) nem gerar Internal Tokens.
 * Esta rota fica no servidor: obtém a sessão Auth.js, gera o
 * X-Internal-Token e encaminha a requisição ao Fastify.
 *
 * URL: /api/proxy/<path>
 * Ex.: GET /api/proxy/analytics/dashboard  →  GET http://localhost:3333/analytics/dashboard
 */

import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { signInternalToken } from '@/lib/internal-token';

const FASTIFY_URL =
  process.env.INTERNAL_FASTIFY_URL ?? 'http://localhost:3333';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  return proxyToFastify(request, await params);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  return proxyToFastify(request, await params);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  return proxyToFastify(request, await params);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  return proxyToFastify(request, await params);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  return proxyToFastify(request, await params);
}

async function proxyToFastify(
  request: NextRequest,
  params: { path: string[] },
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ message: 'Não autenticado' }, { status: 401 });
  }

  const token = await signInternalToken({
    sub: session.user.id,
    role: session.user.role ?? 'USER',
    tenantId: session.user.tenantId,
  });

  // Reconstrói o path + query string do Fastify
  const fastifyPath = '/' + params.path.join('/');
  const searchParams = request.nextUrl.searchParams.toString();
  const targetUrl = `${FASTIFY_URL}${fastifyPath}${searchParams ? '?' + searchParams : ''}`;

  // Propaga Content-Type quando há body
  const headers: Record<string, string> = {
    'X-Internal-Token': token,
  };
  const contentType = request.headers.get('content-type');
  if (contentType) {
    headers['Content-Type'] = contentType;
  }

  const body =
    request.method !== 'GET' && request.method !== 'HEAD'
      ? await request.arrayBuffer()
      : undefined;

  const fastifyResponse = await fetch(targetUrl, {
    method: request.method,
    headers,
    body: body && body.byteLength > 0 ? body : undefined,
  });

  const responseBody = fastifyResponse.status === 204 ? null : await fastifyResponse.arrayBuffer();

  return new NextResponse(responseBody, {
    status: fastifyResponse.status,
    headers: {
      'Content-Type': fastifyResponse.headers.get('content-type') ?? 'application/json',
    },
  });
}
