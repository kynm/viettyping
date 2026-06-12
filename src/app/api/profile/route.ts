import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const THEMES = new Set(['dino', 'turtle', 'bunny', 'panda', 'leopard']);

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
  return NextResponse.json({ profile: user.profile });
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const nickname = typeof body.nickname === 'string' ? body.nickname.trim().slice(0, 80) : '';
  if (!nickname) return NextResponse.json({ error: 'Biệt danh là bắt buộc.' }, { status: 400 });
  const theme = THEMES.has(body.theme) ? body.theme : 'dino';

  const profile = await prisma.studentProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      name: typeof body.name === 'string' ? body.name.trim().slice(0, 120) : '',
      nickname,
      grade: typeof body.grade === 'string' ? body.grade.slice(0, 30) : 'Lớp 1',
      avatar: typeof body.avatar === 'string' ? body.avatar.slice(0, 20) : '🦖',
      theme,
    },
    update: {
      name: typeof body.name === 'string' ? body.name.trim().slice(0, 120) : '',
      nickname,
      grade: typeof body.grade === 'string' ? body.grade.slice(0, 30) : 'Lớp 1',
      avatar: typeof body.avatar === 'string' ? body.avatar.slice(0, 20) : '🦖',
      theme,
    },
  });
  return NextResponse.json({ profile });
}
