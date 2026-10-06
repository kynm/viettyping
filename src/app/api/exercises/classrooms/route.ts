import { prisma } from '@/lib/prisma';
import { authorize, endpoint, jsonBody, HttpError } from '@/lib/exercises/server';
export async function GET(request: Request) {
  return endpoint(async () => {
    const user = await authorize(request, true), page = Math.max(1, Math.floor(Number(new URL(request.url).searchParams.get('page')) || 1));
    const [items, total] = await Promise.all([prisma.classroom.findMany({ where: { teacherId: user.id }, skip: (page - 1) * 20, take: 20, orderBy: { id: 'desc' }, include: { _count: { select: { members: true } } } }), prisma.classroom.count({ where: { teacherId: user.id } })]);
    return { items, total, page };
  });
}
export async function POST(request: Request) {
  return endpoint(async () => {
    const user = await authorize(request, true), b = await jsonBody(request);
    if (typeof b.name !== 'string' || !b.name.trim() || b.name.length > 120) throw new HttpError(400, 'Tên lớp cần 1–120 ký tự.');
    return prisma.classroom.create({ data: { teacherId: user.id, name: b.name.trim() } });
  });
}
