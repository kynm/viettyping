"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Volume2, Mic, Eye, EyeOff, Check } from "lucide-react";
import { useSound } from "@/contexts/SoundContext";
import { useWebSpeech } from "@/hooks/useWebSpeech";
import confetti from "canvas-confetti";

const isEmoji = (url: string) => {
  if (!url) return false;
  return !url.includes('/') && !url.includes('.') && url.length < 10;
};

interface FlashcardProps {
  word: string;
  wordUppercase: string;
  spellingGuide: string;
  exampleSentence: string;
  imagePrompt: string; // Placeholder for image
  imageUrl?: string;
}

export default function Flashcard({
  word,
  wordUppercase,
  spellingGuide,
  exampleSentence,
  imagePrompt,
  imageUrl,
}: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const { playSound: playAppSound } = useSound();
  
  // States cho các chế độ học nâng cao
  const [isDictationMode, setIsDictationMode] = useState(false);
  const [isSpeechMode, setIsSpeechMode] = useState(false);
  const [showOriginalText, setShowOriginalText] = useState(false);
  const [speakSuccess, setSpeakSuccess] = useState<boolean | null>(null);

  const {
    isSpeechSupported,
    isListening,
    transcript,
    speak,
    stopSpeaking,
    startListening,
    stopListening
  } = useWebSpeech({ lang: 'vi-VN' });

  const handleFlip = () => {
    // Chỉ lật thẻ khi không đang trong tiến trình ghi âm giọng nói để tránh gây nhầm lẫn
    if (isListening) return;
    setIsFlipped(!isFlipped);
  };

  const playWordSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    speak(word, 'vi-VN');
  };

  const playSentenceSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    speak(exampleSentence, 'vi-VN');
  };

  // Hàm chuyển đổi câu thành các ký tự gạch dưới để bé nghe đoán
  const getHiddenSentence = (text: string) => {
    return text
      .split(' ')
      .map(w => {
        // Giữ lại các dấu câu ở cuối từ
        const cleanWord = w.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
        const punctuation = w.slice(cleanWord.length);
        return '_'.repeat(cleanWord.length) + punctuation;
      })
      .join(' ');
  };

  // So khớp giọng nói khi transcript thay đổi
  useEffect(() => {
    if (!transcript || !isSpeechMode) return;

    const cleanString = (str: string) => {
      return str
        .toLowerCase()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
        .replace(/\s+/g, " ")
        .trim();
    };

    const checkMatch = (said: string, target: string) => {
      const sClean = cleanString(said);
      const tClean = cleanString(target);
      if (sClean === tClean) return true;

      const sWords = sClean.split(' ');
      const tWords = tClean.split(' ');
      let matchCount = 0;
      tWords.forEach(w => {
        if (sWords.includes(w)) matchCount++;
      });
      // Độ khớp từ 70% trở lên
      return (matchCount / tWords.length) >= 0.7;
    };

    const isMatch = checkMatch(transcript, exampleSentence);
    if (isMatch) {
      setSpeakSuccess(true);
      playAppSound('correct');

      // Bắn confetti cục bộ
      confetti({
        particleCount: 35,
        spread: 55,
        origin: { y: 0.85 }
      });

      const timer = setTimeout(() => {
        setSpeakSuccess(null);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setSpeakSuccess(false);
      playAppSound('wrong');
      const timer = setTimeout(() => {
        setSpeakSuccess(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [transcript, isSpeechMode, exampleSentence, playAppSound]);

  // Dọn dẹp âm thanh khi component unmount hoặc khi thay đổi thẻ
  useEffect(() => {
    return () => {
      stopSpeaking();
      stopListening();
    };
  }, [word, stopSpeaking, stopListening]);

  return (
    <motion.div 
      className="w-full h-full perspective-1000 cursor-pointer select-none" 
      onClick={handleFlip}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <motion.div
        className="w-full h-full relative preserve-3d transition-transform duration-500"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        style={{ transformStyle: "preserve-3d" }}
      >

        {/* Mặt Trước (Front) */}
        <div
          className="absolute w-full h-full backface-hidden rounded-3xl p-6 flex flex-col items-center justify-between shadow-2xl shadow-pink-200/50 border-4 border-white backdrop-blur-sm"
          style={{
            background: "linear-gradient(135deg, rgba(255,154,158,0.9) 0%, rgba(254,207,239,0.9) 100%)",
            backfaceVisibility: "hidden"
          }}
        >
          <div className="w-full h-32 md:h-40 bg-white/60 rounded-2xl flex items-center justify-center p-2 border-2 border-dashed border-white overflow-hidden relative shadow-inner">
            {imageUrl ? (
              isEmoji(imageUrl) ? (
                <span className="text-7xl md:text-8xl select-none animate-bounce">{imageUrl}</span>
              ) : (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageUrl} alt={wordUppercase} className="w-full h-full object-contain rounded-xl drop-shadow-sm" />
                </>
              )
            ) : (
              <span className="text-center text-sm font-semibold text-pink-600">
                [Image Placeholder]<br />
                <span className="text-xs font-normal opacity-70 line-clamp-3 mt-1">{imagePrompt}</span>
              </span>
            )}
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-center">
            <h1 className="text-5xl md:text-6xl font-black text-white drop-shadow-lg tracking-wider">
              {wordUppercase}
            </h1>
          </div>

          <motion.button
            onClick={playWordSound}
            whileHover={{ scale: 1.15, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
            className="w-12 h-12 md:w-14 md:h-14 bg-white rounded-full flex items-center justify-center shadow-lg text-pink-500 hover:text-pink-600 transition-colors cursor-pointer"
          >
            <Volume2 size={28} />
          </motion.button>
        </div>

        {/* Mặt Sau (Back) */}
        <div
          className="absolute w-full h-full backface-hidden rounded-3xl p-5 flex flex-col items-center justify-between shadow-2xl shadow-teal-200/50 border-4 border-white backdrop-blur-sm"
          style={{
            background: "linear-gradient(135deg, rgba(132,250,176,0.9) 0%, rgba(143,211,244,0.9) 100%)",
            transform: "rotateY(180deg)",
            backfaceVisibility: "hidden"
          }}
        >
          {/* Hộp tùy chọn học nâng cao ở đầu mặt sau card */}
          <div className="w-full flex justify-between gap-2 px-1 relative z-20 pointer-events-auto shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsDictationMode(prev => {
                  const ns = !prev;
                  if (ns) {
                    speak(exampleSentence, 'vi-VN');
                  } else {
                    stopSpeaking();
                  }
                  return ns;
                });
                playAppSound('click');
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] sm:text-xs font-black transition-all border ${
                isDictationMode 
                  ? 'bg-sky-600 border-sky-700 text-white' 
                  : 'bg-white/70 border-white/50 text-sky-800 hover:bg-white/90'
              } cursor-pointer`}
            >
              🎧 Nghe-Đoán
            </button>

            {isSpeechSupported && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsSpeechMode(prev => {
                    const ns = !prev;
                    if (!ns) {
                      stopListening();
                    }
                    return ns;
                  });
                  playAppSound('click');
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] sm:text-xs font-black transition-all border ${
                  isSpeechMode 
                    ? 'bg-rose-600 border-rose-700 text-white animate-pulse' 
                    : 'bg-white/70 border-white/50 text-rose-800 hover:bg-white/90'
                } cursor-pointer`}
              >
                🎤 Luyện Đọc
              </button>
            )}
          </div>

          {/* Tiêu đề từ viết thường */}
          <h2 className="text-2xl md:text-3xl font-black text-white drop-shadow-lg mt-2 shrink-0">
            {word}
          </h2>

          {/* Hướng dẫn đánh vần */}
          <div className="bg-white/50 px-4 py-1.5 md:px-5 md:py-2 rounded-xl backdrop-blur-md shadow-sm border border-white/50 shrink-0">
            <p className="text-sm md:text-base font-extrabold text-teal-800 text-center tracking-wide">
              {spellingGuide}
            </p>
          </div>

          {/* Nội dung câu ví dụ (Ẩn/Hiện trong chế độ Dictation) */}
          <div className="w-full flex-1 flex flex-col items-center justify-center relative my-2 min-h-0">
            {isDictationMode && (
              <div className="absolute top-0 right-0 flex gap-1.5 pointer-events-auto z-10">
                <button
                  onClick={playSentenceSound}
                  className="p-1 bg-white/80 hover:bg-white text-sky-600 rounded-lg shadow-sm border border-white/50 cursor-pointer"
                  title="Nghe câu ví dụ"
                >
                  <Volume2 size={14} />
                </button>
                <button
                  onMouseDown={(e) => { e.stopPropagation(); setShowOriginalText(true); }}
                  onMouseUp={(e) => { e.stopPropagation(); setShowOriginalText(false); }}
                  onMouseLeave={(e) => { e.stopPropagation(); setShowOriginalText(false); }}
                  onTouchStart={(e) => { e.stopPropagation(); setShowOriginalText(true); }}
                  onTouchEnd={(e) => { e.stopPropagation(); setShowOriginalText(false); }}
                  className="p-1 bg-white/80 hover:bg-white text-amber-600 rounded-lg shadow-sm border border-white/50 select-none cursor-pointer"
                  title="Nhấn giữ để xem chữ gợi ý"
                >
                  {showOriginalText ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
              </div>
            )}

            <p className="text-base md:text-xl font-bold text-center text-white leading-relaxed drop-shadow-md px-3 overflow-y-auto max-h-full">
              {isDictationMode && !showOriginalText 
                ? getHiddenSentence(exampleSentence) 
                : exampleSentence}
            </p>
          </div>

          {/* Bộ điều khiển Luyện Đọc hoặc Loa phát âm */}
          <div className="w-full flex flex-col items-center gap-2 pointer-events-auto relative z-20 shrink-0">
            {isSpeechMode ? (
              <div className="flex flex-col items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-2 rounded-2xl border border-white/20 w-full">
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isListening) stopListening(); else startListening();
                      playAppSound('click');
                    }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md transition-transform hover:scale-105 active:scale-95 cursor-pointer
                      ${isListening 
                        ? 'bg-red-500 ring-4 ring-red-200 animate-pulse' 
                        : speakSuccess === true
                          ? 'bg-emerald-500'
                          : speakSuccess === false
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                      }`}
                  >
                    {speakSuccess === true ? <Check size={20} /> : <Mic size={20} />}
                  </button>
                  
                  <button
                    onClick={playSentenceSound}
                    className="w-8 h-8 bg-white/70 hover:bg-white text-teal-600 rounded-full flex items-center justify-center shadow-sm cursor-pointer"
                    title="Nghe mẫu"
                  >
                    <Volume2 size={14} />
                  </button>
                </div>

                <div className="text-center w-full">
                  {isListening && (
                    <span className="text-[10px] text-red-100 font-bold animate-pulse block">⚡ Đang nghe bé nói...</span>
                  )}
                  {!isListening && speakSuccess === null && (
                    <span className="text-[10px] text-white/80 font-medium block">Bấm Micro và đọc to câu ví dụ!</span>
                  )}
                  {transcript && (
                    <div className="text-[9px] text-white/95 truncate max-w-[180px] mx-auto mt-0.5">
                      Bé nói: <span className="font-bold">&quot;{transcript}&quot;</span>
                    </div>
                  )}
                  {speakSuccess === true && (
                    <span className="text-[10px] text-emerald-250 font-black animate-bounce block">🌟 Bé phát âm xuất sắc!</span>
                  )}
                  {speakSuccess === false && (
                    <span className="text-[10px] text-amber-200 font-bold block">😅 Bé hãy đọc lại to rõ nhé!</span>
                  )}
                </div>
              </div>
            ) : (
              <motion.button
                onClick={playSentenceSound}
                whileHover={{ scale: 1.15, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
                className="w-12 h-12 md:w-14 md:h-14 bg-white rounded-full flex items-center justify-center shadow-lg text-teal-500 hover:text-teal-600 transition-colors cursor-pointer"
              >
                <Volume2 size={28} />
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
