import { buildLeaderboard } from '@/lib/leaderboard';

describe('buildLeaderboard', () => {
  it('uses account data and sorts users by XP, streak, then account id', () => {
    const leaderboard = buildLeaderboard([
      {
        id: 3,
        username: 'third',
        profile: { nickname: 'Bé Ba', avatar: '🐼' },
        studentData: { data: { typing_xp: '200', typing_streak: '2' } },
      },
      {
        id: 2,
        username: 'second',
        profile: { nickname: 'Bé Hai', avatar: '🐰' },
        studentData: { data: { typing_xp: '200', typing_streak: '5' } },
      },
      {
        id: 1,
        username: 'first',
        profile: null,
        studentData: { data: { typing_xp: '350', typing_streak: '1' } },
      },
    ]);

    expect(leaderboard.map(({ id, rank }) => ({ id, rank }))).toEqual([
      { id: 1, rank: 1 },
      { id: 2, rank: 2 },
      { id: 3, rank: 3 },
    ]);
    expect(leaderboard[0]).toMatchObject({ nickname: 'first', avatar: '👤', xp: 350 });
  });

  it('keeps accounts with missing or invalid score data at zero', () => {
    const leaderboard = buildLeaderboard([
      {
        id: 1,
        username: 'new-account',
        profile: { nickname: '', avatar: '' },
        studentData: { data: { typing_xp: 'invalid', typing_streak: -4 } },
      },
    ]);

    expect(leaderboard[0]).toEqual({
      id: 1,
      nickname: 'new-account',
      avatar: '👤',
      xp: 0,
      streak: 0,
      rank: 1,
    });
  });
});
