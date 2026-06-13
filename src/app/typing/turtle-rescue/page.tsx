'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Play, Sparkles, Volume2, VolumeX, Shield, Heart, Keyboard, Flag, Star } from 'lucide-react';
import { useSound } from '@/contexts/SoundContext';
import { Plus_Jakarta_Sans } from 'next/font/google';
import confetti from 'canvas-confetti';
import { setStoredValue } from '@/lib/client-storage';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700', '800']
});

interface WordItem {
  word: string;
  telex: string;
  emoji: string;
}

const TOPICS = {
  animals: {
    name: 'Động Vật',
    desc: 'Bé giúp Rùa con tránh các loài sứa độc và tìm bạn động vật nhé!',
    color: 'from-amber-400 to-orange-500 border-amber-300 shadow-amber-200',
    words: [
      { word: 'cá', telex: 'cas', emoji: '🐟' },
      { word: 'rùa', telex: 'ruaf', emoji: '🐢' },
      { word: 'thỏ', telex: 'thof', emoji: '🐰' },
      { word: 'gà', telex: 'gaf', emoji: '🐔' },
      { word: 'vịt', telex: 'vitj', emoji: '🦆' },
      { word: 'chó', telex: 'chos', emoji: '🐶' },
      { word: 'mèo', telex: 'meof', emoji: '🐱' },
      { word: 'voi', telex: 'voi', emoji: '🐘' },
      { word: 'hổ', telex: 'hoof', emoji: '🐯' },
      { word: 'bò', telex: 'bof', emoji: '🐂' },
      { word: 'dê', telex: 'dee', emoji: '🐐' }
    ]
  },
  fruits: {
    name: 'Trái Cây',
    desc: 'Hái những quả chín mọng và phá hủy các chai nhựa ô nhiễm biển nào!',
    color: 'from-emerald-400 to-teal-500 border-emerald-300 shadow-emerald-200',
    words: [
      { word: 'táo', telex: 'taos', emoji: '🍎' },
      { word: 'cam', telex: 'cam', emoji: '🍊' },
      { word: 'nho', telex: 'nho', emoji: '🍇' },
      { word: 'lê', telex: 'lee', emoji: '🍐' },
      { word: 'ổi', telex: 'ooir', emoji: '🍈' },
      { word: 'mít', telex: 'mits', emoji: '🍍' },
      { word: 'dừa', telex: 'duwaf', emoji: '🥥' },
      { word: 'bơ', telex: 'bow', emoji: '🥑' },
      { word: 'mận', telex: 'mawnj', emoji: '🍒' },
      { word: 'chuối', telex: 'chuoois', emoji: '🍌' }
    ]
  },
  objects: {
    name: 'Đồ Vật',
    desc: 'Gõ phím để dọn dẹp các mảnh lưới rác ngầm cứu Rùa nhé bé!',
    color: 'from-pink-400 to-rose-500 border-pink-300 shadow-pink-200',
    words: [
      { word: 'bàn', telex: 'banf', emoji: '🪑' },
      { word: 'ghế', telex: 'ghees', emoji: '🪑' },
      { word: 'sách', telex: 'sachs', emoji: '📘' },
      { word: 'vở', telex: 'vowr', emoji: '📙' },
      { word: 'bút', telex: 'buts', emoji: '✏️' },
      { word: 'kéo', telex: 'keos', emoji: '✂️' },
      { word: 'cặp', telex: 'cawpj', emoji: '🎒' },
      { word: 'loa', telex: 'loa', emoji: '🔊' },
      { word: 'đèn', telex: 'ddeenf', emoji: '💡' },
      { word: 'tủ', telex: 'tur', emoji: '🗄️' }
    ]
  },
  letters: {
    name: 'Chữ Cái',
    desc: 'Luyện tập các phím đơn giản nhất để Rùa tăng tốc về đích!',
    color: 'from-purple-400 to-indigo-500 border-purple-300 shadow-purple-200',
    words: [
      { word: 'A', telex: 'a', emoji: '🅰️' },
      { word: 'B', telex: 'b', emoji: '🅱️' },
      { word: 'C', telex: 'c', emoji: '🇨' },
      { word: 'D', telex: 'd', emoji: '🇩' },
      { word: 'E', telex: 'e', emoji: '🇪' },
      { word: 'G', telex: 'g', emoji: '🇬' },
      { word: 'H', telex: 'h', emoji: '🇭' },
      { word: 'I', telex: 'i', emoji: 'ℹ️' },
      { word: 'K', telex: 'k', emoji: '🇰' },
      { word: 'L', telex: 'l', emoji: '🇱' },
      { word: 'M', telex: 'm', emoji: '🇲' },
      { word: 'N', telex: 'n', emoji: '🇳' },
      { word: 'O', telex: 'o', emoji: '🅾️' },
      { word: 'P', telex: 'p', emoji: '🇵' },
      { word: 'U', telex: 'u', emoji: '🇺' },
      { word: 'V', telex: 'v', emoji: '🇻' }
    ]
  }
};

