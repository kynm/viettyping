import React, { useState, useEffect, useRef } from 'react';
import { ActivityAdapterProps } from '@/types/activity';
import { IoPlay, IoMusicalNotes, IoStop } from 'react-icons/io5';
import { useSubjectTheme } from '@/hooks/useSubjectTheme';

// Cấu âm nốt nhạc bài Cả nhà thương nhau
const SONG_NOTES = [
  // Ba thương con, vì con giống mẹ: Đô2 - Đô2 - Đô2 - La - Đô2 - Rê2 - Đô2 - La
  { note: 'Đô2', freq: 523.25, dur: 0.4 },
  { note: 'Đô2', freq: 523.25, dur: 0.4 },
  { note: 'Đô2', freq: 523.25, dur: 0.4 },
  { note: 'La', freq: 440.00, dur: 0.4 },
  { note: 'Đô2', freq: 523.25, dur: 0.4 },
  { note: 'Rê2', freq: 587.33, dur: 0.4 },
  { note: 'Đô2', freq: 523.25, dur: 0.4 },
  { note: 'La', freq: 440.00, dur: 0.8 },
  
  { note: 'rest', freq: 0, dur: 0.3 },

  // Mẹ thương con, vì con giống ba: La - Rê2 - Rê2 - Đô2 - Rê2 - Sol2 - Mi2
  { note: 'La', freq: 440.00, dur: 0.4 },
  { note: 'Rê2', freq: 587.33, dur: 0.4 },
  { note: 'Rê2', freq: 587.33, dur: 0.4 },
  { note: 'Đô2', freq: 523.25, dur: 0.4 },
  { note: 'Rê2', freq: 587.33, dur: 0.4 },
  { note: 'Sol2', freq: 783.99, dur: 0.4 },
  { note: 'Mi2', freq: 659.25, dur: 0.8 },

  { note: 'rest', freq: 0, dur: 0.3 },

  // Cả nhà ta, cùng thương yêu nhau: Đô2 - Rê2 - Fa2 - Rê2 - Fa2 - Sol2 - Sol2
  { note: 'Đô2', freq: 523.25, dur: 0.4 },
  { note: 'Rê2', freq: 587.33, dur: 0.4 },
  { note: 'Fa2', freq: 698.46, dur: 0.4 },
  { note: 'Rê2', freq: 587.33, dur: 0.4 },
  { note: 'Fa2', freq: 698.46, dur: 0.4 },
  { note: 'Sol2', freq: 783.99, dur: 0.4 },
  { note: 'Sol2', freq: 783.99, dur: 0.8 },

  { note: 'rest', freq: 0, dur: 0.3 },

  // Xa là nhớ, gần nhau là cười: Mi2 - Rê2 - Mi2 - Sol2 - Sol - Rê2 - Đô2 - Đô2
  { note: 'Mi2', freq: 659.25, dur: 0.4 },
  { note: 'Rê2', freq: 587.33, dur: 0.4 },
  { note: 'Mi2', freq: 659.25, dur: 0.4 },
  { note: 'Sol2', freq: 783.99, dur: 0.4 },
  { note: 'Sol', freq: 392.00, dur: 0.4 },
  { note: 'Rê2', freq: 587.33, dur: 0.4 },
  { note: 'Đô2', freq: 523.25, dur: 0.4 },
  { note: 'Đô2', freq: 523.25, dur: 0.8 }
];

// Hàm chuẩn hóa để đối chiếu phím nốt nhạc ở dưới với nốt nhạc đang phát của bài hát
const matchNote = (noteNameInButton: string, activeNote: string | null): boolean => {
  if (!activeNote) return false;
  
  // Chuẩn hóa tên nốt
  const cleanButtonNote = noteNameInButton.toLowerCase().replace(/\s*\(.*?\)\s*/g, '').trim(); // ví dụ "đồ (c)" -> "đồ"
  const cleanActiveNote = activeNote.toLowerCase().replace(/[0-9]/g, '').trim(); // ví dụ "đô2" -> "đô"
  
  const mapNotes: Record<string, string> = {
    'đô': 'đồ',
    'đồ': 'đồ',
    'rê': 'rê',
    'mi': 'mi',
    'fa': 'fa',
    'sol': 'sol',
    'la': 'la',
    'si': 'si'
  };
  
  return mapNotes[cleanButtonNote] === mapNotes[cleanActiveNote];
};

