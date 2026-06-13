import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoTimeOutline, IoRefreshOutline, IoWarning, IoSpeedometerOutline, IoCheckmarkCircleOutline } from 'react-icons/io5';
import { Keyboard } from 'lucide-react';
import { useTypingSound } from '@/hooks/useTypingSound';
import VirtualKeyboard from './VirtualKeyboard';
import { TelemetryPayload } from '@/types/lesson';
import { stringToTelexKeys, buildCharMappings, validateInput, getNextHighlightKey, getCharColorStates } from '@/utils/telex';
import confetti from 'canvas-confetti';

export interface TypingTask {
  content: string;
  type: string;
  description: string;
  time_limit_seconds: number;
}

interface Props {
  task: TypingTask;
  onComplete: (telemetry: TelemetryPayload) => void;
  onStatsChange?: (stats: { wpm: number; accuracy: number; timeLeft: number; progressPercent: number; animal: string } | null) => void;
  hideStatsBar?: boolean;
}

// Emoji Map cho các từ vựng xuất hiện trong bài học
const wordStickers: Record<string, string> = {
  'f': '🐢',
  'j': '🦁',
  'space': '✨',
  ' ': '✨',
  'ba': '👨',
  'da': '🧴',
  'la': '🍃',
  'ca': '🐟',
  'cá': '🐟',
  'má': '👩',
  'lá': '🍃',
  'đá': '⚽',
  'cà': '🍆',
  'bà': '👵',
  'nhà': '🏠',
  'đà': '⛰️',
  'cả': '🍀',
  'lả': '🌸',
  'thả': '🎈',
  'vẽ': '🎨',
  'mã': '🐴',
  'kẽ': '🪵',
  'lạ': '👽',
  'mạ': '🌾',
  'tạ': '🏋️',
  'dạ': '🙇',
  'đi': '🚶',
  'học': '🎒',
  'mẹ': '👩‍🦰',
  'bé': '👶',
  'ngoan': '⭐',
  'cờ': '🚩',
  'yêu': '❤️',
  'bơi': '🏊',
  'gà': '🐔',
  'xe': '🚗',
  'học sinh': '🎒',
  'giáo viên': '👩‍🏫',
  'trường': '🏫',
  'lớp': '🏫',
  'thành phố': '🏙️',
  'hà nội': '🏛️',
  'biển': '🌊',
  'mây': '☁️',
  'trời': '☀️',
  'đẹp': '🌈',
  'công viên': '🎡',
  'chơi': '🛝',
  'buổi sáng': '🌅',
  'thức dậy': '⏰',
  'mát mẻ': '🍃',
  'trong lành': '🌬️',
};

