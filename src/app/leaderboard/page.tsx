'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Trophy, Flame, Crown, Sparkles, Medal, Play, Zap, Heart, Lock } from 'lucide-react';
import { useSound } from '@/contexts/SoundContext';
import { LeaderboardUser } from '@/lib/leaderboard';
import { Plus_Jakarta_Sans } from 'next/font/google';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700', '800']
});

export default function LeaderboardPage() {
  const router = useRouter();
  const { playSound } = useSound();
  const [leaderboardUsers, setLeaderboardUsers] = useState<LeaderboardUser[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(true);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);
  const [userXp, setUserXp] = useState<number>(0);
  const [userStreak, setUserStreak] = useState<number>(0);
  const [userWpm, setUserWpm] = useState<number>(0);
  const [userAccuracy, setUserAccuracy] = useState<number>(0);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  // States tính toán Huy hiệu
  const [completedCount, setCompletedCount] = useState<number>(0);
  const [hasAccuracyBadge, setHasAccuracyBadge] = useState<boolean>(false);
  const [hasTurtleBadge, setHasTurtleBadge] = useState<boolean>(false);
  
  // 5 mốc tốc độ gõ phím
  const [hasSpeed10, setHasSpeed10] = useState<boolean>(false);
  const [hasSpeed20, setHasSpeed20] = useState<boolean>(false);
  const [hasSpeed30, setHasSpeed30] = useState<boolean>(false);
  const [hasSpeed40, setHasSpeed40] = useState<boolean>(false);
  const [hasSpeed50, setHasSpeed50] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
    try {
      const savedXp = parseInt(localStorage.getItem('typing_xp') || '0', 10);
      const savedStreak = parseInt(localStorage.getItem('typing_streak') || '0', 10);
      const savedWpm = parseInt(localStorage.getItem('typing_avg_wpm') || '0', 10);
      const savedAcc = parseInt(localStorage.getItem('typing_avg_accuracy') || '0', 10);
      setUserXp(savedXp);
      setUserStreak(savedStreak);
      setUserWpm(savedWpm);
      setUserAccuracy(savedAcc);

      const completed = JSON.parse(localStorage.getItem('typing_completed_lessons') || '[]');
      setCompletedCount(completed.length);
      setHasAccuracyBadge(localStorage.getItem('viettyping_badge_accuracy_100') === 'true');
      setHasTurtleBadge(localStorage.getItem('viettyping_badge_turtle_rescue') === 'true');
      
      // Load các cờ mốc tốc độ gõ
      setHasSpeed10(localStorage.getItem('viettyping_badge_speed_10') === 'true');
      setHasSpeed20(localStorage.getItem('viettyping_badge_speed_20') === 'true');
      setHasSpeed30(localStorage.getItem('viettyping_badge_speed_30') === 'true');
      setHasSpeed40(localStorage.getItem('viettyping_badge_speed_40') === 'true');
      setHasSpeed50(localStorage.getItem('viettyping_badge_speed_50') === 'true');
    } catch (e) {
      console.error('Failed to load user progress:', e);
    }

    async function loadLeaderboard() {
      try {
        const response = await fetch('/api/leaderboard', { cache: 'no-store' });
        if (!response.ok) throw new Error('Không thể tải bảng xếp hạng.');
        const payload = await response.json();
        setLeaderboardUsers(payload.users ?? []);
        setCurrentUserId(payload.currentUserId ?? null);
      } catch (error) {
        console.error('Failed to load leaderboard:', error);
        setLeaderboardError('Chưa thể tải bảng xếp hạng. Vui lòng thử lại sau.');
      } finally {
        setIsLeaderboardLoading(false);
      }
    }

    void loadLeaderboard();
  }, []);

  const speedBadges = [
    {
      id: 'speed_10',
      wpm: 10,
      name: 'Ốc Sên Nhỏ Nhẹ',
      emoji: '🐌',
      desc: 'Đạt tốc độ gõ trên 10 WPM',
      unlocked: hasSpeed10,
      color: 'bg-orange-50 border-orange-300 text-orange-850 shadow-orange-100'
    },
    {
      id: 'speed_20',
      wpm: 20,
      name: 'Thỏ Con Nhanh Nhảu',
      emoji: '🐰',
      desc: 'Đạt tốc độ gõ trên 20 WPM',
      unlocked: hasSpeed20,
      color: 'bg-green-50 border-green-300 text-green-850 shadow-green-100'
    },
    {
      id: 'speed_30',
      wpm: 30,
      name: 'Sóc Nhỏ Siêu Tốc',
      emoji: '🐿️',
      desc: 'Đạt tốc độ gõ trên 30 WPM',
      unlocked: hasSpeed30,
      color: 'bg-purple-50 border-purple-300 text-purple-850 shadow-purple-100'
    },
    {
      id: 'speed_40',
      wpm: 40,
      name: 'Báo Gấm Bay Lượn',
      emoji: '🐆',
      desc: 'Đạt tốc độ gõ trên 40 WPM',
      unlocked: hasSpeed40,
      color: 'bg-rose-50 border-rose-300 text-rose-850 shadow-rose-100'
    },
    {
      id: 'speed_50',
      wpm: 50,
      name: 'Tên Lửa Vũ Trụ',
      emoji: '🚀',
      desc: 'Đạt tốc độ gõ trên 50 WPM',
      unlocked: hasSpeed50,
      color: 'bg-sky-50 border-sky-300 text-sky-850 shadow-sky-100'
    }
  ];

  const achievementBadges = [
    {
      id: 'explore',
      name: 'Khám Phá',
      emoji: '🦖',
      desc: 'Hoàn thành bài luyện gõ đầu tiên',
      unlocked: completedCount >= 1,
      color: 'bg-emerald-50 border-emerald-300 text-emerald-850 shadow-emerald-100'
    },
    {
      id: 'accuracy',
      name: 'Chính Xác',
      emoji: '🎯',
      desc: 'Gõ chuẩn xác 100% trong bài tập',
      unlocked: hasAccuracyBadge,
      color: 'bg-pink-50 border-pink-300 text-pink-850 shadow-pink-100'
    },
    {
      id: 'streak',
      name: 'Chăm Chỉ',
      emoji: '🔥',
      desc: 'Chuỗi học tập đạt từ 3 ngày',
      unlocked: userStreak >= 3,
      color: 'bg-amber-50 border-amber-300 text-amber-850 shadow-amber-100'
    },
    {
      id: 'rescue',
      name: 'Hiệp Sĩ Rùa',
      emoji: '🐢',
      desc: 'Giải cứu thành công Rùa con',
      unlocked: hasTurtleBadge,
      color: 'bg-sky-50 border-sky-300 text-sky-850 shadow-sky-100'
    }
  ];

  const handleBack = () => {
    playSound('click');
    router.push('/');
  };

  if (!isMounted) return null;

  const currentUser = leaderboardUsers.find((user) => user.id === currentUserId);
  const userRank = currentUser?.rank ?? 0;

  // Lọc Top 10 để hiển thị trên bảng
  const top10List = leaderboardUsers.slice(0, 10);

  // Phân chia Top 3 và các thứ hạng còn lại
  const firstRank = top10List.find(u => u.rank === 1);
  const secondRank = top10List.find(u => u.rank === 2);
  const thirdRank = top10List.find(u => u.rank === 3);
  const restList = top10List.filter(u => u.rank > 3);

  // Xác định khoảng cách XP để lọt vào Top 10
  const rank10User = top10List[9] || top10List[top10List.length - 1];
  const diffXpToTop10 = rank10User ? Math.max(0, rank10User.xp - (currentUser?.xp ?? userXp)) : 0;

  return (
    <div className={`canvas-bg bg-background text-foreground transition-colors min-h-screen relative pb-28 ${plusJakartaSans.className}`}>
      
      {/* Hiệu ứng bong bóng tròn nhẹ nhàng */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white/30 border border-white/40"
            style={{
              width: Math.random() * 50 + 30,
              height: Math.random() * 50 + 30,
              left: `${Math.random() * 90}%`,
              bottom: '-80px',
            }}
            animate={{
              y: [0, -1000],
              opacity: [0, 0.7, 0.7, 0]
            }}
            transition={{
              duration: Math.random() * 10 + 20,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: 'linear'
            }}
          />
        ))}
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 relative z-10">
        
        {/* Header với nút quay lại và thông số của bé */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <button
            onClick={handleBack}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--color-surface)] border-2 border-[var(--color-foreground)] rounded-2xl shadow-[3px_3px_0px_0px_var(--color-foreground)] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer text-[var(--color-foreground)] font-black text-sm"
          >
            <ArrowLeft className="w-4 h-4 stroke-[3px]" />
            <span>Quay lại trang chủ</span>
          </button>
          
          {/* Cụm thông số gõ phím của bé */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {/* Tốc độ */}
            <div className="flex items-center gap-1.5 bg-[var(--color-surface)] border-2 border-[var(--color-foreground)] px-3.5 py-2 rounded-2xl shadow-[3px_3px_0px_0px_var(--color-foreground)] text-[var(--color-foreground)]">
              <span className="text-base select-none">⚡</span>
              <span className="text-xs font-black">
                Tốc độ: <span className="text-amber-600 font-extrabold">{userWpm || 0} WPM</span>
              </span>
            </div>
            
            {/* Độ chính xác */}
            <div className="flex items-center gap-1.5 bg-[var(--color-surface)] border-2 border-[var(--color-foreground)] px-3.5 py-2 rounded-2xl shadow-[3px_3px_0px_0px_var(--color-foreground)] text-[var(--color-foreground)]">
              <span className="text-base select-none">🎯</span>
              <span className="text-xs font-black">
                Chính xác: <span className="text-emerald-600 font-extrabold">{userAccuracy || 0}%</span>
              </span>
            </div>

            {/* Điểm số */}
            <div className="flex items-center gap-1.5 bg-[var(--color-surface)] border-2 border-[var(--color-foreground)] px-3.5 py-2 rounded-2xl shadow-[3px_3px_0px_0px_var(--color-foreground)] text-[var(--color-foreground)]">
              <Trophy className="w-4 h-4 text-yellow-500 fill-yellow-300 animate-bounce" />
              <span className="text-xs font-black">
                Điểm số: <span className="text-[var(--color-primary-depth)]">{userXp} XP</span>
              </span>
            </div>
          </div>
        </div>

        {/* Tiêu đề lớn */}
        <div className="text-center mb-8">
          <motion.h1 
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="text-4xl md:text-5xl font-black text-slate-900 drop-shadow-sm tracking-wide flex items-center justify-center gap-3"
          >
            <Trophy className="w-10 h-10 text-yellow-500 fill-yellow-300 animate-bounce" /> Bảng Vàng Cao Thủ
          </motion.h1>
          <p className="text-sm md:text-base text-slate-650 font-bold mt-2">
            Nơi vinh danh các siêu nhân gõ phím chăm chỉ nhất hệ mặt trời!
          </p>
        </div>

        <div className="flex justify-center mb-10">
          <div className="inline-flex items-center gap-2 bg-[var(--color-primary)] text-white border-4 border-[var(--color-foreground)] rounded-[24px] px-6 py-3 shadow-[4px_4px_0px_0px_var(--color-foreground)] font-black text-sm">
            <Crown className="w-4 h-4 text-yellow-300 fill-yellow-300" />
            Xếp hạng tổng XP của các tài khoản
          </div>
        </div>

        {(isLeaderboardLoading || leaderboardError) && (
          <div className="mb-8 rounded-2xl border-2 border-[var(--color-foreground)] bg-[var(--color-surface)] p-4 text-center text-sm font-black text-[var(--color-foreground)]">
            {isLeaderboardLoading ? 'Đang tải bảng xếp hạng...' : leaderboardError}
          </div>
        )}

        {/* Top 3 Vinh Danh - Bục 3D */}
        <div className="flex justify-center items-end gap-3 md:gap-8 mb-12 px-4 select-none">
          {/* HẠNG 2 (Bên Trái) */}
          {secondRank && (
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center w-24 md:w-32"
            >
              <div className="text-4xl md:text-5xl animate-bounce mb-2">{secondRank.avatar}</div>
              <div className="text-[10px] md:text-xs font-black text-slate-700 text-center truncate w-full mb-1">
                {secondRank.nickname.split(' ')[0]}
              </div>
              <div className="text-[10px] font-black text-slate-500 bg-slate-100 border-2 border-slate-300 px-2 py-0.5 rounded-full mb-2">
                {secondRank.xp} XP
              </div>
              {/* Cột bục hạng 2 */}
              <div className="w-full bg-slate-200 border-4 border-[var(--color-foreground)] border-b-0 rounded-t-2xl h-24 flex flex-col items-center justify-center shadow-inner relative">
                <Medal className="w-8 h-8 text-slate-400 fill-slate-200" />
                <span className="text-xl md:text-2xl font-black text-slate-700 mt-1">2</span>
              </div>
            </motion.div>
          )}

          {/* HẠNG 1 (Ở Giữa - Cao Nhất) */}
          {firstRank && (
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex flex-col items-center w-28 md:w-36 z-10"
            >
              {/* Vương miện nảy nhẹ trên đầu Hạng 1 */}
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                className="mb-1"
              >
                <Crown className="w-8 h-8 text-yellow-500 fill-yellow-300 stroke-[2px]" />
              </motion.div>
              <div className="text-5xl md:text-6xl mb-2">{firstRank.avatar}</div>
              <div className="text-xs md:text-sm font-black text-indigo-950 text-center truncate w-full mb-1">
                {firstRank.nickname.split(' ')[0]}
              </div>
              <div className="text-[11px] font-black text-amber-700 bg-amber-55 border-2 border-amber-300 px-2.5 py-0.5 rounded-full mb-2">
                {firstRank.xp} XP
              </div>
              {/* Cột bục hạng 1 */}
              <div className="w-full bg-gradient-to-b from-yellow-300 to-amber-400 border-4 border-[var(--color-foreground)] border-b-0 rounded-t-2xl h-36 flex flex-col items-center justify-center shadow-[inset_0_4px_0_0_rgba(255,255,255,0.4)] relative">
                <div className="absolute top-2 w-4 h-4 bg-white/30 rounded-full blur-sm animate-ping"></div>
                <span className="text-3xl md:text-4xl font-black text-slate-900">1</span>
              </div>
            </motion.div>
          )}

          {/* HẠNG 3 (Bên Phải) */}
          {thirdRank && (
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col items-center w-24 md:w-32"
            >
              <div className="text-4xl md:text-5xl animate-bounce mb-2">{thirdRank.avatar}</div>
              <div className="text-[10px] md:text-xs font-black text-slate-700 text-center truncate w-full mb-1">
                {thirdRank.nickname.split(' ')[0]}
              </div>
              <div className="text-[10px] font-black text-slate-500 bg-slate-100 border-2 border-slate-300 px-2 py-0.5 rounded-full mb-2">
                {thirdRank.xp} XP
              </div>
              {/* Cột bục hạng 3 */}
              <div className="w-full bg-amber-75/30 border-4 border-[var(--color-foreground)] border-b-0 rounded-t-2xl h-16 flex flex-col items-center justify-center shadow-inner relative">
                <Medal className="w-8 h-8 text-amber-700 fill-amber-55" />
                <span className="text-lg md:text-xl font-black text-amber-800 mt-1">3</span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Danh sách thứ hạng từ 4 đến 10 */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="space-y-3 bg-[var(--color-surface)] border-4 border-[var(--color-foreground)] rounded-[28px] p-4 md:p-6 shadow-[6px_6px_0px_0px_var(--color-foreground)] transition-colors"
        >
          {restList.map((user) => {
            const isMe = user.id === currentUserId;
            
            return (
              <motion.div
                key={user.id}
                whileHover={{ scale: 1.01, x: 2 }}
                className={`flex items-center justify-between p-3.5 rounded-2xl border-2 transition-all ${
                  isMe
                    ? 'bg-[var(--color-primary-container)] border-[var(--color-primary)] shadow-[3px_3px_0px_0px_var(--color-primary-depth)] text-[var(--color-on-primary-container)]'
                    : 'bg-[var(--color-surface)] border-[var(--color-outline-variant)] hover:border-slate-400 text-[var(--color-foreground)]'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  {/* Số thứ hạng */}
                  <span className={`w-8 h-8 rounded-full border-2 border-[var(--color-foreground)] flex items-center justify-center font-black text-xs shadow-[1.5px_1.5px_0px_0px_var(--color-foreground)] ${
                    isMe ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-surface-container)] text-[var(--color-foreground)]'
                  }`}>
                    {user.rank}
                  </span>
                  
                  {/* Avatar và Tên */}
                  <span className="text-2xl">{user.avatar}</span>
                  <span className={`text-xs md:text-sm font-black ${isMe ? 'text-indigo-900' : 'text-slate-800'}`}>
                    {isMe ? `${user.nickname} (Con đó!)` : user.nickname}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  {/* Streak ngọn lửa */}
                  {user.streak > 0 && (
                    <div className="flex items-center gap-1 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200" title="Chuỗi ngày học">
                      <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-100 animate-pulse" />
                      <span className="text-[10px] font-black text-orange-700">{user.streak}d</span>
                    </div>
                  )}
                  {/* Điểm XP */}
                  <div className="flex items-center gap-1 bg-[var(--color-surface-container)] px-3 py-1 rounded-full border border-[var(--color-outline-variant)]">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                    <span className="text-[11px] font-black text-[var(--color-foreground)]">{user.xp} XP</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Section Huy Hiệu của bé */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 bg-[var(--color-surface)] border-4 border-[var(--color-foreground)] rounded-[28px] p-5 md:p-6 shadow-[6px_6px_0px_0px_var(--color-foreground)] transition-colors space-y-8"
        >
          {/* Nhóm 1: Hành Trình Tốc Độ WPM */}
          <div>
            <h2 className="text-lg md:text-xl font-black text-slate-900 mb-5 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500 fill-amber-250 animate-pulse" />
              <span>Hành Trình Tốc Độ (WPM)</span>
              <span className="text-[10px] md:text-xs bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full border border-indigo-200 font-extrabold uppercase tracking-wider">Bé gõ càng nhanh, huy hiệu càng xịn!</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {speedBadges.map((badge) => (
                <div 
                  key={badge.id}
                  className={`border-3 border-slate-850 rounded-2xl p-3.5 flex flex-col items-center justify-between text-center transition-all min-h-[160px] ${
                    badge.unlocked 
                      ? `${badge.color} shadow-[3px_3px_0px_0px_rgba(0,0,0,0.15)] hover:scale-103` 
                      : 'bg-slate-100/70 border-slate-300 text-slate-400 opacity-60'
                  }`}
                  title={badge.desc}
                >
                  {/* Thumbnail Huy hiệu tròn chứa số WPM to ở chính giữa */}
                  <div className="relative w-16 h-16 md:w-20 md:h-20 flex flex-col items-center justify-center rounded-full border-4 border-slate-850 bg-white shadow-inner mb-3">
                    {/* Số WPM to chính giữa */}
                    <span className={`text-2xl md:text-3xl font-black leading-none ${badge.unlocked ? 'text-slate-900' : 'text-slate-400 grayscale'}`}>
                      {badge.wpm}
                    </span>
                    <span className={`text-[8px] font-black tracking-wider uppercase leading-none mt-0.5 ${badge.unlocked ? 'text-indigo-600' : 'text-slate-400'}`}>
                      WPM
                    </span>
                    
                    {/* Con vật nhỏ đính kèm góc dưới bên phải */}
                    <span className={`absolute -bottom-1 -right-1 text-xl md:text-2xl select-none transition-transform ${badge.unlocked ? 'animate-pulse' : 'grayscale opacity-60'}`}>
                      {badge.emoji}
                    </span>
                    
                    {/* Khoá 🔒 nếu chưa mở */}
                    {!badge.unlocked && (
                      <div className="absolute -top-1 -right-1 bg-slate-200 border-2 border-slate-400 rounded-full w-5 h-5 flex items-center justify-center text-[10px] text-slate-500 shadow-sm select-none">
                        <Lock className="w-2.5 h-2.5 text-slate-500" />
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <h4 className="font-black text-xs text-slate-850 leading-tight mb-1">
                      {badge.name}
                    </h4>
                    <p className="text-[10px] font-bold text-slate-500 leading-tight leading-relaxed max-w-[110px] mx-auto">
                      {badge.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Nhóm 2: Kỷ Niệm Đáng Yêu */}
          <div>
            <h2 className="text-lg md:text-xl font-black text-slate-900 mb-5 flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-500 fill-pink-250 animate-pulse" />
              <span>Kỷ Niệm Đáng Yêu (Học tập & Trò chơi)</span>
              <span className="text-[10px] md:text-xs bg-pink-100 text-pink-700 px-2.5 py-0.5 rounded-full border border-pink-200 font-extrabold uppercase tracking-wider">Hoàn thành thử thách để nhận quà!</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {achievementBadges.map((badge) => (
                <div 
                  key={badge.id}
                  className={`border-3 border-slate-850 rounded-2xl p-3.5 flex flex-col items-center justify-between text-center transition-all min-h-[140px] ${
                    badge.unlocked 
                      ? `${badge.color} shadow-[3px_3px_0px_0px_rgba(0,0,0,0.15)] hover:scale-103` 
                      : 'bg-slate-100/70 border-slate-300 text-slate-400 opacity-60'
                  }`}
                  title={badge.desc}
                >
                  <div className="relative">
                    <span className={`text-4.5xl inline-block mb-2 ${badge.unlocked ? 'animate-bounce' : 'grayscale'}`}>
                      {badge.emoji}
                    </span>
                    {!badge.unlocked && (
                      <div className="absolute -top-1.5 -right-1.5 bg-slate-200 border-2 border-slate-400 rounded-full w-5 h-5 flex items-center justify-center text-[10px] text-slate-500 shadow-sm">
                        <Lock className="w-2.5 h-2.5 text-slate-500" />
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <h4 className="font-black text-xs text-slate-850 leading-tight mb-1">
                      {badge.name}
                    </h4>
                    <p className="text-[10px] font-bold text-slate-500 leading-tight leading-relaxed max-w-[110px] mx-auto">
                      {badge.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Sticky Bottom Card động viên bé */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-[var(--color-surface)] border-t-4 border-[var(--color-foreground)] p-4 shadow-[0_-8px_20px_rgba(0,0,0,0.05)] transition-colors">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-300 border-2 border-slate-800 rounded-full flex items-center justify-center shadow-sm animate-bounce">
                <Crown className="w-6 h-6 text-yellow-600 fill-yellow-250" />
              </div>
              <div className="text-left">
                <h4 className="text-slate-900 font-black text-sm md:text-base flex items-center gap-1.5">
                  <span>Hạng hiện tại của con: </span>
                  <span className="text-indigo-600 font-extrabold text-base">{userRank ? `#${userRank}` : '--'}</span>
                </h4>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                  {userRank > 0 && userRank <= 10 ? (
                    <span className="text-emerald-600 font-bold">Thật tuyệt vời! Con đang nằm trong Top 10 bảng vàng học tập đó!</span>
                  ) : (
                    <span>Chỉ cần tích lũy thêm <span className="text-amber-600 font-extrabold">{diffXpToTop10} XP</span> nữa là lọt vào Top 10 rồi!</span>
                  )}
                </p>
              </div>
            </div>

            <button
              onClick={() => handleBack()}
              className="keycap-btn-secondary w-full sm:w-auto px-6 py-3.5 text-sm"
            >
              <Play className="w-4 h-4 text-white fill-white mr-1" />
              <span>{userRank > 0 && userRank <= 10 ? 'Học Để Giữ Hạng!' : 'Gõ Phím Đua Top Ngay!'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