export const ListeningActivity: React.FC<ActivityAdapterProps> = ({ activity, onComplete, onProgressUpdate }) => {
  const [startTime, setStartTime] = useState<number>(0);
  const [playCount, setPlayCount] = useState<number>(0);
  const [isPlayingSong, setIsPlayingSong] = useState<boolean>(false);
  const [activeNoteName, setActiveNoteName] = useState<string | null>(null);
  const theme = useSubjectTheme();

  const audioCtxRef = useRef<AudioContext | null>(null);
  const activeOscillatorsRef = useRef<OscillatorNode[]>([]);
  const songTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const noteTimeoutsRef = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    setStartTime(Date.now());
    return () => {
      // Dọn dẹp âm thanh khi unmount
      stopSong();
    };
  }, []);

  const playNote = (frequency: number) => {
    const audioCtx = new (window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);

    gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 1);
    
    setPlayCount(prev => prev + 1);
    
    if (onProgressUpdate) {
      onProgressUpdate(Math.min(100, (playCount + 1) * 20)); // Fake progress based on interactions
    }
  };

  const playSongMelody = () => {
    if (isPlayingSong) {
      stopSong();
      return;
    }

    const audioCtx = new (window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)();
    audioCtxRef.current = audioCtx;
    setIsPlayingSong(true);

    let time = audioCtx.currentTime + 0.1;
    const oscillators: OscillatorNode[] = [];
    const newTimeouts: NodeJS.Timeout[] = [];

    let accumulatedTimeMs = 100; // trễ ban đầu khớp với AudioContext + 0.1s

    SONG_NOTES.forEach((noteObj) => {
      if (noteObj.note !== 'rest') {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        // Sử dụng sóng triangle để tạo âm ấm mô phỏng tiếng gỗ/piano đồ chơi trẻ em
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(noteObj.freq, time);

        // Lập lịch biên độ ADSR
        gainNode.gain.setValueAtTime(0, time);
        gainNode.gain.linearRampToValueAtTime(0.25, time + 0.03); // Attack nhanh
        gainNode.gain.exponentialRampToValueAtTime(0.001, time + noteObj.dur - 0.02); // Decay/Release

        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        osc.start(time);
        osc.stop(time + noteObj.dur);
        oscillators.push(osc);

        // ASMR Pianola Effect: Lập lịch sáng phím
        const tStart = setTimeout(() => {
          setActiveNoteName(noteObj.note);
        }, accumulatedTimeMs);
        newTimeouts.push(tStart);

        // Lập lịch tắt phím
        const tEnd = setTimeout(() => {
          setActiveNoteName(null);
        }, accumulatedTimeMs + noteObj.dur * 1000 - 30);
        newTimeouts.push(tEnd);
      }
      time += noteObj.dur;
      accumulatedTimeMs += noteObj.dur * 1000;
    });

    activeOscillatorsRef.current = oscillators;
    noteTimeoutsRef.current = newTimeouts;

    // Tính tổng thời gian phát
    const totalDurationMs = SONG_NOTES.reduce((acc, n) => acc + n.dur, 0) * 1000 + 200;
    
    songTimeoutRef.current = setTimeout(() => {
      setIsPlayingSong(false);
      setPlayCount(prev => prev + 1);
      setActiveNoteName(null);
      if (onProgressUpdate) onProgressUpdate(100);
    }, totalDurationMs);
  };

  const stopSong = () => {
    if (songTimeoutRef.current) {
      clearTimeout(songTimeoutRef.current);
      songTimeoutRef.current = null;
    }

    // Xoá tất cả các timeout lập lịch phím bấm
    noteTimeoutsRef.current.forEach(t => clearTimeout(t));
    noteTimeoutsRef.current = [];
    setActiveNoteName(null);
    
    // Stop all oscillators
    activeOscillatorsRef.current.forEach(osc => {
      try {
        osc.stop();
      } catch  {
        // Bỏ qua nếu oscillator chưa start hoặc đã stop rồi
      }
    });
    activeOscillatorsRef.current = [];

    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch  {
        // Bỏ qua lỗi close
      }
      audioCtxRef.current = null;
    }
    setIsPlayingSong(false);
  };

  const handleFinish = () => {
    stopSong();
    const duration = Math.round((Date.now() - startTime) / 1000);
    
    if (onProgressUpdate) onProgressUpdate(100);

    onComplete({
      score: 100, // Hoàn thành nghe là 100 điểm
      duration,
      rawPayload: {
        action: 'completed_listening',
        times_played: playCount,
        listened_to_full_song: playCount > 0
      }
    });
  };

  const isCdaNhaThuongNhau = activity.id === 'an-hat-2';

  // Hiển thị đầy đủ 7 nốt nhạc cơ bản làm đàn piano mini nếu là bài Cả nhà thương nhau
  const notesToShow = isCdaNhaThuongNhau
    ? [
        { name: 'Đồ (C)', frequency: 261.63 },
        { name: 'Rê (D)', frequency: 293.66 },
        { name: 'Mi (E)', frequency: 329.63 },
        { name: 'Fa (F)', frequency: 349.23 },
        { name: 'Sol (G)', frequency: 392.00 },
        { name: 'La (A)', frequency: 440.00 },
        { name: 'Si (B)', frequency: 493.88 }
      ]
    : activity.data?.notes && Array.isArray(activity.data.notes)
      ? activity.data.notes
      : [];

  const hasNotes = notesToShow.length > 0;

  return (
    <div className="text-center w-full max-w-2xl mx-auto flex flex-col items-center">
      <div className="mb-6">
        <h3 className="text-3xl font-black text-slate-800 mb-2">{activity.title}</h3>
        <p className="text-slate-500 font-bold text-sm">{activity.instructions}</p>
      </div>

      {/* Nút phát toàn bộ bài hát dành riêng cho bài Cả nhà thương nhau */}
      {isCdaNhaThuongNhau && (
        <button
          onClick={playSongMelody}
          className={`mb-6 tactile-btn text-base py-3 px-6 select-none animate-pulse ${
            isPlayingSong 
              ? 'bg-red-500 text-white hover:bg-red-600' 
              : `bg-amber-450 hover:bg-amber-500 text-slate-800`
          }`}
          style={!isPlayingSong ? { backgroundColor: '#fbbf24', borderColor: '#0f172a' } : undefined}
        >
          {isPlayingSong ? (
            <>
              <IoStop className="text-xl" />
              Dừng nghe giai điệu
            </>
          ) : (
            <>
              <IoMusicalNotes className="text-xl animate-bounce" />
              🎹 Nghe cả bài hát (Piano Cover) 🎶
            </>
          )}
        </button>
      )}

      <div className={`w-full border-4 border-slate-800 rounded-3xl p-8 shadow-[6px_6px_0px_0px_#1e293b] mb-8 bg-white/70 ${theme.bgLight10}`}>
        {hasNotes ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {notesToShow.map((note: { name: string; frequency: number }, idx: number) => {
              const musicEmojis = ['🎵', '🎶', '🎼', '🎹', '🔔', '🎷', '🎸', '🎺'];
              const emoji = musicEmojis[idx % musicEmojis.length];
              const isActive = matchNote(note.name, activeNoteName);
              return (
                <button
                  key={idx}
                  onClick={() => playNote(note.frequency)}
                  className={`flex flex-col items-center justify-center p-5 rounded-2xl border-3 border-slate-800 transition-all cursor-pointer select-none ${
                    isActive 
                      ? `${theme.bg} text-white translate-y-[4px] shadow-[1px_1px_0px_0px_#1e293b] scale-98`
                      : `bg-white text-slate-800 shadow-[4px_4px_0px_0px_#1e293b] hover:${theme.bgLight50} active:translate-y-[4px] active:shadow-[1px_1px_0px_0px_#1e293b]`
                  }`}
                >
                  <span className={`text-4xl mb-2 select-none ${isActive ? 'animate-bounce' : ''}`} role="img" aria-label="music">{emoji}</span>
                  <span className={`font-extrabold text-lg ${isActive ? 'text-white' : 'text-slate-800'}`}>{note.name}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <button 
            className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 cursor-pointer hover:scale-105 active:scale-95 transition-transform border-4 border-slate-800 shadow-[4px_4px_0px_0px_#1e293b] active:translate-y-1 active:shadow-[1px_1px_0px_0px_#1e293b] ${theme.bg}`} 
            onClick={() => playNote(440)}
            aria-label="Play Note"
          >
            <IoPlay className="text-white text-4xl ml-1.5" />
          </button>
        )}
      </div>

      <button
        onClick={handleFinish}
        className={`tactile-btn ${theme.tactileBtn} text-lg px-8 py-3.5`}
      >
        {hasNotes ? 'Hoàn thành bài nghe' : 'Đã nghe xong'}
      </button>
    </div>
  );
};
