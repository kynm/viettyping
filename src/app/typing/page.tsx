'use client';

import React, { useState, useEffect } from 'react';
import { lessons, Lesson } from '@/data/lessons';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSound } from '@/contexts/SoundContext';
import { plusJakartaSans } from '@/lib/fonts';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Sparkles, Trophy, Lightbulb, ArrowLeft, Lock } from 'lucide-react';
import VisualWorldBackground from '@/components/VisualWorldBackground';



const levelNames: Record<string, { name: string; description: string; color: string; icon: string; bgClass: string; borderClass: string; accentColor: string }> = {
  basic: {
    name: 'Đảo Học Việc',
    description: 'Làm quen các hàng phím cơ bản và dấu tiếng Việt',
    color: 'from-emerald-400 to-teal-500',
    icon: '🐢',
    bgClass: 'bg-emerald-50/90',
    borderClass: 'border-emerald-200',
    accentColor: '#10b981',
  },
  intermediate: {
    name: 'Đảo Tăng Tốc',
    description: 'Thực hành gõ từ ghép vui nhộn và câu văn ngắn',
    color: 'from-amber-400 to-orange-500',
    icon: '🦁',
    bgClass: 'bg-amber-50/90',
    borderClass: 'border-amber-200',
    accentColor: '#f59e0b',
  },
  advanced: {
    name: 'Đảo Siêu Nhân',
    description: 'Chinh phục đoạn văn dài để trở thành Siêu Nhân Gõ Phím',
    color: 'from-fuchsia-400 to-purple-500',
    icon: '🚀',
    bgClass: 'bg-purple-50/90',
    borderClass: 'border-purple-200',
    accentColor: '#d946ef',
  }
};

