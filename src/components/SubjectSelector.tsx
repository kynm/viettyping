import React from 'react';
import { Subject } from '@/data/subjects';
import { useProgress } from '@/hooks/useProgress';
import { useSound } from '@/contexts/SoundContext';
import { motion } from 'framer-motion';
import { Star, BookOpen } from 'lucide-react';
import { Plus_Jakarta_Sans } from 'next/font/google';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700', '800']
});

interface SubjectSelectorProps {
  subjects: Subject[];
  onSelectSubject: (subject: Subject) => void;
}

const SubjectSelector: React.FC<SubjectSelectorProps> = ({
  subjects,
  onSelectSubject,
}) => {
  const { getTopicProgress, isLoaded } = useProgress();
  const { playSound } = useSound();

  if (!isLoaded) return null;

  // Stagger container animation
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.9 },
    show: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        type: 'spring' as const,
        stiffness: 100,
        damping: 12
      }
    }
  };

  return (
    <div className={`max-w-6xl mx-auto px-6 py-10 ${plusJakartaSans.className}`}>
      {/* Title section */}
      <div className="text-center mb-10">
        <motion.h2 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-4xl md:text-5xl font-black text-slate-800 mb-3 drop-shadow-sm tracking-wide flex items-center justify-center gap-2"
        >
          <BookOpen className="w-10 h-10 text-sky-600" /> Lớp Học Kỳ Diệu
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-lg md:text-xl text-sky-650 font-black"
        >
          Bé hãy chọn một môn học để bắt đầu chuyến phiêu lưu tri thức nhé!
        </motion.p>
      </div>

      {/* Grid of subjects */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
      >
        {subjects.map((subject) => {
          const rawProgress = getTopicProgress(subject.topics.flatMap(t => t.activities.map(a => a.id)));
          const progress = Math.min(100, Math.max(0, rawProgress)); // Đảm bảo luôn nằm trong khoảng 0-100
          
          return (
            <motion.div
              key={subject.id}
              variants={itemVariants}
              whileHover={{ 
                y: -6,
                rotate: [0, -1, 1, 0],
                transition: { duration: 0.3 }
              }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                playSound('click');
                onSelectSubject(subject);
              }}
              className="relative overflow-hidden rounded-[28px] bg-white border-4 border-slate-800 shadow-[6px_6px_0px_0px_#1e293b] cursor-pointer flex flex-col h-full group transition-all duration-300 hover:shadow-[8px_8px_0px_0px_#1e293b]"
            >
              {/* Thumbnail hoặc Gradient Header */}
              {subject.thumbnailUrl ? (
                <div className="h-48 w-full relative overflow-hidden border-b-4 border-slate-800 bg-white p-2.5 flex items-center justify-center">
                  <img 
                    src={subject.thumbnailUrl} 
                    alt={subject.name}
                    className="max-w-full max-h-full object-contain rounded-2xl transform group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ) : (
                <div className={`h-36 w-full bg-gradient-to-br ${subject.color} relative overflow-hidden border-b-4 border-slate-800 flex items-center justify-center`}>
                  <div className="text-6xl text-white transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                    {subject.icon}
                  </div>
                  <div className="absolute -bottom-6 -right-6 w-16 h-16 bg-white/10 rounded-full blur-md"></div>
                </div>
              )}

              {/* Nội dung môn học */}
              <div className="p-5 flex flex-col justify-between flex-grow min-h-[170px]">
                <div>
                  <h3 className="text-lg md:text-xl font-black text-slate-800 mb-1.5 tracking-wide line-clamp-1 group-hover:text-sky-600 transition-colors">
                    {subject.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-bold line-clamp-2 leading-relaxed mb-4">
                    {subject.description}
                  </p>
                </div>

                <div>
                  {/* Lớp & Số chủ đề */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    {subject.grade && (
                      <span className="inline-flex items-center bg-sky-blue/15 border-2 border-slate-800 text-slate-800 rounded-full px-2.5 py-0.5 text-[10px] font-black tracking-wide">
                        {subject.grade}
                      </span>
                    )}
                    <span className="text-[11px] font-black text-slate-600">
                      {subject.topics.length} chủ đề
                    </span>
                  </div>

                  {/* Thanh Tiến Độ */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-black tracking-wide text-slate-500">
                      <span>Tiến độ</span>
                      <span className="flex items-center gap-0.5 text-sky-600">
                        {progress > 0 && <Star className="w-3 h-3 text-amber-550 fill-amber-500 animate-pulse" />}
                        {progress}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-3.5 rounded-full p-0.5 overflow-hidden border-2 border-slate-200">
                      <motion.div
                        className="bg-gradient-to-r from-sunshine-yellow to-coral-orange h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Encouragement message banner */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-14 text-center"
      >
        <div className="inline-flex items-center gap-2 bg-dino-green/15 border-2 border-slate-800 rounded-2xl px-4 md:px-6 py-3.5 shadow-[3px_3px_0px_0px_#1e293b] hover:scale-102 transition-transform">
          <Star className="w-4 h-4 text-amber-500 fill-amber-300 animate-pulse shrink-0" />
          <span className="text-slate-850 font-black text-xs md:text-base">
            Tất cả các môn đều có phần thưởng Sao Vàng và Huy Hiệu đang chờ bé!
          </span>
        </div>
      </motion.div>
    </div>
  );
};

export default SubjectSelector;
