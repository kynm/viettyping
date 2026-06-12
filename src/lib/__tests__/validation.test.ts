import { normalizeUsername, validateCredentials, validateUsername } from '@/lib/validation';

describe('username validation', () => {
  it('normalizes spaces and uppercase letters', () => {
    expect(normalizeUsername('  Nguyen_Van_An  ')).toBe('nguyen_van_an');
  });

  it.each(['nguyen_van_an', 'hocsinh1', 'be_an'])('accepts %s', (username) => {
    expect(validateUsername(username)).toBeNull();
  });

  it.each(['bé_an', 'nguyen van an', '1hocsinh', 'hoc-sinh', 'an@email.vn'])('rejects %s', (username) => {
    expect(validateUsername(username)).not.toBeNull();
  });

  it('requires an eight-character password', () => {
    expect(validateCredentials('hoc_sinh', '1234567')).toBe('Mật khẩu phải có ít nhất 8 ký tự.');
  });
});
