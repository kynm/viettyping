'use client';

import React, { useState, useEffect } from 'react';
import { subjects } from '@/data/subjects';
import SubjectSelector from '@/components/SubjectSelector';
import HeroSlideBanner from '@/components/HeroSlideBanner';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSound } from '@/contexts/SoundContext';
import { useStudent } from '@/contexts/StudentContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Trophy, Flame, Keyboard, ArrowRight, Smile, Menu, X, Gift, Award, Home as HomeIcon, CheckSquare, BookOpen, Users, Gamepad2, TrendingUp, User } from 'lucide-react';
import { Plus_Jakarta_Sans } from 'next/font/google';
import Logo from '@/components/Logo';
import DinoMascot from '@/components/DinoMascot';
import VisualWorldBackground from '@/components/VisualWorldBackground';
import { TactileStarBadge } from '@/components/BadgeElements';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700', '800']
});

const titles = [
  'Học Tập Kỳ Thú Cho Bé',
  'Luyện Gõ Phím Cực Vui!',
  'Khám Phá Tri Thức Mới',
  'Trở Thành Siêu Nhân Gõ Phím!'
];

const renderTaskIcon = (iconName: string) => {
  switch (iconName) {
    case 'book':
      return <BookOpen className="w-6 h-6 text-[var(--color-foreground)]" />;
    case 'keyboard':
      return <Keyboard className="w-6 h-6 text-[var(--color-foreground)]" />;
    case 'gamepad':
      return <Gamepad2 className="w-6 h-6 text-[var(--color-foreground)]" />;
    default:
      return <CheckSquare className="w-6 h-6 text-[var(--color-foreground)]" />;
  }
};

