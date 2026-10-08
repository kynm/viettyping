import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { authorize, endpoint, HttpError, numberId } from '@/lib/exercises/server';
export async function GET(request: Request) {
  return endpoint(async () => {
    const user = await authorize(request), p = new URL(request.url).searchParams, classId = numberId(p.get('classId') ?? '');
    const classroom = await prisma.classroom.findFirst({ where: { id: classId, OR: [{ teacherId: user.id }, { members: { some: { studentId: user.id } } }] } });
    if (!classroom) throw new HttpError(404, 'Không tìm thấy lớp.');
    const days = p.get('period') === 'monthly' ? 30 : 7;
    const rows = await prisma.$queryRaw<{ studentId: number; nickname: string | null; avatar: string | null; xp: bigint; score: number | null }[]>(Prisma.sql`SELECT r.student_id AS studentId, p.nickname, p.avatar, SUM(r.xp) AS xp, AVG(a.averageScore) AS score FROM exercise_rewards r JOIN classroom_members cm ON cm.student_id = r.student_id AND cm.classroom_id = ${classId} JOIN exercises e ON e.id = r.exercise_id AND e.created_by = ${classroom.teacherId} AND e.leaderboard_enabled = true LEFT JOIN student_profiles p ON p.user_id = r.student_id LEFT JOIN (SELECT student_id, exercise_id, AVG(score / total_score * 100) AS averageScore FROM student_attempts WHERE submitted_at IS NOT NULL AND needs_review = false AND show_result = true GROUP BY student_id, exercise_id) a ON a.student_id = r.student_id AND a.exercise_id = r.exercise_id WHERE r.created_at >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL ${days} DAY) GROUP BY r.student_id, p.nickname, p.avatar ORDER BY xp DESC LIMIT 20`);
    return { className: classroom.name, period: days, items: rows.map((r, i) => ({ rank: i + 1, nickname: r.nickname || 'Bạn học', avatar: r.avatar || '⭐', xp: Number(r.xp), score: r.score === null ? null : Math.round(Number(r.score)), me: r.studentId === user.id })) };
  });
}

