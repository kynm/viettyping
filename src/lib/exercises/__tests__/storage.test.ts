import { clearStoredSnapshot } from '@/lib/client-storage';
describe('Shared device exercise privacy', () => {
  it('clears exercise drafts when logout clears the student snapshot', () => {
    localStorage.setItem('exercise-attempt-123', JSON.stringify({ answers: { writing: 'Private draft' } }));
    localStorage.setItem('typing_xp', '100');
    localStorage.setItem('unrelated-setting', 'keep');
    clearStoredSnapshot();
    expect(localStorage.getItem('exercise-attempt-123')).toBeNull();
    expect(localStorage.getItem('typing_xp')).toBeNull();
    expect(localStorage.getItem('unrelated-setting')).toBe('keep');
  });
});
