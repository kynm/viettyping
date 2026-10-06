import { prisma } from '@/lib/prisma';
import { authorize, endpoint, jsonBody, HttpError, numberId } from '@/lib/exercises/server';
type Context = { params: Promise<{ id: string }> };
export async function GET(request: Request, context: Context) {
  return endpoint(async () => {
    const user = await authorize(request, true), id = numberId((await context.params).id);
    const classroom = await prisma.classroom.findFirst({ where: { id, teacherId: user.id } });
    if (!classroom) throw new HttpError(404, 'Không tìm thấy lớp.');
    const page = Math.max(1, Math.floor(Number(new URL(request.url).searchParams.get('page')) || 1));
    return { ...classroom, members: await prisma.classroomMember.findMany({ where: { classroomId: id }, skip: (page - 1) * 50, take: 50, include: { student: { select: { username: true } } } }), total: await prisma.classroomMember.count({ where: { classroomId: id } }), page };
  });
}
export async function PUT(request: Request, context: Context) {
  return endpoint(async () => {
    const user = await authorize(request, true), id = numberId((await context.params).id), b = await jsonBody(request);
    if (!await prisma.classroom.findFirst({ where: { id, teacherId: user.id } })) throw new HttpError(404, 'Không tìm thấy lớp.');
    if (typeof b.username !== 'string' || typeof b.groupName !== 'string' || b.groupName.length > 80) throw new HttpError(400, 'Học sinh/nhóm không hợp lệ.');
    const student = await prisma.user.findUnique({ where: { username: b.username.trim().toLowerCase() } });
    if (!student || student.role !== 'STUDENT') throw new HttpError(400, 'Không tìm thấy học sinh.');
    if (b.remove === true) await prisma.classroomMember.deleteMany({ where: { classroomId: id, studentId: student.id } });
    else await prisma.classroomMember.upsert({ where: { classroomId_studentId: { classroomId: id, studentId: student.id } }, create: { classroomId: id, studentId: student.id, groupName: b.groupName.trim() }, update: { groupName: b.groupName.trim() } });
    return { ok: true };
  });
}
