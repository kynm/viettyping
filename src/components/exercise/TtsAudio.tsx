'use client';
import { useState } from 'react';
import { exerciseApi } from './api';
import { ExerciseButton } from './controls';
export default function TtsAudio({ text, onGenerated }: { text: string; onGenerated: (url: string) => void }) {
  const [message, setMessage] = useState(''), [busy, setBusy] = useState(false);
  return <div><ExerciseButton disabled={!text.trim() || busy} onClick={() => { setBusy(true); void exerciseApi<{ url: string }>('/api/exercises/tts', 'POST', { text }).then(r => { onGenerated(r.url); setMessage('Đã tạo audio tiếng Anh.'); }).catch(e => setMessage(e.message)).finally(() => setBusy(false)); }}>{busy ? 'Đang tạo audio…' : 'Tạo audio từ văn bản'}</ExerciseButton><p role="status">{message}</p></div>;
}
