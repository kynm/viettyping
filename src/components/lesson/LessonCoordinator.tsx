"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { IoChevronBack, IoChevronForward, IoPlay, IoRibbon, IoMusicalNotesOutline, IoTimeOutline, IoStar } from "react-icons/io5";
import { LessonConfig, LessonStep, ActivityResult, LessonSummary, TelemetryPayload, MiniGameConfig } from "@/types/lesson";
import Flashcard from "@/components/Flashcard";
import ProgressBar from "@/components/ProgressBar";
import TrueFalseGame from "@/components/TrueFalseGame";
import MatchingGame from "@/components/MatchingGame";
import SpinWheelGame from "@/components/SpinWheelGame";
import FillInTheBlankGame from "@/components/FillInTheBlankGame";
import MultipleChoiceGame from "@/components/MultipleChoiceGame";
import TypingPractice from "@/components/TypingPractice";
import RealWorldMathGame from "@/components/RealWorldMathGame";
import ColoringCanvas from "@/components/ColoringCanvas";

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export interface LessonCoordinatorProps {
  config: LessonConfig;
  studentNickname?: string;
  currentXP?: number;
  onActivityComplete?: (activityId: string, telemetry: TelemetryPayload) => void;
  onAllActivitiesComplete: (summary: LessonSummary) => void;
  initialStep?: LessonStep;
}

