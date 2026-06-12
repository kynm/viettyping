'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { BookOpen, Keyboard, Volume2, VolumeX, Moon, Sun, Sparkles, RefreshCw, Eye, EyeOff, Play, Pause, ArrowRight, Video, Palette, Settings, Lightbulb } from 'lucide-react';
import AsmrKeyboard from '@/components/AsmrKeyboard';
import AsmrVisualizer from '@/components/AsmrVisualizer';
import FingersVisualizer from '@/components/FingersVisualizer';
import { useSound } from '@/contexts/SoundContext';
import { stringToTelexKeys, buildCharMappings, CharMapping } from '@/utils/telex';
import VisualWorldBackground from '@/components/VisualWorldBackground';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700', '800']
});

// Các bài thơ thiếu nhi cấu hình song song Có Dấu và Không Dấu
const zenTexts = [
  {
    title: "Tiết Kiệm Điện Năng 2026",
    withDiacritics: "Tắt điện khi ra ngoài\nTiết kiệm nước mỗi ngày\nĐiện mặt trời tỏa nắng\nTương lai xanh từ đây",
    withoutDiacritics: "Tat dien khi ra ngoai\nTiet kiem nuoc moi ngay\nDien mat troi toa nang\nTuong lai xanh tu day"
  },
  {
    title: "Hạt Mưa Tinh Nghịch",
    withDiacritics: "Hạt mưa tinh nghịch\nTừ trời rơi xuống\nTưới mát ruộng đồng\nCho cây xanh lá",
    withoutDiacritics: "Hat mua tinh nghich\nTu troi roi xuong\nTuoi mat ruong dong\nCho cay xanh la"
  },
  {
    title: "Trăng Ơi Từ Đâu Đến",
    withDiacritics: "Trăng ơi từ đâu đến\nHay từ một sân chơi\nTrăng bay như quả bóng\nBạn nào đã lên trời",
    withoutDiacritics: "Trang oi tu dau den\nHay tu mot san choi\nTrang bay nhu qua bong\nBan nao da len troi"
  },
  {
    title: "Nắng Mai Lấp Lánh",
    withDiacritics: "Gió thổi nhè nhẹ\nHoa cười lung linh\nNắng mai lấp lánh\nĐón chào bình minh",
    withoutDiacritics: "Gio thoi nhe nhe\nHoa cuoi lung linh\nNang mai lap lanh\nDon chao binh minh"
  },
  {
    title: "Luyện Tập Phím Cơ Bản",
    withDiacritics: "asdf jkl; asdf jkl;\na s d f j k l ;\nfj fj dk dk sl sl am am",
    withoutDiacritics: "asdf jkl; asdf jkl;\na s d f j k l ;\nfj fj dk dk sl sl am am"
  }
];

