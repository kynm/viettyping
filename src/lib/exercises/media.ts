import { access } from 'node:fs/promises';
import path from 'node:path';
import { prisma } from '@/lib/prisma';
import { Question } from './contracts';
import { HttpError } from './server';

export async function validateQuestionMedia(questions: Question[], teacherId: number) {
  const refs = questions.flatMap(q => [
    ...(q.image ? [{ url: q.image, kind: 'image' }] : []),
    ...(q.audio ? [{ url: q.audio, kind: 'audio' }] : []),
    ...q.pairs.filter(p => p.left.startsWith('/')).map(p => ({ url: p.left, kind: 'image' })),
  ]);
  const ids = [...new Set(refs.filter(r => r.url.startsWith('/api/')).map(r => r.url.split('/').pop()!))];
  const files = ids.length ? await prisma.exerciseMedia.findMany({ where: { id: { in: ids }, userId: teacherId, attemptId: null }, select: { id: true, mime: true } }) : [];
  for (const ref of refs) {
    if (!new RegExp(ref.kind === 'image' ? '\\.(png|jpe?g|webp)$' : '\\.(mp3|wav)$', 'i').test(ref.url)) throw new HttpError(400, 'Định dạng ảnh/audio câu hỏi không phù hợp.');
    if (ref.url.startsWith('/api/')) {
      const file = files.find(f => f.id === ref.url.split('/').pop());
      if (!file || !file.mime.startsWith(ref.kind + '/')) throw new HttpError(400, 'Media không thuộc giáo viên hoặc là ghi âm bài làm riêng tư.');
    } else {
      await access(path.join(process.cwd(), 'public', ref.url.slice(1))).catch(() => { throw new HttpError(400, `Không tìm thấy media có sẵn: ${ref.url}`); });
    }
  }
}
