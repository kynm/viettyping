"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X } from "lucide-react";
import confetti from "canvas-confetti";
import { GameAdapterProps, TelemetryPayload, MultipleChoiceItem } from "@/types/lesson";
import { useSound } from "@/contexts/SoundContext";

export type MultipleChoiceGameConfig = MultipleChoiceItem;

// Utility to shuffle an array
const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const isEmoji = (url: string) => {
  if (!url) return false;
  return !url.includes('/') && !url.includes('.') && url.length < 10;
};


export default function MultipleChoiceGame({ gameConfig, flashcards = [], onComplete }: GameAdapterProps<MultipleChoiceItem>) {
  const { id: gameId, items } = gameConfig;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [choices, setChoices] = useState<string[]>([]);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
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
    setChoices([]);
    setSelectedChoice(null);
    setFeedback("none");
    startTimeRef.current = Date.now();
    failedAttemptsRef.current = new Set();
    errorsRef.current = [];
  }, [gameId]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (currentItem) {
      const allChoices = [currentItem.correct_answer, ...currentItem.distractors];
      setChoices(shuffleArray(allChoices));
      setSelectedChoice(null);
      setFeedback("none");
    }
  }, [currentIndex, gameId]);

  const handleChoice = (choice: string) => {
    if (feedback !== "none") return; // Ngăn chặn bấm nhiều lần

    setSelectedChoice(choice);
    const isCorrect = choice === currentItem.correct_answer;

    if (isCorrect) {
      setFeedback("correct");
      playSound('coin');
      
      confetti({
        particleCount: 50,
        spread: 40,
        origin: { y: 0.6 },
        colors: ["#10b981", "#34d399"] // green confetti
      });

      setTimeout(() => {
        if (currentIndex < items.length - 1) {
          setCurrentIndex((prev) => prev + 1);
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
      }, 1500);
    } else {
      setFeedback("incorrect");
      
      // Record failed attempt for telemetry
      if (!failedAttemptsRef.current.has(currentIndex)) {
        failedAttemptsRef.current.add(currentIndex);
        errorsRef.current.push({
          questionId: `${gameId}_q${currentIndex}`,
          userAnswer: choice,
          correctAnswer: currentItem.correct_answer,
        });
      }

      playSound('boing');

      setTimeout(() => {
        setFeedback("none");
        setSelectedChoice(null);
      }, 1000);
    }
  };

  if (!currentItem) return null;

  // Kiểm tra xem trong các lựa chọn hiện tại có lựa chọn nào có ảnh từ flashcards không
  const hasAnyImage = choices.some(choice => 
    !!flashcards?.find(f => f.word.toLowerCase() === choice.toLowerCase())?.image_url
  );

  return (
    <div className="w-full flex flex-col items-center">
      {/* Question Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentItem.question}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          className="bg-white/90 px-8 py-6 rounded-3xl border-4 border-slate-800 shadow-[6px_6px_0px_0px_#1e293b] mb-10 w-full max-w-2xl text-center"
        >
          <h3 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
            {currentItem.question}
          </h3>
        </motion.div>
      </AnimatePresence>

      {/* Choices Area */}
      <div className="grid grid-cols-2 gap-4 md:gap-6 w-full max-w-2xl">
        <AnimatePresence>
          {choices.map((choice, index) => {
            const isSelected = selectedChoice === choice;
            
            let buttonStateClass = "bg-purple-500 hover:bg-purple-400 text-white border-4 border-slate-800 shadow-[4px_4px_0px_0px_#1e293b]";
            let icon = null;

            if (feedback !== "none" && isSelected) {
              if (feedback === "correct") {
                buttonStateClass = "bg-green-500 text-white border-4 border-slate-800 shadow-none translate-y-[4px] z-10";
                icon = <Check className="text-white drop-shadow-md w-8 h-8 md:w-10 md:h-10" strokeWidth={4} />;
              } else if (feedback === "incorrect") {
                buttonStateClass = "bg-red-500 text-white border-4 border-slate-800 shadow-none translate-y-[4px]";
                icon = <X className="text-white drop-shadow-md w-8 h-8 md:w-10 md:h-10" strokeWidth={4} />;
              }
            } else if (feedback !== "none" && !isSelected) {
              // Dim other buttons when an answer is selected
              buttonStateClass = "bg-gray-200 text-gray-400 border-4 border-gray-300 shadow-none opacity-40";
            }

            // Tìm thông tin ảnh cho lựa chọn này
            const choiceFc = flashcards?.find(f => f.word.toLowerCase() === choice.toLowerCase());
            const choiceImg = choiceFc?.image_url;

            return (
              <motion.button
                key={`${choice}-${index}`}
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={
                  feedback === "incorrect" && isSelected
                    ? { x: [-10, 10, -10, 10, 0], opacity: 1, scale: 1, y: 0 }
                    : feedback === "correct" && isSelected
                    ? { scale: [1, 1.1, 1], opacity: 1, y: 0 }
                    : { opacity: 1, scale: 1, y: 0 }
                }
                transition={
                  feedback === "correct" && isSelected
                    ? { duration: 0.5, times: [0, 0.5, 1], ease: "easeInOut" }
                    : { duration: 0.3, delay: index * 0.1 }
                }
                whileHover={feedback === "none" ? { scale: 1.05 } : {}}
                whileTap={feedback === "none" ? { scale: 0.95 } : {}}
                onClick={() => { playSound('pop'); handleChoice(choice); }}
                disabled={feedback !== "none"}
                className={`
                  relative flex-1 text-white font-black text-2xl md:text-3xl 
                  ${hasAnyImage ? "py-4 md:py-6 px-3" : "py-6 md:py-8"} rounded-3xl 
                  transition-all flex flex-col items-center justify-center gap-3 disabled:cursor-not-allowed
                  ${buttonStateClass}
                  ${feedback === "none" ? "active:translate-y-[4px] active:shadow-none" : ""}
                `}
              >
                {/* Khung hiển thị hình ảnh đồng bộ */}
                {hasAnyImage && (
                  <div className="w-20 h-20 md:w-28 md:h-28 bg-white rounded-2xl p-2 border-2 border-slate-800 shadow-[2px_2px_0px_0px_#1e293b] flex items-center justify-center mb-1.5 shrink-0">
                    {choiceImg ? (
                      isEmoji(choiceImg) ? (
                        <span className="text-4xl md:text-5xl select-none animate-bounce" role="img" aria-label={choice}>
                          {choiceImg}
                        </span>
                      ) : (
                        <img 
                          src={choiceImg} 
                          alt={choice} 
                          className="w-full h-full object-contain drop-shadow-md"
                        />
                      )
                    ) : (
                      <span className="text-3xl md:text-4xl select-none" role="img" aria-label="question-mark">❓</span>
                    )}
                  </div>
                )}

                <span className={`${hasAnyImage ? "text-lg md:text-2xl" : "text-2xl md:text-3xl"} capitalize`}>
                  {choice}
                </span>

                {icon && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`absolute ${hasAnyImage ? "right-4 top-4" : "right-6"}`}
                  >
                    {icon}
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