export default function TypingPractice({ task, onComplete, onStatsChange, hideStatsBar = false }: Props) {
  const [input, setInput] = useState('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [timeLeft, setTimeLeft] = useState(task.time_limit_seconds || 60);
  const [pressedKey, setPressedKey] = useState<string | null>(null);
  const [showKeyboard, setShowKeyboard] = useState(true);
  
  // States cho Popup thành tích EdTech
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [finalStats, setFinalStats] = useState<{ wpm: number; accuracy: number; incorrectCount: number; durationSeconds: number } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const startTimeRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const wrongSoundTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const { playCorrectSound, playWrongSound } = useTypingSound();

  // Tự động ẩn bàn phím ảo trên màn hình có chiều cao thấp
  useEffect(() => {
    const handleResize = () => {
      if (window.innerHeight < 700) {
        setShowKeyboard(false);
      } else {
        setShowKeyboard(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const targetTelexKeys = useMemo(() => stringToTelexKeys(task.content), [task.content]);
  const charMappings = useMemo(() => buildCharMappings(task.content), [task.content]);

  const validationResult = useMemo(() => validateInput(task.content, input), [task.content, input]);
  const firstErrorIndex = validationResult.firstErrorTelexIndex;
  const currentProgressIndex = validationResult.currentProgressIndex;
  const charStates = useMemo(() => getCharColorStates(task.content, input), [task.content, input]);

  // Xác định từ hiện tại đang gõ
  const currentWord = useMemo(() => {
    const cleanContent = task.content.toLowerCase();
    const words = cleanContent.split(' ');
    let charCount = 0;
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const start = charCount;
      const end = charCount + word.length;
      if (input.length >= start && input.length <= end) {
        return word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
      }
      charCount += word.length + 1;
    }
    return '';
  }, [task.content, input]);

  // Trích xuất sticker emoji từ từ hiện tại
  const currentSticker = useMemo(() => {
    if (!currentWord) return null;
    return wordStickers[currentWord] || null;
  }, [currentWord]);

  const calculateStats = (currentInput = input, currentStartTime = startTime) => {
    if (!currentStartTime) return { wpm: 0, accuracy: 0, incorrectCount: 0 };

    const timeInSeconds = (Date.now() - currentStartTime) / 1000;
    const timeInMinutes = Math.max(timeInSeconds, 3) / 60; // Giới hạn tối thiểu 3s để tránh nổ số WPM ban đầu

    const validation = validateInput(task.content, currentInput);
    const correctKeysCount = validation.currentProgressIndex;
    const currentTelexKeysLength = stringToTelexKeys(currentInput).length;
    const incorrectKeysCount = Math.max(0, currentTelexKeysLength - correctKeysCount);

    const words = correctKeysCount / 5; // Standard WPM: 1 word = 5 keystrokes
    const wpm = Math.round(words / timeInMinutes);
    const accuracy = Math.round((correctKeysCount / Math.max(currentTelexKeysLength, 1)) * 100) || 0;

    return { wpm, accuracy, incorrectCount: incorrectKeysCount };
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newInput = e.target.value;

    const oldValidation = validateInput(task.content, input);
    const oldFirstErrorIndex = oldValidation.firstErrorTelexIndex;

    // Nếu đang có lỗi và người dùng gõ thêm (chiều dài tăng)
    if (oldFirstErrorIndex !== -1 && newInput.length > input.length) {
      playWrongSound();
      return;
    }

    let currentStartTime = startTime;
    if (!startTime) {
      const now = Date.now();
      setStartTime(now);
      startTimeRef.current = now;
      currentStartTime = now;
      startTimer();
    }

    if (wrongSoundTimeoutRef.current) {
      clearTimeout(wrongSoundTimeoutRef.current);
      wrongSoundTimeoutRef.current = undefined;
    }

    const newValidation = validateInput(task.content, newInput);
    const newFirstErrorIndex = newValidation.firstErrorTelexIndex;

    const isNewCorrect = newValidation.isValid;
    const isOldCorrect = oldFirstErrorIndex === -1;

    const oldInputTelexKeysLength = stringToTelexKeys(input).length;
    const newInputTelexKeysLength = stringToTelexKeys(newInput).length;

    if (newInputTelexKeysLength > 0) {
      if (isNewCorrect && ((!isOldCorrect && newInputTelexKeysLength >= oldInputTelexKeysLength) || newInputTelexKeysLength > oldInputTelexKeysLength)) {
        playCorrectSound();
      } else if (!isNewCorrect && newInputTelexKeysLength >= oldInputTelexKeysLength) {
        // Phản hồi âm thanh sai phím ngay lập tức cho trẻ
        playWrongSound();
      }
    }

    setInput(newInput);

    if (newInput === task.content || (isNewCorrect && newInputTelexKeysLength === targetTelexKeys.length)) {
      const stats = calculateStats(newInput, currentStartTime);
      completeLesson(stats);
    }
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          const stats = calculateStats(inputRef.current?.value || '', startTimeRef.current);
          completeLesson(stats);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Kích hoạt pháo hoa canvas-confetti
  const triggerConfetti = () => {
    try {
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min;
      };

      const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);
    } catch (e) {
      console.error(e);
    }
  };

  const completeLesson = (stats: { wpm: number; accuracy: number; incorrectCount: number }) => {
    setIsComplete(true);
    clearInterval(timerRef.current);
    
    const durationSeconds = startTimeRef.current
      ? Math.round((Date.now() - startTimeRef.current) / 1000)
      : 0;
    
    setFinalStats({
      ...stats,
      durationSeconds
    });
    
    // Hiển thị modal ăn mừng và bắn confetti
    setShowSuccessModal(true);
    triggerConfetti();
  };

  const handleNextClick = () => {
    if (finalStats) {
      onComplete({
        score: finalStats.accuracy,
        durationSeconds: finalStats.durationSeconds,
        metadata: {
          wpm: finalStats.wpm,
          accuracy: finalStats.accuracy,
          incorrectCount: finalStats.incorrectCount,
        },
      });
    }
  };

  const handleRestart = useCallback(() => {
    setInput('');
    setStartTime(null);
    startTimeRef.current = null;
    setIsComplete(false);
    setTimeLeft(task.time_limit_seconds || 60);
    clearInterval(timerRef.current);
    setShowSuccessModal(false);
    setFinalStats(null);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  }, [task.time_limit_seconds]);

  useEffect(() => {
    inputRef.current?.focus();
    return () => clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    handleRestart();
  }, [task, handleRestart]);

  useEffect(() => {
    setTimeLeft(task.time_limit_seconds || 60);
    setInput('');
    setStartTime(null);
    setIsComplete(false);
    setShowSuccessModal(false);
    setFinalStats(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, [task]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setPressedKey(e.key.toLowerCase());
    };

    const handleKeyUp = () => {
      setPressedKey(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Listen to Enter key when success modal is shown to trigger next step
  useEffect(() => {
    if (!showSuccessModal) return;

    const handleEnterPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleNextClick();
      }
    };

    window.addEventListener('keydown', handleEnterPress);
    return () => window.removeEventListener('keydown', handleEnterPress);
  }, [showSuccessModal, handleNextClick]);

  const { wpm, accuracy } = calculateStats();
  const totalTimeLimit = task.time_limit_seconds || 60;
  const timeLeftPercent = (timeLeft / totalTimeLimit) * 100;

  const getTimerColor = () => {
    if (timeLeftPercent > 50) return 'text-blue-600 bg-blue-50 border-blue-100/50';
    if (timeLeftPercent > 20) return 'text-yellow-600 bg-yellow-50 border-yellow-100/50';
    return 'text-red-600 bg-red-50 border-red-100/50 animate-pulse';
  };

  const getAnimal = () => {
    if (wpm === 0) return '🐢';
    if (wpm < 10) return '🐢';
    if (wpm < 25) return '🐰';
    return '🐆';
  };

  const getSpeedLabel = () => {
    if (wpm === 0) return 'Đang đợi bé gõ phím...';
    if (wpm < 10) return 'Chậm rãi như Rùa 🐢';
    if (wpm < 25) return 'Nhịp nhàng như Thỏ 🐰';
    return 'Siêu tốc như Báo 🐆';
  };

  const getSpeedColor = () => {
    if (wpm === 0) return 'text-slate-400';
    if (wpm < 10) return 'text-orange-500';
    if (wpm < 25) return 'text-green-500';
    return 'text-amber-500 font-extrabold drop-shadow-sm';
  };

  const progressPercent = Math.min(100, Math.round((currentProgressIndex / targetTelexKeys.length) * 100));

  // Gửi thông số gõ phím lên LessonCoordinator
  useEffect(() => {
    if (onStatsChange) {
      onStatsChange({
        wpm,
        accuracy,
        timeLeft,
        progressPercent,
        animal: getAnimal()
      });
    }
    return () => {
      if (onStatsChange) onStatsChange(null);
    };
  }, [wpm, accuracy, timeLeft, progressPercent, onStatsChange]);

  return (
    <div className="w-full h-full flex flex-col relative">
      <style jsx>{`
        @keyframes blink {
          0%, 100% { background-color: rgb(96 165 250); }
          50% { background-color: transparent; }
        }
        .cursor-blink {
          animation: blink 1s ease-in-out infinite;
        }
      `}</style>

      {/* Mobile Blocker */}
      <div className="md:hidden flex flex-col items-center justify-center h-full p-8 text-center bg-white/90 rounded-3xl shadow-lg border border-red-100">
        <div className="w-24 h-24 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-6 shadow-inner">
          <IoWarning size={48} />
        </div>
        <h2 className="text-2xl font-black text-red-600 mb-4">
          Cần bàn phím vật lý!
        </h2>
        <p className="text-gray-600 text-lg">
          Bài tập luyện gõ phím 10 ngón được thiết kế tối ưu nhất khi sử dụng máy tính (Desktop/Laptop). 
          <br/><br/>
          Bé hoặc phụ huynh hãy mở trên thiết bị có bàn phím vật lý để thực hành nhé!
        </p>
      </div>

      {/* Desktop/Tablet Content */}
      <div className="hidden md:flex flex-col w-full h-full min-h-0">
        
        {/* Compact Stats Bar */}
        <div className={`flex items-center justify-between gap-4 px-2 py-1.5 mb-2 shrink-0 w-full ${hideStatsBar ? 'justify-end' : ''}`}>
          {!hideStatsBar && (
            <div className="flex items-center gap-4 animate-fade-in">
              <div className={`flex items-center gap-1.5 font-mono font-black text-sm px-3 py-1.5 rounded-xl border ${getTimerColor()}`}>
                <IoTimeOutline className="text-base" />
                {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}
              </div>
              <div className="h-4 w-px bg-gray-200" />
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <IoSpeedometerOutline className="text-base text-green-500" />
                <span>Tốc độ: <span className="font-extrabold text-green-600 text-sm">{wpm}</span> WPM <span className={`ml-1 font-bold ${getSpeedColor()}`}>{wpm > 0 ? `(${getSpeedLabel()})` : ''}</span></span>
              </div>
              <div className="h-4 w-px bg-gray-200" />
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <IoCheckmarkCircleOutline className="text-base text-blue-500" />
                <span>Chính xác: <span className="font-extrabold text-blue-600 text-sm">{accuracy}%</span></span>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowKeyboard(prev => !prev)}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs border-2 border-slate-800 rounded-xl font-bold cursor-pointer transition-all shadow-[0_3px_0_0_var(--color-outline-variant)] ${
                showKeyboard 
                  ? "bg-indigo-100 text-indigo-850" 
                  : "bg-white text-gray-655"
              } active:translate-y-0.5 active:shadow-none`}
              title={showKeyboard ? "Ẩn bàn phím ảo" : "Hiện bàn phím ảo"}
            >
              <Keyboard size={14} className="shrink-0" />
              <span>{showKeyboard ? "Ẩn phím" : "Hiện phím"}</span>
            </button>
            
            <button
              onClick={handleRestart}
              className="flex items-center gap-1 px-4 py-1.5 text-xs bg-white border-2 border-slate-800 text-gray-750 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all font-bold cursor-pointer shadow-[0_3px_0_0_var(--color-outline-variant)] active:translate-y-0.5 active:shadow-none"
            >
              <IoRefreshOutline className="text-sm" />
              Làm lại
            </button>
          </div>
        </div>

        {/* Sticker minh họa sinh động cho từ đang gõ */}
        <div className="h-24 mb-2 flex items-center justify-center shrink-0 relative z-10">
          <AnimatePresence mode="wait">
            {currentSticker ? (
              <motion.div
                key={currentWord}
                initial={{ scale: 0, rotate: -15, opacity: 0 }}
                animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0], opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ 
                  scale: { duration: 0.3 },
                  rotate: { repeat: Infinity, duration: 4, ease: "easeInOut" }
                }}
                className="flex flex-col items-center justify-center min-w-[100px] h-20 relative"
              >
                <span className="text-5xl filter drop-shadow-sm select-none">{currentSticker}</span>
                <span className="text-[10px] font-black text-amber-700 uppercase mt-1 tracking-wider">{currentWord}</span>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                className="text-slate-400 text-sm font-bold italic"
              >
                Nhìn tranh và luyện gõ phím nhé bé yêu! 🎯
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Typing Display Area: Cỡ chữ siêu khổng lồ cho bé 6 tuổi */}
        <div className="relative mb-2 p-4 bg-blue-50/40 rounded-2xl text-4xl md:text-5xl font-black leading-relaxed tracking-wide flex flex-wrap content-center items-center justify-center text-center flex-1 min-h-[120px] overflow-visible py-5 font-sans">
          {/* Hidden input for focus */}
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleInput}
            disabled={isComplete}
            className="absolute inset-0 opacity-0 cursor-default z-10"
            autoFocus
          />
          {charMappings.map((mapping, i) => {
            const state = charStates[i] || 'none';
            const isCorrect = state === 'correct';
            const isIncorrect = state === 'incorrect';
            const isCurrent = state === 'current';
              
            let colorClass = 'text-gray-400';
            let borderClass = '';
            
            if (isCorrect) {
              colorClass = 'text-green-600 font-black drop-shadow-sm';
            } else if (isIncorrect) {
              return (
                <motion.span
                  key={i}
                  animate={{ x: [0, -3, 3, -3, 3, 0] }}
                  transition={{ repeat: Infinity, duration: 0.6, repeatDelay: 1 }}
                  className="text-red-500 font-black bg-red-100 rounded-2xl px-2 shadow-sm relative inline-block mx-0.5"
                >
                  {mapping.char === ' ' ? '\u00A0' : mapping.char}
                </motion.span>
              );
            } else if (isCurrent) {
              borderClass = 'cursor-blink border-b-4 border-blue-500 font-black';
            }
            
            return (
              <span
                key={i}
                className={`${colorClass} ${borderClass} relative transition-all duration-150 mx-0.5`}
              >
                {mapping.char === ' ' ? '\u00A0' : mapping.char}
                {isCurrent && mapping.telexKeys.length > 1 && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 bg-accent text-slate-900 text-xs px-3 py-2 rounded-2xl shadow-xl animate-bounce whitespace-nowrap z-30 pointer-events-none flex items-center gap-1 border-2 border-accent-depth/35">
                    {mapping.telexKeys.map((key, keyIdx) => {
                      const isTyped = (currentProgressIndex - mapping.startIndex) > keyIdx;
                      const isCurrentKey = (currentProgressIndex - mapping.startIndex) === keyIdx;
                      return (
                        <React.Fragment key={keyIdx}>
                          {keyIdx > 0 && <span className="text-yellow-900 text-[10px] font-bold">+</span>}
                          <span 
                            className={`px-2 py-0.5 rounded-lg font-mono text-sm leading-none ${
                              isCurrentKey 
                                ? 'bg-primary text-white ring-2 ring-primary/30 font-extrabold' 
                                : isTyped 
                                  ? 'text-slate-400 line-through font-normal' 
                                  : 'bg-accent/40 text-slate-700 font-semibold'
                            }`}
                          >
                            {key}
                          </span>
                        </React.Fragment>
                      );
                    })}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-accent" />
                  </div>
                )}
              </span>
            );
          })}
        </div>

        {/* Alert Bar cố định hiển thị cảnh báo gõ sai */}
        {firstErrorIndex !== -1 && (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-3 p-3 bg-secondary/5 rounded-xl text-center text-sm font-bold text-secondary flex items-center justify-center gap-2 relative z-20"
          >
            <span className="text-lg animate-bounce">⚠️</span>
            <span>Bé gõ chưa đúng rồi! Hãy nhấn phím <b>Xóa (⌫)</b> màu tím để sửa lại nhé!</span>
          </motion.div>
        )}

        {/* Keyboard */}
        {showKeyboard && (
          <div className="shrink-0 animate-fade-in">
            <VirtualKeyboard
              pressedKey={pressedKey}
              highlightKey={getNextHighlightKey(task.content, input)}
            />
          </div>
        )}
      </div>

      {/* Success Modal chúc mừng ăn mừng hoành tráng */}
      <AnimatePresence>
        {showSuccessModal && finalStats && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.85, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.85, y: 50 }}
              transition={{ type: 'spring', damping: 15 }}
              className="bg-[#fffdfa] rounded-[32px] border-4 border-slate-800 p-8 max-w-md w-full text-center shadow-[8px_8px_0px_0px_#1e293b] relative overflow-hidden"
            >
              {/* Sticker động vật to đùng chúc mừng */}
              <div className="text-8xl mb-4 animate-bounce select-none">
                {finalStats.wpm < 10 ? '🐢' : finalStats.wpm < 25 ? '🐰' : '🐆'}
              </div>

              <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500 mb-2">
                Quá Xuất Sắc Bé Ơi! 🎉
              </h2>

              <p className="text-gray-600 font-bold mb-6 text-sm">
                {finalStats.wpm < 10 
                  ? 'Bé gõ chậm rãi và rất cẩn thận như chú Rùa đáng yêu! 🐢' 
                  : finalStats.wpm < 25 
                    ? 'Bé gõ nhịp nhàng và nhanh nhẹn như chú Thỏ tinh nghịch! 🐰' 
                    : 'Bé gõ siêu tốc độ như chú Báo dũng mãnh! 🐆'}
              </p>

              {/* Các chỉ số thành tích chunky */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white border-2 border-slate-800 shadow-[3px_3px_0px_0px_#1e293b] rounded-2xl p-3 text-center">
                  <div className="text-xs text-primary font-bold uppercase tracking-wider">Tốc độ</div>
                  <div className="text-2xl font-black text-primary">{finalStats.wpm} WPM</div>
                </div>
                <div className="bg-white border-2 border-slate-800 shadow-[3px_3px_0px_0px_#1e293b] rounded-2xl p-3 text-center">
                  <div className="text-xs text-tertiary font-bold uppercase tracking-wider">Chính xác</div>
                  <div className="text-2xl font-black text-tertiary">{finalStats.accuracy}%</div>
                </div>
              </div>

              {/* Lời khen khích lệ */}
              <div className="bg-amber-50 border-2 border-slate-800 rounded-2xl p-4 mb-6 text-xs text-slate-700 font-bold shadow-[2px_2px_0px_0px_#1e293b]">
                ⭐ Bé đã vượt qua thử thách gõ phím này rồi! Cố lên nhé, bé đang học rất giỏi!
              </div>

              {/* Nút Tiếp tục khổng lồ 3D Chunky */}
              <button
                onClick={handleNextClick}
                className="keycap-btn-primary w-full py-4 text-lg rounded-2xl cursor-pointer text-white"
              >
                Tiếp tục học ➔
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
