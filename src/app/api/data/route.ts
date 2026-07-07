import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { readJsonBody, validateSameOriginRequest } from '@/lib/security';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
  const record = await prisma.studentData.findUnique({ where: { userId: user.id } });
  return NextResponse.json({ data: record?.data ?? {} });
}

export async function PUT(request: Request) {
  const originError = validateSameOriginRequest(request);
  if (originError) return originError;

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
  const { body, response } = await readJsonBody(request, { maxBytes: 256 * 1024 });
  if (response) return response;

  const data = body.data;
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return NextResponse.json({ error: 'Dữ liệu không hợp lệ.' }, { status: 400 });
  }

  await prisma.studentData.upsert({
    where: { userId: user.id },
    create: { userId: user.id, data },
    update: { data },
  });
  return NextResponse.json({ ok: true });
}
