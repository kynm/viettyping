import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { buildLeaderboard } from '@/lib/leaderboard';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      profile: {
        select: {
          nickname: true,
          avatar: true,
        },
      },
      studentData: {
        select: {
          data: true,
        },
      },
    },
  });

  return NextResponse.json({
    users: buildLeaderboard(users),
    currentUserId: currentUser.id,
  });
}
