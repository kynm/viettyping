import { NextResponse } from 'next/server';
import { deleteCurrentSession } from '@/lib/auth';
import { validateSameOriginRequest } from '@/lib/security';

export async function POST(request: Request) {
  const originError = validateSameOriginRequest(request);
  if (originError) return originError;

  await deleteCurrentSession();
  return NextResponse.json({ ok: true });
}
