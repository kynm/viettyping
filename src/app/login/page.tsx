'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Keyboard, LogIn, UserPlus } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? 'Không thể đăng nhập.');
        return;
      }
      router.replace('/');
      router.refresh();
    } catch {
      setError('Không kết nối được máy chủ.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-amber-50 p-4">
      <div className="w-full max-w-md rounded-[30px] border-4 border-slate-800 bg-white p-7 shadow-[8px_8px_0_#1e293b]">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl border-3 border-slate-800 bg-indigo-100">
            <Keyboard className="h-9 w-9 text-indigo-700" />
          </div>
          <h1 className="text-3xl font-black text-slate-900">VietTyping</h1>
          <p className="mt-1 text-sm font-bold text-slate-500">
            {mode === 'login' ? 'Đăng nhập để tiếp tục học' : 'Tạo tài khoản học sinh mới'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-black text-slate-700">
            Tên đăng nhập
            <input
              type="text"
              required
              minLength={3}
              maxLength={30}
              pattern="[A-Za-z][A-Za-z0-9_]*"
              autoCapitalize="none"
              spellCheck={false}
              autoComplete="username"
              placeholder="Ví dụ: nguyen_van_an"
              value={username}
              onChange={(event) => setUsername(event.target.value.toLowerCase())}
              className="mt-1.5 w-full rounded-xl border-2 border-slate-800 px-4 py-3 font-bold outline-none focus:ring-4 focus:ring-indigo-200"
            />
            <span className="mt-1 block text-xs font-bold text-slate-500">
              Chỉ dùng chữ không dấu, số và dấu gạch dưới.
            </span>
          </label>
          <label className="block text-sm font-black text-slate-700">
            Mật khẩu
            <input
              type="password"
              required
              minLength={8}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1.5 w-full rounded-xl border-2 border-slate-800 px-4 py-3 font-bold outline-none focus:ring-4 focus:ring-indigo-200"
            />
          </label>
          {error && <p className="rounded-xl bg-rose-100 p-3 text-sm font-bold text-rose-700">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-slate-800 bg-indigo-600 px-4 py-3 font-black text-white shadow-[4px_4px_0_#1e293b] disabled:opacity-60"
          >
            {mode === 'login' ? <LogIn className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
            {submitting ? 'Đang xử lý...' : mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
          className="mt-5 w-full text-sm font-black text-indigo-700 underline"
        >
          {mode === 'login' ? 'Chưa có tài khoản? Đăng ký' : 'Đã có tài khoản? Đăng nhập'}
        </button>
      </div>
    </main>
  );
}
