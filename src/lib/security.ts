import { NextResponse } from 'next/server';

const DEFAULT_JSON_LIMIT_BYTES = 64 * 1024;
const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

export function forbidden(message = 'Yeu cau khong hop le.') {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function getClientIp(request: Request) {
  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwardedFor || request.headers.get('x-real-ip') || 'unknown';
}

export function validateSameOriginRequest(request: Request) {
  const method = request.method.toUpperCase();
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) return null;

  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const expectedOrigin = process.env.APP_ORIGIN || process.env.EXERCISE_ORIGIN || new URL(request.url).origin;
  if (request.headers.get('sec-fetch-site') === 'cross-site') return forbidden();

  if (origin) return origin === expectedOrigin ? null : forbidden();
  if (referer) {
    try {
      return new URL(referer).origin === expectedOrigin ? null : forbidden();
    } catch {
      return forbidden();
    }
  }

  return process.env.NODE_ENV === 'production' ? forbidden() : null;
}

export function consumeRateLimit(
  key: string,
  options: { limit: number; windowMs: number },
) {
  const now = Date.now();
  const current = rateLimitBuckets.get(key);

  if (!current || current.resetAt <= now) {
    rateLimitBuckets.set(key, { count: 1, resetAt: now + options.windowMs });
    return null;
  }

  current.count += 1;
  if (current.count <= options.limit) return null;

  const retryAfterSeconds = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
  return NextResponse.json(
    { error: 'Qua nhieu yeu cau. Vui long thu lai sau.' },
    {
      status: 429,
      headers: { 'Retry-After': String(retryAfterSeconds) },
    },
  );
}

export async function readJsonBody(
  request: Request,
  options: { maxBytes?: number } = {},
) {
  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().includes('application/json')) {
    return {
      body: null,
      response: NextResponse.json({ error: 'Content-Type khong hop le.' }, { status: 415 }),
    };
  }

  const maxBytes = options.maxBytes ?? DEFAULT_JSON_LIMIT_BYTES;
  const contentLength = Number.parseInt(request.headers.get('content-length') ?? '', 10);
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    return {
      body: null,
      response: NextResponse.json({ error: 'Du lieu gui len qua lon.' }, { status: 413 }),
    };
  }

  const text = await request.text().catch(() => '');
  if (new TextEncoder().encode(text).length > maxBytes) {
    return {
      body: null,
      response: NextResponse.json({ error: 'Du lieu gui len qua lon.' }, { status: 413 }),
    };
  }

  try {
    return { body: text ? JSON.parse(text) : {}, response: null };
  } catch {
    return {
      body: null,
      response: NextResponse.json({ error: 'JSON khong hop le.' }, { status: 400 }),
    };
  }
}
