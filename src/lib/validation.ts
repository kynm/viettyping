export function normalizeUsername(value: unknown) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

export function validateUsername(username: string) {
  if (username.length < 3 || username.length > 30) {
    return 'Tên đăng nhập phải có từ 3 đến 30 ký tự.';
  }
  if (!/^[a-z][a-z0-9_]*$/.test(username)) {
    return 'Tên đăng nhập phải bắt đầu bằng chữ cái và chỉ gồm chữ không dấu, số hoặc dấu gạch dưới.';
  }
  return null;
}

export function validateCredentials(username: string, password: unknown) {
  const usernameError = validateUsername(username);
  if (usernameError) return usernameError;
  if (typeof password !== 'string' || password.length < 8) {
    return 'Mật khẩu phải có ít nhất 8 ký tự.';
  }
  if (password.length > 128) return 'Mật khẩu không được vượt quá 128 ký tự.';
  return null;
}
