'use client';
import { useState } from 'react';
import { fieldClass } from './controls';
export default function MediaUpload({ onUploaded }: { onUploaded: (url: string, kind: 'image' | 'audio') => void }) {
  const [message, setMessage] = useState('');
  return <label className="min-w-0 grid gap-2">Upload ảnh / audio (tối đa 10MB)<input className={fieldClass} type="file" accept=".png,.jpg,.jpeg,.webp,.mp3,.wav" onChange={e => { const file = e.target.files?.[0]; if (!file) return; if (file.size > 10000000) { setMessage('Tệp quá lớn.'); return; } const form = new FormData(); form.set('file', file); setMessage('Đang tải…'); void fetch('/api/exercises/media', { method: 'POST', body: form }).then(async r => { const data = await r.json(); if (!r.ok) throw new Error(data.error); onUploaded(data.url, data.kind); setMessage('Đã tải lên'); }).catch(e => setMessage(e.message)); }} /><span role="status">{message}</span></label>;
}
