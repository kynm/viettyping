'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Sparkles, Flame, Check, Lock, ShoppingBag, Star, Lightbulb } from 'lucide-react';
import { useSound } from '@/contexts/SoundContext';
import { useStudent } from '@/contexts/StudentContext';
import { Plus_Jakarta_Sans } from 'next/font/google';
import confetti from 'canvas-confetti';
import { setStoredValue } from '@/lib/client-storage';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700', '800']
});

interface MascotItem {
  id: 'dino' | 'turtle' | 'bunny' | 'panda' | 'leopard';
  name: string;
  emoji: string;
  desc: string;
  price: number;
  colorClass: string;
  image: string;
}

const SHOP_MASCOTS: MascotItem[] = [
  {
    id: 'dino',
    name: 'Khủng Long Siêu Phàm',
    emoji: '🦖',
    desc: 'Mạnh mẽ & nhanh nhẹn, luôn đồng hành cùng bé!',
    price: 0,
    colorClass: 'border-emerald-300 bg-emerald-50 text-emerald-800 shadow-emerald-200',
    image: '/assets/dino-3d.png' 
  },
  {
    id: 'turtle',
    name: 'Rùa Con Chăm Chỉ',
    emoji: '🐢',
    desc: 'Chậm mà chắc, nền tảng gõ chuẩn 100%!',
    price: 0,
    colorClass: 'border-teal-300 bg-teal-50 text-teal-850 shadow-teal-200',
    image: '/assets/turtle-3d.png'
  },
  {
    id: 'bunny',
    name: 'Thỏ Ngọc Siêu Tốc',
    emoji: '🐰',
    desc: 'Nhanh như chớp, vượt mọi thử thách gõ phím!',
    price: 500,
    colorClass: 'border-pink-300 bg-pink-50 text-pink-850 shadow-pink-200',
    image: '/assets/bunny-3d.png'
  },
  {
    id: 'panda',
    name: 'Gấu Trúc Thông Thái',
    emoji: '🐼',
    desc: 'Đáng yêu & kiên trì, vui vẻ gõ phím tiếng Việt!',
    price: 800,
    colorClass: 'border-red-300 bg-red-50 text-red-850 shadow-red-200',
    image: '/assets/panda-3d.png'
  },
  {
    id: 'leopard',
    name: 'Báo Đốm Thần Tốc',
    emoji: '🐆',
    desc: 'Dũng mãnh & điêu luyện, vận tốc của nhà vô địch!',
    price: 1200,
    colorClass: 'border-purple-300 bg-purple-50 text-purple-850 shadow-purple-200',
    image: '/assets/leopard-3d.png'
  }
];

