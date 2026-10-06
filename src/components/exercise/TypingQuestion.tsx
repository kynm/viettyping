'use client';
import { useEffect, useRef, useState } from 'react';
import { fieldClass } from './controls';
export default function TypingQuestion({ target, value, race, onChange }: { target: string; value: string; race: boolean; onChange: (value: string) => void }) {
  const start = useRef(Date.now()), [elapsed, setElapsed] = useState(1), [countdown, setCountdown] = useState(race ? 3 : 0);
  useEffect(() => { const timer = setInterval(() => { setCountdown(c => Math.max(0, c - 1)); setElapsed(Math.max(1, (Date.now() - start.current) / 1000 - (race ? 3 : 0))); }, 1000); return () => clearInterval(timer); }, [race]);
  const errors = [...value].filter((c, i) => c !== target[i]).length;
  const accuracy = value.length ? Math.round((value.length - errors) / value.length * 100) : 100;
  return <div className="min-w-0 grid gap-4"><p className="rounded-2xl bg-amber-50 p-5 text-2xl leading-relaxed">{target}</p>{countdown > 0 ? <p className="text-3xl" role="status">Sẵn sàng… {countdown}</p> : <p>{Math.round(value.length / 5 / (elapsed / 60))} WPM · {accuracy}% · {errors} lỗi · {Math.floor(elapsed)}s</p>}<progress aria-label="Tiến độ gõ" className="w-full" max={target.length || 1} value={Math.min(value.length, target.length)} /><label className="min-w-0 grid gap-2">Gõ lại đoạn trên<textarea disabled={countdown > 0} autoComplete="off" spellCheck={false} className={fieldClass} value={value} onChange={e => onChange(e.target.value)} /></label></div>;
}
