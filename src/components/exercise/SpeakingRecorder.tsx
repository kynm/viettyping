'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ExerciseButton } from './controls';
import { recordingDraft } from '@/lib/exercises/recording-drafts';
export default function SpeakingRecorder({ attemptId, questionId, value, onChange }: { attemptId?: number; questionId: string; value: string; onChange: (value: string) => void }) {
  const recorder = useRef<MediaRecorder | null>(null), stream = useRef<MediaStream | null>(null), chunks = useRef<Blob[]>([]), timeout = useRef<ReturnType<typeof setTimeout> | null>(null), pending = useRef<Blob | null>(null), callback = useRef(onChange), uploading = useRef(false), previewUrl = useRef('');
  callback.current = onChange;
  const [recording, setRecording] = useState(false), [error, setError] = useState(''), [preview, setPreview] = useState(''), [busy, setBusy] = useState(false);
  const key = `${attemptId}:${questionId}`;
  const upload = useCallback(async () => {
    if (!attemptId || !pending.current || uploading.current) return;
    uploading.current = true; setBusy(true);
    const blob = pending.current, form = new FormData();
    form.set('file', blob, blob.type.includes('mp4') ? 'recording.m4a' : 'recording.webm'); form.set('attemptId', String(attemptId));
    try {
      const res = await fetch('/api/exercises/media', { method: 'POST', body: form }); const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      callback.current(data.url); pending.current = null; await recordingDraft(key, 'delete').catch(() => undefined); setError('');
    } catch (e) { setError(`Ghi âm đang chờ đồng bộ: ${(e as Error).message}. Bản ghi được giữ trên thiết bị.`); }
    finally { uploading.current = false; setBusy(false); }
  }, [attemptId, key]);
  useEffect(() => {
    let cancelled = false;
    if (attemptId) void recordingDraft(key, 'get').then(blob => { if (blob && !cancelled) { pending.current = blob; previewUrl.current = URL.createObjectURL(blob); setPreview(previewUrl.current); void upload(); } }).catch(() => setError('Không thể khôi phục ghi âm trên thiết bị.'));
    const online = () => { void upload(); }; window.addEventListener('online', online);
    return () => { cancelled = true; window.removeEventListener('online', online); if (recorder.current?.state === 'recording') { recorder.current.onstop = null; recorder.current.stop(); } stream.current?.getTracks().forEach(t => t.stop()); if (timeout.current) clearTimeout(timeout.current); if (previewUrl.current) URL.revokeObjectURL(previewUrl.current); };
  }, [attemptId, key, upload]);
  async function start() {
    try {
      if (!attemptId) { setError('Ghi âm hoạt động trong bài làm của học sinh.'); return; }
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : '';
      recorder.current = new MediaRecorder(stream.current, mimeType ? { mimeType } : undefined); chunks.current = [];
      recorder.current.ondataavailable = e => { if (e.data.size) chunks.current.push(e.data); };
      recorder.current.onstop = async () => {
        setRecording(false); stream.current?.getTracks().forEach(t => t.stop()); if (timeout.current) clearTimeout(timeout.current);
        const blob = new Blob(chunks.current, { type: recorder.current?.mimeType || 'audio/webm' }); pending.current = blob;
        if (previewUrl.current) URL.revokeObjectURL(previewUrl.current); previewUrl.current = URL.createObjectURL(blob); setPreview(previewUrl.current);
        try { await recordingDraft(key, 'put', blob); } catch { setError('Không thể lưu ghi âm trên thiết bị. Hãy giữ trang mở đến khi upload xong.'); }
        await upload();
      };
      recorder.current.start(); setRecording(true); setError(''); timeout.current = setTimeout(() => recorder.current?.stop(), 120000);
    } catch { setError('Không thể truy cập microphone. Kiểm tra quyền trình duyệt và kết nối HTTPS.'); }
  }
  return <div className="min-w-0 grid gap-4"><p>Ghi âm tối đa 2 phút. Giáo viên sẽ nghe và chấm bài.</p><ExerciseButton disabled={busy} onClick={() => recording ? recorder.current?.stop() : void start()}>{recording ? '⏹ Dừng ghi âm' : '🎙 Bắt đầu ghi âm'}</ExerciseButton>{(preview || value) && <audio controls src={preview || value} aria-label="Nghe lại bài nói" />}<p role="status">{busy ? 'Đang lưu ghi âm…' : value ? 'Đã lưu ghi âm' : ''}</p>{error && <><p role="alert">{error}</p><ExerciseButton onClick={() => void upload()}>Thử đồng bộ ghi âm</ExerciseButton></>}</div>;
}
