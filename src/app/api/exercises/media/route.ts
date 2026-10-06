import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { authorize, endpoint, HttpError } from '@/lib/exercises/server';
import { prisma } from '@/lib/prisma';
import sharp from 'sharp';
export async function POST(request: Request) {
  return endpoint(async () => {
    const user = await authorize(request);
    if (Number(request.headers.get('content-length')) > 10_500_000) throw new HttpError(413, 'Tệp tối đa 10MB.');
    const form = await request.formData(), file = form.get('file');
    const attemptId = form.get('attemptId') ? Number(form.get('attemptId')) : null;
    if (!attemptId && user.role !== 'TEACHER') throw new HttpError(403, 'Chỉ giáo viên được tải media câu hỏi.');
    if (attemptId) {
      const attempt = await prisma.studentAttempt.findFirst({ where: { id: attemptId, studentId: user.id, submittedAt: null } });
      if (!attempt || (attempt.deadline && attempt.deadline <= new Date())) throw new HttpError(403, 'Không được tải ghi âm vào bài làm này.');
    }
    if (!(file instanceof File) || file.size < 1 || file.size > 10_000_000) throw new HttpError(400, 'Tệp phải có kích thước từ 1 byte đến 10MB.');
    let bytes = Buffer.from(await file.arrayBuffer());
    let ext = '';
    if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) ext = 'png';
    else if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) ext = 'jpg';
    else if (bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') ext = 'webp';
    else if (bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WAVE') ext = 'wav';
    else if (bytes.toString('ascii', 0, 3) === 'ID3' || (bytes[0] === 255 && (bytes[1] & 224) === 224)) ext = 'mp3';
    else if (attemptId && bytes.subarray(0, 4).equals(Buffer.from([26, 69, 223, 163]))) ext = 'webm';
    else if (attemptId && bytes.toString('ascii', 4, 8) === 'ftyp') ext = 'm4a';
    const allowedMime = { png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp', wav: 'audio/wav', mp3: 'audio/mpeg', webm: 'audio/webm', m4a: 'audio/mp4' };
    if (!ext || (file.type && ![allowedMime[ext as keyof typeof allowedMime], ...(ext === 'wav' ? ['audio/x-wav'] : [])].includes(file.type.split(';')[0]))) throw new HttpError(400, 'Định dạng media hoặc MIME không phù hợp.');
    const dir = path.join(process.cwd(), '.exercise-media');
    await mkdir(dir, { recursive: true });
    if (attemptId && !['webm', 'm4a', 'mp3', 'wav'].includes(ext)) throw new HttpError(400, 'Bài nói cần tệp audio.');
    if (await prisma.exerciseMedia.count({ where: { userId: user.id, createdAt: { gte: new Date(Date.now() - 86400000) } } }) >= 100) throw new HttpError(429, 'Đã đạt giới hạn upload hôm nay.');
    if (['png', 'jpg', 'webp'].includes(ext)) {
      try { bytes = await sharp(bytes, { limitInputPixels: 16_000_000 }).rotate().resize({ width: 640, height: 480, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toBuffer(); ext = 'webp'; }
      catch { throw new HttpError(400, 'Ảnh không hợp lệ hoặc vượt quá 16 megapixel.'); }
    }
    const name = `${randomUUID()}.${ext}`;
    await writeFile(path.join(dir, name), bytes, { flag: 'wx' });
    await prisma.exerciseMedia.create({ data: { id: name, userId: user.id, attemptId, createdAt: new Date(), mime: allowedMime[ext as keyof typeof allowedMime], size: bytes.length } });
    return { url: `/api/exercises/media/${name}`, kind: ['mp3', 'wav', 'webm', 'm4a'].includes(ext) ? 'audio' : 'image' };
  });
}
