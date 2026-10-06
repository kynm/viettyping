'use client';
import { Answers, PublicQuestion } from '@/lib/exercises/contracts';
import { ExerciseButton, fieldClass } from './controls';
import TokenQuestion from './TokenQuestion';
import MatchingQuestion from './MatchingQuestion';
import Image from 'next/image';
import DragDropQuestion from './DragDropQuestion';
import TypingQuestion from './TypingQuestion';
import PuzzleQuestion from './PuzzleQuestion';
import MemoryQuestion from './MemoryQuestion';
import WritingQuestion from './WritingQuestion';
import SpeakingQuestion from './SpeakingRecorder';
export default function QuestionRenderer({ question: q, value, onChange, attemptId }: { question: PublicQuestion; value: Answers[string] | undefined; onChange: (value: Answers[string]) => void; attemptId?: number }) {
  const choices = ['multiple_choice', 'true_false', 'odd_one_out', 'listen_choose', 'read_choose'].includes(q.type);
  return <div className="min-w-0 grid gap-6">
    {q.passage && !['typing', 'typing_race'].includes(q.type) && <blockquote className="whitespace-pre-wrap rounded-2xl bg-amber-50 p-5 text-lg leading-relaxed">{q.passage}</blockquote>}
    {q.image && <Image unoptimized={q.image.startsWith('/api/')} src={q.image} alt="Hình minh họa câu hỏi" width={480} height={240} className="mx-auto max-h-60 max-w-full rounded-2xl object-contain" />}
    <h2 className="text-2xl font-black leading-relaxed">{q.prompt}</h2>
    {q.audio ? <audio controls preload="none" src={q.audio} aria-label="Nghe câu hỏi" /> : q.speechText && <ExerciseButton onClick={() => { if (!('speechSynthesis' in window)) { alert('Trình duyệt không hỗ trợ đọc. Hãy dùng trình duyệt khác.'); return; } speechSynthesis.cancel(); const speech = new SpeechSynthesisUtterance(q.speechText); speech.lang = 'en-US'; speech.rate = .85; speechSynthesis.speak(speech); }}>🔊 Nghe</ExerciseButton>}
    {q.type === 'fill_blank' && q.options.length > 0 ? <label className="min-w-0 grid gap-2">Chọn từ điền vào chỗ trống<select className={fieldClass} value={typeof value === 'string' ? value : ''} onChange={e => onChange(e.target.value)}><option value="">Chọn đáp án</option>{q.options.map(o => <option key={o}>{o}</option>)}</select></label> : q.type === 'speaking' ? <SpeakingQuestion questionId={q.id} attemptId={attemptId} value={typeof value === 'string' ? value : ''} onChange={onChange} /> : q.type === 'writing' ? <WritingQuestion value={typeof value === 'string' ? value : ''} minWords={q.minWords} maxWords={q.maxWords} onChange={onChange} /> : ['word_search', 'crossword'].includes(q.type) ? <PuzzleQuestion question={q} value={value} onChange={onChange} /> : q.type === 'memory' ? <MemoryQuestion question={q} value={value && typeof value === 'object' && !Array.isArray(value) ? value : {}} onChange={onChange} /> : ['typing', 'typing_race'].includes(q.type) ? <TypingQuestion target={q.passage || q.prompt} value={typeof value === 'string' ? value : ''} race={q.type === 'typing_race'} onChange={onChange} /> : q.type === 'drag_drop' ? <DragDropQuestion options={q.options} value={typeof value === 'string' ? value : ''} onChange={onChange} /> : q.type === 'matching' ? <MatchingQuestion question={q} value={value && typeof value === 'object' && !Array.isArray(value) ? value : {}} onChange={onChange} /> : ['word_scramble', 'sentence_scramble'].includes(q.type) ? <TokenQuestion tokens={q.tokens} value={Array.isArray(value) ? value : []} onChange={onChange} /> : choices ? <div className="min-w-0 grid gap-3 sm:grid-cols-2" role="group" aria-label="Chọn đáp án">{q.options.map((option, i) => <ExerciseButton key={option} aria-pressed={value === option} className={value === option ? '!bg-sky-300' : ''} onClick={() => onChange(option)}>{String.fromCharCode(65 + i)}. {option}{value === option && ' ✓'}</ExerciseButton>)}</div> : <label className="min-w-0 grid gap-3 text-lg font-semibold">Câu trả lời<input autoComplete="off" spellCheck={false} className={fieldClass} value={typeof value === 'string' ? value : ''} onChange={e => onChange(e.target.value)} /></label>}
  </div>;
}