export default function LessonCoordinator({
  config,
  studentNickname,
  currentXP = 0,
  onActivityComplete,
  onAllActivitiesComplete,
  initialStep = "flashcards",
}: LessonCoordinatorProps) {
  const router = useRouter();
  
  // State nhận các thông số thời gian thực từ TypingPractice
  const [typingStats, setTypingStats] = useState<{
    wpm: number;
    accuracy: number;
    timeLeft: number;
    progressPercent: number;
    animal: string;
  } | null>(null);

  const [step, setStep] = useState<LessonStep>(initialStep);
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [typingPracticeIndex, setTypingPracticeIndex] = useState(0);
  const [gameIndex, setGameIndex] = useState(0);
  const [results, setResults] = useState<ActivityResult[]>([]);

  // Reset các thông số gõ phím khi chuyển bài gõ hoặc chuyển bước
  useEffect(() => {
    setTypingStats(null);
  }, [step, typingPracticeIndex]);

  // Pomodoro & Focus Mode states
  const [pomodoroState, setPomodoroState] = useState<"FOCUS" | "BREAK">("FOCUS");
  const [pomodoroTimeLeft, setPomodoroTimeLeft] = useState(0);
  const [focusProgress, setFocusProgress] = useState(0); // seed growth progress (0 to 100)
  const [, setIdleTime] = useState(0);
  const [showIdleReminder, setShowIdleReminder] = useState(false);
  const [breakType, setBreakType] = useState<"stretch" | "music">("stretch");

  const pomodoroIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Timers for tracking duration
  const stepStartTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    // Reset timer whenever step changes
    stepStartTimeRef.current = Date.now();
  }, [step, gameIndex, typingPracticeIndex]);

  // Listen to Enter key when summary screen is shown to go back home
  useEffect(() => {
    if (step !== "summary") return;

    const handleEnterPress = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        router.push("/");
      }
    };

    window.addEventListener("keydown", handleEnterPress);
    return () => window.removeEventListener("keydown", handleEnterPress);
  }, [step, router]);

  useEffect(() => {
    const isDev = typeof window !== 'undefined' && window.location.search.includes('dev');
    const FOCUS_LIMIT = isDev ? 15 : 15 * 60;
    const BREAK_LIMIT = isDev ? 5 : 3 * 60;

    if (pomodoroTimeLeft === 0) {
      setPomodoroTimeLeft(pomodoroState === "FOCUS" ? FOCUS_LIMIT : BREAK_LIMIT);
    }

    // Activity tracking for idle reminder
    const resetIdle = () => {
      setIdleTime(0);
      setShowIdleReminder(false);
    };

    window.addEventListener("mousemove", resetIdle);
    window.addEventListener("keydown", resetIdle);
    window.addEventListener("click", resetIdle);
    window.addEventListener("touchstart", resetIdle);

    // Idle Checker Interval
    const idleInterval = setInterval(() => {
      if (pomodoroState === "FOCUS") {
        setIdleTime((prev) => {
          if (prev >= 30) {
            setShowIdleReminder(true);
          }
          return prev + 1;
        });
      }
    }, 1000);

    // Pomodoro Timer Interval
    pomodoroIntervalRef.current = setInterval(() => {
      setPomodoroTimeLeft((prev) => {
        if (pomodoroState === "FOCUS") {
          const progress = ((FOCUS_LIMIT - prev) / FOCUS_LIMIT) * 100;
          setFocusProgress(progress);

          if (prev <= 1) {
            setPomodoroState("BREAK");
            setBreakType(Math.random() > 0.5 ? "stretch" : "music");
            try {
              const audio = new Audio('/ting.mp3');
              audio.play().catch(() => {});
            } catch {}
            return BREAK_LIMIT;
          }
          return prev - 1;
        } else {
          if (prev <= 1) {
            setPomodoroState("FOCUS");
            setFocusProgress(0);
            try {
              const audio = new Audio('/ting.mp3');
              audio.play().catch(() => {});
            } catch {}
            return FOCUS_LIMIT;
          }
          return prev - 1;
        }
      });
    }, 1000);

    return () => {
      window.removeEventListener("mousemove", resetIdle);
      window.removeEventListener("keydown", resetIdle);
      window.removeEventListener("click", resetIdle);
      window.removeEventListener("touchstart", resetIdle);
      clearInterval(idleInterval);
      clearInterval(pomodoroIntervalRef.current);
    };
  }, [pomodoroState]);

  const { flashcards, typing_practice, mini_games } = config;
  const totalActivities = 1 + (typing_practice?.length || 0) + (mini_games?.length || 0);

  // 1. Calculate overall progress percentage
  let progressPercent = 0;
  if (step === "flashcards") {
    const fcCount = flashcards?.length || 1;
    progressPercent = (flashcardIndex / fcCount) * (1 / totalActivities) * 100;
  } else if (step === "typing_practice") {
    // ProgressBar chính sẽ tạm thời biến thành đường đua của bài gõ hiện tại
    progressPercent = typingStats ? typingStats.progressPercent : 0;
  } else if (step === "mini_games") {
    progressPercent = ((1 + (typing_practice?.length || 0) + gameIndex) / totalActivities) * 100;
  } else if (step === "summary") {
    progressPercent = 100;
  }

  // 2. Handle completing Flashcards step
  const handleFlashcardsComplete = () => {
    const duration = Math.round((Date.now() - stepStartTimeRef.current) / 1000);
    
    // Save flashcard step result
    const flashcardResult: ActivityResult = {
      activityId: "flashcards",
      type: "flashcards",
      score: 100, // Watching flashcards awards max score
      durationSeconds: duration,
      passed: true,
    };

    const updatedResults = [...results, flashcardResult];
    setResults(updatedResults);

    if (onActivityComplete) {
      onActivityComplete("flashcards", {
        score: 100,
        durationSeconds: duration,
      });
    }

    // Go to typing practice if available, otherwise mini games, otherwise summary
    if (typing_practice && typing_practice.length > 0) {
      setStep("typing_practice");
      setTypingPracticeIndex(0);
    } else if (mini_games && mini_games.length > 0) {
      setStep("mini_games");
      setGameIndex(0);
    } else {
      setStep("summary");
      triggerAllActivitiesComplete(updatedResults);
    }
  };

  // 2b. Handle completing typing practice step
  const handleTypingComplete = (telemetry: TelemetryPayload) => {
    const typingResult: ActivityResult = {
      activityId: `typing_${typingPracticeIndex}`,
      type: "typing_practice",
      score: telemetry.score,
      durationSeconds: telemetry.durationSeconds,
      passed: telemetry.score >= 50,
      errors: telemetry.errors,
    };

    const updatedResults = [...results, typingResult];
    setResults(updatedResults);

    if (onActivityComplete) {
      onActivityComplete(`typing_${typingPracticeIndex}`, telemetry);
    }

    if (typing_practice && typingPracticeIndex < typing_practice.length - 1) {
      setTypingPracticeIndex((prev) => prev + 1);
    } else if (mini_games && mini_games.length > 0) {
      setStep("mini_games");
      setGameIndex(0);
    } else {
      setStep("summary");
      triggerAllActivitiesComplete(updatedResults);
    }
  };

  // 3. Handle completing an individual game
  const handleGameComplete = (gameId: string, telemetry: TelemetryPayload) => {
    const gameResult: ActivityResult = {
      activityId: gameId,
      type: "mini_game",
      score: telemetry.score,
      durationSeconds: telemetry.durationSeconds,
      passed: telemetry.score >= 50,
      errors: telemetry.errors,
    };

    const updatedResults = [...results, gameResult];
    setResults(updatedResults);

    if (onActivityComplete) {
      onActivityComplete(gameId, telemetry);
    }

    if (gameIndex < mini_games.length - 1) {
      setGameIndex((prev) => prev + 1);
    } else {
      setStep("summary");
      triggerAllActivitiesComplete(updatedResults);
    }
  };

  // Helper to calculate total summary and trigger callback
  const triggerAllActivitiesComplete = (finalResults: ActivityResult[]) => {
    const totalScore = finalResults.reduce((sum, r) => sum + r.score, 0);
    const totalDuration = finalResults.reduce((sum, r) => sum + r.durationSeconds, 0);

    onAllActivitiesComplete({
      totalScore,
      totalDuration,
      activityResults: finalResults,
    });
  };

  // Render components according to step
  const renderContent = () => {
    switch (step) {
      case "flashcards": {
        if (!flashcards || flashcards.length === 0) {
          return (
            <div className="text-center p-8 bg-white/80 rounded-3xl shadow-xl">
              <p className="text-gray-500 font-bold">Không có thẻ flashcard nào.</p>
              <button
                onClick={handleFlashcardsComplete}
                className="mt-4 bg-purple-600 text-white font-bold px-6 py-3 rounded-full"
              >
                Tiếp tục
              </button>
            </div>
          );
        }

        const currentFc = flashcards[flashcardIndex];

        return (
          <motion.div
            key={`flashcard-${flashcardIndex}`}
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -50, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="w-full flex flex-col items-center"
          >
            <div className="w-80 h-[380px] md:h-[420px] mb-8">
              <Flashcard
                word={currentFc.word}
                wordUppercase={currentFc.word_uppercase}
                spellingGuide={currentFc.spelling_guide}
                exampleSentence={currentFc.example_sentence}
                imagePrompt={currentFc.image_prompt}
                imageUrl={currentFc.image_url}
              />
            </div>

            {/* Flashcard Navigation */}
            <div className="flex items-center gap-6 bg-[var(--color-surface)] px-6 py-3 rounded-full border-3 border-[var(--color-foreground)] shadow-[4px_4px_0px_0px_var(--color-foreground)]">
              <motion.button
                data-testid="prev-fc-btn"
                whileHover={{ scale: flashcardIndex > 0 ? 1.1 : 1 }}
                whileTap={{ scale: flashcardIndex > 0 ? 0.9 : 1 }}
                onClick={() => flashcardIndex > 0 && setFlashcardIndex((prev) => prev - 1)}
                disabled={flashcardIndex === 0}
                className={`w-12 h-12 rounded-full flex items-center justify-center text-purple-600 transition-all ${
                  flashcardIndex === 0
                    ? "opacity-30 cursor-not-allowed bg-gray-100"
                    : "bg-purple-100 hover:bg-purple-200"
                }`}
              >
                <IoChevronBack size={24} />
              </motion.button>

              <span className="font-black text-purple-700 text-xl tracking-wider min-w-[60px] text-center">
                {flashcardIndex + 1} / {flashcards.length}
              </span>

              {flashcardIndex < flashcards.length - 1 ? (
                <motion.button
                  data-testid="next-fc-btn"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setFlashcardIndex((prev) => prev + 1)}
                  className="w-12 h-12 bg-purple-100 hover:bg-purple-200 rounded-full flex items-center justify-center text-purple-600 transition-all"
                >
                  <IoChevronForward size={24} />
                </motion.button>
              ) : (
                <motion.button
                  data-testid="play-game-btn"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleFlashcardsComplete}
                  className="bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white font-black px-6 py-3 rounded-full flex items-center gap-2 shadow-md shadow-emerald-200"
                >
                  <IoPlay size={20} />
                  Chơi game!
                </motion.button>
              )}
            </div>
          </motion.div>
        );
      }

      case "typing_practice": {
        if (!typing_practice || typing_practice.length === 0) {
          return null;
        }

        const currentTask = typing_practice[typingPracticeIndex];

        return (
          <motion.div
            key={`typing-${typingPracticeIndex}`}
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -30 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-none keycap-card p-4 md:p-6 flex flex-col items-center justify-center text-center transition-colors"
          >
            <p className="text-lg text-purple-600 mb-3 font-medium bg-purple-100 px-4 py-1 rounded-full">
              {currentTask.description}
            </p>
            
            <div className="w-full flex-1">
              <TypingPractice
                task={currentTask}
                onStatsChange={setTypingStats}
                onComplete={handleTypingComplete}
                hideStatsBar={true}
              />
            </div>
          </motion.div>
        );
      }

      case "mini_games": {
        const currentGame = mini_games[gameIndex];
        if (!currentGame) return null;

        // Render appropriate game
        const renderGame = () => {
          switch (currentGame.type) {
            case "true_false_game":
              return (
                <TrueFalseGame
                  key={currentGame.id}
                  gameConfig={currentGame}
                  flashcards={flashcards}
                  onComplete={(telemetry) => handleGameComplete(currentGame.id, telemetry)}
                />
              );

            case "matching_game":
              return (
                <MatchingGame
                  key={currentGame.id}
                  gameConfig={currentGame}
                  flashcards={flashcards}
                  onComplete={(telemetry) => handleGameComplete(currentGame.id, telemetry)}
                />
              );

            case "spin_wheel_items":
              return (
                <SpinWheelGame
                  key={currentGame.id}
                  gameConfig={currentGame}
                  flashcards={flashcards}
                  onComplete={(telemetry) => handleGameComplete(currentGame.id, telemetry)}
                />
              );

            case "fill_in_the_blank":
              return (
                <FillInTheBlankGame
                  key={currentGame.id}
                  gameConfig={currentGame}
                  flashcards={flashcards}
                  onComplete={(telemetry) => handleGameComplete(currentGame.id, telemetry)}
                />
              );

            case "multiple_choice":
              return (
                <MultipleChoiceGame
                  key={currentGame.id}
                  gameConfig={currentGame}
                  flashcards={flashcards}
                  onComplete={(telemetry) => handleGameComplete(currentGame.id, telemetry)}
                />
              );

            case "math_realworld_dragdrop":
              return (
                <RealWorldMathGame
                  key={currentGame.id}
                  gameConfig={currentGame}
                  onComplete={(telemetry) => handleGameComplete(currentGame.id, telemetry)}
                />
              );

            case "drawing_coloring_canvas":
              return (
                <ColoringCanvas
                  key={currentGame.id}
                  gameConfig={currentGame}
                  onComplete={(telemetry) => handleGameComplete(currentGame.id, telemetry)}
                />
              );

            default:
              return (
                <div className="text-center p-6 bg-white/85 rounded-3xl shadow-lg border border-purple-100 max-w-md w-full">
                  <p className="text-gray-600 mb-6 text-lg font-bold">
                    Trò chơi này chưa được hỗ trợ giao diện!
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() =>
                      handleGameComplete((currentGame as MiniGameConfig).id, {
                        score: 100,
                        durationSeconds: Math.round((Date.now() - stepStartTimeRef.current) / 1000),
                      })
                    }
                    className="bg-purple-600 hover:bg-purple-700 text-white font-black text-lg px-8 py-3 rounded-full shadow-lg shadow-purple-200 transition-all"
                  >
                    Bỏ qua game này
                  </motion.button>
                </div>
              );
          }
        };

        return (
          <motion.div
            key={`game-${currentGame.id}`}
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -30 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-7xl keycap-card p-6 md:p-8 flex flex-col items-center justify-center text-center transition-colors"
          >
            {renderGame()}
          </motion.div>
        );
      }

      case "summary": {
        const totalScore = results.reduce((sum, r) => sum + r.score, 0);
        const totalDuration = results.reduce((sum, r) => sum + r.durationSeconds, 0);
        const completionXp = config.base_rewards?.completion_xp || 100;
        const badgeName = config.base_rewards?.badge_name_vi || "Huy hiệu xuất sắc";

        return (
          <motion.div
            key="summary"
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -100, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 80, damping: 12 }}
            className="keycap-card border-4 border-[var(--color-accent)] p-8 max-w-md w-full text-center relative overflow-hidden transition-colors"
          >
            {/* Background Sparkles / Decorative stars */}
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-yellow-200/40 to-transparent pointer-events-none" />
            
            {/* Celebration Icon with rotation and floating effects */}
            <motion.div
              initial={{ rotate: -180, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 100, damping: 10, delay: 0.2 }}
              className="mx-auto w-24 h-24 bg-gradient-to-tr from-yellow-400 via-orange-400 to-pink-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-yellow-400/40 relative"
            >
              <IoRibbon className="text-white text-5xl animate-pulse" />
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border-4 border-dashed border-white/30"
              />
            </motion.div>

            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500 mb-2">
              {studentNickname ? `${studentNickname} đã hoàn thành!` : "Bé đã hoàn thành!"}
            </h2>
            <p className="text-gray-600 mb-6 font-bold text-lg">
              {(() => {
                const rawMessage = config.summary_config?.celebration_message || "Chúc mừng bé yêu gõ chữ rất giỏi!";
                if (studentNickname) {
                  return rawMessage
                    .replace(/bé yêu/gi, `${studentNickname} yêu`)
                    .replace(/bé/gi, studentNickname)
                    .replace(/con/gi, studentNickname);
                }
                return rawMessage;
              })()}
            </p>

            {/* Rewards Display (Badge & XP) */}
            <div className="flex flex-col gap-4 mb-6">
              {/* Badge reward */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-4 text-white shadow-md flex items-center gap-4 border border-purple-300/20"
              >
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-3xl">
                  🏆
                </div>
                <div className="text-left">
                  <div className="text-xs text-purple-200 font-bold uppercase tracking-wider">Huy hiệu mới</div>
                  <div className="text-lg font-black">{badgeName}</div>
                </div>
              </motion.div>

              {/* XP reward */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                className="bg-yellow-50 rounded-2xl p-4 border border-yellow-200 flex items-center gap-4 shadow-sm"
              >
                <div className="w-12 h-12 bg-yellow-400 rounded-xl flex items-center justify-center text-white text-2xl shadow-inner font-bold">
                  ★
                </div>
                <div className="text-left flex-1">
                  <div className="text-xs text-yellow-600 font-bold uppercase tracking-wider">Điểm kinh nghiệm</div>
                  <div className="text-2xl font-black text-yellow-700">+{completionXp} XP</div>
                </div>
              </motion.div>
            </div>

            {/* Performance Stats */}
            <div className="bg-purple-50 rounded-2xl p-5 mb-6 border border-purple-100 flex flex-col gap-3 text-sm">
              <div className="flex justify-between items-center text-purple-700 font-bold">
                <span>Tổng số hoạt động:</span>
                <span className="text-base font-black bg-purple-200/50 px-3 py-1 rounded-full">{results.length}</span>
              </div>
              <div className="flex justify-between items-center text-purple-700 font-bold">
                <span>Tổng số điểm đạt được:</span>
                <span className="text-base font-black text-yellow-700 bg-yellow-100/60 px-3 py-1 rounded-full">{totalScore} sao</span>
              </div>
              <div className="flex justify-between items-center text-purple-700 font-bold">
                <span>Thời gian học tập:</span>
                <span className="text-base font-black bg-purple-200/50 px-3 py-1 rounded-full">{totalDuration} giây</span>
              </div>
            </div>

            {/* Navigation Button */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                href="/"
                className="w-full inline-block bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white font-black text-lg py-3 rounded-2xl shadow-[0_6px_0_0_#059669] hover:shadow-[0_3px_0_0_#059669] transition-all hover:translate-y-[3px] active:shadow-none active:translate-y-[6px]"
              >
                Tuyệt vời! Quay lại trang chủ
              </Link>
            </motion.div>

            <p className="text-xs text-gray-400 mt-4 italic">
              Chúc mừng bé đã học xong bài: {config.lesson_title}
            </p>
          </motion.div>
        );
      }

      default:
        return null;
    }
  };

  // Tiêu đề động cho Header
  const getHeaderTitle = () => {
    switch (step) {
      case "flashcards":
        return "Học từ vựng";
      case "typing_practice": {
        const currentTask = typing_practice?.[typingPracticeIndex];
        return `Luyện gõ: ${currentTask?.type === "word" ? "Từ vựng" : "Câu"}`;
      }
      case "mini_games": {
        const currentGame = mini_games?.[gameIndex];
        if (!currentGame) return "Trò chơi trí tuệ";
        const formattedType = currentGame.type.replace(/_/g, " ");
        return `Trò chơi: ${formattedType}`;
      }
      case "summary":
        return "Kết quả bài học";
      default:
        return "Đảo Học Tập";
    }
  };

  const headerTitle = getHeaderTitle();

  return (
    <div className="w-full flex flex-col items-center relative">
      {/* Header động */}
      {step !== "summary" && (
        <header className={`py-2 md:py-3 px-4 flex items-center justify-between relative z-20 w-full mx-auto gap-3 transition-all duration-300 ${
          step === "typing_practice" ? "max-w-none" : "max-w-7xl"
        }`}>
          <Link
            href="/"
            className="flex items-center gap-2 bg-[var(--color-surface)] px-4 py-2.5 rounded-xl text-[var(--color-foreground)] font-black hover:translate-y-[-1px] active:translate-y-[1px] transition-all shadow-[2px_2px_0px_0px_var(--color-foreground)] border-2 border-[var(--color-foreground)] text-sm md:text-base cursor-pointer shrink-0"
          >
            <IoChevronBack size={20} className="stroke-[2px]" />
            <span className="hidden sm:inline">Quay lại</span>
          </Link>
          
          {/* Tiêu đề trò chơi/bài học ở giữa */}
          <div className="flex-1 text-center px-1">
            <span className="inline-block font-black text-[var(--color-foreground)] text-sm sm:text-lg bg-[var(--color-surface-container)] px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-xl border-2 border-[var(--color-foreground)] shadow-[2px_2px_0px_0px_var(--color-foreground)] capitalize truncate max-w-[140px] sm:max-w-[300px] md:max-w-none">
               {headerTitle}
            </span>
          </div>

          <div className="flex items-center gap-2 bg-[var(--color-surface)] px-4 py-2 rounded-xl shadow-[2px_2px_0px_0px_var(--color-foreground)] border-2 border-[var(--color-foreground)] text-sm md:text-base shrink-0">
            {/* Chỉ số Luyện gõ phím thời gian thực */}
            {step === "typing_practice" && typingStats && (
              <div className="flex items-center gap-2 md:gap-3 border-r border-slate-300/60 pr-2 md:pr-3 mr-1 text-xs sm:text-sm">
                <span className="font-extrabold text-blue-600 font-mono flex items-center gap-1">
                  ⏱️ {formatTime(typingStats.timeLeft)}
                </span>
                <span className="h-3 w-px bg-slate-300" />
                <span className="font-extrabold text-green-600 flex items-center gap-1">
                  ⚡ {typingStats.wpm} <span className="text-[10px] text-green-400 font-bold hidden md:inline">WPM</span>
                </span>
                <span className="h-3 w-px bg-slate-300" />
                <span className="font-extrabold text-purple-600 flex items-center gap-1">
                  🎯 {typingStats.accuracy}%
                </span>
              </div>
            )}

            {/* Đồng hồ đếm ngược Pomodoro (chỉ hiển thị khi không ở typing_practice để tránh rối mắt) */}
            {pomodoroState === "FOCUS" && step !== "typing_practice" && (
              <div className="flex items-center gap-1 border-r border-slate-300 pr-2 md:pr-3 mr-1 text-xs md:text-sm">
                <span className="animate-bounce select-none">
                  {focusProgress < 30 ? "🌱" : focusProgress < 65 ? "🌿" : focusProgress < 90 ? "🌸" : "🌳"}
                </span>
                <span className="font-extrabold text-green-700 font-mono tracking-wide">
                  {formatTime(pomodoroTimeLeft)}
                </span>
              </div>
            )}
            
            <IoStar className="text-yellow-400 text-lg md:text-2xl animate-pulse" />
            <span className="font-black text-purple-700 text-base md:text-xl">{currentXP} XP</span>
          </div>
        </header>
      )}

      {/* ProgressBar at the top of the container */}
      {step !== "summary" && (
        <div className={`w-full mb-3 px-4 transition-all duration-300 ${
          step === "typing_practice" ? "max-w-none" : "max-w-7xl"
        }`}>
          <ProgressBar progress={progressPercent} animal={step === "typing_practice" ? typingStats?.animal : undefined} />
        </div>
      )}

      {/* Pomodoro BREAK overlay */}
      <AnimatePresence>
        {pomodoroState === "BREAK" ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-purple-900/90 backdrop-blur-lg p-6 text-center select-none"
          >
            <div className="max-w-md bg-[#fffdfa] border-4 border-slate-800 rounded-[40px] p-8 shadow-[8px_8px_0px_0px_#1e293b] flex flex-col items-center text-slate-800">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="text-8xl mb-6"
              >
                {breakType === "stretch" ? "🧘‍♀️" : "🎵"}
              </motion.div>
              
              <h2 className="text-3xl font-black mb-3 text-amber-600">
                {breakType === "stretch" ? "Bé ơi, giải lao giãn cơ nhé!" : "Bé ơi, hát cùng nhạc nhé!"}
              </h2>
              
              <p className="text-sm text-slate-650 font-bold mb-6">
                {breakType === "stretch" 
                  ? "Hãy đứng dậy vươn vai thật cao, quay cổ nhẹ nhàng và chớp mắt 5 lần để đôi mắt bé được nghỉ ngơi nhé!"
                  : "Lắng nghe giai điệu vui tai dưới đây, lẩm nhẩm hát theo để rèn luyện giọng hát đúng giai điệu của bé!"
                }
              </p>

              {breakType === "music" && (
                <div className="w-full bg-slate-50 border-2 border-slate-800 rounded-2xl p-4 mb-6 shadow-[3px_3px_0px_0px_#1e293b] flex items-center justify-center gap-3">
                  <span className="text-2xl animate-bounce">🎵</span>
                  <div className="text-left flex-1 text-xs">
                    <div className="font-bold text-indigo-700">Đồ - Rê - Mi - Pha - Son - La - Si</div>
                    <div className="text-slate-500 italic">Bé tập đọc nốt nhạc theo nhịp nhé!</div>
                  </div>
                  <IoMusicalNotesOutline className="text-2xl text-indigo-600 animate-pulse" />
                </div>
              )}

              {breakType === "stretch" && (
                <div className="w-full bg-slate-50 border-2 border-slate-800 rounded-2xl p-4 mb-6 shadow-[3px_3px_0px_0px_#1e293b] flex flex-wrap justify-center gap-4 text-xs font-bold text-slate-700">
                  <span className="bg-white border-2 border-slate-800 px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-[2px_2px_0px_0px_#1e293b]">🙆‍♂️ Vươn vai</span>
                  <span className="bg-white border-2 border-slate-800 px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-[2px_2px_0px_0px_#1e293b]">👀 Nhắm mắt</span>
                  <span className="bg-white border-2 border-slate-800 px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-[2px_2px_0px_0px_#1e293b]">🚶‍♂️ Đứng dậy</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-base font-black text-slate-800 bg-white border-2 border-slate-800 px-6 py-2.5 rounded-full shadow-[3px_3px_0px_0px_#1e293b]">
                <IoTimeOutline className="text-xl animate-spin" />
                <span>Học tiếp sau: {pomodoroTimeLeft} giây</span>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>



      {/* Idle distraction overlay */}
      <AnimatePresence>
        {showIdleReminder && pomodoroState === "FOCUS" && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-4 right-4 z-45 bg-[#fffdfa] border-3 border-slate-800 rounded-3xl p-4 shadow-[4px_4px_0px_0px_#1e293b] max-w-[280px] flex items-center gap-3"
          >
            <span className="text-4xl animate-bounce">🐶</span>
            <div className="text-left">
              <h5 className="font-black text-purple-700 text-xs mb-0.5">
                {studentNickname ? `${studentNickname} ơi, ${studentNickname} đâu rồi?` : "Bé ơi, bé đâu rồi?"}
              </h5>
              <p className="text-[10px] text-slate-500 leading-tight">
                Hãy gõ phím hoặc chạm màn hình tiếp tục học để nhận sao lấp lánh nhé!
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="w-full flex justify-center px-4">
        <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>
      </div>
    </div>
  );
}