export default function Home() {
  const router = useRouter();
  const { playSound } = useSound();
  const { studentInfo, setIsOpenConfig } = useStudent();
  
  const [xp, setXp] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [avgWpm, setAvgWpm] = useState<number>(0);
  const [avgAccuracy, setAvgAccuracy] = useState<number>(0);
  const [typedText, setTypedText] = useState('');
  const [titleIndex, setTitleIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(100);
  const [isMounted, setIsMounted] = useState(false);
  const [activeMenu, setActiveMenu] = useState<'home' | 'lesson' | 'tasks' | 'shop' | 'leaderboard'>('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Đọc dữ liệu gamification từ localStorage
  useEffect(() => {
    setIsMounted(true);
    try {
      const savedXp = parseInt(localStorage.getItem('typing_xp') || '0', 10);
      const savedStreak = parseInt(localStorage.getItem('typing_streak') || '0', 10);
      const savedWpm = parseInt(localStorage.getItem('typing_avg_wpm') || '0', 10);
      const savedAcc = parseInt(localStorage.getItem('typing_avg_accuracy') || '0', 10);
      setXp(savedXp);
      setStreak(savedStreak);
      setAvgWpm(savedWpm);
      setAvgAccuracy(savedAcc);
    } catch (e) {
      console.error('Failed to load learning progress:', e);
    }
  }, []);

  // Xử lý hiệu ứng chữ chạy tự động thay đổi
  useEffect(() => {
    const currentFullText = titles[titleIndex];
    
    const handleTyping = () => {
      if (!isDeleting) {
        setTypedText(currentFullText.slice(0, typedText.length + 1));
        
        if (typedText === currentFullText) {
          setTypingSpeed(2000); // Đợi 2 giây
          setIsDeleting(true);
        } else {
          setTypingSpeed(80);
        }
      } else {
        setTypedText(currentFullText.slice(0, typedText.length - 1));
        
        if (typedText === '') {
          setIsDeleting(false);
          setTitleIndex((prev) => (prev + 1) % titles.length);
          setTypingSpeed(300);
        } else {
          setTypingSpeed(45);
        }
      }
    };

    const timer = setTimeout(handleTyping, typingSpeed);
    return () => clearTimeout(timer);
  }, [typedText, isDeleting, titleIndex, typingSpeed]);

  const handleNavClick = (path: string) => {
    playSound('click');
    setIsSidebarOpen(false);
    router.push(path);
  };

  const getLevelConfig = (theme: string) => {
    switch(theme) {
      case 'turtle':
        return { name: 'RÙA CON CHĂM CHỈ', motto: 'Chậm mà chắc', desc: 'Hãy cùng nhau xây dựng nền tảng vững chắc cho đôi bàn tay của bạn nhé!' };
      case 'panda':
        return { name: 'GẤU TRÚC THÔNG THÁI', motto: 'Đáng yêu & Kiên trì', desc: 'Luyện tập mỗi ngày cùng bạn Gấu Trúc để đôi bàn tay xinh xắn của con gõ thật khéo léo!' };
      case 'bunny':
        return { name: 'THỎ NGỌC SIÊU TỐC', motto: 'Nhanh như chớp', desc: 'Bứt phá tốc độ và rèn luyện phản xạ gõ phím cực nhanh cùng bạn Thỏ!' };
      case 'leopard':
        return { name: 'BÁO ĐỐM THẦN TỐC', motto: 'Dũng mãnh & Điêu luyện', desc: 'Chinh phục mọi thử thách gõ phím khó nhất và đạt tốc độ của nhà vô địch!' };
      default:
        return { name: 'KHỦNG LONG SIÊU PHÀM', motto: 'Mạnh mẽ & Nhanh nhẹn', desc: 'Đánh thức sức mạnh gõ phím của bạn và khám phá thế giới tri thức kỳ thú!' };
    }
  };

  const getThemeMascotName = (theme: string) => {
    switch(theme) {
      case 'turtle': return 'Rùa';
      case 'panda': return 'Gấu Trúc';
      case 'bunny': return 'Thỏ';
      case 'leopard': return 'Báo';
      default: return 'Khủng Long';
    }
  };

  const currentTheme = studentInfo?.theme || 'dino';
  const levelConfig = getLevelConfig(currentTheme);

  const sidebarContent = (
    <div className="flex flex-col h-full items-center justify-between py-6">
      {/* Logo Thương Hiệu */}
      <div className="w-full px-6 py-2 flex justify-center border-b-2 border-dashed border-[var(--color-foreground)]/10 pb-4">
        <div className="flex flex-col items-center gap-1 text-center">
          <Logo className="h-auto w-36" priority />
          <span className="text-[9px] font-bold leading-tight text-[var(--color-foreground)]/55">
            Một phiên bản của VietTyping
          </span>
        </div>
      </div>

      {/* Navigation Menu Vertical */}
      <nav className="w-full px-4 space-y-3 mt-8 flex-1">
        {[
          { id: 'home', label: 'Trang chủ', icon: <HomeIcon className="w-5 h-5" />, path: '/' },
          { id: 'lesson', label: 'Bài học của bé', icon: <BookOpen className="w-5 h-5" />, path: '/lesson' },
          { id: 'tasks', label: 'Đảo Gõ Phím', icon: <Keyboard className="w-5 h-5" />, path: '/typing' },
          { id: 'shop', label: 'Cửa hàng', icon: <Gift className="w-5 h-5" />, path: '/shop' },
          { id: 'leaderboard', label: 'Bảng xếp hạng', icon: <Trophy className="w-5 h-5" />, path: '/leaderboard' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveMenu(item.id as any);
              handleNavClick(item.path);
            }}
            className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-xl border-2 font-black transition-all cursor-pointer ${
              activeMenu === item.id
                ? 'bg-[var(--color-primary)] text-white border-[var(--color-foreground)] shadow-[2px_2px_0px_0px_var(--color-foreground)] translate-y-[-2px]'
                : 'bg-transparent text-[var(--color-foreground)] border-transparent opacity-75 hover:opacity-100'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Bottom Action Keycap Button */}
      <div className="w-full px-4 mt-auto">
        <button
          onClick={() => handleNavClick('/typing')}
          className="tactile-btn tactile-btn-primary w-full py-4 text-base rounded-2xl gap-2 cursor-pointer flex items-center justify-center"
        >
          <span>Bắt đầu gõ</span>
          <Sparkles className="w-5 h-5 text-white animate-pulse" />
        </button>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)] flex flex-col md:flex-row ${plusJakartaSans.className} transition-colors`}>
      
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-64 bg-[var(--color-surface)] border-r-4 border-[var(--color-foreground)] flex-col shrink-0 h-screen sticky top-0 transition-colors">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar (Drawer) */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black z-40 md:hidden"
            />
            <motion.aside 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 bottom-0 left-0 w-64 bg-[var(--color-surface)] border-r-4 border-[var(--color-foreground)] z-50 md:hidden"
            >
              <button 
                onClick={() => setIsSidebarOpen(false)}
                className="absolute top-4 right-4 p-1.5 border-2 border-[var(--color-foreground)] rounded-lg bg-[var(--color-background)]"
              >
                <X className="w-4 h-4" />
              </button>
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-[var(--color-surface)] border-b-4 border-[var(--color-foreground)] px-4 md:px-6 py-4 flex items-center justify-between transition-colors">
          <div className="flex items-center gap-3">
            {/* Hamburger button on Mobile */}
            <button 
              onClick={() => {
                playSound('click');
                setIsSidebarOpen(true);
              }}
              className="p-2 border-3 border-[var(--color-foreground)] rounded-xl bg-[var(--color-background)] md:hidden shadow-[2px_2px_0px_0px_var(--color-foreground)] active:translate-y-[1px] active:shadow-none cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links (Horizontal) */}
          <nav className="hidden lg:flex items-center gap-6 font-black text-sm text-[var(--color-foreground)]">
            <Link href="/lesson" onClick={() => playSound('click')} className="hover:text-[var(--color-primary)] border-b-2 border-transparent hover:border-[var(--color-primary)] py-1">Bài học</Link>
            <Link href="/typing/turtle-rescue" onClick={() => playSound('click')} className="hover:text-[var(--color-primary)] border-b-2 border-transparent hover:border-[var(--color-primary)] py-1">Trò chơi</Link>
            <Link href="/typing" onClick={() => playSound('click')} className="hover:text-[var(--color-primary)] border-b-2 border-transparent hover:border-[var(--color-primary)] py-1">Luyện tập</Link>
          </nav>

          {/* Gamification Indicator Panel */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Streak */}
            <TactileStarBadge color="orange" value={`${streak || 0} ngày`} className="scale-105" />

            {/* Stars/Coins */}
            <TactileStarBadge color="yellow" value={xp >= 1000 ? `${(xp / 1000).toFixed(1)} XP` : `${xp} XP`} className="scale-105" />

            {/* Profile Info & Config Button */}
            <button
              onClick={() => {
                playSound('click');
                setIsOpenConfig(true);
              }}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl border-2 border-[var(--color-foreground)] bg-[var(--color-surface)] shadow-[2.5px_2.5px_0px_0px_var(--color-foreground)] hover:translate-y-[-1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer text-left"
              title="Cấu hình hồ sơ của bé"
            >
              <div className="w-8 h-8 rounded-full border-2 border-[var(--color-foreground)] bg-[var(--color-surface-container)] flex items-center justify-center text-lg overflow-hidden shrink-0">
                {studentInfo ? (
                  <span className="text-lg leading-none">{studentInfo.avatar}</span>
                ) : (
                  <User className="w-4 h-4 text-[var(--color-foreground)]" />
                )}
              </div>
              <div className="hidden sm:flex flex-col pr-1 leading-tight">
                <span className="text-xs font-black text-[var(--color-foreground)]">
                  Chào {studentInfo ? studentInfo.nickname : 'Khoai Tây'}!
                </span>
                <span className="text-[10px] font-bold text-[var(--color-foreground)]/65">
                  Cấp độ {Math.floor(xp / 1000) + 1}
                </span>
              </div>
            </button>
          </div>
        </header>

        {/* main content area */}
        <VisualWorldBackground>
          <main className="flex-1 p-4 md:p-6 space-y-12 overflow-y-auto pb-24 relative z-10">
          
          {/* Running Title Banner */}
          <div className="text-center pt-2 pb-1">
            <h1 className="text-xl md:text-3xl font-black text-[var(--color-foreground)] min-h-[40px] drop-shadow-sm tracking-normal">
              {typedText}
              <span className="animate-blink text-[var(--color-primary-depth)] font-normal">|</span>
            </h1>
          </div>

          {/* Block 1: Banner Chào Mừng Cấp Độ Học Sinh */}
          <div className="bg-[var(--color-surface)] border-2 border-[var(--color-foreground)] rounded-[24px] shadow-[4px_4px_0px_0px_var(--color-foreground)] p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden transition-colors">
            <div className="flex-1 text-center md:text-left">
              <span className="bg-emerald-50 text-emerald-700 border-2 border-[var(--color-foreground)] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_var(--color-foreground)]">
                CẤP ĐỘ: {levelConfig.name}
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-[var(--color-foreground)] mt-4 mb-2">
                Chào {studentInfo?.nickname || 'Dũng Sĩ Gõ Phím'}!
              </h2>
              <p className="text-[var(--color-foreground)] opacity-90 text-sm md:text-base font-semibold max-w-xl leading-relaxed mb-6">
                Chúc mừng bạn đã đạt cấp độ {levelConfig.name}. Phương châm của chúng ta là <strong className="text-[var(--color-primary-depth)] font-black">"{levelConfig.motto}"</strong>. {levelConfig.desc}
              </p>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                <button
                  onClick={() => handleNavClick('/lesson')}
                  className="tactile-btn tactile-btn-secondary px-6 py-3.5 text-sm cursor-pointer flex items-center gap-2"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>BÀI HỌC CỦA BÉ</span>
                </button>
                <button
                  onClick={() => handleNavClick('/typing')}
                  className="tactile-btn tactile-btn-tertiary px-6 py-3.5 text-sm cursor-pointer flex items-center gap-2"
                >
                  <Keyboard className="w-4 h-4" />
                  <span>ĐẢO GÕ PHÍM</span>
                </button>
                <button
                  onClick={() => handleNavClick('/parents')}
                  className="tactile-btn tactile-btn-gray px-6 py-3.5 text-sm cursor-pointer flex items-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  <span>GÓC PHỤ HUYNH</span>
                </button>
              </div>
            </div>
            
            {/* Mascot Container với hiệu ứng 3D Pop-out */}
            <div className="relative w-48 h-56 flex flex-col justify-end items-center select-none shrink-0">
              {/* Khung nền màu rực rỡ, bo góc, viền dày kiểu Neo-brutalism lùi xuống dưới */}
              <div className="absolute bottom-0 w-full h-[78%] bg-[var(--color-surface-container)] border-3 border-[var(--color-foreground)] rounded-3xl shadow-[4px_4px_0px_0px_var(--color-foreground)] z-0" />
              
              {/* Linh vật phóng to, nhô lên trên ngoài viền của khung nền */}
              <div className="relative z-10 mb-2 filter drop-shadow-[0_10px_12px_rgba(0,0,0,0.3)] hover:scale-110 hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                <DinoMascot className="w-36 h-36" />
              </div>

              {/* Nhãn tên cấp độ nằm đè ở chân linh vật, ngay phía trên khung nền */}
              <div className="relative z-20 mb-3">
                <span className="bg-[var(--color-surface)] border-2 border-[var(--color-foreground)] text-[9px] font-black text-[var(--color-foreground)] px-2.5 py-1 rounded-full uppercase tracking-wider shadow-[2px_2px_0px_0px_var(--color-foreground)]">
                  {levelConfig.name}
                </span>
              </div>
            </div>
          </div>

          {/* Block 2: Tiến Trình Tuần & Giới Thiệu Thế Giới Linh Vật */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
             {/* Cột Trái: Tiến trình tuần */}
            <div className="bg-[var(--color-surface)] border-2 border-[var(--color-foreground)] rounded-[24px] shadow-[4px_4px_0px_0px_var(--color-foreground)] p-6 transition-colors">
              <h3 className="text-xl font-black text-[var(--color-foreground)] flex items-center justify-between mb-4">
                <span>Tiến trình tuần</span>
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              </h3>
              <div className="flex justify-between items-center text-xs font-black text-[var(--color-foreground)] opacity-85 mb-1.5">
                <span>KINH NGHIỆM</span>
                <span>{xp % 1000}/1000 XP</span>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-[var(--color-background)] border-2 border-[var(--color-foreground)] rounded-full h-5 p-0.5 overflow-hidden mb-6">
                <div
                  className="bg-[var(--color-primary)] h-full rounded-full transition-all duration-500"
                  style={{ width: `${(xp % 1000) / 10}%` }}
                ></div>
              </div>
              
              {/* Sub-info blocks */}
              <div className="grid grid-cols-2 gap-4">
                <div className="border-2 border-[var(--color-foreground)] rounded-xl p-3 bg-[var(--color-background)] text-center shadow-[2px_2px_0px_0px_var(--color-foreground)]">
                  <div className="text-[10px] font-black opacity-60 uppercase">Tốc độ</div>
                  <div className="text-lg font-black text-[var(--color-foreground)]">{avgWpm || 0} WPM</div>
                </div>
                <div className="border-2 border-[var(--color-foreground)] rounded-xl p-3 bg-[var(--color-background)] text-center shadow-[2px_2px_0px_0px_var(--color-foreground)]">
                  <div className="text-[10px] font-black opacity-60 uppercase">Chính xác</div>
                  <div className="text-lg font-black text-[var(--color-foreground)]">{avgAccuracy || 0}%</div>
                </div>
              </div>
            </div>

            {/* Cột Phải: Thế giới Linh vật */}
            <div className="bg-[var(--color-surface)] border-2 border-[var(--color-foreground)] rounded-[24px] shadow-[4px_4px_0px_0px_var(--color-foreground)] p-6 flex flex-col justify-between gap-6 transition-colors">
              <div className="text-center sm:text-left">
                <h3 className="text-xl font-black text-[var(--color-foreground)] mb-2">
                  Thế giới {getThemeMascotName(currentTheme)}
                </h3>
                <p className="text-sm font-semibold text-[var(--color-foreground)] opacity-85 leading-relaxed mb-6">
                  Hãy bắt đầu hành trình gõ phím tiếng Việt qua những hòn đảo kiến thức. Càng chậm, bạn càng gõ chuẩn!
                </p>
              </div>
              <div className="flex justify-center sm:justify-start">
                <button
                  onClick={() => handleNavClick('/typing')}
                  className="tactile-btn tactile-btn-primary px-6 py-3.5 text-sm cursor-pointer flex items-center gap-1.5"
                >
                  <span>BẮT ĐẦU NGAY</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Block 3: Nhiệm Vụ Hàng Ngày */}
          <div className="space-y-4">
            <h3 className="text-2xl font-black text-[var(--color-foreground)] flex items-center gap-2">
              <span className="p-2 bg-[var(--color-accent)] border-2 border-[var(--color-foreground)] rounded-xl shadow-[2px_2px_0px_0px_var(--color-foreground)] flex items-center justify-center">
                <CheckSquare className="w-5 h-5 text-[var(--color-foreground)]" />
              </span>
              <span>Nhiệm vụ hàng ngày</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  id: 'task-1',
                  title: 'Luyện chữ cái A-Ă-Â',
                  desc: 'Làm quen với các dấu thanh đặc biệt.',
                  xp: '200 XP',
                  icon: 'book',
                  path: '/subjects/tieng-viet/topics/tv-1'
                },
                {
                  id: 'task-2',
                  title: 'Tốc độ bền bỉ',
                  desc: 'Gõ 5 phút không sai lỗi nào.',
                  xp: '150 XP',
                  icon: 'keyboard',
                  path: '/typing'
                },
                {
                  id: 'task-3',
                  title: 'Giải cứu Rùa con',
                  desc: 'Trò chơi gõ phím vượt chướng ngại vật.',
                  xp: '300 XP',
                  icon: 'gamepad',
                  path: '/typing/turtle-rescue'
                }
              ].map((t) => (
                <div 
                  key={t.id}
                  onClick={() => handleNavClick(t.path)}
                  className="bg-[var(--color-surface)] border-3 border-[var(--color-foreground)] rounded-[20px] p-5 shadow-[4px_4px_0px_0px_var(--color-foreground)] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_var(--color-foreground)] transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div className="flex justify-between items-start gap-2 mb-4">
                    <span className="p-2 bg-[var(--color-background)] border-2 border-[var(--color-foreground)] rounded-xl shadow-[1.5px_1.5px_0px_0px_var(--color-foreground)] flex items-center justify-center">
                      {renderTaskIcon(t.icon)}
                    </span>
                    <span className="bg-yellow-50 text-yellow-800 border border-[var(--color-foreground)] text-[9px] font-black px-2 py-0.5 rounded-full shadow-[1px_1px_0px_0px_var(--color-foreground)]">
                      +{t.xp}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-black text-sm md:text-base text-[var(--color-foreground)] mb-1">{t.title}</h4>
                    <p className="text-xs font-semibold text-[var(--color-foreground)] opacity-70 leading-relaxed">{t.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SubjectSelector Grid */}
          <div className="pt-4">
            <div className="flex items-center gap-2 mb-6">
              <BookOpen className="w-6 h-6 text-[var(--color-primary-depth)]" />
              <h3 className="text-2xl font-black text-[var(--color-foreground)]">Khám Phá Môn Học</h3>
            </div>
            <SubjectSelector
              subjects={subjects}
              onSelectSubject={(subject) => {
                playSound('click');
                router.push(`/subjects/${subject.id}`);
              }}
            />
          </div>

          {/* Parents Corner Entry Card */}
          <div className="max-w-4xl mx-auto pt-6 text-center">
            <div className="inline-flex flex-col md:flex-row items-center gap-4 bg-[var(--color-surface)] border-2 border-[var(--color-foreground)] p-6 rounded-3xl shadow-[4px_4px_0px_0px_var(--color-foreground)]">
              <div className="p-3 bg-[var(--color-primary-container)] border-2 border-[var(--color-foreground)] rounded-2xl shrink-0 flex items-center justify-center">
                <Users className="w-8 h-8 text-[var(--color-primary-depth)]" />
              </div>
              <div className="text-center md:text-left flex flex-col items-center md:items-start">
                <h4 className="text-[var(--color-foreground)] font-black text-lg flex items-center justify-center md:justify-start gap-1.5">
                  <span>Bố mẹ ơi!</span>
                  <Smile className="w-5 h-5 text-[var(--color-primary-depth)] animate-bounce" />
                </h4>
                <p className="text-[var(--color-foreground)] opacity-90 text-sm md:text-base mt-1 font-bold leading-relaxed">
                  Hãy ghé thăm <Link href="/parents" onClick={() => playSound('click')} className="text-[var(--color-primary-depth)] font-extrabold underline hover:opacity-80">Góc phụ huynh</Link> để theo dõi tiến trình học tập của bé, xem bảng điểm, thống kê WPM và chuỗi ngày học để động viên bé kịp thời nhé!
                </p>
              </div>
            </div>
          </div>

          {/* Dòng bản quyền tinh tế trên nền cỏ */}
          <div className="text-center text-xs font-black text-emerald-850/60 pt-12 pb-6 max-w-2xl mx-auto flex flex-col justify-center items-center gap-2 select-none">
            <div className="flex flex-wrap justify-center items-center gap-1.5">
              <span>EasyTyping © {new Date().getFullYear()}</span>
              <span>•</span>
              <span>Phát triển bởi</span>
              <a 
                href="http://github.com/anhnbt" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-[var(--color-primary-depth)] hover:underline font-extrabold cursor-pointer"
                onClick={() => playSound('click')}
              >
                Nguyễn Bá Tuấn Anh
              </a>
              <span>•</span>
              <span className="bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shadow-[0.5px_0.5px_0px_rgba(0,0,0,0.1)]">
                Bản Thử Nghiệm
              </span>
            </div>
            <p className="max-w-xl text-[10px] leading-relaxed opacity-80">
              EasyTyping là một phiên bản phát triển từ dự án VietTyping. Tên dự án gốc và quyền tác giả VietTyping được trân trọng ghi nhận.
            </p>
            <div className="flex gap-3 mt-1.5 opacity-80">
              <Link href="/parents" onClick={() => playSound('click')} className="hover:underline">Bảo mật</Link>
              <span>•</span>
              <Link href="/typing" onClick={() => playSound('click')} className="hover:underline">Điều khoản</Link>
            </div>
          </div>

        </main>
        </VisualWorldBackground>

      </div>
    </div>
  );
}
