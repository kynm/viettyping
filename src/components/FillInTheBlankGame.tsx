"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { GameAdapterProps, TelemetryPayload, FillInTheBlankItem } from "@/types/lesson";
import { useSound } from "@/contexts/SoundContext";

export type FillInTheBlankGameConfig = FillInTheBlankItem;

const VIETNAMESE_CHARS = "aăâeêioôơuưyáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵbcdđghklmnpqrstvx".split("");

export default function FillInTheBlankGame({ gameConfig, onComplete }: GameAdapterProps<FillInTheBlankItem>) {
  const { id: gameId, items } = gameConfig;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedChar, setSelectedChar] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<"none" | "correct" | "incorrect">("none");

  const { playSound } = useSound();

  // Telemetry state
  const startTimeRef = useRef<number>(Date.now());
  const failedAttemptsRef = useRef<Set<number>>(new Set());
  const errorsRef = useRef<Array<{ questionId: string; userAnswer: string; correctAnswer: string }>>([]);

  const currentItem = items[currentIndex];

  useEffect(() => {
    // Reset state and timers when gameConfig changes
    setCurrentIndex(0);
    setSelectedChar(null);
    setFeedback("none");
    startTimeRef.current = Date.now();
    failedAttemptsRef.current = new Set();
    errorsRef.current = [];
  }, [gameId]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const keyboardOptions = useMemo(() => {
    if (!currentItem) return [];
    
    // Generate distractors
    const missing = currentItem.missing_char.toLowerCase();
    const pool = VIETNAMESE_CHARS.filter((c) => c !== missing);
    
    // Shuffle pool and pick 3
    const shuffledPool = [...pool].sort(() => 0.5 - Math.random());
    const distractors = shuffledPool.slice(0, 3);
    
    // Combine with correct answer and shuffle
    const options = [missing, ...distractors].sort(() => 0.5 - Math.random());
    
    // If the original missing char was uppercase, make all options uppercase
    if (currentItem.missing_char === currentItem.missing_char.toUpperCase()) {
      return options.map((c) => c.toUpperCase());
    }
    return options;
  }, [currentIndex, gameId]);

  // Handle Text to Speech
  const speakWord = (text: string) => {
    if ("speechSynthesis" in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "vi-VN";
      utterance.rate = 0.8; // Speak slightly slower for kids
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleKeyPress = (char: string) => {
    if (feedback !== "none") return;

    setSelectedChar(char);

    if (char.toLowerCase() === currentItem.missing_char.toLowerCase()) {
      setFeedback("correct");
      playSound('coin');

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ["#10b981", "#34d399", "#fbbf24", "#f472b6"],
      });

      // TTS
      setTimeout(() => speakWord(currentItem.full_word), 500);

      setTimeout(() => {
        if (currentIndex < items.length - 1) {
          setCurrentIndex((prev) => prev + 1);
          setSelectedChar(null);
          setFeedback("none");
        } else {
          const durationSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
          const totalQuestions = items.length;
          const correctFirstTry = totalQuestions - failedAttemptsRef.current.size;
          const score = Math.round((correctFirstTry / totalQuestions) * 100);

          const telemetry: TelemetryPayload = {
            score,
            durationSeconds,
            errors: errorsRef.current.length > 0 ? errorsRef.current : undefined,
          };
          onComplete(telemetry);
        }
      }, 2500); // Wait longer so the kid can hear the word
    } else {
      setFeedback("incorrect");
      
      // Record failed attempt for telemetry
      if (!failedAttemptsRef.current.has(currentIndex)) {
        failedAttemptsRef.current.add(currentIndex);
        errorsRef.current.push({
          questionId: `${gameId}_q${currentIndex}`,
          userAnswer: char,
          correctAnswer: currentItem.missing_char,
        });
      }

      playSound('boing');

      setTimeout(() => {
        setFeedback("none");
        setSelectedChar(null);
      }, 1000);
    }
  };

  if (!currentItem) return null;

  // Replace '_' with the selected char or a blank space component
  const sentenceParts = currentItem.sentence.split("_");

  return (
    <div className="w-full flex flex-col items-center">
      {/* Display sentence */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          className="bg-white/90 px-8 py-10 md:px-12 md:py-16 rounded-3xl border-4 border-slate-800 shadow-[6px_6px_0px_0px_#1e293b] mb-12 w-full max-w-2xl text-center"
        >
          <div className="text-4xl md:text-5xl lg:text-6xl font-black text-purple-700 leading-relaxed flex flex-wrap justify-center items-center gap-2">
            {sentenceParts.map((part, index) => (
              <React.Fragment key={index}>
                <span>{part}</span>
                {index < sentenceParts.length - 1 && (
                  <motion.div
                    animate={
                      feedback === "incorrect"
                        ? { x: [-5, 5, -5, 5, 0], transition: { duration: 0.4 } }
                        : {}
                    }
                    className={`inline-flex items-center justify-center min-w-[60px] md:min-w-[80px] h-[60px] md:h-[80px] border-3 border-slate-800 mx-2 rounded-2xl transition-all ${
                      feedback === "correct"
                        ? "bg-green-200 text-green-800 shadow-[2px_2px_0px_0px_#1e293b]"
                        : feedback === "incorrect"
                        ? "bg-red-200 text-red-800 shadow-[2px_2px_0px_0px_#1e293b]"
                        : "bg-purple-100 text-purple-700 shadow-[3px_3px_0px_0px_#1e293b]"
                    }`}
                  >
                    {feedback === "correct" ? currentItem.missing_char : selectedChar || ""}
                  </motion.div>
                )}
              </React.Fragment>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Virtual Keyboard */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-wrap justify-center gap-4 md:gap-6 w-full max-w-lg"
      >
        {keyboardOptions.map((char, index) => {
          const isSelected = selectedChar === char;
          const isCorrect = feedback === "correct" && isSelected;
          const isWrong = feedback === "incorrect" && isSelected;

          return (
            <motion.button
              key={`${currentIndex}-${index}`}
              whileHover={{ scale: feedback === "none" ? 1.1 : 1 }}
              whileTap={{ scale: feedback === "none" ? 0.95 : 1 }}
              animate={
                isCorrect
                  ? { scale: [1, 1.15, 1], transition: { duration: 0.5, times: [0, 0.5, 1], ease: "easeInOut" } }
                  : isWrong
                  ? { x: [-10, 10, -10, 10, 0], transition: { duration: 0.4 } }
                  : {}
              }
              onClick={() => { playSound('pop'); handleKeyPress(char); }}
              disabled={feedback !== "none"}
              className={`w-20 h-20 md:w-24 md:h-24 rounded-2xl font-black text-4xl border-3 border-slate-800 flex items-center justify-center transition-all disabled:cursor-not-allowed ${
                isCorrect
                  ? "bg-green-400 text-slate-800 shadow-none translate-y-[4px]"
                  : isWrong
                  ? "bg-red-400 text-white shadow-none translate-y-[4px]"
                  : "bg-white text-purple-700 hover:bg-purple-50 shadow-[4px_4px_0px_0px_#1e293b] active:translate-y-[4px] active:shadow-none"
              }`}
            >
              {char}
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
}
