'use client';

import React, { useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';
import { useSound } from '@/contexts/SoundContext';
import { motion } from 'framer-motion';
import { Home, Keyboard, Search } from 'lucide-react';
import { plusJakartaSans } from '@/lib/fonts';



export default function NotFound() {
  const router = useRouter();
  const { playSound } = useSound();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Phát âm thanh boing vui nhộn khi bé đi lạc vào trang 404
    playSound('boing');
  }, [playSound]);

  const handleNav = (path: string) => {
    playSound('click');
    router.push(path);
  };

  return (
    <main className={`min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-6 relative overflow-hidden ${plusJakartaSans.className}`}>
      
      {/* Đám mây trôi lơ lửng */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div 
          className="absolute top-12 left-1/10 w-32 h-10 bg-white/70 rounded-full blur-[0.5px]"
          animate={{ x: [-150, 1200] }}
          transition={{ repeat: Infinity, duration: 35, ease: 'linear' }}
        />
        <motion.div 
          className="absolute bottom-20 right-1/10 w-44 h-12 bg-white/60 rounded-full blur-[0.5px]"
          animate={{ x: [1200, -200] }}
          transition={{ repeat: Infinity, duration: 40, ease: 'linear' }}
        />
      </div>

      {/* Bong bóng lơ lửng */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {isMounted && [...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white/35 border border-white/40 shadow-sm"
            style={{
              width: 30 + i * 12,
              height: 30 + i * 12,
              left: `${15 + i * 18}%`,
              bottom: '-50px',
            }}
            animate={{
              y: [0, -1000],
              x: [0, (i % 2 === 0 ? 30 : -30), 0],
              opacity: [0, 0.7, 0]
            }}
            transition={{
              duration: 15 + i * 3,
              repeat: Infinity,
              delay: i * 2.5,
              ease: 'linear'
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-xl text-center bg-white/50 backdrop-blur-md p-8 md:p-12 rounded-[36px] border-4 border-white shadow-[0_16px_32px_rgba(99,102,241,0.08)]">
        
        {/* Khủng long dễ thương bị lạc */}
        <div className="relative inline-block mb-6">
          <motion.div
            className="text-8xl md:text-9xl drop-shadow-md select-none"
            animate={{ 
              y: [0, -15, 0],
              rotate: [0, -3, 3, 0]
            }}
            transition={{ 
              duration: 4, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          >
            🦖
          </motion.div>
          <motion.div
            className="absolute -top-2 -right-2 bg-yellow-400 border-2 border-slate-800 p-2 rounded-full shadow-[2px_2px_0px_0px_#1e293b] text-slate-800"
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Search className="w-5 h-5" />
          </motion.div>
        </div>

        {/* Tiêu đề lỗi tiếng Việt hoạt hình */}
        <h1 className="text-3xl md:text-4xl font-black text-indigo-950 mb-3 tracking-wide leading-tight">
          Bé ơi, Đường Này Lạ Quá! 🧭
        </h1>
        
        <p className="text-slate-700 text-sm md:text-base font-bold mb-8 leading-relaxed max-w-md mx-auto">
          Chú Khủng Long 🦖 đã đi lạc mất rồi. Hãy giúp chú quay trở lại Đảo Học Tập để tiếp tục hành trình gõ phím cực vui nhé!
        </p>

        {/* Nút bấm Chunky 3D */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95, y: 1 }}
            onClick={() => handleNav('/')}
            className="w-full sm:w-auto px-6 py-4 flex items-center justify-center gap-2.5 text-base font-black text-white bg-rose-500 hover:bg-rose-600 border-2 border-slate-800 rounded-2xl shadow-[4px_4px_0px_0px_#1e293b] transition-colors duration-200 cursor-pointer select-none"
          >
            <Home className="w-5 h-5" />
            <span>Về Trang Chủ 🏠</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95, y: 1 }}
            onClick={() => handleNav('/typing')}
            className="w-full sm:w-auto px-6 py-4 flex items-center justify-center gap-2.5 text-base font-black text-white bg-sky-500 hover:bg-sky-600 border-2 border-slate-800 rounded-2xl shadow-[4px_4px_0px_0px_#1e293b] transition-colors duration-200 cursor-pointer select-none"
          >
            <Keyboard className="w-5 h-5" />
            <span>Luyện Gõ Phím ⌨️</span>
          </motion.button>
        </div>
      </div>
    </main>
  );
}
