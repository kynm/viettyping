'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';


interface Bubble {
  id: string;
  char: string;
  left: string;
  size: number;
  color: string;
  textColor: string;
  shadowColor: string;
  duration: number;
  xRange: number[];
}

const VIETNAMESE_CHARS = [
  'A', 'Ă', 'Â', 'B', 'C', 'D', 'Đ', 'E', 'Ê', 'G', 'H', 'I', 
  'K', 'L', 'M', 'N', 'O', 'Ô', 'Ơ', 'P', 'Q', 'R', 'S', 'T', 
  'U', 'Ư', 'V', 'X', 'Y'
];

const BUBBLE_COLORS = [
  { bg: '#2ecc71', text: '#ffffff', shadow: '#27ae60' }, // Green
  { bg: '#3498db', text: '#ffffff', shadow: '#2980b9' }, // Blue
  { bg: '#e74c3c', text: '#ffffff', shadow: '#c0392b' }, // Red
  { bg: '#f1c40f', text: '#0f172a', shadow: '#d35400' }, // Yellow
  { bg: '#e67e22', text: '#ffffff', shadow: '#d35400' }, // Orange
  { bg: '#9b59b6', text: '#ffffff', shadow: '#8e44ad' }, // Purple
  { bg: '#ff7675', text: '#ffffff', shadow: '#e84118' }, // Pink
];

interface VisualWorldBackgroundProps {
  children?: React.ReactNode;
  showBubbles?: boolean;
}

