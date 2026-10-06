import { NextResponse } from 'next/server';
import { deleteCurrentSession } from '@/lib/auth';
import { isSameOrigin } from '@/lib/request-origin';

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'Nguồn yêu cầu không hợp lệ.' }, { status: 403 });
  await deleteCurrentSession();
  return NextResponse.json({ ok: true });
}