export default function ShopPage() {
  const router = useRouter();
  const { playSound } = useSound();
  const { studentInfo, updateStudentInfo } = useStudent();

  const [xp, setXp] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [unlockedMascots, setUnlockedMascots] = useState<string[]>(['dino', 'turtle']);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
    try {
      const savedXp = parseInt(localStorage.getItem('typing_xp') || '0', 10);
      const savedStreak = parseInt(localStorage.getItem('typing_streak') || '0', 10);
      
      const savedUnlocked = localStorage.getItem('viettyping_unlocked_mascots');
      let unlockedList = ['dino', 'turtle'];
      if (savedUnlocked) {
        unlockedList = JSON.parse(savedUnlocked);
      } else {
        setStoredValue('viettyping_unlocked_mascots', JSON.stringify(unlockedList));
      }

      setXp(savedXp);
      setStreak(savedStreak);
      setUnlockedMascots(unlockedList);
    } catch (e) {
      console.error('Failed to load shop progress:', e);
    }
  }, []);

  const handleBack = () => {
    playSound('click');
    router.push('/');
  };

  const handleUnlock = (mascot: MascotItem) => {
    if (xp < mascot.price) {
      playSound('wrong');
      alert(`Bé ơi, con cần tích lũy thêm ${mascot.price - xp} XP nữa để mở khóa bạn ${mascot.name} nhé! Cố lên con yêu! 💪`);
      return;
    }

    const newXp = xp - mascot.price;
    const newUnlocked = [...unlockedMascots, mascot.id];

    try {
      setStoredValue('typing_xp', String(newXp));
      setStoredValue('viettyping_unlocked_mascots', JSON.stringify(newUnlocked));
      
      setXp(newXp);
      setUnlockedMascots(newUnlocked);
      
      playSound('coin');
      setTimeout(() => playSound('tada'), 150);

      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#ffd700", "#ff4500", "#1e90ff", "#32cd32", "#da70d6"]
      });
    } catch (e) {
      console.error('Lỗi khi lưu thông tin mở khóa:', e);
    }
  };

  const handleSelectMascot = (mascot: MascotItem) => {
    if (!studentInfo) return;
    playSound('click');

    const updated = {
      ...studentInfo,
      theme: mascot.id,
      avatar: mascot.emoji
    };

    updateStudentInfo(updated);
    
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0 }
    });
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 1 }
    });
  };

  if (!isMounted) return null;

  const currentTheme = studentInfo?.theme || 'dino';

  return (
    <div className={`min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-100 relative pb-16 ${plusJakartaSans.className}`}>
      
      {/* Bong bóng nổi tạo hoạt cảnh đáng yêu */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white/40 border border-white/50"
            style={{
              width: Math.random() * 40 + 20,
              height: Math.random() * 40 + 20,
              left: `${Math.random() * 95}%`,
              bottom: '-50px',
            }}
            animate={{
              y: [0, -1000],
              opacity: [0, 0.8, 0.8, 0]
            }}
            transition={{
              duration: Math.random() * 12 + 18,
              repeat: Infinity,
              delay: Math.random() * 4,
              ease: 'linear'
            }}
          />
        ))}
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 relative z-10">
        
        {/* Header điều hướng */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-slate-800 rounded-2xl shadow-[3px_3px_0px_0px_#1e293b] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer text-slate-800 font-black text-sm"
          >
            <ArrowLeft className="w-4 h-4 stroke-[3px]" />
            <span>Quay lại trang chủ</span>
          </button>
          
          <div className="flex items-center gap-3">
            {streak > 0 && (
              <div className="flex items-center gap-1.5 bg-red-50 border-2 border-slate-800 px-3.5 py-2 rounded-2xl shadow-[3px_3px_0px_0px_#1e293b]">
                <Flame className="w-5 h-5 text-orange-500 fill-orange-500 animate-pulse" />
                <span className="text-sm font-black text-slate-800">{streak} ngày</span>
              </div>
            )}
            <div className="flex items-center gap-2 bg-amber-50 border-2 border-slate-800 px-4 py-2 rounded-2xl shadow-[3px_3px_0px_0px_#1e293b]">
              <Star className="w-5 h-5 text-amber-500 fill-amber-300" />
              <span className="text-sm font-black text-slate-800">
                Kho điểm của bé: <span className="text-indigo-600 text-base">{xp} XP</span>
              </span>
            </div>
          </div>
        </div>

        {/* Tiêu đề chính */}
        <div className="text-center mb-10">
          <motion.h1 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-4xl md:text-5xl font-black text-slate-900 drop-shadow-sm tracking-wide flex items-center justify-center gap-3"
          >
            <ShoppingBag className="w-10 h-10 text-indigo-600 animate-pulse" /> Cửa Hàng Linh Vật
          </motion.h1>
          <p className="text-sm md:text-base text-slate-600 font-bold mt-2.5 max-w-xl mx-auto leading-relaxed">
            Dùng điểm kinh nghiệm (XP) con gõ phím được để mời thêm các bạn linh vật siêu dễ thương về đồng hành và thay đổi màu áo mới cho lớp học nhé!
          </p>
        </div>

        {/* Thùng chứa danh sách item */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SHOP_MASCOTS.map((mascot) => {
            const isUnlocked = unlockedMascots.includes(mascot.id);
            const isSelected = currentTheme === mascot.id;
            const canAfford = xp >= mascot.price;

            return (
              <motion.div
                key={mascot.id}
                whileHover={{ y: -4 }}
                className={`bg-white border-4 border-slate-800 rounded-[28px] p-5 flex flex-col justify-between transition-all shadow-[6px_6px_0px_0px_#1e293b] relative overflow-hidden`}
              >
                {/* Dải trang trí góc */}
                {isSelected && (
                  <div className="absolute top-0 right-0 bg-indigo-500 text-white font-black text-[9px] px-3.5 py-1.5 rounded-bl-2xl uppercase tracking-wider flex items-center gap-1 border-l-2 border-b-2 border-slate-800">
                    <Check className="w-3 h-3 stroke-[3px]" />
                    <span>Đang Chọn</span>
                  </div>
                )}

                <div>
                  {/* Khung hiển thị Mascot Avatar */}
                  <div className={`w-full h-36 rounded-2xl border-2 border-slate-800 ${mascot.colorClass.split(' ')[1]} flex items-center justify-center relative mb-4 shadow-[inner_0_3px_0_rgba(0,0,0,0.05)] overflow-hidden`}>
                    {mascot.image ? (
                      <img 
                        src={mascot.image} 
                        alt={mascot.name} 
                        className="w-24 h-24 object-contain animate-pulse"
                      />
                    ) : (
                      <span className="text-6xl animate-bounce">🦖</span>
                    )}
                    <span className="absolute bottom-2 left-2 text-2xl filter drop-shadow-sm">{mascot.emoji}</span>
                  </div>

                  {/* Tên & mô tả */}
                  <h3 className="text-xl font-black text-slate-900 flex items-center gap-1.5">
                    <span>{mascot.name}</span>
                  </h3>
                  <p className="text-xs font-bold text-slate-500 mt-1.5 leading-relaxed min-h-[36px]">
                    {mascot.desc}
                  </p>
                </div>

                {/* Phần Nút Hành Động phía dưới */}
                <div className="mt-6 pt-4 border-t-2 border-dashed border-slate-200/80">
                  {/* Hiển thị Giá tiền */}
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Giá mở khóa</span>
                    <span className="font-black text-sm flex items-center gap-1">
                      {mascot.price === 0 ? (
                        <span className="text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-300">MIỄN PHÍ</span>
                      ) : (
                        <span className={`flex items-center gap-1 ${isUnlocked ? 'text-slate-400 font-bold line-through' : 'text-amber-600'}`}>
                          <Sparkles className="w-3.5 h-3.5 inline text-amber-500 fill-amber-300" /> {mascot.price} XP
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Nút chính */}
                  {isUnlocked ? (
                    isSelected ? (
                      <button
                        disabled
                        className="keycap-btn-surface w-full py-3 text-xs cursor-default flex items-center justify-center gap-1 opacity-80"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[var(--color-primary-depth)] animate-spin" />
                        <span>Đang Đồng Hành</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSelectMascot(mascot)}
                        className="keycap-btn-primary w-full py-3 text-xs flex items-center justify-center gap-1"
                      >
                        <Check className="w-4 h-4 mr-1 stroke-[3px]" /> Chọn Bạn Đồng Hành
                      </button>
                    )
                  ) : (
                    <button
                      onClick={() => handleUnlock(mascot)}
                      className={`keycap-btn-accent w-full py-3 text-xs flex items-center justify-center gap-1.5 ${
                        !canAfford ? 'opacity-50 cursor-not-allowed filter grayscale' : ''
                      }`}
                      disabled={!canAfford}
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Mở khóa bằng {mascot.price} XP</span>
                    </button>
                  )}
                </div>

              </motion.div>
            );
          })}
        </div>

        {/* Thẻ gợi ý luyện tập để tích điểm */}
        <div className="bg-white/90 rounded-[28px] p-6 mt-10 border-2 border-indigo-100 shadow-[6px_6px_0px_0px_#e2e8f0] flex flex-col sm:flex-row items-center gap-5">
          <div className="p-4 bg-indigo-50 border-2 border-indigo-200 rounded-2xl text-4xl shrink-0 text-indigo-500">
            <Lightbulb className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-black text-indigo-950">
              Học gõ phím chăm chỉ để nhận thêm XP bé nhé!
            </h3>
            <p className="text-slate-600 text-xs md:text-sm font-semibold mt-1 leading-relaxed">
              Mỗi bài luyện tập hoàn thành xuất sắc sẽ mang về cho bé rất nhiều điểm XP đó. Trò chơi Giải cứu Rùa con cũng có phần thưởng cực khủng lên tới <span className="text-orange-500 font-black">300 XP</span>. Hãy gõ phím thật nhanh và chuẩn xác nha con yêu!
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