export default function TypingPage() {
  const router = useRouter();
  const { playSound } = useSound();

  // States cho gamification
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'basic' | 'intermediate' | 'advanced'>('basic');
  const [hoveredLessonId, setHoveredLessonId] = useState<string | null>(null);

  // Đọc dữ liệu từ localStorage sau khi component mount (để tránh lỗi hydration Next.js)
  useEffect(() => {
    try {
      const completed = JSON.parse(localStorage.getItem('typing_completed_lessons') || '[]');
      setCompletedLessons(completed);
    } catch (e) {
      console.error('Failed to load typing progress:', e);
    }
  }, []);

  const getLessonsForLevel = (level: string) => {
    return lessons.filter(lesson => lesson.level === level);
  };

  // Xác định bài học tiếp theo (bài đầu tiên chưa hoàn thành)
  const getNextLessonId = () => {
    const allLevels = ['basic', 'intermediate', 'advanced'];
    for (const lvl of allLevels) {
      const lvlLessons = getLessonsForLevel(lvl);
      for (const les of lvlLessons) {
        if (!completedLessons.includes(les.id)) {
          return les.id;
        }
      }
    }
    return lessons[0]?.id; // Mặc định là bài đầu tiên nếu đã hoàn thành hết
  };

  const nextLessonId = getNextLessonId();

  const handleLessonClick = (lesson: Lesson) => {
    playSound('click');
    router.push(`/typing/${lesson.id}`);
  };

  return (
    <VisualWorldBackground>
      <main className={`min-h-screen relative overflow-hidden pb-16 z-10 ${plusJakartaSans.className}`}>

        <div className="max-w-6xl mx-auto px-6 py-8 relative z-10">
          {/* Thanh Điều hướng Header tối giản */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8 w-full border-b-2 border-dashed border-[var(--color-foreground)]/10 pb-6">
            {/* Bên trái: Nút quay lại */}
            <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
              <Link
                href="/"
                onClick={() => playSound('click')}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-[var(--color-surface)] border-2 border-[var(--color-foreground)] rounded-2xl shadow-[3px_3px_0px_0px_var(--color-foreground)] hover:translate-y-[-1px] active:translate-y-[1px] active:shadow-none transition-all text-[var(--color-foreground)] font-black text-xs"
              >
                <ArrowLeft className="w-4 h-4 stroke-[3px]" />
                <span>Trang chủ</span>
              </Link>
            </div>

            {/* Bên phải: Nút ASMR Thư giãn */}
            <div className="flex gap-3 justify-center md:justify-end z-20 w-full md:w-auto">
              <Link
                href="/typing/asmr"
                onClick={() => playSound('click')}
                className="tactile-btn bg-[var(--color-tertiary)] border-3 border-[var(--color-foreground)] shadow-[3px_3px_0px_0px_var(--color-foreground)] hover:translate-y-[-1px] active:translate-y-[1px] active:shadow-none text-white font-black text-xs transition-all px-4 py-2.5"
              >
                <Sparkles className="w-4 h-4 text-yellow-200" />
                <span>ASMR Thư giãn</span>
              </Link>
            </div>
          </div>

          {/* Bộ chọn hòn đảo (Tab Selector) */}
          <div className="grid grid-cols-3 gap-3 mb-8 max-w-2xl mx-auto bg-[var(--color-surface-container)] p-2 rounded-3xl border-3 border-[var(--color-foreground)] shadow-[4px_4px_0px_0px_var(--color-foreground)] transition-colors">
            {(['basic', 'intermediate', 'advanced'] as const).map((tab) => {
              const isSelected = activeTab === tab;
              const tabInfo = levelNames[tab];

              return (
                <button
                  key={tab}
                  onClick={() => {
                    playSound('click');
                    setActiveTab(tab);
                  }}
                  className={`relative px-4 py-4 rounded-2xl font-black text-sm md:text-base flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${isSelected
                      ? `bg-gradient-to-r ${tabInfo.color} text-white border-2 border-[var(--color-foreground)] shadow-[3px_3px_0px_0px_var(--color-foreground)] scale-105`
                      : 'text-[var(--color-foreground)] opacity-75 hover:opacity-100 hover:bg-[var(--color-background)]/60'
                    }`}
                >
                  <span className="text-xl md:text-2xl">{tabInfo.icon}</span>
                  <span className={plusJakartaSans.className}>{tab === 'basic' ? 'Cơ bản' : tab === 'intermediate' ? 'Trung cấp' : 'Nâng cao'}</span>
                </button>
              );
            })}
          </div>

          {/* Nội dung Hòn đảo đã chọn */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className={`rounded-3xl p-6 md:p-8 border-3 border-[var(--color-foreground)] shadow-[6px_6px_0px_0px_var(--color-foreground)] ${levelNames[activeTab].bgClass} ${levelNames[activeTab].borderClass} transition-all`}
            >
              {/* Banner Đảo */}
              <div className="flex flex-col sm:flex-row items-center gap-4 mb-8 text-center sm:text-left border-b-2 border-dashed border-gray-200/60 pb-6">
                <span className="text-5xl md:text-6xl p-4 bg-white rounded-2xl shadow-sm border border-gray-100">
                  {levelNames[activeTab].icon}
                </span>
                <div>
                  <h2 className={`text-2xl md:text-3xl font-black text-gray-800 ${plusJakartaSans.className}`}>
                    {levelNames[activeTab].name}
                  </h2>
                  <p className="text-gray-600 text-sm md:text-base mt-1">
                    {levelNames[activeTab].description}
                  </p>
                </div>
              </div>

              {/* Grid các bài học có scroll nếu quá nhiều bài */}
              <div className="max-h-[380px] overflow-y-auto pr-2 custom-scrollbar">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-x-4 gap-y-5 py-2">
                  {getLessonsForLevel(activeTab).map((lesson, index) => {
                    const isCompleted = completedLessons.includes(lesson.id);
                    const isNext = lesson.id === nextLessonId;
                    const isLocked = !isCompleted && !isNext && completedLessons.length < lessons.findIndex(l => l.id === lesson.id);

                    let btnBgClass = 'bg-[var(--color-surface-container)] text-slate-450 border-3 border-[var(--color-outline-variant)] shadow-[0_5px_0_0_var(--color-outline-variant)]';

                    if (isCompleted) {
                      btnBgClass = 'bg-[var(--color-primary)] text-white border-3 border-slate-900 shadow-[0_5px_0_0_#0f172a] hover:brightness-105 active:shadow-none active:translate-y-[5px] opacity-60 hover:opacity-100 transition-opacity';
                    } else if (isNext) {
                      btnBgClass = 'bg-[var(--color-accent)] text-slate-900 border-3 border-slate-900 shadow-[0_5px_0_0_#0f172a] hover:brightness-105 active:shadow-none active:translate-y-[5px] ring-4 ring-[var(--color-accent)]/60 ring-offset-2 animate-pulse';
                    } else if (!isLocked) {
                      btnBgClass = 'bg-[var(--color-tertiary)] text-white border-3 border-slate-900 shadow-[0_5px_0_0_#0f172a] hover:brightness-105 active:shadow-none active:translate-y-[5px]';
                    }

                    return (
                      <div key={lesson.id} className="relative flex flex-col items-center">
                        {/* Nút bài học 3D Chunky */}
                        <button
                          onClick={() => !isLocked && handleLessonClick(lesson)}
                          onMouseEnter={() => {
                            setHoveredLessonId(lesson.id);
                            if (!isLocked) playSound('click');
                          }}
                          onMouseLeave={() => setHoveredLessonId(null)}
                          disabled={isLocked}
                          className={`w-20 h-20 rounded-[24px] border-b-4 flex items-center justify-center text-3xl font-black font-sans transition-all relative z-10 cursor-pointer ${btnBgClass} ${isLocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                            }`}
                        >
                          {isLocked ? (
                            <Lock className="w-6 h-6 text-slate-400 stroke-[3px]" />
                          ) : (
                            <span>{index + 1}</span>
                          )}
                        </button>

                        {/* Tiêu đề ngắn gọn bên dưới nút */}
                        <span className="text-xs font-bold text-gray-700 mt-3 text-center line-clamp-2 min-h-[32px] px-1">
                          {lesson.title.replace('Luyện gõ ', '')}
                        </span>

                        {/* Tooltip thông tin học tập */}
                        <AnimatePresence>
                          {hoveredLessonId === lesson.id && (
                            <motion.div
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.95 }}
                              transition={{ duration: 0.15 }}
                              className="absolute bottom-full mb-3 z-50 bg-slate-800 text-white p-3 rounded-2xl shadow-xl w-48 text-center text-xs pointer-events-none"
                            >
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1.5 border-4 border-transparent border-t-slate-800" />
                              <h4 className="font-bold text-amber-300 text-sm mb-1">{lesson.title}</h4>
                              <p className="text-slate-300 mb-2">{lesson.description}</p>
                              <div className="flex justify-around bg-slate-700/60 p-1.5 rounded-lg border border-slate-700">
                                <div>
                                  <div className="text-slate-400">Tốc độ</div>
                                  <div className="font-bold text-emerald-400 flex items-center gap-1"><Trophy className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" /> {lesson.targetWPM} WPM</div>
                                </div>
                                <div className="w-[1px] bg-slate-700" />
                                <div>
                                  <div className="text-slate-400">Độ chuẩn</div>
                                  <div className="font-bold text-sky-400 flex items-center gap-1"><Check className="w-3.5 h-3.5 text-sky-400 stroke-[3px]" /> {lesson.minAccuracy}%</div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Hướng dẫn Đặt Ngón Tay & Luyện tập */}
          <div className="bg-[var(--color-surface)] rounded-3xl p-6 mt-8 border-3 border-[var(--color-foreground)] shadow-[6px_6px_0px_0px_var(--color-foreground)] flex flex-col md:flex-row items-center gap-6 transition-colors">
            <div className="p-4 bg-indigo-50 rounded-2xl text-4xl shrink-0 text-indigo-500">
              <Lightbulb className="w-8 h-8" />
            </div>
            <div>
              <h3 className={`text-lg md:text-xl font-bold text-indigo-900 ${plusJakartaSans.className}`}>
                Bí kíp gõ phím của Siêu Nhân Nhí!
              </h3>
              <p className="text-gray-600 text-sm md:text-base mt-1 leading-relaxed">
                Bé hãy nhớ đặt hai ngón trỏ lên các phím có gờ nổi là <span className="font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md">F</span> và <span className="font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md">J</span> nhé! Ngón cái thì dùng để nhấn phím Cách nha. Cố lên bé yêu!
              </p>
            </div>
          </div>
        </div>
      </main>
    </VisualWorldBackground>
  );
}
