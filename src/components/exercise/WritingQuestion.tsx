'use client';
import { fieldClass } from './controls';
export default function WritingQuestion({ value, minWords = 0, maxWords = 1000, onChange }: { value: string; minWords?: number; maxWords?: number; onChange: (value: string) => void }) {
  const count = value.trim() ? value.trim().split(/\s+/).length : 0;
  return <label className="min-w-0 grid gap-3">Viết bài của em ({minWords}–{maxWords} từ)<textarea rows={8} maxLength={10000} className={fieldClass} value={value} onChange={e => onChange(e.target.value)} /><span role="status">{count} từ · {count < minWords ? 'Hãy viết thêm' : count > maxWords ? 'Hãy rút gọn bài viết' : 'Đủ số từ'} · Giáo viên sẽ chấm bài</span></label>;
}
