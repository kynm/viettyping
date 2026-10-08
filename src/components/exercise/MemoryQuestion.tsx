'use client';
import { useMemo, useState } from 'react';
import { PublicQuestion } from '@/lib/exercises/contracts';
import { ExerciseButton } from './controls';
import Image from 'next/image';
import styles from './exercise.module.css';
export default function MemoryQuestion({ question: q, value, onChange }: { question: PublicQuestion; value: Record<string, string>; onChange: (value: Record<string, string>) => void }) {
  const [flipped, setFlipped] = useState<string[]>([]), [left, setLeft] = useState<string | null>(null);
  const cards = useMemo(() => [...q.pairs.map(p => ({ id: `l_${p.id}`, text: p.left, key: p.id, side: 'left' })), ...q.choices.map((text, i) => ({ id: `r_${i}`, text, key: text, side: 'right' }))].sort((a, b) => a.text.localeCompare(b.text)), [q]);
  return <div className="min-w-0 grid gap-4"><p>Lật một thẻ hình/gợi ý, rồi lật thẻ từ để ghép. Bấm lại để thay đổi lựa chọn. Kết quả được chấm khi nộp bài.</p><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{cards.map(card => { const matched = card.side === 'left' ? !!value[card.key] : Object.values(value).includes(card.text); const visible = matched || flipped.includes(card.id); return <ExerciseButton key={card.id} className={`${visible ? styles.flipped : ''} min-h-24 transition-transform duration-300 ${visible ? '!bg-amber-100' : ''}`} aria-label={visible ? card.text : card.side === 'left' ? 'Lật thẻ gợi ý' : 'Lật thẻ từ'} onClick={() => { setFlipped(prev => [...new Set([...prev, card.id])]); if (card.side === 'left') setLeft(card.key); else if (left !== null) { onChange({ ...value, [left]: card.text }); setLeft(null); setFlipped([]); } }}>{visible ? card.text.startsWith('/assets/') || card.text.startsWith('/api/exercises/media/') ? <Image unoptimized={card.text.startsWith('/api/')} src={card.text} alt='Hình trên thẻ' width={120} height={120} className='mx-auto object-contain' /> : card.text : card.side === 'left' ? '🖼️' : '🔤'}</ExerciseButton>; })}</div><p>{Object.keys(value).length} / {q.pairs.length} cặp đã chọn</p><ExerciseButton onClick={() => { onChange({}); setFlipped([]); setLeft(null); }}>Lật lại tất cả</ExerciseButton></div>;
}