const OBSTACLES = ['🍾', '🛍️', '👾', '🪨', '⚓'];

export default function TurtleRescuePage() {
  const router = useRouter();
  const { playSound } = useSound();

  // Trạng thái game: 'setup' | 'playing' | 'victory'
  const [gameState, setGameState] = useState<'setup' | 'playing' | 'victory'>('setup');
  const [selectedTopic, setSelectedTopic] = useState<keyof typeof TOPICS>('animals');
  const [gameWords, setGameWords] = useState<WordItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [inputValue, setInputValue] = useState<string>('');
  
  // Các hiệu ứng hình ảnh
  const [shootBubble, setShootBubble] = useState<boolean>(false);
  const [obstacleExplode, setObstacleExplode] = useState<boolean>(false);
  const [shakeInput, setShakeInput] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  // Lưu trữ XP ban đầu để cộng thêm khi thắng
  const [xp, setXp] = useState<number>(0);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsMounted(true);
    try {
      const savedXp = parseInt(localStorage.getItem('typing_xp') || '0', 10);
      setXp(savedXp);
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Bắt đầu chơi game với chủ đề đã chọn
  const handleStartGame = (topicKey: keyof typeof TOPICS) => {
    playSound('click');
    const topicData = TOPICS[topicKey];
    
    // Trộn ngẫu nhiên danh sách từ vựng và chọn lấy 10 từ để chơi
    const shuffled = [...topicData.words].sort(() => 0.5 - Math.random()).slice(0, 10);
    
    setGameWords(shuffled);
    setCurrentIndex(0);
    setInputValue('');
    setSelectedTopic(topicKey);
    setGameState('playing');
    
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleBack = () => {
    playSound('click');
    if (gameState === 'playing') {
      if (confirm('Bé có muốn dừng chơi game và quay về trang chủ không?')) {
        setGameState('setup');
      }
    } else {
      router.push('/');
    }
  };

  // Xử lý khi bé gõ phím vào ô nhập liệu
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().trim();
    const currentTarget = gameWords[currentIndex];

    if (!currentTarget) return;

    // So khớp phím gõ Telex
    if (value === currentTarget.telex) {
      // Bé gõ đúng hoàn toàn từ hiện tại!
      setInputValue('');
      setShootBubble(true);
      playSound('correct');

      // Đợi bong bóng bay tới chướng ngại vật (khoảng 500ms)
      setTimeout(() => {
        setObstacleExplode(true);
        playSound('pop');
        setShootBubble(false);

        // Đợi hiệu ứng nổ kết thúc (khoảng 300ms)
        setTimeout(() => {
          setObstacleExplode(false);
          const nextIdx = currentIndex + 1;
          
          if (nextIdx >= gameWords.length) {
            // Chiến thắng!
            handleVictory();
          } else {
            setCurrentIndex(nextIdx);
            // Focus lại ô gõ
            inputRef.current?.focus();
          }
        }, 300);

      }, 500);

    } else {
      // Đang gõ dở hoặc sai
      setInputValue(e.target.value);
      
      // Kiểm tra xem bé có gõ sai phím nào không
      const typedLen = value.length;
      const targetPrefix = currentTarget.telex.substring(0, typedLen);
      if (value !== targetPrefix && typedLen > 0) {
        // Gõ sai phím! Rung nhẹ ô gõ và phát tiếng boing
        playSound('wrong');
        setShakeInput(true);
        setTimeout(() => setShakeInput(false), 500);
        // Xóa ký tự gõ sai để bé gõ lại
        setInputValue(e.target.value.substring(0, typedLen - 1));
      }
    }
  };

  // Xử lý khi bé chiến thắng
  const handleVictory = () => {
    setGameState('victory');
    playSound('tada');
    
    // Lưu XP mới
    const rewardXp = 300;
    const newXp = xp + rewardXp;
    setXp(newXp);
    
    try {
      setStoredValue('typing_xp', String(newXp));
      setStoredValue('viettyping_badge_turtle_rescue', 'true');
    } catch (e) {
      console.error('Failed to save rewards:', e);
    }

    // Pháo hoa ăn mừng rực rỡ
    const duration = 4 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.8 }
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.8 }
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  };

  if (!isMounted) return null;

  // Tính phần trăm tiến trình
  const progressPercent = gameWords.length > 0 ? (currentIndex / gameWords.length) * 100 : 0;
  
  // Xác định biểu tượng chướng ngại vật ngẫu nhiên dựa vào index
  const obstacleIcon = OBSTACLES[currentIndex % OBSTACLES.length];

  return (
    <div className={`min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)] flex flex-col justify-between ${plusJakartaSans.className} transition-colors overflow-x-hidden`}>
      
      {/* Top Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b-4 border-slate-800 px-6 py-4 flex items-center justify-between z-10 shrink-0">
        <button
          onClick={handleBack}
          className="keycap-btn-surface px-4 py-2 text-xs"
        >
          <ArrowLeft className="w-4 h-4 stroke-[3px] mr-1" />
          <span>{gameState === 'playing' ? 'Dừng chơi' : 'Quay lại'}</span>
        </button>

        <h1 className="text-xl md:text-2xl font-black text-slate-900 flex items-center gap-2 tracking-wide">
          Giải cứu Rùa con
        </h1>

        <div className="flex items-center gap-2 bg-amber-50 border-2 border-slate-850 px-3.5 py-1.5 rounded-xl shadow-[2.5px_2.5px_0px_0px_#1e293b]">
          <Star className="w-4 h-4 text-amber-500 fill-amber-300" />
          <span className="text-xs font-black text-slate-800">{xp} XP</span>
        </div>
      </header>

      {/* Main Area */}
      <main className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-6 flex flex-col justify-center min-h-0">
        <AnimatePresence mode="wait">
          
          {/* MÀN HÌNH CHỌN CHỦ ĐỀ (SETUP) */}
          {gameState === 'setup' && (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full text-center space-y-8"
            >
              <div className="space-y-3">
                <span className="text-7xl inline-block animate-bounce">🐢🌊</span>
                <h2 className="text-3xl md:text-4xl font-black text-slate-900">Bé hãy chọn một chủ đề học gõ nhé!</h2>
                <p className="text-slate-500 text-sm md:text-base font-semibold max-w-md mx-auto leading-relaxed">
                  Gõ đúng các từ hiển thị trên chướng ngại vật để giúp bạn Rùa bơi lội an toàn về rặng san hô nào. Thắng cuộc sẽ được cộng ngay <strong className="text-orange-550 font-black">+300 XP</strong> thưởng!
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 px-4">
                {(Object.keys(TOPICS) as Array<keyof typeof TOPICS>).map((topicKey) => {
                  const topic = TOPICS[topicKey];
                  return (
                    <motion.div
                      key={topicKey}
                      whileHover={{ scale: 1.03, y: -4 }}
                      onClick={() => handleStartGame(topicKey)}
                      className={`bg-white border-4 border-slate-800 rounded-[28px] p-5 cursor-pointer flex flex-col justify-between text-center transition-all shadow-[6px_6px_0px_0px_#1e293b]`}
                    >
                      <div className="space-y-3">
                        <div className={`w-full h-24 rounded-2xl bg-gradient-to-br ${topic.color.split(' ')[0]} ${topic.color.split(' ')[1]} flex items-center justify-center text-5xl shadow-sm border-2 border-slate-850`}>
                          {topic.words[0]?.emoji || '🍀'}
                        </div>
                        <h3 className="text-lg font-black text-slate-850">{topic.name}</h3>
                        <p className="text-slate-500 text-[10px] font-bold leading-normal min-h-[36px]">
                          {topic.desc}
                        </p>
                      </div>
                      
                      <button
                        className="keycap-btn-primary mt-5 w-full py-2.5 text-xs"
                      >
                        <Play className="w-3.5 h-3.5 fill-white mr-1.5" />
                        <span>Chơi ngay</span>
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* MÀN HÌNH CHƠI GAME (PLAYING) */}
          {gameState === 'playing' && gameWords[currentIndex] && (
            <motion.div
              key="playing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full flex flex-col gap-6"
            >
              {/* Thanh tiến độ giải cứu */}
              <div className="bg-white/80 border-3 border-slate-800 rounded-2xl p-4 shadow-[4px_4px_0px_0px_#1e293b] flex items-center justify-between gap-4">
                <span className="text-xs font-black text-slate-800 flex items-center gap-1.5 whitespace-nowrap">
                  <span>Tiến trình giải cứu:</span>
                  <span className="text-indigo-600 font-extrabold text-sm">{currentIndex}/{gameWords.length} từ</span>
                </span>
                
                <div className="w-full bg-slate-200 border-2 border-slate-850 rounded-full h-6 p-0.5 overflow-hidden relative">
                  <motion.div
                    className="bg-gradient-to-r from-sky-400 to-indigo-500 h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.3 }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-slate-850 uppercase">
                    {Math.round(progressPercent)}% về đích
                  </div>
                </div>
                
                <Flag className="w-5 h-5 text-indigo-500" />
              </div>

              {/* Sân khấu Đại dương Game Canvas */}
              <div className="w-full h-72 md:h-80 bg-gradient-to-b from-sky-400 via-sky-500 to-indigo-850 border-4 border-slate-800 rounded-[32px] shadow-[6px_6px_0px_0px_#1e293b] relative overflow-hidden flex items-center justify-between px-10 select-none">
                
                {/* Bong bóng nước nhẹ trôi lên */}
                {[...Array(6)].map((_, idx) => (
                  <motion.div
                    key={idx}
                    className="absolute bg-white/20 border border-white/30 rounded-full"
                    style={{
                      width: Math.random() * 20 + 10,
                      height: Math.random() * 20 + 10,
                      left: `${15 + idx * 15}%`,
                      bottom: '-40px'
                    }}
                    animate={{
                      y: [0, -400],
                      opacity: [0, 0.6, 0]
                    }}
                    transition={{
                      duration: Math.random() * 5 + 6,
                      repeat: Infinity,
                      delay: Math.random() * 3,
                      ease: 'linear'
                    }}
                  />
                ))}

                {/* Vật cản lưới rác trang trí đại dương ở đáy */}
                <div className="absolute bottom-0 left-0 right-0 h-10 bg-indigo-900/60 border-t-2 border-indigo-800 flex justify-around items-end text-xl">
                  <span>🌿</span>
                  <span>🪸</span>
                  <span>🐚</span>
                  <span>🪸</span>
                  <span>🌿</span>
                </div>

                {/* 1. CHÚ RÙA CON (Bên trái) */}
                <div className="relative w-28 h-28 flex items-center justify-center">
                  <motion.div
                    animate={{ 
                      y: [0, -8, 8, 0],
                      rotate: [0, -3, 3, 0]
                    }}
                    transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                    className="text-7xl filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.15)] relative"
                  >
                    🐢
                    {/* Bong bóng bắn đi khi gõ đúng */}
                    <AnimatePresence>
                      {shootBubble && (
                        <motion.div
                          initial={{ x: 30, y: 10, scale: 0.4, opacity: 1 }}
                          animate={{ x: 450, y: 0, scale: 1.5, opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.5, ease: 'easeOut' }}
                          className="absolute text-3xl z-25 text-yellow-300 filter drop-shadow-md"
                        >
                          🫧
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </div>

                {/* 2. CHƯỚNG NGẠI VẬT (Bên phải) */}
                <AnimatePresence mode="wait">
                  {!obstacleExplode ? (
                    <motion.div
                      key={currentIndex}
                      initial={{ x: 300, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: -100, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                      className="relative flex flex-col items-center gap-2"
                    >
                      {/* Bong bóng chữ to hiển thị Từ Vựng */}
                      <div className="bg-white border-3 border-slate-800 px-6 py-3 rounded-2xl shadow-[3px_3px_0px_0px_#1e293b] flex flex-col items-center text-center whitespace-nowrap min-w-[130px] relative">
                        {/* Từ hiển thị tiếng Việt */}
                        <div className="text-3xl font-black text-slate-900 flex items-center gap-2">
                          <span className="text-3xl">{gameWords[currentIndex].emoji}</span>
                          <span>{gameWords[currentIndex].word}</span>
                        </div>
                        {/* Hướng dẫn gõ Telex nhỏ cho bé */}
                        <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1 border-t border-slate-100 pt-1 w-full">
                          {gameWords[currentIndex].telex.split('').map((char, index) => (
                            <span key={index} className="mx-0.5 bg-slate-100 px-1 py-0.5 rounded border border-slate-200">
                              {char}
                            </span>
                          ))}
                        </div>
                        
                        {/* Mũi tên chỉ xuống bong bóng */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-6 border-transparent border-t-slate-800" />
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white mt-[-2px]" />
                      </div>

                      {/* Icon chướng ngại vật thực tế */}
                      <span className="text-6.5xl filter drop-shadow-md animate-pulse">
                        {obstacleIcon}
                      </span>
                    </motion.div>
                  ) : (
                    // Hiệu ứng phát nổ khi gõ đúng
                    <motion.div
                      key="explosion"
                      initial={{ scale: 0.8, opacity: 1 }}
                      animate={{ scale: 2.2, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="text-6xl flex items-center justify-center mr-20"
                    >
                      💥
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>

              {/* Ô gõ phím & Bàn phím gõ */}
              <div className="flex flex-col items-center justify-center space-y-4 pt-2">
                <label className="text-slate-800 font-extrabold text-base flex items-center gap-2">
                  <Keyboard className="w-5 h-5 text-slate-700" />
                  <span>Bé gõ đúng chữ ở trên nhé:</span>
                </label>
                
                <motion.div
                  animate={shakeInput ? { x: [-10, 10, -10, 10, -5, 5, 0] } : {}}
                  transition={{ duration: 0.5 }}
                  className={`w-full max-w-md bg-white border-4 border-slate-800 rounded-3xl p-3.5 shadow-[5px_5px_0px_0px_#1e293b] flex items-center justify-between ${
                    shakeInput ? 'bg-rose-50 border-rose-400' : ''
                  }`}
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    placeholder="Gõ từ của chướng ngại vật..."
                    disabled={obstacleExplode}
                    className="w-full text-2xl font-black text-slate-800 placeholder-slate-350 focus:outline-none bg-transparent"
                    autoFocus
                  />
                  <Keyboard className="w-8 h-8 text-slate-400" />
                </motion.div>

                <p className="text-slate-500 text-xs font-bold italic">
                  Gợi ý: Nhìn kỹ các chữ cái nhỏ trong ô màu xanh trên chướng ngại vật để gõ Telex nha con!
                </p>
              </div>
            </motion.div>
          )}

          {/* MÀN HÌNH CHIẾN THẮNG (VICTORY) */}
          {gameState === 'victory' && (
            <motion.div
              key="victory"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 15 }}
              className="bg-white border-4 border-slate-800 rounded-[36px] p-8 max-w-lg mx-auto text-center shadow-[8px_8px_0px_0px_#1e293b] space-y-6"
            >
              <div className="text-8xl animate-bounce py-2">🐢🎉🏆</div>
              
              <div className="space-y-2">
                <h2 className="text-3xl font-black text-indigo-950">Giải Cứu Thành Công!</h2>
                <p className="text-slate-600 font-bold text-sm leading-relaxed max-w-sm mx-auto">
                  Bạn Rùa con đã vượt qua tất cả chướng ngại vật nguy hiểm dưới biển và bơi về với gia đình an toàn rồi! Bé thật là giỏi!
                </p>
              </div>

              {/* Hộp quà thưởng */}
              <div className="bg-amber-50 border-3 border-amber-300 rounded-2xl p-4 flex items-center justify-around max-w-sm mx-auto shadow-sm">
                <div className="text-left">
                  <div className="text-[10px] text-amber-700 font-black uppercase tracking-wider">Phần Thưởng Đạt Được</div>
                  <div className="text-2xl font-black text-amber-600 flex items-center gap-1">
                    <Sparkles className="w-5 h-5 text-amber-500 fill-amber-300 inline mr-1" />
                    <span>+300 XP</span>
                  </div>
                </div>
                <div className="text-4xl animate-pulse">🎁</div>
              </div>

              <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 text-xs text-sky-700 font-black max-w-sm mx-auto">
                🏅 Đã nhận Huy hiệu "Hiệp Sĩ Rùa" trong tủ huy hiệu của bé!
              </div>

              {/* Nút hành động */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-sm mx-auto pt-2">
                <button
                  onClick={() => handleStartGame(selectedTopic)}
                  className="keycap-btn-primary flex-1 py-3.5 text-sm"
                >
                  Chơi Lại Vòng Này
                </button>
                <button
                  onClick={() => setGameState('setup')}
                  className="keycap-btn-surface flex-1 py-3.5 text-sm"
                >
                  Đổi Chủ Đề Khác
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="py-6 shrink-0 border-t-4 border-slate-850 bg-white text-center text-xs font-black text-slate-500 flex flex-col gap-2">
        <span>Bé yêu gõ phím chính xác để đập tan chướng ngại vật bảo vệ biển cả nhé!</span>
        <span>
          Một sản phẩm miễn phí của{' '}
          <a
            href="https://easycheck.io.vn/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            EasyCheck
          </a>
        </span>
      </footer>

    </div>
  );
}