export const VisualWorldBackground: React.FC<VisualWorldBackgroundProps> = ({
  children,
  showBubbles = true
}) => {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const bubbleIdRef = useRef(0);

  // Sinh bong bóng chữ cái rơi tự do định kỳ
  useEffect(() => {
    if (!showBubbles) {
      setBubbles([]);
      return;
    }

    const createBubble = () => {
      const id = `bubble-${bubbleIdRef.current++}`;
      const char = VIETNAMESE_CHARS[Math.floor(Math.random() * VIETNAMESE_CHARS.length)];
      const left = `${Math.floor(Math.random() * 85) + 5}%`; // Tránh sát viền quá
      const size = Math.floor(Math.random() * 20) + 35; // Đường kính 35px - 55px
      const colorScheme = BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)];
      const duration = Math.floor(Math.random() * 6) + 8; // Rơi trong 8 - 14 giây
      const amplitude = Math.floor(Math.random() * 25) + 15;
      const xRange = [0, amplitude, -amplitude, 0];

      const newBubble: Bubble = {
        id,
        char,
        left,
        size,
        color: colorScheme.bg,
        textColor: colorScheme.text,
        shadowColor: colorScheme.shadow,
        duration,
        xRange
      };

      setBubbles((prev) => [...prev, newBubble]);

      // Tự động dọn dẹp bong bóng sau khi rơi xong để tránh rò rỉ bộ nhớ
      setTimeout(() => {
        setBubbles((prev) => prev.filter((b) => b.id !== id));
      }, duration * 1000 + 500);
    };

    // Tạo ngay vài bong bóng lúc đầu
    for (let i = 0; i < 4; i++) {
      setTimeout(createBubble, i * 1500);
    }

    const interval = setInterval(createBubble, 2500);
    return () => clearInterval(interval);
  }, [showBubbles]);

  return (
    <div className="w-full min-h-screen relative overflow-hidden bg-gradient-to-b from-[#b3e5fc] via-[#e1f5fe] to-[#fffde7] flex flex-col z-0 select-none">
      
      {/* --- PHẦN 1: BẦU TRỜI & MÂY TRÔI --- */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Đám mây 1 */}
        <motion.div
          initial={{ x: '-150px' }}
          animate={{ x: '100vw' }}
          transition={{ repeat: Infinity, duration: 45, ease: 'linear' }}
          className="absolute top-12 left-0 w-32 h-10 bg-white/80 rounded-full flex items-center justify-center filter drop-shadow-sm"
          style={{ borderRadius: '40px' }}
        >
          <div className="absolute -top-4 left-6 w-14 h-14 bg-white/80 rounded-full"></div>
          <div className="absolute -top-2 left-14 w-10 h-10 bg-white/80 rounded-full"></div>
        </motion.div>

        {/* Đám mây 2 */}
        <motion.div
          initial={{ x: '100vw' }}
          animate={{ x: '-200px' }}
          transition={{ repeat: Infinity, duration: 60, ease: 'linear' }}
          className="absolute top-36 left-0 w-44 h-12 bg-white/70 rounded-full flex items-center justify-center filter drop-shadow-sm"
          style={{ borderRadius: '50px' }}
        >
          <div className="absolute -top-6 left-8 w-18 h-18 bg-white/70 rounded-full"></div>
          <div className="absolute -top-4 left-20 w-14 h-14 bg-white/70 rounded-full"></div>
        </motion.div>

        {/* Đám mây 3 */}
        <motion.div
          initial={{ x: '-200px' }}
          animate={{ x: '100vw' }}
          transition={{ repeat: Infinity, duration: 50, ease: 'linear', delay: 15 }}
          className="absolute top-24 left-0 w-28 h-8 bg-white/75 rounded-full flex items-center justify-center"
          style={{ borderRadius: '30px' }}
        >
          <div className="absolute -top-3 left-4 w-10 h-10 bg-white/75 rounded-full"></div>
          <div className="absolute -top-2 left-10 w-8 h-8 bg-white/75 rounded-full"></div>
        </motion.div>
      </div>

      {/* --- PHẦN 2: BONG BÓNG CHỮ RƠI TỰ DO --- */}
      {showBubbles && (
        <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
          <AnimatePresence>
            {bubbles.map((bubble) => (
              <motion.div
                key={bubble.id}
                className="absolute flex items-center justify-center border-[2.5px] border-slate-900 font-sans font-black select-none"
                style={{
                  width: bubble.size,
                  height: bubble.size,
                  left: bubble.left,
                  backgroundColor: bubble.color,
                  color: bubble.textColor,
                  boxShadow: `3px 3px 0px 0px #0f172a`,
                  borderRadius: '50%',
                  top: -60,
                }}
                initial={{ y: -60, opacity: 0, scale: 0.8 }}
                animate={{
                  y: '105vh',
                  x: bubble.xRange,
                  opacity: [0, 0.9, 0.9, 0.9, 0],
                  scale: 1,
                  rotate: [0, 10, -10, 0],
                }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{
                  duration: bubble.duration,
                  ease: 'linear',
                }}
              >
                <span style={{ fontSize: `${bubble.size * 0.45}px` }}>
                  {bubble.char}
                </span>
                {/* Ánh sáng phản quang nhỏ xinh của bong bóng */}
                <div className="absolute top-1 left-1.5 w-2 h-2 rounded-full bg-white/40"></div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* --- PHẦN 3: ĐỒI CỎ VÀ CÂY RỪNG HOẠT HÌNH --- */}
      <div className="absolute bottom-0 inset-x-0 h-96 pointer-events-none z-10">
        {/* Đồi cỏ phía sau (Xanh nhạt) */}
        <svg className="absolute bottom-0 w-full h-32 text-[#a3e635]" viewBox="0 0 1440 200" preserveAspectRatio="none" fill="currentColor">
          <path d="M0,120 C320,180 480,80 800,140 C1120,200 1280,110 1440,160 L1440,200 L0,200 Z" />
        </svg>

        {/* Đồi cỏ phía trước (Xanh đậm rực rỡ) */}
        <svg className="absolute bottom-0 w-full h-24 text-[#4ade80]" viewBox="0 0 1440 200" preserveAspectRatio="none" fill="currentColor">
          <path d="M0,140 C280,80 560,180 900,100 C1180,40 1320,150 1440,120 L1440,200 L0,200 Z" />
        </svg>

        {/* Cây bên trái: Cây cổ thụ tán lá đám mây có táo đỏ */}
        <svg className="absolute bottom-0 left-[1.5%] w-44 h-80 z-20" viewBox="0 0 120 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="trunkGradLeft" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#a0522d" />
              <stop offset="100%" stopColor="#5c2e16" />
            </linearGradient>
            <linearGradient id="foliageGradLeft" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#a3e635" />
              <stop offset="60%" stopColor="#2ecc71" />
              <stop offset="100%" stopColor="#15803d" />
            </linearGradient>
            <linearGradient id="appleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff7675" />
              <stop offset="100%" stopColor="#d63031" />
            </linearGradient>
          </defs>

          {/* Thân cây uốn lượn có nhánh */}
          <path d="M50 190 C45 165 44 135 50 105 C44 95 33 90 28 95 C33 85 43 87 52 97 C57 85 67 80 74 85 C69 90 61 93 57 101 C61 125 61 165 69 190 Z" fill="url(#trunkGradLeft)" stroke="#0f172a" strokeWidth="3" strokeLinejoin="round" />
          
          {/* Tán lá và quả đung đưa nhẹ nhàng trước gió */}
          <motion.g
            animate={{ rotate: [-0.6, 0.6, -0.6] }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            style={{ transformOrigin: "50px 105px" }}
          >
            {/* Tán lá lượn sóng hình mây tròn */}
            <path d="M55 35 
                     C38 25, 18 35, 23 55 
                     C8 60, 8 85, 23 95 
                     C28 110, 58 115, 68 100 
                     C83 105, 103 90, 93 70 
                     C103 50, 83 30, 68 40 
                     C63 30, 58 30, 55 35 Z" 
                  fill="url(#foliageGradLeft)" stroke="#0f172a" strokeWidth="3.5" strokeLinejoin="round" />
            
            {/* Các quả táo đỏ lấp lánh */}
            <g transform="translate(35, 70)">
              <circle cx="0" cy="0" r="5" fill="url(#appleGrad)" stroke="#0f172a" strokeWidth="1.5" />
              <path d="M0 -5 C1 -8, 3 -8, 3 -6" stroke="#5c2e16" strokeWidth="1" fill="none" />
              <circle cx="-1.5" cy="-1.5" r="1.2" fill="white" opacity="0.7" />
            </g>
            <g transform="translate(73, 60)">
              <circle cx="0" cy="0" r="5.5" fill="url(#appleGrad)" stroke="#0f172a" strokeWidth="1.5" />
              <path d="M0 -5.5 C1 -8.5, 3 -8.5, 3 -6.5" stroke="#5c2e16" strokeWidth="1" fill="none" />
              <circle cx="-1.5" cy="-1.5" r="1.3" fill="white" opacity="0.7" />
            </g>
            <g transform="translate(52, 90)">
              <circle cx="0" cy="0" r="5" fill="url(#appleGrad)" stroke="#0f172a" strokeWidth="1.5" />
              <path d="M0 -5 C1 -8, 3 -8, 3 -6" stroke="#5c2e16" strokeWidth="1" fill="none" />
              <circle cx="-1.5" cy="-1.5" r="1.2" fill="white" opacity="0.7" />
            </g>
          </motion.g>
        </svg>

        {/* Cây bên phải: Cây Cam xum xuê thực thụ với quả cam chín mọng */}
        <svg className="absolute bottom-0 right-[2.5%] w-48 h-96 z-20" viewBox="0 0 120 220" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="trunkGradRight" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8b4513" />
              <stop offset="100%" stopColor="#4a2206" />
            </linearGradient>
            <linearGradient id="foliageGradRight1" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#2ecc71" />
              <stop offset="100%" stopColor="#27ae60" />
            </linearGradient>
            <linearGradient id="foliageGradRight2" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#a3e635" />
              <stop offset="100%" stopColor="#2ecc71" />
            </linearGradient>
            <linearGradient id="orangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffbe76" />
              <stop offset="100%" stopColor="#e67e22" />
            </linearGradient>
          </defs>

          {/* Thân cây thẳng gốc to */}
          <path d="M54 210 C50 170 52 130 56 100 C58 98 62 98 64 100 C68 130 70 170 66 210 Z" fill="url(#trunkGradRight)" stroke="#0f172a" strokeWidth="3" />
          
          {/* Tán lá và quả cây cam đung đưa nhẹ nhàng trước gió */}
          <motion.g
            animate={{ rotate: [0.6, -0.6, 0.6] }}
            transition={{
              duration: 7,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            style={{ transformOrigin: "56px 100px" }}
          >
            {/* Tán lá cây cam lớp phía sau (lớn hơn, đậm màu hơn) */}
            <path d="M60 25
                     C35 15, 10 30, 15 62
                     C0 70, 0 100, 15 118
                     C20 135, 55 140, 72 122
                     C88 135, 115 118, 110 90
                     C120 62, 98 30, 78 42
                     C72 27, 65 25, 60 25 Z" 
                  fill="url(#foliageGradRight1)" stroke="#0f172a" strokeWidth="3.5" strokeLinejoin="round" />

            {/* Tán lá cây cam lớp phía trước (nhỏ hơn, sáng màu hơn để tạo độ nổi 3D) */}
            <path d="M60 35
                     C42 27, 22 38, 26 62
                     C13 68, 13 92, 26 106
                     C30 118, 58 122, 70 108
                     C82 118, 104 106, 100 84
                     C108 62, 90 38, 76 46
                     C71 36, 66 35, 60 35 Z" 
                  fill="url(#foliageGradRight2)" stroke="#0f172a" strokeWidth="2.5" strokeLinejoin="round" />

            {/* Các quả cam chín mọng lấp lánh có cuống và lá */}
            <g transform="translate(38, 75)">
              <circle cx="0" cy="0" r="5.5" fill="url(#orangeGrad)" stroke="#0f172a" strokeWidth="1.5" />
              <path d="M0 -5.5 C1 -8, 2.5 -8, 2.5 -6" stroke="#4a2206" strokeWidth="0.8" fill="none" />
              <path d="M2.5 -8 C4 -8.5, 5 -7, 4 -6 C3 -5, 2 -7.5, 2.5 -8" fill="#2ecc71" />
              <circle cx="-1.5" cy="-1.5" r="1.3" fill="white" opacity="0.75" />
            </g>

            <g transform="translate(78, 65)">
              <circle cx="0" cy="0" r="6" fill="url(#orangeGrad)" stroke="#0f172a" strokeWidth="1.5" />
              <path d="M0 -6 C1 -8.5, 2.5 -8.5, 2.5 -6.5" stroke="#4a2206" strokeWidth="0.8" fill="none" />
              <path d="M2.5 -8.5 C4 -9, 5 -7.5, 4 -6.5 C3 -5.5, 2 -8, 2.5 -8.5" fill="#2ecc71" />
              <circle cx="-1.8" cy="-1.8" r="1.5" fill="white" opacity="0.75" />
            </g>

            <g transform="translate(54, 98)">
              <circle cx="0" cy="0" r="5.5" fill="url(#orangeGrad)" stroke="#0f172a" strokeWidth="1.5" />
              <path d="M0 -5.5 C1 -8, 2.5 -8, 2.5 -6" stroke="#4a2206" strokeWidth="0.8" fill="none" />
              <path d="M2.5 -8 C4 -8.5, 5 -7, 4 -6 C3 -5, 2 -7.5, 2.5 -8" fill="#2ecc71" />
              <circle cx="-1.5" cy="-1.5" r="1.3" fill="white" opacity="0.75" />
            </g>

            <g transform="translate(88, 92)">
              <circle cx="0" cy="0" r="5" fill="url(#orangeGrad)" stroke="#0f172a" strokeWidth="1.5" />
              <path d="M0 -5 C1 -7.5, 2 -7.5, 2 -5.5" stroke="#4a2206" strokeWidth="0.8" fill="none" />
              <path d="M2 -7.5 C3.2 -8, 4 -6.8, 3.2 -5.8 C2.4 -4.8, 1.6 -7, 2 -7.5" fill="#2ecc71" />
              <circle cx="-1.2" cy="-1.2" r="1.2" fill="white" opacity="0.75" />
            </g>

            <g transform="translate(58, 50)">
              <circle cx="0" cy="0" r="5.5" fill="url(#orangeGrad)" stroke="#0f172a" strokeWidth="1.5" />
              <path d="M0 -5.5 C1 -8, 2.5 -8, 2.5 -6" stroke="#4a2206" strokeWidth="0.8" fill="none" />
              <path d="M2.5 -8 C4 -8.5, 5 -7, 4 -6 C3 -5, 2 -7.5, 2.5 -8" fill="#2ecc71" />
              <circle cx="-1.5" cy="-1.5" r="1.3" fill="white" opacity="0.75" />
            </g>
          </motion.g>
        </svg>

      </div>



      {/* --- PHẦN 5: CONTAINER NỘI DUNG CHÍNH (TRANG TRÍ LÊN NỀN) --- */}
      <div className="flex-1 w-full relative z-20 flex flex-col min-w-0">
        {children}
      </div>
      
    </div>
  );
};

export default VisualWorldBackground;