export default function AsmrPage() {
  const { playSound } = useSound();

  // Trạng thái cấu hình thiết bị
  const [keyboardType, setKeyboardType] = useState<'mechanical' | 'membrane'>('mechanical');
  const [switchType, setSwitchType] = useState<'blue' | 'red' | 'brown'>('blue');
  const [is3d, setIs3d] = useState<boolean>(false); // Tắt 3D mặc định
  const [ledMode, setLedMode] = useState<'rgb' | 'warm' | 'cool' | 'off'>('rgb');

  // Âm thanh nền & âm lượng
  const [ambientSound, setAmbientSound] = useState<'rain' | 'campfire' | 'none'>('rain'); // Mặc định tự động phát tiếng mưa
  const [typingVolume, setTypingVolume] = useState<number>(0.7);
  const [ambientVolume, setAmbientVolume] = useState<number>(0.3);
  const [isAudioInitialized, setIsAudioInitialized] = useState<boolean>(false);

  // Trạng thái gõ phím tương tác
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
  const [triggerSignal, setTriggerSignal] = useState<number>(0);
  const [highlightKey, setHighlightKey] = useState<string | null>(null);

  // Trạng thái bài gõ Zen
  const [currentTextIndex, setCurrentTextIndex] = useState<number>(0);
  const [showFingers, setShowFingers] = useState<boolean>(false); // Tắt show ngón tay mặc định

  // Trạng thái Bật/Tắt Có Dấu
  const [isAccented, setIsAccented] = useState<boolean>(true);

  // Trạng thái tự động gõ (Auto-Play Mode)
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(true); // Tự động phát gõ phím ASMR khi vào trang
  const [autoPlayWpm, setAutoPlayWpm] = useState<number>(60);

  // Số phím đã gõ đúng theo kiểu Telex
  const [correctKeysCount, setCorrectKeysCount] = useState<number>(0);

  // Refs để lưu trữ trạng thái thay đổi liên tục giúp chạy mượt vòng lặp Auto-Play
  const correctKeysCountRef = useRef<number>(0);
  const autoPlayWpmRef = useRef<number>(60);

  // Web Audio & Timers Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const rainNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const rainGainRef = useRef<GainNode | null>(null);
  const campfireNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const campfireGainRef = useRef<GainNode | null>(null);
  const campfireIntervalRef = useRef<number | null>(null);
  const autoPlayTimeoutRef = useRef<number | null>(null);

  const currentText = zenTexts[currentTextIndex];
  // Văn bản hiển thị trên màn hình
  const currentTextContent = isAccented ? currentText.withDiacritics : currentText.withoutDiacritics;

  // Dùng Telex utilities để dịch toàn bộ bài gõ thành chuỗi các phím cần nhấn thực tế
  const targetTelexKeys = useMemo(() => stringToTelexKeys(currentTextContent), [currentTextContent]);
  const charMappings = useMemo(() => buildCharMappings(currentTextContent), [currentTextContent]);

  // Tách charMappings thành từng dòng dựa trên ký tự xuống dòng '\n' để hiển thị xuống dòng chuẩn xác
  const lines = useMemo(() => {
    const result: CharMapping[][] = [];
    let currentLine: CharMapping[] = [];
    charMappings.forEach((mapping) => {
      currentLine.push(mapping);
      if (mapping.char === '\n') {
        result.push(currentLine);
        currentLine = [];
      }
    });
    if (currentLine.length > 0) {
      result.push(currentLine);
    }
    return result;
  }, [charMappings]);

  // Đồng bộ correctKeysCount và autoPlayWpm vào Refs
  useEffect(() => {
    correctKeysCountRef.current = correctKeysCount;
  }, [correctKeysCount]);

  useEffect(() => {
    autoPlayWpmRef.current = autoPlayWpm;
  }, [autoPlayWpm]);

  // Bộ tổng hợp tiếng mưa rơi (Rain Synthesizer) dùng Pink/White Noise
  const startAmbient = useCallback((type: 'rain' | 'campfire', ctx: AudioContext) => {
    if (!ctx) return;

    // Dọn dẹp ambient cũ
    if (rainNodeRef.current) { try { rainNodeRef.current.stop(); } catch (e) { } rainNodeRef.current = null; }
    if (campfireNodeRef.current) { try { campfireNodeRef.current.stop(); } catch (e) { } campfireNodeRef.current = null; }
    if (campfireIntervalRef.current) { clearTimeout(campfireIntervalRef.current); campfireIntervalRef.current = null; }

    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      data[i] *= 0.11;
      b6 = white * 0.115926;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(ambientVolume, ctx.currentTime);

    const filter = ctx.createBiquadFilter();
    filter.type = type === 'rain' ? 'lowpass' : 'bandpass';
    filter.frequency.setValueAtTime(type === 'rain' ? 800 : 400, ctx.currentTime);
    if (type === 'campfire') filter.Q.setValueAtTime(1.5, ctx.currentTime);

    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    source.start(0);

    if (type === 'rain') {
      rainNodeRef.current = source;
      rainGainRef.current = gainNode;
    } else {
      campfireNodeRef.current = source;
      campfireGainRef.current = gainNode;

      const playCrackle = () => {
        if (!audioContextRef.current) return;
        const cCtx = audioContextRef.current;
        const now = cCtx.currentTime;

        const osc = cCtx.createOscillator();
        const cGain = cCtx.createGain();
        osc.connect(cGain);
        cGain.connect(cCtx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1500 + Math.random() * 1200, now);

        cGain.gain.setValueAtTime(0.01 + Math.random() * 0.04, now);
        cGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.005 + Math.random() * 0.01);

        osc.start(now);
        osc.stop(now + 0.02);

        campfireIntervalRef.current = window.setTimeout(playCrackle, 100 + Math.random() * 800);
      };

      playCrackle();
    }
  }, [ambientVolume]);

  const stopAmbient = useCallback(() => {
    if (rainNodeRef.current) {
      try { rainNodeRef.current.stop(); } catch (e) { }
      rainNodeRef.current = null;
    }
    if (campfireNodeRef.current) {
      try { campfireNodeRef.current.stop(); } catch (e) { }
      campfireNodeRef.current = null;
    }
    if (campfireIntervalRef.current) {
      clearTimeout(campfireIntervalRef.current);
      campfireIntervalRef.current = null;
    }
  }, []);

  // Khởi tạo Audio Context khi người dùng tương tác lần đầu
  const initAudio = useCallback(() => {
    if (isAudioInitialized) {
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
      return;
    }

    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      const ctx = new AudioContextClass();
      audioContextRef.current = ctx; 
      setIsAudioInitialized(true);

      if (ambientSound !== 'none') {
        startAmbient(ambientSound, ctx);
      }
    }
  }, [isAudioInitialized, ambientSound, startAmbient]);

  // Tự động kích hoạt âm thanh khi vào trang
  useEffect(() => {
    const timer = setTimeout(() => {
      initAudio();
    }, 150);
    return () => clearTimeout(timer);
  }, [initAudio]);

  // Cập nhật phím cần gõ tiếp theo (highlight) theo danh sách phím Telex chuẩn
  useEffect(() => {
    if (correctKeysCount < targetTelexKeys.length) {
      const nextKey = targetTelexKeys[correctKeysCount];
      // Chuyển ký tự xuống dòng thành phím Enter để bàn phím ảo highlight đúng phím
      setHighlightKey(nextKey === '\n' ? 'Enter' : nextKey);
    } else {
      setHighlightKey(null);
    }
  }, [correctKeysCount, targetTelexKeys]);

  // Điều chỉnh âm lượng nhạc nền
  useEffect(() => {
    if (rainGainRef.current && audioContextRef.current) {
      rainGainRef.current.gain.setValueAtTime(ambientVolume, audioContextRef.current.currentTime);
    }
    if (campfireGainRef.current && audioContextRef.current) {
      campfireGainRef.current.gain.setValueAtTime(ambientVolume, audioContextRef.current.currentTime);
    }
  }, [ambientVolume]);

  // Bật/tắt nhạc nền dựa vào thay đổi state
  useEffect(() => {
    if (isAudioInitialized && audioContextRef.current) {
      if (ambientSound === 'none') {
        stopAmbient();
      } else {
        startAmbient(ambientSound, audioContextRef.current);
      }
    }
    return () => stopAmbient();
  }, [ambientSound, isAudioInitialized, startAmbient, stopAmbient]);

  // BỘ TỔNG HỢP ÂM THANH GÕ PHÍM (ASMR Keyboard Synthesizer)
  const synthesizeKeystroke = useCallback((key: string, isDownstroke: boolean) => {
    const ctx = audioContextRef.current;
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;
    const lowerKey = key.toLowerCase();

    const pitchSkew = 0.95 + Math.random() * 0.1;
    const volSkew = 0.9 + Math.random() * 0.2;
    const finalVolume = typingVolume * volSkew;

    if (isDownstroke) {
      // 1. Âm thanh đập đáy phím nhựa (Bottom-out Sound)
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.type = 'triangle';

      let baseFreq = 180;
      let decay = 0.06;

      if (keyboardType === 'membrane') {
        baseFreq = 120;
        decay = 0.09;
      } else {
        if (switchType === 'red') {
          baseFreq = 200;
          decay = 0.07;
        } else if (switchType === 'brown') {
          baseFreq = 160;
          decay = 0.045;
        } else {
          baseFreq = 185;
          decay = 0.055;
        }
      }

      if (lowerKey === ' ' || lowerKey === 'space') {
        baseFreq *= 0.65;
        decay *= 1.5;
      } else if (lowerKey === 'backspace' || lowerKey === 'enter' || lowerKey === '\n') {
        baseFreq *= 0.8;
        decay *= 1.2;
      }

      baseFreq *= pitchSkew;

      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(10, now + decay);

      gainNode.gain.setValueAtTime(finalVolume * 0.35, now);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + decay);

      osc.start(now);
      osc.stop(now + decay + 0.05);

      // 2. Tiếng ồn đục của vỏ phím
      const noise = ctx.createBufferSource();
      const noiseGain = ctx.createGain();
      const noiseFilter = ctx.createBiquadFilter();

      const nBufferSize = ctx.sampleRate * 0.1;
      const nBuffer = ctx.createBuffer(1, nBufferSize, ctx.sampleRate);
      const nData = nBuffer.getChannelData(0);
      for (let i = 0; i < nBufferSize; i++) {
        nData[i] = Math.random() * 2 - 1;
      }

      noise.buffer = nBuffer;
      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      noiseFilter.type = 'lowpass';
      const filterCutoff = keyboardType === 'membrane' ? 280 : (switchType === 'red' ? 550 : 650);
      noiseFilter.frequency.setValueAtTime(filterCutoff * pitchSkew, now);

      noiseGain.gain.setValueAtTime(finalVolume * (keyboardType === 'membrane' ? 0.15 : 0.22), now);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + decay * 0.8);

      noise.start(now);
      noise.stop(now + decay + 0.05);

      // 3. Tiếng "Click" cơ khí đanh gọn (Chỉ Blue Switch Mechanical)
      if (keyboardType === 'mechanical' && switchType === 'blue' && lowerKey !== ' ' && lowerKey !== 'space') {
        const clickOsc = ctx.createOscillator();
        const clickGain = ctx.createGain();
        const clickFilter = ctx.createBiquadFilter();

        clickOsc.connect(clickFilter);
        clickFilter.connect(clickGain);
        clickGain.connect(ctx.destination);

        clickOsc.type = 'sawtooth';
        clickOsc.frequency.setValueAtTime(3200 * pitchSkew, now);

        clickFilter.type = 'bandpass';
        clickFilter.frequency.setValueAtTime(3800 * pitchSkew, now);
        clickFilter.Q.setValueAtTime(6, now);

        clickGain.gain.setValueAtTime(finalVolume * 0.42, now);
        clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.008);

        clickOsc.start(now);
        clickOsc.stop(now + 0.03);
      }
    } else {
      // UPSTROKE (Tiếng nảy phím lên)
      const upOsc = ctx.createOscillator();
      const upGain = ctx.createGain();

      upOsc.connect(upGain);
      upGain.connect(ctx.destination);

      upOsc.type = 'sine';
      let upFreq = keyboardType === 'membrane' ? 180 : 300;
      let upDecay = keyboardType === 'membrane' ? 0.03 : 0.02;

      if (lowerKey === ' ' || lowerKey === 'space') {
        upFreq *= 0.6;
        upDecay *= 1.5;
      }

      upOsc.frequency.setValueAtTime(upFreq * pitchSkew, now);

      upGain.gain.setValueAtTime(finalVolume * (keyboardType === 'membrane' ? 0.06 : 0.12), now);
      upGain.gain.exponentialRampToValueAtTime(0.0001, now + upDecay);

      upOsc.start(now);
      upOsc.stop(now + upDecay + 0.02);
    }
  }, [keyboardType, switchType, typingVolume]);

  const handleNextText = useCallback(() => {
    setCorrectKeysCount(0);
    setCurrentTextIndex((prev) => (prev + 1) % zenTexts.length);
    initAudio();
  }, [initAudio]);

  const handleResetZen = useCallback(() => {
    setCorrectKeysCount(0);
    initAudio();
  }, [initAudio]);

  const handleStartViralDemo = useCallback(() => {
    setCorrectKeysCount(0);

    let ctx = audioContextRef.current;
    if (!ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        ctx = new AudioContextClass();
        audioContextRef.current = ctx;
        setIsAudioInitialized(true);
      }
    }

    setKeyboardType('mechanical');
    setSwitchType('blue');
    setIs3d(true);
    setLedMode('rgb');

    setAmbientSound('rain');
    if (ctx) {
      startAmbient('rain', ctx);
    }

    setAutoPlayWpm(80);
    setIsAutoPlaying(true);

    playSound('click');
  }, [playSound, startAmbient]);

  // VÒNG LẶP TỰ ĐỘNG GÕ ASMR (AUTO-PLAY EFFECT) - GÕ LẦN LƯỢT TỪNG PHÍM TELEX THẬT SỰ
  useEffect(() => {
    if (!isAutoPlaying) {
      if (autoPlayTimeoutRef.current) {
        clearTimeout(autoPlayTimeoutRef.current);
        autoPlayTimeoutRef.current = null;
      }
      return;
    }

    const typeNextKey = () => {
      const currentKeys = targetTelexKeys;
      const currentIndex = correctKeysCountRef.current;

      // Đã gõ hoàn thành toàn bộ bài thơ
      if (currentIndex >= currentKeys.length) {
        autoPlayTimeoutRef.current = window.setTimeout(() => {
          handleNextText();
        }, 2200);
        return;
      }

      const keyToType = currentKeys[currentIndex];
      let keyToRegister = keyToType.toLowerCase();

      if (keyToType === '\n') keyToRegister = 'enter';
      else if (keyToType === ' ') keyToRegister = ' ';

      if (!isAudioInitialized) {
        initAudio();
      }

      // 1. Nhấn phím xuống (Downstroke)
      synthesizeKeystroke(keyToType, true);
      setTriggerSignal((prev) => prev + 1);

      setActiveKeys((prev) => {
        const next = new Set(prev);
        next.add(keyToRegister);
        return next;
      });

      // Tăng tiến trình phím đã gõ lên
      setCorrectKeysCount((prev) => prev + 1);

      // Phát âm thanh hoàn thành khi gõ hết
      if (currentIndex + 1 === currentKeys.length) {
        setTimeout(() => {
          playSound('complete');
        }, 150);
      }

      // 2. Nhả phím lên sau 85ms (Upstroke)
      setTimeout(() => {
        synthesizeKeystroke(keyToType, false);
        setActiveKeys((prev) => {
          const next = new Set(prev);
          next.delete(keyToRegister);
          return next;
        });
      }, 85);

      // Tính khoảng delay dựa trên WPM
      const currentWpm = autoPlayWpmRef.current;
      const msPerChar = 60000 / (currentWpm * 5);

      const randomVariance = (Math.random() * 0.4 - 0.2) * msPerChar;
      const nextDelay = Math.max(85, msPerChar + randomVariance);

      autoPlayTimeoutRef.current = window.setTimeout(typeNextKey, nextDelay);
    };

    autoPlayTimeoutRef.current = window.setTimeout(typeNextKey, 600);

    return () => {
      if (autoPlayTimeoutRef.current) {
        clearTimeout(autoPlayTimeoutRef.current);
      }
    };
  }, [isAutoPlaying, currentTextIndex, targetTelexKeys, isAudioInitialized, handleNextText, initAudio, playSound, synthesizeKeystroke]);

  // XỬ LÝ SO KHỚP PHÍM VẬT LÝ TELEX ĐỘNG
  const handleZenTyping = useCallback((key: string) => {
    const currentKeys = targetTelexKeys;
    const currentIndex = correctKeysCountRef.current;

    if (currentIndex >= currentKeys.length) return;

    const targetKey = currentKeys[currentIndex];
    let isCorrect = false;

    if (key === 'Backspace') {
      setCorrectKeysCount((prev) => Math.max(0, prev - 1));
      return;
    }

    // So khớp phím gõ
    if (key === 'Enter' && (targetKey === '\n' || targetKey === 'Enter')) {
      isCorrect = true;
    } else if (key === ' ' && targetKey === ' ') {
      isCorrect = true;
    } else if (key.toLowerCase() === targetKey.toLowerCase()) {
      isCorrect = true;
    }

    if (isCorrect) {
      setCorrectKeysCount((prev) => prev + 1);

      if (currentIndex + 1 === currentKeys.length) {
        setTimeout(() => {
          playSound('complete');
        }, 150);
      }
    }
  }, [targetTelexKeys, playSound]);

  // XỬ LÝ GÕ PHÍM VẬT LÝ CỦA NGƯỜI DÙNG
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isAutoPlaying) return;

      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === ' ' || e.key === 'Backspace' || e.key === 'Tab') {
        e.preventDefault();
      }

      const keyLower = e.key.toLowerCase();
      let keyToRegister = keyLower;
      if (e.key === ' ') keyToRegister = ' ';
      else if (e.key === 'Enter') keyToRegister = 'enter';

      if (!isAudioInitialized) {
        initAudio();
      }

      if (!activeKeys.has(keyToRegister)) {
        synthesizeKeystroke(e.key, true);
        setTriggerSignal((prev) => prev + 1);
        handleZenTyping(e.key);
      }

      setActiveKeys((prev) => {
        const next = new Set(prev);
        next.add(keyToRegister);
        return next;
      });
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (isAutoPlaying) return;

      const keyLower = e.key.toLowerCase();
      let keyToRegister = keyLower;
      if (e.key === ' ') keyToRegister = ' ';
      else if (e.key === 'Enter') keyToRegister = 'enter';

      if (activeKeys.has(keyToRegister)) {
        synthesizeKeystroke(e.key, false);
      }

      setActiveKeys((prev) => {
        const next = new Set(prev);
        next.delete(keyToRegister);
        return next;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [activeKeys, isAudioInitialized, isAutoPlaying, initAudio, synthesizeKeystroke, handleZenTyping]);

  return (
    <VisualWorldBackground>
      <main
        onClick={initAudio}
        className={`min-h-screen relative overflow-hidden pb-8 flex flex-col justify-between ${plusJakartaSans.className} text-[var(--color-foreground)] z-10`}
      >

        {/* ----------------- HEADER: ĐIỀU HƯỚNG & KHỞI TẠO ----------------- */}
        <header className="w-full max-w-6xl mx-auto px-6 pt-4 relative z-10 flex flex-col sm:flex-row justify-between items-center gap-2 border-b-2 border-dashed border-[var(--color-foreground)]/10 pb-4 mb-2">
          <div className="flex gap-4 w-full sm:w-auto justify-start">
            <Link
              href="/typing"
              onClick={() => { playSound('click'); stopAmbient(); }}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-[var(--color-surface)] border-2 border-[var(--color-foreground)] rounded-2xl shadow-[3px_3px_0px_0px_var(--color-foreground)] hover:translate-y-[-1.5px] active:translate-y-[1.5px] active:shadow-none transition-all text-[var(--color-foreground)] font-black text-xs cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-indigo-500" /> Trở lại luyện gõ
            </Link>
          </div>

          {!isAudioInitialized && (
            <motion.button
              onClick={initAudio}
              animate={{ scale: [1, 1.03, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="px-4 py-2.5 text-xs font-black bg-[var(--color-accent)] border-2 border-[var(--color-foreground)] shadow-[3px_3px_0px_0px_var(--color-foreground)] hover:translate-y-[-1.5px] active:translate-y-[1.5px] active:shadow-none text-slate-900 rounded-2xl flex items-center gap-1.5 cursor-pointer z-50 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              Nhấn để bật Âm thanh ASMR
            </motion.button>
          )}
        </header>

        {/* ----------------- MAIN LAYOUT CONTENT ----------------- */}
        <section className="w-full max-w-5xl mx-auto px-4 py-2 relative z-10 flex flex-col gap-4 flex-grow justify-center">

          {/* KHU VỰC 1: TRÌNH GÕ CHỮ ZEN (ZEN WRITING SPACE) */}
          <div className="bg-[var(--color-surface)] border-3 border-[var(--color-foreground)] rounded-[24px] p-5 shadow-[6px_6px_0px_0px_var(--color-foreground)] flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b-2 border-dashed border-[var(--color-foreground)]/10 pb-2">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-500" />
                <span className="text-sm font-bold text-indigo-500">Đang gõ:</span>
                <span className="text-sm font-black text-[var(--color-foreground)]">{currentText.title}</span>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
                {/* Nút Toggle Có Dấu/Không Dấu */}
                <button
                  onClick={() => {
                    setIsAccented(!isAccented);
                    setCorrectKeysCount(0);
                    playSound('click');
                  }}
                  className={`px-3 py-2 text-xs font-black rounded-xl border-2 flex items-center gap-1.5 transition-all cursor-pointer select-none hover:translate-y-[-1.5px] active:translate-y-[1.5px] active:shadow-none
                  ${isAccented
                      ? 'bg-indigo-500 text-white border-[var(--color-foreground)] shadow-[2.5px_2.5px_0px_0px_var(--color-foreground)]'
                      : 'bg-[var(--color-surface)] text-[var(--color-foreground)] border-[var(--color-foreground)]/30 hover:border-[var(--color-foreground)]'}`}
                >
                  <span>{isAccented ? 'Có dấu' : 'Không dấu'}</span>
                </button>

                <div className="w-[1px] h-4 bg-[var(--color-foreground)]/10" />

                {/* Nút Quay Video Viral (Auto ASMR) */}
                <button
                  onClick={handleStartViralDemo}
                  className="px-3.5 py-2 text-xs font-black rounded-xl bg-purple-500 text-white border-2 border-[var(--color-foreground)] shadow-[2.5px_2.5px_0px_0px_var(--color-foreground)] hover:translate-y-[-1.5px] active:translate-y-[1.5px] active:shadow-none transition-all cursor-pointer select-none"
                >
                  <Video className="w-4 h-4" />
                </button>

                {/* Nút Auto-Play (Tự động gõ ASMR) */}
                <button
                  onClick={() => {
                    initAudio();
                    setIsAutoPlaying(!isAutoPlaying);
                    playSound('click');
                  }}
                  className={`px-3 py-2 text-xs font-black rounded-xl border-2 flex items-center gap-1.5 transition-all cursor-pointer select-none hover:translate-y-[-1.5px] active:translate-y-[1.5px] active:shadow-none
                  ${isAutoPlaying
                      ? 'bg-emerald-500 text-white border-[var(--color-foreground)] shadow-[2.5px_2.5px_0px_0px_var(--color-foreground)]'
                      : 'bg-[var(--color-surface)] text-[var(--color-foreground)] border-[var(--color-foreground)]/30 hover:border-[var(--color-foreground)]'}`}
                >
                  {isAutoPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isAutoPlaying ? 'Dừng tự gõ' : 'Tự động gõ'}</span>
                </button>

                {/* Điều khiển tốc độ WPM của Auto-Play */}
                {isAutoPlaying && (
                  <div className="flex items-center gap-2 text-[11px] text-[var(--color-foreground)]/70 font-mono bg-[var(--color-surface-container)] px-2 py-1.5 rounded-xl border-2 border-[var(--color-foreground)]/10">
                    <span>Tốc độ:</span>
                    <input
                      type="range"
                      min="35"
                      max="140"
                      step="5"
                      value={autoPlayWpm}
                      onChange={(e) => setAutoPlayWpm(parseInt(e.target.value))}
                      className="w-16 h-1 bg-[var(--color-foreground)]/10 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                    <span className="text-emerald-600 font-bold">{autoPlayWpm} WPM</span>
                  </div>
                )}

                <div className="w-[1px] h-4 bg-[var(--color-foreground)]/10 hidden sm:block" />

                <button
                  onClick={handleResetZen}
                  title="Gõ lại từ đầu"
                  className="p-2 rounded-xl bg-[var(--color-surface)] border-2 border-[var(--color-foreground)] shadow-[2.5px_2.5px_0px_0px_var(--color-foreground)] text-[var(--color-foreground)] hover:translate-y-[-1.5px] active:translate-y-[1.5px] active:shadow-none transition-all cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextText}
                  className="px-3 py-2 text-xs font-black rounded-xl bg-indigo-500 text-white border-2 border-[var(--color-foreground)] hover:translate-y-[-1.5px] active:translate-y-[1.5px] active:shadow-none transition-all cursor-pointer flex items-center gap-1 shadow-[2.5px_2.5px_0px_0px_var(--color-foreground)]"
                >
                  <span>Đổi bài thơ</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Vùng văn bản hiển thị gõ theo nhịp */}
          <div className="relative font-mono text-lg md:text-xl leading-relaxed tracking-normal py-4 px-5 bg-[var(--color-surface-container)] rounded-2xl border-2 border-[var(--color-foreground)] text-center select-none min-h-[100px] flex flex-col justify-center items-center shadow-inner">
              {isAutoPlaying && (
                <div className="absolute top-2 left-3 text-[10px] text-emerald-600 font-mono flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>Đang tự phát ASMR...</span>
                </div>
              )}

              <div className="flex flex-col items-center gap-3 w-full">
                {lines.map((line, lineIdx) => (
                  <div key={lineIdx} className="flex flex-wrap justify-center items-center leading-relaxed">
                    {line.map((mapping, index) => {
                      if (mapping.char === '\n') {
                        const isCorrect = correctKeysCount >= mapping.endIndex;
                        const isCurrent = correctKeysCount >= mapping.startIndex && correctKeysCount < mapping.endIndex;

                        let charClass = "text-[var(--color-foreground)]/20";
                        if (isCorrect) {
                          charClass = "text-[var(--color-primary)]/30";
                        } else if (isCurrent) {
                          charClass = "text-[var(--color-accent)] font-extrabold animate-pulse drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]";
                        }

                        return (
                          <span key={index} className={`${charClass} text-[11px] font-sans mx-2 select-none relative inline-block`}>
                            {isCurrent ? '⏎ Nhấn Enter' : '⏎'}
                          </span>
                        );
                      }

                      const isCorrect = correctKeysCount >= mapping.endIndex;
                      const isCurrent = correctKeysCount >= mapping.startIndex && correctKeysCount < mapping.endIndex;

                      let charClass = "text-[var(--color-foreground)]/70";
                      if (isCorrect) {
                        charClass = "text-[var(--color-primary)] font-bold drop-shadow-[0_0_4px_rgba(0,109,48,0.3)]";
                      } else if (isCurrent) {
                        charClass = "bg-[var(--color-accent)]/30 border-b-2 border-[var(--color-accent)] animate-pulse px-[1px] text-[var(--color-foreground)] font-extrabold";
                      }

                      return (
                        <span key={index} className={`${charClass} relative inline-block ${mapping.char === ' ' ? 'mx-1.5' : 'mx-[0.5px]'} transition-all`}>
                          {mapping.char}

                          {/* Bong bóng Telex hiển thị khi phím đang gõ là từ tiếng Việt có dấu phức tạp */}
                          {isCurrent && mapping.telexKeys.length > 1 && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-yellow-400 text-slate-900 text-[10px] px-2.5 py-1.5 rounded-xl font-bold shadow-lg animate-bounce-subtle whitespace-nowrap z-30 pointer-events-none flex items-center gap-1 border-2 border-yellow-300">
                              {mapping.telexKeys.map((telexKey, keyIdx) => {
                                const currentSubIndex = correctKeysCount - mapping.startIndex;
                                const isKeyTyped = keyIdx < currentSubIndex;
                                const isCurrentSubKey = keyIdx === currentSubIndex;
                                return (
                                  <React.Fragment key={keyIdx}>
                                    {keyIdx > 0 && <span className="text-yellow-800 text-[9px] font-normal">+</span>}
                                    <span
                                      className={`px-1.5 py-0.5 rounded font-mono text-[11px] leading-none ${isCurrentSubKey
                                        ? 'bg-blue-600 text-white ring-2 ring-blue-300 font-extrabold scale-110'
                                        : isKeyTyped
                                          ? 'text-slate-400 line-through font-normal'
                                          : 'bg-yellow-300 text-slate-700 font-semibold'
                                        }`}
                                    >
                                      {telexKey}
                                    </span>
                                  </React.Fragment>
                                );
                              })}
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-yellow-400" />
                            </div>
                          )}
                        </span>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Thông báo hoàn thành thơ */}
              {correctKeysCount === targetTelexKeys.length && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute inset-0 bg-[var(--color-surface)]/95 rounded-2xl flex flex-col items-center justify-center gap-2 border-2 border-[var(--color-primary)]/30"
                >
                  <span className="text-2xl font-black text-[var(--color-primary)]">🎉 Bé thật giỏi! 🎉</span>
                  <p className="text-xs text-[var(--color-foreground)]/70">Âm thanh gõ phím thật nhịp nhàng, êm ái đúng không bé?</p>
                  <button
                    onClick={handleNextText}
                    className="mt-2 px-4 py-2 text-xs font-black bg-[var(--color-primary)] text-white rounded-xl shadow-[3px_3px_0px_0px_var(--color-foreground)] border-2 border-[var(--color-foreground)] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
                  >
                    Gõ bài tiếp theo thôi!
                  </button>
                </motion.div>
              )}
            </div>
          </div>

          {/* KHU VỰC 3: BÀN PHÍM VÀ PANEL ĐIỀU KHIỂN */}
          <div className="flex flex-col gap-4">
            <AsmrKeyboard
              activeKeys={activeKeys}
              keyboardType={keyboardType}
              switchType={switchType}
              is3d={is3d}
              ledMode={ledMode}
              highlightKey={highlightKey}
            />

            {/* BẢNG ĐIỀU KHIỂN TÙY CHỌN (ASMR CONTROLS) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[var(--color-surface)] border-3 border-[var(--color-foreground)] rounded-[24px] p-5 shadow-[6px_6px_0px_0px_var(--color-foreground)]">

              {/* Cột 1: Cấu hình Bàn Phím */}
              <div className="flex flex-col gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-500 flex items-center gap-1.5">
                  <Settings className="w-4 h-4 text-indigo-500" /> Loại Bàn Phím
                </span>

                <div className="grid grid-cols-2 gap-2 bg-[var(--color-surface-container)]/30 p-1.5 rounded-xl border-2 border-[var(--color-foreground)]/10">
                  <button
                    onClick={() => { setKeyboardType('mechanical'); playSound('click'); }}
                    className={`py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer hover:translate-y-[-0.5px] active:translate-y-[0.5px] ${keyboardType === 'mechanical' ? 'bg-[var(--color-primary)] text-white border-2 border-[var(--color-foreground)] shadow-[1px_2px_0px_0px_var(--color-foreground)]' : 'text-slate-500 hover:text-slate-700 bg-[var(--color-surface-container)]/50 border-2 border-[var(--color-foreground)]/10'}`}
                  >
                    Bàn Phím Cơ
                  </button>
                  <button
                    onClick={() => { setKeyboardType('membrane'); playSound('click'); }}
                    className={`py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer hover:translate-y-[-0.5px] active:translate-y-[0.5px] ${keyboardType === 'membrane' ? 'bg-[var(--color-primary)] text-white border-2 border-[var(--color-foreground)] shadow-[1px_2px_0px_0px_var(--color-foreground)]' : 'text-slate-500 hover:text-slate-700 bg-[var(--color-surface-container)]/50 border-2 border-[var(--color-foreground)]/10'}`}
                  >
                    Bàn Phím Màng
                  </button>
                </div>

                {/* Lựa chọn Switch */}
                <AnimatePresence mode="wait">
                  {keyboardType === 'mechanical' ? (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex flex-col gap-1.5"
                    >
                      <span className="text-[10px] text-slate-500 font-mono">Chọn loại Switch cơ:</span>
                      <div className="grid grid-cols-3 gap-1.5 bg-[var(--color-surface-container)]/30 p-1 rounded-lg border-2 border-[var(--color-foreground)]/10">
                        <button
                          onClick={() => { setSwitchType('blue'); playSound('click'); }}
                          className={`py-1 rounded text-[10px] font-black transition-all cursor-pointer hover:translate-y-[-0.5px] active:translate-y-[0.5px] ${switchType === 'blue' ? 'bg-blue-600 text-white border-2 border-[var(--color-foreground)] shadow-[1px_1.5px_0px_0px_var(--color-foreground)]' : 'text-slate-500 hover:text-slate-700 bg-[var(--color-surface-container)]/50 border-2 border-[var(--color-foreground)]/10'}`}
                        >
                          Blue (Clicky)
                        </button>
                        <button
                          onClick={() => { setSwitchType('red'); playSound('click'); }}
                          className={`py-1 rounded text-[10px] font-black transition-all cursor-pointer hover:translate-y-[-0.5px] active:translate-y-[0.5px] ${switchType === 'red' ? 'bg-red-600 text-white border-2 border-[var(--color-foreground)] shadow-[1px_1.5px_0px_0px_var(--color-foreground)]' : 'text-slate-500 hover:text-slate-700 bg-[var(--color-surface-container)]/50 border-2 border-[var(--color-foreground)]/10'}`}
                        >
                          Red (Linear)
                        </button>
                        <button
                          onClick={() => { setSwitchType('brown'); playSound('click'); }}
                          className={`py-1 rounded text-[10px] font-black transition-all cursor-pointer hover:translate-y-[-0.5px] active:translate-y-[0.5px] ${switchType === 'brown' ? 'bg-yellow-700 text-white border-2 border-[var(--color-foreground)] shadow-[1px_1.5px_0px_0px_var(--color-foreground)]' : 'text-slate-500 hover:text-slate-700 bg-[var(--color-surface-container)]/50 border-2 border-[var(--color-foreground)]/10'}`}
                        >
                          Brown (Tactile)
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="text-[11px] text-slate-500 italic leading-relaxed flex gap-1 items-start"
                    >
                      <Lightbulb className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                      <span>Bàn phím màng sử dụng các đệm cao su đàn hồi mềm mại dưới keycap, tạo ra âm thanh gõ êm ái, đục nhẹ, ít gây ồn nhất.</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Cột 2: Cấu hình Âm thanh ASMR & Âm lượng */}
              <div className="flex flex-col gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-500 flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-indigo-500" /> Âm Thanh Nền & Âm Lượng
                </span>

                <div className="grid grid-cols-3 gap-1.5 bg-[var(--color-surface-container)]/30 p-1.5 rounded-xl border-2 border-[var(--color-foreground)]/10 text-xs">
                  <button
                    onClick={() => { setAmbientSound('rain'); initAudio(); }}
                    className={`py-1 rounded-lg font-black transition-all cursor-pointer hover:translate-y-[-0.5px] active:translate-y-[0.5px] ${ambientSound === 'rain' ? 'bg-[var(--color-primary)] text-white border-2 border-[var(--color-foreground)] shadow-[1px_2px_0px_0px_var(--color-foreground)]' : 'text-slate-500 hover:text-slate-700 bg-[var(--color-surface-container)]/50 border-2 border-[var(--color-foreground)]/10'}`}
                  >
                    Mưa Rơi
                  </button>
                  <button
                    onClick={() => { setAmbientSound('campfire'); initAudio(); }}
                    className={`py-1 rounded-lg font-black transition-all cursor-pointer hover:translate-y-[-0.5px] active:translate-y-[0.5px] ${ambientSound === 'campfire' ? 'bg-[var(--color-primary)] text-white border-2 border-[var(--color-foreground)] shadow-[1px_2px_0px_0px_var(--color-foreground)]' : 'text-slate-500 hover:text-slate-700 bg-[var(--color-surface-container)]/50 border-2 border-[var(--color-foreground)]/10'}`}
                  >
                    Củi Lửa
                  </button>
                  <button
                    onClick={() => setAmbientSound('none')}
                    className={`py-1 rounded-lg font-black transition-all cursor-pointer hover:translate-y-[-0.5px] active:translate-y-[0.5px] ${ambientSound === 'none' ? 'bg-[var(--color-primary)] text-white border-2 border-[var(--color-foreground)] shadow-[1px_2px_0px_0px_var(--color-foreground)]' : 'text-slate-500 hover:text-slate-700 bg-[var(--color-surface-container)]/50 border-2 border-[var(--color-foreground)]/10'}`}
                  >
                    Tắt
                  </button>
                </div>

                {/* Thanh điều khiển âm lượng */}
                <div className="flex flex-col gap-1 mt-1 text-[10px] text-slate-500 font-mono">
                  <div className="flex justify-between items-center">
                    <span>Tiếng gõ phím:</span>
                    <span>{Math.round(typingVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={typingVolume}
                    onChange={(e) => setTypingVolume(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[var(--color-primary)]"
                  />

                  <div className="flex justify-between items-center mt-1">
                    <span>Tiếng nền:</span>
                    <span>{Math.round(ambientVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    disabled={ambientSound === 'none'}
                    min="0"
                    max="1"
                    step="0.05"
                    value={ambientVolume}
                    onChange={(e) => setAmbientVolume(parseFloat(e.target.value))}
                    className={`w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[var(--color-primary)] ${ambientSound === 'none' ? 'opacity-30 cursor-not-allowed' : ''}`}
                  />
                </div>
              </div>

              {/* Cột 3: Giao Diện & LED */}
              <div className="flex flex-col gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-500 flex items-center gap-1.5">
                  <Palette className="w-4 h-4 text-indigo-500" /> Giao Diện & LED
                </span>

                {/* Các tùy chọn hiển thị */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setIs3d(!is3d)}
                    className={`py-1.5 px-2 rounded-xl text-[10px] font-black border-2 flex items-center justify-center gap-1 transition-all cursor-pointer hover:translate-y-[-0.5px] active:translate-y-[0.5px] active:shadow-none
                    ${is3d ? 'bg-[var(--color-primary)] text-white border-[var(--color-foreground)] shadow-[1px_2px_0px_0px_var(--color-foreground)]' : 'text-slate-500 hover:text-slate-700 bg-[var(--color-surface-container)]/50 border-2 border-[var(--color-foreground)]/10'}`}
                  >
                    📐 Góc 3D: {is3d ? 'Bật' : 'Tắt'}
                  </button>
                  <button
                    onClick={() => setShowFingers(!showFingers)}
                    className={`py-1.5 px-2 rounded-xl text-[10px] font-black border-2 flex items-center justify-center gap-1 transition-all cursor-pointer hover:translate-y-[-0.5px] active:translate-y-[0.5px] active:shadow-none
                    ${showFingers ? 'bg-[var(--color-primary)] text-white border-[var(--color-foreground)] shadow-[1px_2px_0px_0px_var(--color-foreground)]' : 'text-slate-500 hover:text-slate-700 bg-[var(--color-surface-container)]/50 border-2 border-[var(--color-foreground)]/10'}`}
                  >
                    {showFingers ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    <span>Ngón tay</span>
                  </button>
                </div>

                {/* Chế độ LED */}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-[var(--color-foreground)]/70 font-mono shrink-0">Chế độ LED:</span>
                  <select
                    value={ledMode}
                    onChange={(e) => setLedMode(e.target.value as 'rgb' | 'warm' | 'cool' | 'off')}
                    className="bg-[var(--color-surface)] border-2 border-[var(--color-foreground)] text-[var(--color-foreground)] rounded-xl px-2.5 py-1 text-[10px] font-black flex-grow cursor-pointer outline-none shadow-[1.5px_2px_0px_0px_var(--color-foreground)]"
                  >
                    <option value="rgb">Đa Sắc RGB</option>
                    <option value="warm">Vàng Ấm Áp</option>
                    <option value="cool">Xanh Băng Giá</option>
                    <option value="off">Tắt LED</option>
                  </select>
                </div>
              </div>

            </div>
          </div>

          {/* KHU VỰC 4: HƯỚNG DẪN ĐẶT NGÓN TAY */}
          {showFingers && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="w-full"
            >
              <div className="bg-[var(--color-surface)] border-3 border-[var(--color-foreground)] rounded-[24px] p-5 shadow-[6px_6px_0px_0px_var(--color-foreground)] overflow-hidden relative">
                <FingersVisualizer highlightKey={highlightKey} pressedKey={activeKeys.size > 0 ? Array.from(activeKeys)[activeKeys.size - 1] : null} />
              </div>
            </motion.div>
          )}

        </section>

        {/* ----------------- FOOTER ----------------- */}
        <footer className="w-full max-w-6xl mx-auto px-6 pt-4 border-t-2 border-dashed border-[var(--color-foreground)]/10 text-center relative z-10 text-[11px] text-[var(--color-foreground)]/50 flex flex-col sm:flex-row justify-between items-center gap-2 mt-2">
          <span>© 2026 EasyTyping - Một phiên bản của VietTyping</span>
          <div className="flex gap-4">
            <span>Gõ phím cơ clicky</span>
            <span>Thư giãn tuyệt đỉnh</span>
            <span>EdTech Lớp 1</span>
          </div>
        </footer>
      </main>
    </VisualWorldBackground>
  );
}
