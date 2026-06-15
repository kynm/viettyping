export interface LeaderboardUser {
  id: number;
  nickname: string;
  avatar: string;
  xp: number;
  streak: number;
  rank: number;
}

interface LeaderboardSourceUser {
  id: number;
  username: string;
  profile: {
    nickname: string;
    avatar: string;
  } | null;
  studentData: {
    data: unknown;
  } | null;
}

function readNonNegativeInteger(data: unknown, key: string) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return 0;

  const value = (data as Record<string, unknown>)[key];
  const parsed = typeof value === 'number' ? value : Number.parseInt(String(value ?? ''), 10);

  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
}

export function buildLeaderboard(users: LeaderboardSourceUser[]): LeaderboardUser[] {
  return users
    .map((user) => ({
      id: user.id,
      nickname: user.profile?.nickname.trim() || user.username,
      avatar: user.profile?.avatar || '👤',
      xp: readNonNegativeInteger(user.studentData?.data, 'typing_xp'),
      streak: readNonNegativeInteger(user.studentData?.data, 'typing_streak'),
    }))
    .sort((a, b) => b.xp - a.xp || b.streak - a.streak || a.id - b.id)
    .map((user, index) => ({ ...user, rank: index + 1 }));
}
