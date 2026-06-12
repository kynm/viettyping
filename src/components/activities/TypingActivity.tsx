import React, { useState, useCallback, useEffect } from 'react';
import { ActivityAdapterProps } from '@/types/activity';
import { IoPlay, IoClose } from 'react-icons/io5';
import TypingPractice from '@/components/TypingPractice';
import CompletionModal from '@/components/CompletionModal';
import { TelemetryPayload } from '@/types/lesson';
import { useSubjectTheme } from '@/hooks/useSubjectTheme';
import { setStoredValue } from '@/lib/client-storage';

export const TypingActivity: React.FC<ActivityAdapterProps> = ({ activity, onComplete, onProgressUpdate }) => {
  const [showTypingModal, setShowTypingModal] = useState(false);
  const [typingStats, setTypingStats] = useState<{ wpm: number; accuracy: number; incorrectCount: number } | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);
  const theme = useSubjectTheme();

  useEffect(() => {
    setStartTime(Date.now());
  }, []);

  const handleTypingComplete = useCallback((telemetry: TelemetryPayload) => {
    const stats = {
      wpm: telemetry.metadata?.wpm || 0,
      accuracy: telemetry.score,
      incorrectCount: telemetry.metadata?.incorrectCount || 0,
    };
    setTypingStats(stats);
    setShowCompletionModal(true);
    if (onProgressUpdate) onProgressUpdate(100);

    // Cập nhật WPM và Accuracy trung bình lũy tiến
    try {
      const totalLessons = parseInt(localStorage.getItem('typing_total_lessons') || '0', 10);
      const avgWpm = parseFloat(localStorage.getItem('typing_avg_wpm') || '0');
      const avgAcc = parseFloat(localStorage.getItem('typing_avg_accuracy') || '0');
      
      const newTotal = totalLessons + 1;
      const newAvgWpm = Math.round((avgWpm * totalLessons + stats.wpm) / newTotal);
      const newAvgAcc = Math.round((avgAcc * totalLessons + stats.accuracy) / newTotal);
      
      setStoredValue('typing_total_lessons', String(newTotal));
      setStoredValue('typing_avg_wpm', String(newAvgWpm));
      setStoredValue('typing_avg_accuracy', String(newAvgAcc));
    } catch (e) {
      console.error('Failed to update typing stats in activity:', e);
    }
  }, [onProgressUpdate]);

  const handleTypingRestart = useCallback(() => {
    setShowCompletionModal(false);
    setTypingStats(null);
    setShowTypingModal(false);
    // Re-open the modal to restart
    setTimeout(() => setShowTypingModal(true), 100);
  }, []);

  const handleTypingContinue = useCallback(() => {
    setShowCompletionModal(false);
    setShowTypingModal(false);
    
    const duration = Math.round((Date.now() - startTime) / 1000);

    if (typingStats) {
      onComplete({
        score: typingStats.accuracy,
        duration,
        rawPayload: {
          action: 'completed_typing',
          wpm: typingStats.wpm,
          accuracy: typingStats.accuracy,
          incorrectCount: typingStats.incorrectCount
        }
      });
    }
    setTypingStats(null);
  }, [typingStats, startTime, onComplete]);

  return (
    <div className="text-center w-full max-w-2xl mx-auto flex flex-col items-center">
      <div className="mb-6">
        <h3 className="text-3xl font-black text-slate-800 mb-2">{activity.title}</h3>
        <p className="text-slate-500 font-bold text-sm">{activity.instructions}</p>
      </div>
      
      <div className={`w-full border-4 border-slate-800 rounded-3xl p-8 shadow-[6px_6px_0px_0px_#1e293b] mb-6 bg-white/70 ${theme.bgLight10}`}>
        <p className="text-3xl font-mono font-black text-slate-850 tracking-wider leading-snug">{activity.content}</p>
      </div>

      <button
        onClick={() => setShowTypingModal(true)}
        className={`tactile-btn ${theme.tactileBtn} text-xl px-8 py-4`}
      >
        <IoPlay className="text-2xl" />
        Bắt đầu gõ
      </button>

      {/* Typing Practice Modal */}
      {showTypingModal && (
        <div className="fixed inset-0 z-[100] bg-gray-50 flex flex-col">
          {/* Modal Header */}
          <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0 shadow-sm">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setShowTypingModal(false);
                  setTypingStats(null);
                  setShowCompletionModal(false);
                }}
                className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                title="Đóng"
              >
                <IoClose className="text-xl" />
              </button>
              <div>
                <h1 className="text-sm font-bold text-gray-800 leading-tight">
                  {activity.title}
                </h1>
                <p className="text-xs text-gray-500">Luyện gõ</p>
              </div>
            </div>
          </header>

          {/* Practice Area */}
          <div className="flex-1 overflow-hidden p-4">
            <div className="w-full h-full">
              <TypingPractice
                key={showTypingModal ? 'open' : 'closed'}
                task={{
                  content: activity.content,
                  type: 'word',
                  description: activity.instructions,
                  time_limit_seconds: 60,
                }}
                onComplete={handleTypingComplete}
              />
            </div>
          </div>
        </div>
      )}

      {/* Completion Modal */}
      {typingStats && (
        <CompletionModal
          isOpen={showCompletionModal}
          stats={typingStats}
          onRestart={handleTypingRestart}
          onContinue={handleTypingContinue}
          continueLabel="Hoàn thành & Tiếp tục"
        />
      )}
    </div>
  );
};
