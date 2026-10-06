import { prisma } from '@/lib/prisma';
import { authorize, endpoint, HttpError } from '@/lib/exercises/server';
import { Prisma } from '@prisma/client';
export async function GET(request: Request) {
  return endpoint(async () => {
    const user = await authorize(request), teacher = new URL(request.url).searchParams.get('teacher') === '1';
    if (teacher && user.role !== 'TEACHER') throw new HttpError(403, 'Không có quyền.');
    const studentName = new URL(request.url).searchParams.get('student')?.slice(0, 30);
    const student = teacher && studentName ? await prisma.user.findFirst({ where: { username: studentName, OR: [{ attempts: { some: { exercise: { createdBy: user.id } } } }, { memberships: { some: { classroom: { teacherId: user.id } } } }] }, select: { id: true } }) : null;
    if (teacher && studentName && !student) throw new HttpError(404, 'Học sinh chưa có bài làm hoặc chưa thuộc lớp của giáo viên.');
    const page = Math.max(1, Number(new URL(request.url).searchParams.get('page')) || 1);
    const where = teacher ? { exercise: { createdBy: user.id }, ...(student ? { studentId: student.id } : {}) } : { studentId: user.id };
    const [attempts, count, rewards] = await Promise.all([
      prisma.studentAttempt.findMany({ where, orderBy: { id: 'desc' }, skip: (page - 1) * 50, take: 50, select: { id: true, score: true, totalScore: true, correct: true, showResult: true, needsReview: true, startedAt: true, submittedAt: true, student: { select: { username: true } }, exercise: { select: { title: true, skill: true } } } }),
      prisma.studentAttempt.count({ where }),
      prisma.exerciseReward.findMany({ where: { studentId: user.id }, select: { xp: true, stars: true, badge: true } }),
    ]);
    const summaries = await prisma.$queryRaw<{ skill: string; completed: bigint; averageScore: number | null }[]>(Prisma.sql`SELECT e.skill, COUNT(*) AS completed, AVG(a.score / a.total_score * 100) AS averageScore FROM student_attempts a JOIN exercises e ON e.id = a.exercise_id WHERE a.submitted_at IS NOT NULL AND a.needs_review = false AND ${student ? Prisma.sql`a.student_id = ${student.id}` : Prisma.sql`1 = 1`} AND ${teacher ? Prisma.sql`e.created_by = ${user.id}` : Prisma.sql`a.student_id = ${user.id} AND a.show_result = true`} GROUP BY e.skill`);
    const skills = summaries.map(s => ({ skill: s.skill, completed: Number(s.completed), averageScore: Math.round(Number(s.averageScore ?? 0)) }));
    const [completed, assigned] = await Promise.all([prisma.studentAttempt.count({ where: { ...where, submittedAt: { not: null } } }), prisma.exerciseAssignment.count({ where: teacher ? { exercise: { createdBy: user.id }, ...(student ? { studentId: student.id } : {}) } : { studentId: user.id } })]);
    const days = await prisma.$queryRaw<{ day: string }[]>(Prisma.sql`SELECT DISTINCT DATE_FORMAT(DATE_ADD(submitted_at, INTERVAL 7 HOUR), '%Y-%m-%d') AS day FROM student_attempts WHERE student_id = ${user.id} AND submitted_at >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 32 DAY) ORDER BY day DESC`);
    const today = new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10), yesterday = new Date(Date.now() + 7 * 3600000 - 86400000).toISOString().slice(0, 10);
    let streak = 0;
    if (days[0] && [today, yesterday].includes(days[0].day)) {
      let date = new Date(days[0].day + 'T00:00:00Z');
      for (const entry of days) { if (entry.day !== date.toISOString().slice(0, 10)) break; streak++; date = new Date(date.getTime() - 86400000); }
    }
    const assignmentWhere = teacher ? { exercise: { createdBy: user.id }, ...(student ? { studentId: student.id } : {}) } : { studentId: user.id };
    const [completedAssignments, bonus, badges] = await Promise.all([prisma.exerciseAssignment.count({ where: { ...assignmentWhere, attempts: { some: { submittedAt: { not: null } } } } }), prisma.studentDailyBonus.aggregate({ where: { studentId: user.id }, _sum: { xp: true } }), prisma.studentExerciseBadge.findMany({ where: { studentId: user.id }, select: { badge: true } })]); const xp = rewards.reduce((n, r) => n + r.xp, 0) + (bonus._sum.xp ?? 0);
    const studentsNeedHelp = teacher ? await prisma.$queryRaw<{ studentId: number; username: string; average: number }[]>(Prisma.sql`SELECT a.student_id AS studentId, u.username, AVG(a.score / a.total_score * 100) AS average FROM student_attempts a JOIN exercises e ON e.id = a.exercise_id JOIN users u ON u.id = a.student_id WHERE e.created_by = ${user.id} AND a.submitted_at IS NOT NULL AND a.needs_review = false GROUP BY a.student_id, u.username HAVING average < 60 ORDER BY average ASC LIMIT 20`) : [];
    const topExercises = teacher ? await prisma.studentAttempt.groupBy({ by: ['exerciseId'], where: { exercise: { createdBy: user.id }, submittedAt: { not: null } }, _count: { id: true }, orderBy: { _count: { id: 'desc' } }, take: 5 }) : [];
    const titles = topExercises.length ? await prisma.exercise.findMany({ where: { id: { in: topExercises.map(e => e.exerciseId) } }, select: { id: true, title: true } }) : [];
    const averageScore = skills.length ? Math.round(skills.reduce((n, s) => n + s.averageScore * s.completed, 0) / skills.reduce((n, s) => n + s.completed, 0)) : 0;
    return { attempts: attempts.map(a => teacher || (a.showResult && !a.needsReview) ? a : { ...a, score: null, totalScore: null, correct: null }), count, page, completed, assigned, completionRate: assigned ? Math.round(completedAssignments / assigned * 100) : 0, averageScore, studentsNeedHelp: studentsNeedHelp.map(s => ({ username: s.username, average: Math.round(Number(s.average)) })), topExercises: topExercises.map(e => ({ title: titles.find(t => t.id === e.exerciseId)?.title, completed: e._count.id })), skills, streak, xp, level: xp < 100 ? 1 : xp < 300 ? 2 : xp < 600 ? 3 : 4 + Math.floor((xp - 600) / 400), stars: rewards.reduce((n, r) => n + r.stars, 0), badges: [...new Set([...rewards.map(r => r.badge), ...badges.map(b => b.badge), ...(streak >= 7 ? ['7 Day Streak'] : []), ...(streak >= 30 ? ['30 Day Streak'] : [])])] };
  });
}
