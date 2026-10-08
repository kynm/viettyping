import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { authorize, HttpError } from '@/lib/exercises/server';
import { prisma } from '@/lib/prisma';
export async function GET(request: Request, context: { params: Promise<{ name: string }> }) {
  try {
    const user = await authorize(request);
    const name = (await context.params).name;
    if (!/^[a-f0-9-]{36}\.(png|jpg|webp|mp3|wav|webm|m4a)$/.test(name)) throw new HttpError(404, 'Không tìm thấy media.');
    const media = await prisma.exerciseMedia.findUnique({ where: { id: name }, include: { attempt: { include: { exercise: { select: { createdBy: true } } } } } });
    if (!media || (media.attemptId && media.userId !== user.id && !(user.role === 'TEACHER' && media.attempt?.exercise.createdBy === user.id))) throw new HttpError(404, 'Không tìm thấy media.');
    if (!media.attemptId && media.userId !== user.id) {
      const url = `/api/exercises/media/${name}`;
      const published = await prisma.$queryRaw<{ id: number }[]>`SELECT id FROM exercises WHERE status = 'published' AND JSON_SEARCH(questions, 'one', ${url}) IS NOT NULL LIMIT 1`;
      const ownedAttempt = published.length ? [] : await prisma.$queryRaw<{ id: number }[]>`SELECT id FROM student_attempts WHERE student_id = ${user.id} AND JSON_SEARCH(snapshot, 'one', ${url}) IS NOT NULL LIMIT 1`;
      if (!published.length && !ownedAttempt.length) throw new HttpError(404, 'Không tìm thấy media.');
    }
    const file = await readFile(path.join(process.cwd(), '.exercise-media', name)).catch(() => { throw new HttpError(404, 'Không tìm thấy media.'); });
    return new Response(file, { headers: { 'Content-Type': media.mime, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });
  } catch (e) { return Response.json({ error: e instanceof HttpError ? e.message : 'Không thể tải media.' }, { status: e instanceof HttpError ? e.status : 500 }); }
}
