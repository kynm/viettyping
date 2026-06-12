import { hash } from 'bcryptjs';
import { NextResponse } from 'next/server';
import { createSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { normalizeUsername, validateCredentials } from '@/lib/validation';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const username = normalizeUsername(body.username);
  const error = validateCredentials(username, body.password);
  if (error) return NextResponse.json({ error }, { status: 400 });

  try {
    const user = await prisma.user.create({
      data: {
        username,
        passwordHash: await hash(body.password, 12),
        profile: { create: {} },
        studentData: { create: { data: {} } },
      },
      include: { profile: true },
    });
    await createSession(user.id);
    return NextResponse.json({ user: { id: user.id, username: user.username, profile: user.profile } }, { status: 201 });
  } catch (caught) {
    if (caught && typeof caught === 'object' && 'code' in caught && caught.code === 'P2002') {
      return NextResponse.json({ error: 'Tên đăng nhập này đã được sử dụng.' }, { status: 409 });
    }
    console.error('Register failed:', caught);
    return NextResponse.json({ error: 'Không thể tạo tài khoản.' }, { status: 500 });
  }
}
