import { prisma } from '@/lib/prisma';
import { authorize, endpoint, jsonBody, HttpError, numberId } from '@/lib/exercises/server';
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return endpoint(async () => {
    const user = await authorize(request, true), exerciseId = numberId((await context.params).id);
    const exercise = await prisma.exercise.findFirst({ where: { id: exerciseId, createdBy: user.id, status: 'published' } });
    if (!exercise) throw new HttpError(404, 'Cần bài tập đã xuất bản thuộc giáo viên.');
    const b = await jsonBody(request), startsAt = new Date(b.startsAt), endsAt = new Date(b.endsAt), attemptsAllowed = Number(b.attemptsAllowed), timeLimit = Number(b.timeLimit ?? exercise.timeLimit);
    if (!Number.isFinite(startsAt.getTime()) || !Number.isFinite(endsAt.getTime()) || endsAt <= startsAt || !Number.isInteger(attemptsAllowed) || attemptsAllowed < 1 || attemptsAllowed > 20 || !Number.isInteger(timeLimit) || timeLimit < 0 || timeLimit > 7200) throw new HttpError(400, 'Lịch giao bài không hợp lệ.');
    let students: { id: number }[];
    if (b.classId) {
      const classId = numberId(String(b.classId));
      if (!await prisma.classroom.findFirst({ where: { id: classId, teacherId: user.id } })) throw new HttpError(404, 'Không tìm thấy lớp thuộc giáo viên.');
      students = (await prisma.classroomMember.findMany({ where: { classroomId: classId, ...(b.groupName ? { groupName: String(b.groupName).slice(0, 80) } : {}), student: { role: 'STUDENT' } }, take: 501, select: { studentId: true } })).map(m => ({ id: m.studentId }));
      if (!students.length || students.length > 500) throw new HttpError(400, 'Lớp/nhóm phải có 1–500 học sinh.');
    } else {
      const student = await prisma.user.findUnique({ where: { username: String(b.username).trim().toLowerCase() } });
      if (!student || student.role !== 'STUDENT') throw new HttpError(400, 'Không tìm thấy học sinh.');
      students = [student];
    }
    const data = { startsAt, endsAt, attemptsAllowed, timeLimit, randomQuestions: b.randomQuestions === true, randomAnswers: b.randomAnswers === true, showResult: b.showResult !== false, showAnswer: b.showAnswer === true };
    await prisma.$transaction(students.map(student => prisma.exerciseAssignment.upsert({ where: { exerciseId_studentId: { exerciseId, studentId: student.id } }, create: { ...data, exerciseId, studentId: student.id }, update: data })));
    return { ok: true, assigned: students.length };
  });
}
