'use client';

import React, { useState, useCallback } from 'react';
import { notFound, useRouter } from 'next/navigation';
import { lessons } from '@/data/lessons';
import TypingPractice, { TypingTask } from '@/components/TypingPractice';
import CompletionModal from '@/components/CompletionModal';
import { IoArrowBack, IoArrowForward } from 'react-icons/io5';
import { TelemetryPayload } from '@/types/lesson';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { setStoredValue } from '@/lib/client-storage';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700', '800']
});

interface Props {
  params: Promise<{
    lessonId: string;
  }>;
}

interface Stats {
  wpm: number;
  accuracy: number;
  incorrectCount: number;
}

export default function LessonPage({ params }: Props) {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const resolvedParams = React.use(params);
  const lesson = lessons.find((l) => l.id === resolvedParams.lessonId);

  if (!lesson) {
    notFound();
  }

  const handleLessonComplete = useCallback((telemetry: TelemetryPayload) => {
    const newStats = {
      wpm: telemetry.metadata?.wpm || 0,
      accuracy: telemetry.score,
      incorrectCount: telemetry.metadata?.incorrectCount || 0,
    };
    setStats(newStats);
    setShowModal(true);

    // Lưu tiến trình thực tế vào localStorage để đồng bộ với danh sách bài học
    try {
      // 1. Lưu danh sách bài học đã hoàn thành
      const completedList = JSON.parse(localStorage.getItem('typing_completed_lessons') || '[]');
      if (!completedList.includes(resolvedParams.lessonId)) {
        completedList.push(resolvedParams.lessonId);
        setStoredValue('typing_completed_lessons', JSON.stringify(completedList));
      }

      // 2. Tính toán & Cộng thêm XP (ví dụ: gõ tốt được 100 XP, gõ xuất sắc 3 sao được 150 XP)
      const earnedXP = telemetry.score >= 90 ? 150 : 100;
      const currentXP = parseInt(localStorage.getItem('typing_xp') || '0', 10);
      setStoredValue('typing_xp', String(currentXP + earnedXP));

      // 3. Cập nhật Streak
      const currentStreak = parseInt(localStorage.getItem('typing_streak') || '0', 10);
      setStoredValue('typing_streak', String(currentStreak + 1));

      // 4. Lưu cờ Huy hiệu (Badges) dựa trên thành tích
      if (telemetry.score === 100) {
        setStoredValue('viettyping_badge_accuracy_100', 'true');
      }
      const wpmValue = telemetry.metadata?.wpm || 0;
      if (wpmValue >= 10) {
        setStoredValue('viettyping_badge_speed_10', 'true');
      }
      if (wpmValue >= 20) {
        setStoredValue('viettyping_badge_speed_20', 'true');
      }
      if (wpmValue >= 30) {
        setStoredValue('viettyping_badge_speed_30', 'true');
      }
      if (wpmValue >= 40) {
        setStoredValue('viettyping_badge_speed_40', 'true');
      }
      if (wpmValue >= 50) {
        setStoredValue('viettyping_badge_speed_50', 'true');
      }

      // 5. Cập nhật WPM và Accuracy trung bình lũy tiến
      const totalLessons = parseInt(localStorage.getItem('typing_total_lessons') || '0', 10);
      const avgWpm = parseFloat(localStorage.getItem('typing_avg_wpm') || '0');
      const avgAcc = parseFloat(localStorage.getItem('typing_avg_accuracy') || '0');
      
      const newTotal = totalLessons + 1;
      const newAvgWpm = Math.round((avgWpm * totalLessons + wpmValue) / newTotal);
      const newAvgAcc = Math.round((avgAcc * totalLessons + telemetry.score) / newTotal);
      
      setStoredValue('typing_total_lessons', String(newTotal));
      setStoredValue('typing_avg_wpm', String(newAvgWpm));
      setStoredValue('typing_avg_accuracy', String(newAvgAcc));
    } catch (err) {
      console.error('Failed to save typing progress to localStorage:', err);
    }
  }, [resolvedParams.lessonId]);

  const getNextLesson = useCallback(() => {
    const currentIndex = lessons.findIndex((l) => l.id === lesson.id);
    return lessons[currentIndex + 1] || null;
  }, [lesson.id]);

  const handleNextLesson = useCallback(() => {
    const nextLesson = getNextLesson();
    if (nextLesson) {
      router.push(`/typing/${nextLesson.id}`);
    }
  }, [getNextLesson, router]);

  const handleRestart = useCallback(() => {
    setShowModal(false);
    setStats(null);
    setResetKey((prev) => prev + 1);
  }, []);

  const handleContinue = useCallback(() => {
    setShowModal(false);
    setStats(null);
    const nextLesson = getNextLesson();
    if (nextLesson) {
      router.push(`/typing/${nextLesson.id}`);
    } else {
      router.push('/typing');
    }
  }, [getNextLesson, router]);

  return (
    <main className={`min-h-screen bg-gradient-to-b from-[var(--color-background)] to-[var(--color-surface)] py-6 ${plusJakartaSans.className}`}>
      <div className="w-full px-6 md:px-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/typing')}
              className="keycap-btn-surface px-5 py-3 text-sm"
            >
              <IoArrowBack className="text-xl mr-1" />
              <span>Quay lại đảo</span>
            </button>
          </div>
          <h1 className={`text-3xl md:text-4xl font-black text-[var(--color-foreground)] text-center ${plusJakartaSans.className}`}>
            {lesson.title}
          </h1>
          {getNextLesson() ? (
            <button
              onClick={handleNextLesson}
              className="keycap-btn-primary px-5 py-3 text-sm"
            >
              <span>Tiếp theo</span>
              <IoArrowForward className="text-xl ml-1" />
            </button>
          ) : (
            <div className="w-[120px] hidden md:block"></div>
          )}
        </div>

        <div className="bg-[var(--color-surface)]/80 backdrop-blur-md rounded-3xl p-6 shadow-[6px_6px_0px_0px_var(--color-foreground)] border-3 border-[var(--color-foreground)] mb-8">
          <TypingPractice
            key={`${lesson.id}-${resetKey}`}
            task={lesson as unknown as TypingTask}
            onComplete={handleLessonComplete}
          />
        </div>

        {stats && (
          <CompletionModal
            isOpen={showModal}
            stats={stats}
            onRestart={handleRestart}
            onContinue={handleContinue}
            continueLabel={getNextLesson() ? 'Bài tiếp theo' : 'Quay lại danh sách'}
          />
        )}
      </div>
    </main>
  );
}

