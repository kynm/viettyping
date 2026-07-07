"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Play, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { GameAdapterProps, TelemetryPayload, Flashcard, SpinWheelItem } from "@/types/lesson";
import { useStudent } from "@/contexts/StudentContext";
import { useSound } from "@/contexts/SoundContext";

export type SpinWheelGameConfig = SpinWheelItem;

const isEmoji = (url: string) => {
  if (!url) return false;
  return !url.includes('/') && !url.includes('.') && url.length < 10;
};

export default function SpinWheelGame({ gameConfig, flashcards = [], onComplete }: GameAdapterProps<SpinWheelItem>) {
  const { id: gameId, items } = gameConfig;
  const { studentInfo } = useStudent();
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [pendingWinnerIndex, setPendingWinnerIndex] = useState<number | null>(null);

  const matchedFlashcard = selectedItem
    ? flashcards.find((f) => f.word.toLowerCase() === selectedItem.toLowerCase())
    : null;

  // Telemetry state
  const startTimeRef = useRef<number>(Date.now());

  const { playSound } = useSound();

  useEffect(() => {
    startTimeRef.current = Date.now();
  }, [gameId]);

  const spinWheel = () => {
    if (isSpinning) return;
    
    setIsSpinning(true);
    setSelectedItem(null);
    setShowPopup(false);

    // Phát tiếng tick quay bánh xe liên tục và chậm dần bằng Web Audio API
    let tickInterval = 60; // ban đầu quay nhanh
    let elapsed = 0;
    const maxDuration = 2800; // Quay trong khoảng 2.8s
    
    const playTickLoop = () => {
      if (elapsed >= maxDuration) return;
      playSound('tick');
      
      elapsed += tickInterval;
      // Chậm dần đều
      tickInterval = 60 + (elapsed / maxDuration) * 320;
      
      setTimeout(playTickLoop, tickInterval);
    };
    playTickLoop();

    const spinSpins = 5; // 5 full rotations
    const sliceAngle = 360 / items.length;
    
    // Pick a random winner
    const winnerIndex = Math.floor(Math.random() * items.length);
    const winnerTextAngle = (winnerIndex * sliceAngle) + (sliceAngle / 2);
    
    // Calculate final rotation
    const randomOffset = Math.random() * (sliceAngle * 0.6) - (sliceAngle * 0.3);
    
    const targetRotation = rotation + (spinSpins * 360) + (360 - winnerTextAngle) - (rotation % 360) + randomOffset;

    setRotation(targetRotation);
    setPendingWinnerIndex(winnerIndex);
  };

  const playTTS = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'vi-VN';
      utterance.rate = 0.8; // Slower for kids
      window.speechSynthesis.speak(utterance);
    }
  };

  // When popup opens, auto play TTS
  useEffect(() => {
    if (showPopup && selectedItem) {
      playTTS(selectedItem);
    }
  }, [showPopup, selectedItem]);

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto py-8">
      
      {/* Spin Wheel Container */}
      <div className="relative w-72 h-72 md:w-96 md:h-96 mb-12">
        {/* Pointer */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 w-8 h-8 text-yellow-500 drop-shadow-xl flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 rotate-180">
            <path d="M12 2L22 20H2L12 2Z" />
          </svg>
        </div>

        <motion.div 
          className="w-full h-full rounded-full border-8 border-white shadow-2xl overflow-hidden relative"
          animate={{ rotate: rotation }}
          transition={{ duration: 3, ease: "circOut" }}
          onAnimationComplete={() => {
            if (isSpinning && pendingWinnerIndex !== null) {
              setIsSpinning(false);
              setSelectedItem(items[pendingWinnerIndex]);
              setShowPopup(true);
              
              playSound('tada');

              confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff']
              });
              
              setPendingWinnerIndex(null);
            }
          }}
          style={{ 
            transformOrigin: "center center",
            background: `conic-gradient(${items.map((_, i) => {
              const angle = 360 / items.length;
              const colors = ['#FF595E', '#FFCA3A', '#8AC926', '#1982C4', '#6A4C93', '#F15BB5', '#00BBF9', '#00F5D4'];
              return `${colors[i % colors.length]} ${i * angle}deg ${(i + 1) * angle}deg`;
            }).join(', ')})`
          }}
        >
          {items.map((item, index) => {
            const angle = 360 / items.length;
            // The text should be placed in the middle of each slice
            // Slice starts at index * angle, ends at (index + 1) * angle
            // Middle is (index * angle) + (angle / 2)
            // But 0 degrees in conic gradient is at the top (12 o'clock).
            // To point text from center to edge, we rotate the text container
            const textAngle = (index * angle) + (angle / 2);
            
            return (
              <div 
                key={index} 
                className="absolute top-0 left-0 w-full h-full flex items-start justify-center pt-4"
                style={{
                  transform: `rotate(${textAngle}deg)`,
                }}
              >
                <span className="text-white font-black text-2xl md:text-3xl drop-shadow-md">
                  {item}
                </span>
              </div>
            );
          })}
          
          {/* Wheel Center Peg */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-inner z-10 border-4 border-gray-200" />
        </motion.div>
      </div>

      {/* Spin Button */}
      <motion.button
        whileHover={!isSpinning ? { scale: 1.05 } : {}}
        whileTap={!isSpinning ? { scale: 0.95 } : {}}
        onClick={() => { playSound('pop'); spinWheel(); }}
        disabled={isSpinning}
        className={`bg-orange-400 hover:bg-orange-300 text-white font-black text-2xl px-12 py-4 rounded-3xl border-4 border-slate-800 shadow-[4px_4px_0px_0px_#1e293b] transition-all flex items-center gap-3 ${
          isSpinning ? "opacity-50 cursor-not-allowed" : "active:translate-y-[4px] active:shadow-none"
        }`}
      >
        <Play fill="currentColor" size={28} />
        {isSpinning ? 'Đang quay...' : 'Quay Ngay!'}
      </motion.button>

      {/* Result Popup */}
      <AnimatePresence>
        {showPopup && selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5, y: 50 }}
              transition={{ type: "spring", bounce: 0.5 }}
              className="bg-[#fffdfa] rounded-3xl p-8 max-w-sm w-full text-center border-4 border-slate-800 shadow-[8px_8px_0px_0px_#1e293b] relative overflow-hidden"
            >
              <h2 className="text-2xl font-bold text-gray-700 mb-4">
                {studentInfo ? `${studentInfo.nickname} quay được chữ:` : "Bé quay được chữ:"}
              </h2>
              
              <div className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-purple-500 to-pink-500 mb-4 py-2">
                {selectedItem}
              </div>

              {matchedFlashcard?.image_url && (
                <motion.div
                  initial={{ scale: 0, rotate: -15 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                  className="w-36 h-36 mx-auto mb-6 relative rounded-3xl overflow-hidden border-4 border-slate-800 p-1 shadow-[4px_4px_0px_0px_#1e293b] bg-white flex items-center justify-center animate-bounce"
                >
                  {isEmoji(matchedFlashcard.image_url) ? (
                    <span className="text-6xl md:text-7xl select-none">{matchedFlashcard.image_url}</span>
                  ) : (
                    <img
                      src={matchedFlashcard.image_url}
                      alt={selectedItem}
                      className="w-full h-full object-cover rounded-2xl"
                    />
                  )}
                </motion.div>
              )}

              <div className="flex gap-3 justify-center w-full">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { playSound('pop'); playTTS(selectedItem); }}
                  className="flex-1 sm:flex-none bg-blue-400 hover:bg-blue-300 text-white border-3 border-slate-800 font-bold text-sm sm:text-lg px-4 sm:px-6 py-3 sm:py-4 rounded-2xl shadow-[3px_3px_0px_0px_#1e293b] transition-all flex items-center justify-center gap-1.5 active:translate-y-[3px] active:shadow-none whitespace-nowrap"
                >
                  <Volume2 size={20} className="shrink-0" />
                  <span>Nghe lại</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    playSound('pop');
                    const durationSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
                    onComplete({
                      score: 100,
                      durationSeconds,
                    });
                  }}
                  className="flex-1 sm:flex-none bg-green-400 hover:bg-green-300 text-white border-3 border-slate-800 font-bold text-sm sm:text-lg px-4 sm:px-6 py-3 sm:py-4 rounded-2xl shadow-[3px_3px_0px_0px_#1e293b] transition-all flex items-center justify-center gap-1.5 active:translate-y-[3px] active:shadow-none whitespace-nowrap"
                >
                  <Check size={20} className="shrink-0" />
                  <span>Tiếp tục</span>
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
