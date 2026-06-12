'use client';

import { LogIn, LogOut } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function AccountStatus() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  if (pathname === '/login') return null;

  if (!user) {
    return (
      <Link
        href="/login"
        className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-xl border-2 border-slate-800 bg-amber-100 px-3 py-2 text-xs font-black text-slate-800 shadow-[3px_3px_0_#1e293b] hover:bg-amber-200"
        title="Đăng nhập để đồng bộ dữ liệu"
      >
        <LogIn className="h-4 w-4" />
        Đăng nhập
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void logout()}
      className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-xl border-2 border-slate-800 bg-white px-3 py-2 text-xs font-black text-slate-800 shadow-[3px_3px_0_#1e293b] hover:bg-rose-50"
      title={`Đăng xuất ${user.username}`}
    >
      <LogOut className="h-4 w-4" />
      Đăng xuất
    </button>
  );
}
