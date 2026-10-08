import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { prisma } from '@/lib/prisma';
import { authorize, endpoint, HttpError, jsonBody } from '@/lib/exercises/server';
// Optional Windows host adapter. Text is passed through stdin as data, never as shell code.
export async function POST(request: Request) {
  return endpoint(async () => {
    const user = await authorize(request, true), body = await jsonBody(request);
    if (process.platform !== 'win32') throw new HttpError(503, 'TTS server chưa được hỗ trợ trên host này. Hãy upload audio.');
    if (typeof body.text !== 'string' || !body.text.trim() || body.text.length > 2000) throw new HttpError(400, 'Văn bản đọc cần 1–2000 ký tự.');
    if (await prisma.exerciseMedia.count({ where: { userId: user.id, createdAt: { gte: new Date(Date.now() - 86400000) } } }) >= 100) throw new HttpError(429, 'Đã đạt giới hạn audio hôm nay.');
    const dir = path.join(process.cwd(), '.exercise-media'), id = `${randomUUID()}.wav`;
    await mkdir(dir, { recursive: true });
    const filePath = path.join(dir, id);
    const script = '$ErrorActionPreference="Stop"; Add-Type -AssemblyName System.Speech; $payload=[Console]::In.ReadToEnd() | ConvertFrom-Json; $voice=New-Object System.Speech.Synthesis.SpeechSynthesizer; try { $voice.SelectVoiceByHints([System.Speech.Synthesis.VoiceGender]::NotSet,[System.Speech.Synthesis.VoiceAge]::NotSet,0,[System.Globalization.CultureInfo]::GetCultureInfo("en-US")); $voice.Rate=-2; $voice.SetOutputToWaveFile($payload.path); $voice.Speak($payload.text) } finally { $voice.Dispose() }';
    await new Promise<void>((resolve, reject) => {
      const child = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], { windowsHide: true, stdio: ['pipe', 'ignore', 'ignore'] });
      const timer = setTimeout(() => { child.kill(); reject(new HttpError(503, 'TTS vượt thời gian. Hãy upload audio.')); }, 30000);
      child.on('error', () => { clearTimeout(timer); reject(new HttpError(503, 'TTS chưa sẵn sàng. Hãy upload audio.')); });
      child.on('exit', code => { clearTimeout(timer); if (code === 0) resolve(); else reject(new HttpError(503, 'Host chưa có giọng tiếng Anh. Hãy upload audio.')); });
      child.stdin.end(JSON.stringify({ text: body.text, path: filePath }));
    });
    const info = await stat(filePath);
    await prisma.exerciseMedia.create({ data: { id, userId: user.id, createdAt: new Date(), size: info.size, mime: 'audio/wav' } });
    return { url: `/api/exercises/media/${id}` };
  });
}
