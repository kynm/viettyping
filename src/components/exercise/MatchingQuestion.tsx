'use client';
import { PublicQuestion } from '@/lib/exercises/contracts';
import { fieldClass } from './controls';
import Image from 'next/image';
export default function MatchingQuestion({ question, value, onChange }: { question: PublicQuestion; value: Record<string, string>; onChange: (value: Record<string, string>) => void }) {
  return <div className="min-w-0 grid gap-4">{question.pairs.map(pair => <label key={pair.id} className="min-w-0 grid gap-3 rounded-2xl bg-sky-50 p-4 sm:grid-cols-2 sm:items-center"><span className="text-xl font-bold">{pair.left.startsWith('/assets/') || pair.left.startsWith('/api/exercises/media/') ? <Image unoptimized={pair.left.startsWith('/api/')} src={pair.left} alt={`Hình cần ghép ${Number(pair.id) + 1}`} width={128} height={128} className="mx-auto object-contain" /> : pair.left}</span><select aria-label={`Ghép ${pair.left}`} className={fieldClass} value={value[pair.id] ?? ''} onChange={e => onChange({ ...value, [pair.id]: e.target.value })}><option value="">Chọn từ phù hợp</option>{question.choices.map(c => <option key={c}>{c}</option>)}</select></label>)}</div>;
}
