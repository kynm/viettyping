'use client';
import { useRef, useState } from 'react';
import { Answers, PublicQuestion } from '@/lib/exercises/contracts';
import { ExerciseButton } from './controls';
import { wordAtPath } from '@/lib/exercises/puzzles';
export default function PuzzleQuestion({ question: q, value, onChange }: { question: PublicQuestion; value: Answers[string] | undefined; onChange: (value: Answers[string]) => void }) {
  const start = useRef<[number, number] | null>(null), [selected, setSelected] = useState<string[]>([]);
  const drag = useRef<[number, number] | null>(null), ignoreClick = useRef(false);
  if (!q.grid) return <p>Chưa có bảng câu hỏi.</p>;
  const paths = Array.isArray(value) ? value : [];
  const found = paths.map(path => { const word = wordAtPath(q.grid!, path), reverse = [...word].reverse().join(''); return q.choices.includes(word) ? word : q.choices.includes(reverse) ? reverse : ''; }).filter(Boolean);
  const cells = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  function choose(row: number, col: number) {
    if (!start.current) { start.current = [row, col]; setSelected([`${row}_${col}`]); return; }
    const [r, c] = start.current, dr = Math.sign(row - r), dc = Math.sign(col - c), distance = Math.max(Math.abs(row - r), Math.abs(col - c));
    start.current = null;
    if (row !== r && col !== c && Math.abs(row - r) !== Math.abs(col - c)) { setSelected([]); return; }
    const positions = Array.from({ length: distance + 1 }, (_, i) => [r + dr * i, c + dc * i]);
    const word = positions.map(([r, c]) => q.grid![r][c]).join(''), reverse = [...word].reverse().join('');
    const valid = q.choices.includes(word) ? word : q.choices.includes(reverse) ? reverse : '';
    setSelected(positions.map(([r, c]) => `${r}_${c}`));
    if (valid && !found.includes(valid)) onChange([...paths, positions.map(([r, c]) => `${r},${c}`).join(';')]);
  }
  return <div className="min-w-0 grid gap-4"><p>{q.type === 'word_search' ? 'Bấm ô đầu và ô cuối của từ, hoặc kéo từ ô đầu đến ô cuối. Có thể chọn ngang, dọc, chéo.' : 'Điền từng chữ vào ô theo gợi ý.'}</p><div className="min-w-0 overflow-x-auto pb-3"><div style={{ display: 'grid', gridTemplateColumns: `repeat(${q.grid[0].length}, 44px)`, width: 'max-content' }} role="group" aria-label="Bảng chữ">{q.grid.flatMap((row, r) => row.map((letter, c) => q.type === 'crossword' ? letter ? <input key={`${r}_${c}`} aria-label={`Hàng ${r + 1} cột ${c + 1}`} maxLength={1} autoComplete="off" className="h-11 w-11 border-2 border-slate-500 text-center text-xl font-bold uppercase" value={cells[`${r}_${c}`] ?? ''} onChange={e => onChange({ ...cells, [`${r}_${c}`]: e.target.value.toUpperCase() })} /> : <div key={`${r}_${c}`} className="h-11 w-11 bg-slate-800" /> : <button key={`${r}_${c}`} aria-label={`${letter}, hàng ${r + 1}, cột ${c + 1}`} className={`h-11 w-11 border text-lg font-bold ${selected.includes(`${r}_${c}`) ? 'bg-sky-200' : 'bg-white'}`} data-row={r} data-col={c} style={{ touchAction: 'none' }} onPointerDown={() => { drag.current = [r, c]; ignoreClick.current = false; }} onPointerUp={e => { const target = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null; const row = Number(target?.dataset.row), col = Number(target?.dataset.col); if (drag.current && Number.isInteger(row) && Number.isInteger(col) && (drag.current[0] !== row || drag.current[1] !== col)) { start.current = drag.current; choose(row, col); ignoreClick.current = true; } drag.current = null; }} onClick={() => { if (ignoreClick.current) { ignoreClick.current = false; return; } choose(r, c); }}>{letter}</button>))}</div></div>{q.type === 'word_search' ? <><p>Từ cần tìm: {q.choices.join(' · ')}</p><p role="status">Đã tìm: {found.join(' · ') || 'Chưa có từ nào'}</p><ExerciseButton onClick={() => onChange([])}>Làm lại bảng</ExerciseButton></> : <ol className="min-w-0 grid gap-2">{q.clues?.map(clue => <li key={clue.id}>{Number(clue.id) + 1}. Hàng {clue.row + 1}, cột {clue.col + 1} ({clue.direction === 'across' ? 'ngang' : 'dọc'}, {clue.length} chữ): {clue.clue}</li>)}</ol>}</div>;
}

