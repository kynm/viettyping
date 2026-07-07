import { compare } from 'bcryptjs';
import { NextResponse } from 'next/server';
import { createSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { consumeRateLimit, getClientIp, readJsonBody, validateSameOriginRequest } from '@/lib/security';
import { normalizeUsername, validateUsername } from '@/lib/validation';

export async function POST(request: Request) {
  const originError = validateSameOriginRequest(request);
  if (originError) return originError;

  const ip = getClientIp(request);
  const rateLimitError = consumeRateLimit(`login:${ip}`, { limit: 10, windowMs: 15 * 60 * 1000 });
  if (rateLimitError) return rateLimitError;

  const { body, response } = await readJsonBody(request, { maxBytes: 4096 });
  if (response) return response;

  const username = normalizeUsername(body.username);
  const password = typeof body.password === 'string' ? body.password : '';
  if (validateUsername(username)) {
    return NextResponse.json({ error: 'Tên đăng nhập hoặc mật khẩu không đúng.' }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { username }, include: { profile: true } });

  if (!user || !(await compare(password, user.passwordHash))) {
    return NextResponse.json({ error: 'Tên đăng nhập hoặc mật khẩu không đúng.' }, { status: 401 });
  }

  await createSession(user.id);
  return NextResponse.json({ user: { id: user.id, username: user.username, profile: user.profile } });
}
