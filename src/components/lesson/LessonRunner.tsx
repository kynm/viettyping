import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LessonConfig } from "@/types/lesson";
import MatchingGame from "@/components/MatchingGame";
import TrueFalseGame from "@/components/TrueFalseGame";
import SpinWheelGame from "@/components/SpinWheelGame";
import FillInTheBlankGame from "@/components/FillInTheBlankGame";
import MultipleChoiceGame from "@/components/MultipleChoiceGame";
import { IoCheckmarkCircle } from "react-icons/io5";

export interface LessonRunnerProps {
  config: LessonConfig;
  onGameComplete?: (gameId: string, score: number, duration: number) => void;
  onAllGamesComplete: (summary: {
    totalScore: number;
    totalDuration: number;
    gameResults: Array<{ gameId: string; passed: boolean }>;
  }) => void;
  initialGameIndex?: number;
}

export default function LessonRunner({
  config,
  onGameComplete,
  onAllGamesComplete,
  initialGameIndex = 0,
}: LessonRunnerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialGameIndex);
  const [gameStartTime, setGameStartTime] = useState(Date.now());
  const [gameResults, setGameResults] = useState<Array<{ gameId: string; passed: boolean }>>([]);
  
  const { mini_games, flashcards } = config;
  const currentGame = mini_games[currentIndex];

  useEffect(() => {
    // Reset timer when game changes
    setGameStartTime(Date.now());
  }, [currentIndex]);

  const handleCurrentGameComplete = () => {
    const duration = Math.round((Date.now() - gameStartTime) / 1000);
    const score = 100; // Mock score per game for now
    
    if (onGameComplete && currentGame) {
      onGameComplete(currentGame.id, score, duration);
    }

    if (!currentGame) return;

    const newResults = [...gameResults, { gameId: currentGame.id, passed: true }];
    setGameResults(newResults);

    if (currentIndex < mini_games.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      onAllGamesComplete({
        totalScore: newResults.length * score,
        totalDuration: duration,
        gameResults: newResults,
      });
    }
  };

  const renderCurrentGame = () => {
    if (!currentGame) return null;

    switch (currentGame.type) {
      case "matching_game":
        return (
          <MatchingGame
            gameConfig={currentGame}
            flashcards={flashcards}
            onComplete={() => handleCurrentGameComplete()}
          />
        );
      case "true_false_game":
        return (
          <TrueFalseGame
            gameConfig={currentGame}
            flashcards={flashcards}
            onComplete={(telemetry) => {
              console.log("[TrueFalseGame Telemetry]:", telemetry);
              handleCurrentGameComplete();
            }}
          />
        );
      case "spin_wheel_items":
        return (
          <SpinWheelGame
            gameConfig={currentGame}
            flashcards={flashcards}
            onComplete={() => handleCurrentGameComplete()}
          />
        );
      case "fill_in_the_blank":
        return (
          <FillInTheBlankGame
            gameConfig={currentGame}
            flashcards={flashcards}
            onComplete={() => handleCurrentGameComplete()}
          />
        );
      case "multiple_choice":
        return (
          <MultipleChoiceGame
            gameConfig={currentGame}
            flashcards={flashcards}
            onComplete={() => handleCurrentGameComplete()}
          />
        );
      default:
        return (
          <>
            <p className="text-gray-600 mb-8 text-lg">
              (Giao diện game này chưa được hỗ trợ)
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCurrentGameComplete}
              className="bg-green-500 hover:bg-green-400 text-white font-black text-xl px-8 py-4 rounded-full shadow-[0_6px_0_0_#166534] hover:shadow-[0_3px_0_0_#166534] hover:translate-y-1 transition-all flex items-center gap-2"
            >
              <IoCheckmarkCircle size={28} />
              Hoàn Thành Game Này!
            </motion.button>
          </>
        );
    }
  };

  const formattedType = currentGame ? currentGame.type.replace(/_/g, " ") : "";

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentGame?.id || currentIndex}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.2 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-4xl bg-white/80 backdrop-blur-md rounded-3xl shadow-xl p-8 flex flex-col items-center min-h-[400px] justify-center text-center"
      >
        <h2 className="text-3xl font-black text-purple-700 mb-6 capitalize">
          Đang chơi: {formattedType}
        </h2>
        
        {renderCurrentGame()}
      </motion.div>
    </AnimatePresence>
  );
}
