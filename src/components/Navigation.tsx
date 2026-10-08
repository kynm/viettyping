"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import SoundToggle from '@/components/SoundToggle';
import { useSound } from '@/contexts/SoundContext';
import { motion } from 'framer-motion';

const Navigation: React.FC = () => {
  const pathname = usePathname();
  const { playSound } = useSound();

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/' || pathname.startsWith('/subjects');
    }
    return pathname.startsWith(path);
  };

  const navItems = [
    { path: '/exercises', label: 'Bài tập tiếng Anh', icon: '🌟', activeBg: 'bg-sky-blue hover:bg-sky-blue/90', activeShadow: 'shadow-[0_1px_0_0_#2563EB]' },
    { path: '/', label: 'Học các môn', icon: '📚', activeBg: 'bg-coral-orange hover:bg-coral-orange/90', activeShadow: 'shadow-[0_1px_0_0_#DC2626]' },
    { path: '/typing', label: 'Luyện gõ phím', icon: '⌨️', activeBg: 'bg-sky-blue hover:bg-sky-blue/90', activeShadow: 'shadow-[0_1px_0_0_#2563EB]' },
    { path: '/parents', label: 'Góc phụ huynh', icon: '👨‍👩‍👧‍👦', activeBg: 'bg-dino-green hover:bg-dino-green/90', activeShadow: 'shadow-[0_1px_0_0_#16A34A]' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="bg-white border-4 border-slate-800 rounded-[28px] p-2.5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-[6px_6px_0px_0px_#1e293b] select-none">
        
        {/* Nhóm các tab điều hướng */}
        <div className="flex flex-wrap justify-center items-center gap-2 md:gap-3 w-full md:w-auto">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <motion.div
                key={item.path}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="w-full sm:w-auto"
              >
                <Link
                  href={item.path}
                  onClick={() => playSound('click')}
                  className={`w-full sm:w-auto px-5 py-3 rounded-2xl font-black text-sm md:text-base flex items-center justify-center gap-2 border-2 transition-all duration-150 ${
                    active
                      ? `${item.activeBg} text-white border-slate-800 ${item.activeShadow} translate-y-[3px]`
                      : 'bg-white text-slate-700 border-slate-800 shadow-[0_4px_0_0_#1e293b] hover:translate-y-[-1px] hover:shadow-[0_5px_0_0_#1e293b]'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Nút bật/tắt âm thanh */}
        <div className="flex items-center shrink-0">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center justify-center border-2 border-slate-800 rounded-2xl p-1 bg-amber-50/50 shadow-[3px_3px_0px_0px_#1e293b] hover:bg-amber-100/50 transition-colors"
          >
            <SoundToggle />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Navigation;
