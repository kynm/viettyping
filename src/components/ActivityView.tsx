import React, { useState, useEffect } from 'react';
import { Topic, Activity, subjects } from '@/data/subjects';
import { IoArrowBack } from 'react-icons/io5';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useProgress } from '@/hooks/useProgress';
import { hasVietnameseDiacritics } from '@/utils/vietnameseUtils';
import TelexGuide from './TelexGuide';
import DinoMascot from './DinoMascot';
import { useStudent } from '@/contexts/StudentContext';
import { useSubjectTheme } from '@/hooks/useSubjectTheme';

const MASCOT_NAMES: Record<string, string> = {
  dino: 'Khủng Long',
  turtle: 'Rùa Con',
  bunny: 'Thỏ Ngọc',
  panda: 'Gấu Trúc',
  leopard: 'Báo Đốm'
};

// Import Adapters
import { 
  QuizActivity, 
  ReadingActivity, 
  DrawingActivity, 
  ListeningActivity, 
  TypingActivity,
  MathActivity
} from '@/components/activities';
import { ActivityTelemetry } from '@/types/activity';

// Import Game Components
import MatchingGame from '@/components/MatchingGame';
import TrueFalseGame from '@/components/TrueFalseGame';
import SpinWheelGame from '@/components/SpinWheelGame';
import FillInTheBlankGame from '@/components/FillInTheBlankGame';
import MultipleChoiceGame from '@/components/MultipleChoiceGame';

interface ActivityViewProps {
  topic: Topic;
  onComplete: (activityId: string, score: number) => void;
}

const ActivityView: React.FC<ActivityViewProps> = ({ topic, onComplete }) => {
  const params = useParams();
  const router = useRouter();
  const { studentInfo } = useStudent();
  const subjectId = params.subjectId as string;
  const subject = subjects.find(s => s.id === subjectId);
  const theme = useSubjectTheme();
  const [currentActivityIndex, setCurrentActivityIndex] = useState(0);
  const [currentProgress, setCurrentProgress] = useState(0); // For intra-activity progress bar
  const { isActivityCompleted, saveProgress, isLoaded, getTopicProgress, clearTopicProgress } = useProgress();

  const currentTheme = studentInfo?.theme || 'dino';
  const currentMascotName = MASCOT_NAMES[currentTheme] || 'Khủng Long';

  const currentActivity = topic.activities[currentActivityIndex];

  // Reset progress when changing activity
  useEffect(() => {
    setCurrentProgress(0);
  }, [currentActivityIndex]);

  const handleActivityComplete = (telemetry: ActivityTelemetry) => {
    const activityId = currentActivity.id;
    
    // TODO: Send telemetry data to backend/analytics server here
    console.log(`[Telemetry] Activity ${activityId} completed:`, telemetry);

    // Save score progress
    saveProgress(activityId, telemetry.score);
    onComplete(activityId, telemetry.score);

    // Move to next activity
    if (currentActivityIndex < topic.activities.length - 1) {
      setTimeout(() => {
        setCurrentActivityIndex((prev) => prev + 1);
      }, 1000); // Wait 1s before moving next to allow animations to finish
    }
  };

  const handleProgressUpdate = (progress: number) => {
    setCurrentProgress(progress);
  };

  const renderActivity = (activity: Activity) => {
    switch (activity.type) {
      case 'typing':
        return <TypingActivity key={activity.id} activity={activity} onComplete={handleActivityComplete} onProgressUpdate={handleProgressUpdate} />;
      case 'quiz':
        return <QuizActivity key={activity.id} activity={activity} onComplete={handleActivityComplete} onProgressUpdate={handleProgressUpdate} />;
      case 'math':
        return <MathActivity key={activity.id} activity={activity} onComplete={handleActivityComplete} onProgressUpdate={handleProgressUpdate} />;
      case 'reading':
        return <ReadingActivity key={activity.id} activity={activity} onComplete={handleActivityComplete} onProgressUpdate={handleProgressUpdate} />;
      case 'drawing':
        return <DrawingActivity key={activity.id} activity={activity} onComplete={handleActivityComplete} onProgressUpdate={handleProgressUpdate} />;
      case 'listening':
        return <ListeningActivity key={activity.id} activity={activity} onComplete={handleActivityComplete} onProgressUpdate={handleProgressUpdate} />;
      case 'game': {
        const subtype = activity.data?.subtype;
        switch (subtype) {
          case 'spinwheel': {
            const spinConfig = {
              id: activity.id,
              type: 'spin_wheel_items' as const,
              items: activity.data.items || [],
            };
            return (
              <SpinWheelGame
                key={activity.id}
                gameConfig={spinConfig}
                flashcards={activity.data.flashcards}
                onComplete={(telemetry) => handleActivityComplete({
                  score: telemetry.score,
                  duration: telemetry.durationSeconds,
                  rawPayload: telemetry
                })}
              />
            );
          }
          case 'matching': {
            const matchingConfig = {
              id: activity.id,
              type: 'matching_game' as const,
              items: activity.data.items || [],
            };
            return (
              <MatchingGame
                key={activity.id}
                gameConfig={matchingConfig}
                flashcards={activity.data.flashcards}
                onComplete={(telemetry) => handleActivityComplete({
                  score: telemetry.score,
                  duration: telemetry.durationSeconds,
                  rawPayload: telemetry
                })}
              />
            );
          }
          case 'true_false': {
            const tfConfig = {
              id: activity.id,
              type: 'true_false_game' as const,
              items: activity.data.items || [],
            };
            return (
              <TrueFalseGame
                key={activity.id}
                gameConfig={tfConfig}
                flashcards={activity.data.flashcards}
                onComplete={(telemetry) => handleActivityComplete({
                  score: telemetry.score,
                  duration: telemetry.durationSeconds,
                  rawPayload: telemetry
                })}
              />
            );
          }
          case 'fill_in_the_blank': {
            const fillConfig = {
              id: activity.id,
              type: 'fill_in_the_blank' as const,
              items: activity.data.items || [],
            };
            return (
              <FillInTheBlankGame
                key={activity.id}
                gameConfig={fillConfig}
                flashcards={activity.data.flashcards}
                onComplete={(telemetry) => handleActivityComplete({
                  score: telemetry.score,
                  duration: telemetry.durationSeconds,
                  rawPayload: telemetry
                })}
              />
            );
          }
          case 'multiple_choice': {
            const mcConfig = {
              id: activity.id,
              type: 'multiple_choice' as const,
              items: activity.data.items || [],
            };

            return (
              <MultipleChoiceGame
                key={activity.id}
                gameConfig={mcConfig}
                flashcards={activity.data.flashcards}
                onComplete={(telemetry) => handleActivityComplete({
                  score: telemetry.score,
                  duration: telemetry.durationSeconds,
                  rawPayload: telemetry
                })}
              />
            );
          }
          default:
            return (
              <div className="text-center">
                <p className="text-gray-500">
                  Trò chơi loại &quot;{subtype}&quot; đang được phát triển...
                </p>
              </div>
            );
        }
      }
      default:
        return (
          <div className="text-center">
            <p className="text-gray-500">
              Loại hoạt động này đang được phát triển...
            </p>
          </div>
        );
    }
  };

  const activityIds = topic.activities.map(a => a.id);
  const progress = getTopicProgress(activityIds);
  const isTopicComplete = progress === 100;

  // Listen to Enter key when topic is completed to go to the next lesson
  useEffect(() => {
    if (!isTopicComplete) return;

    const handleEnterPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        router.push(`/subjects/${subjectId}`);
      }
    };

    window.addEventListener('keydown', handleEnterPress);
    return () => window.removeEventListener('keydown', handleEnterPress);
  }, [isTopicComplete, subjectId, router]);

  if (!isLoaded) return null;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-soft-cream">
      {/* Professional Header */}
      <header className="h-14 bg-white/90 border-b-4 border-slate-800 flex items-center justify-between px-4 shrink-0 z-20 shadow-sm relative">
        <div className="flex items-center gap-3">
          {/* Back Button */}
          <Link
            href={`/subjects/${subjectId}`}
            className={`group flex items-center gap-1.5 p-2 -ml-1 text-gray-500 hover:${theme.text} hover:${theme.bgLight15} rounded-xl transition-all`}
            title="Quay lại"
          >
            <IoArrowBack className="text-xl group-hover:-translate-x-0.5 transition-transform" />
          </Link>

          {/* Separator */}
          <div className="h-6 w-px bg-gray-200" />

          {/* Subject Icon + Title */}
          <div className="flex items-center gap-2.5">
            {subject && (
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${subject.color} flex items-center justify-center text-white text-sm shrink-0 shadow-sm`}>
                {subject.icon}
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-gray-900 truncate leading-tight">
                {topic.title}
              </h1>
              <p className="text-xs text-gray-500 truncate">
                {currentActivityIndex + 1}/{topic.activities.length} hoạt động
              </p>
            </div>
          </div>
        </div>

        {/* Progress Dots + Badge */}
        <div className="flex items-center gap-3">
          {/* Activity Progress Dots */}
          <div className="hidden sm:flex items-center gap-1.5">
            {topic.activities.map((activity, index) => {
              const isCompleted = isActivityCompleted(activity.id);
              const isActive = index === currentActivityIndex;
              return (
                <button
                  key={activity.id}
                  onClick={() => setCurrentActivityIndex(index)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${isActive
                    ? `${theme.bg} scale-125 ring-2 ${theme.ring} border border-slate-800`
                    : isCompleted
                      ? 'bg-dino-green hover:bg-dino-green/90 border border-slate-800'
                      : 'bg-slate-200 hover:bg-slate-300 border border-slate-400'
                    }`}
                  title={activity.title}
                />
              );
            })}
          </div>

          {/* Progress Badge */}
          <div className={`px-3 py-1 rounded-full text-xs font-black border-2 border-slate-800 ${progress === 100 ? 'bg-dino-green/20 text-slate-800' : `${theme.bgLight20} text-slate-800`
            }`}>
            {Math.round(progress)}%
          </div>
        </div>

        {/* Intra-activity Progress Bar (Optional) */}
        {currentProgress > 0 && currentProgress < 100 && (
          <div className={`absolute bottom-0 left-0 h-1 ${theme.bg} transition-all duration-300`} style={{ width: `${currentProgress}%` }} />
        )}
      </header>

      {/* 2. Main Content (Split Screen) */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* Left Panel: Instructions & Avatar */}
        <div className="w-80 md:w-96 bg-white border-r-4 border-slate-800 flex flex-col shrink-0 overflow-y-auto z-10 hidden lg:flex">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-full ${theme.bgLight20} border border-slate-800 flex items-center justify-center ${theme.text} text-xl font-bold`}>
                {currentActivityIndex + 1}
              </div>
              <h2 className="text-xl font-bold text-gray-800">
                {currentActivity.title}
              </h2>
            </div>

            <div className={`p-4 rounded-2xl text-slate-800 leading-relaxed border-2 border-slate-800 mb-6 ${theme.bgLight10}`}>
              {currentActivity.instructions}
            </div>

            {/* TELEX Guide - shown for Vietnamese typing activities */}
            {currentActivity.type === 'typing' && hasVietnameseDiacritics(currentActivity.content) && (
              <TelexGuide />
            )}

            {/* Context/Mascot với hiệu ứng 3D Pop-out cổ vũ bé */}
            <div className="relative w-full flex flex-col items-center justify-end select-none pt-14 mt-auto">
              {/* Linh vật nổi ở trên, nhô ra ngoài hộp */}
              <div className="absolute top-0 z-10 filter drop-shadow-[0_8px_10px_rgba(0,0,0,0.25)] hover:scale-115 hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                <DinoMascot className="w-28 h-28" />
              </div>
              
              {/* Khung thoại làm nền nâng linh vật sử dụng màu sắc chủ đề môn học */}
              <div className={`w-full ${theme.bgLight50} border-2 border-slate-800 rounded-2xl pt-11 pb-3 px-4 shadow-[3px_3px_0px_0px_#1e293b] text-center z-0`}>
                <p className={`text-[11px] font-black ${theme.text} uppercase tracking-wider mb-0.5`}>
                  Bạn {currentMascotName}
                </p>
                <p className="text-[10px] font-bold text-slate-600">
                  đang cổ vũ bé cố lên!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Workspace / Activity Area */}
        <div className="flex-1 bg-soft-cream/60 flex flex-col relative overflow-hidden">
          {/* Mobile Instruction Toggle (Visible only on small screens) */}
          <div className="lg:hidden p-4 bg-white border-b-4 border-slate-800 shrink-0">
            <h2 className="font-bold text-gray-800 mb-1">{currentActivity.title}</h2>
            <p className="text-sm text-gray-600 line-clamp-2 mb-2">{currentActivity.instructions}</p>
            {currentActivity.type === 'typing' && hasVietnameseDiacritics(currentActivity.content) && (
              <TelexGuide />
            )}
          </div>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto p-4 flex items-center justify-center">
            <div className={`w-full h-full flex items-center justify-center mx-auto ${
              currentActivity.type === 'drawing' ? 'max-w-5xl' : 'max-w-4xl'
            }`}>
              {renderActivity(currentActivity)}
            </div>
          </div>
        </div>

        {/* Completion Overlay với hiệu ứng 3D Pop-out linh vật chiến thắng */}
        {isTopicComplete && (
          <div className="absolute inset-0 bg-white/90 z-50 flex items-center justify-center backdrop-blur-sm animate-fade-in">
            {/* Hộp thoại có position relative và padding-top lớn hơn để nhường chỗ cho linh vật */}
            <div className="relative text-center pt-24 pb-8 px-8 bg-white rounded-3xl shadow-[8px_8px_0px_0px_#1e293b] border-4 border-slate-800 max-w-lg mx-4 flex flex-col items-center z-10">
              
              {/* Linh vật nhảy vọt lên trên ngoài viền của hộp thoại và đổ bóng sâu */}
              <div className="absolute -top-24 left-1/2 -translate-x-1/2 z-20 w-48 h-48 filter drop-shadow-[0_12px_20px_rgba(0,0,0,0.35)]">
                <DinoMascot variant="victory" className="w-full h-full" />
              </div>

              <h3 className="text-3xl font-black text-slate-800 mb-2">
                Hoàn thành xuất sắc!
              </h3>
              <p className="text-gray-600 text-lg mb-8 font-bold">
                Con đã hoàn thành toàn bộ chủ đề <span className={`font-extrabold ${theme.text}`}>{topic.title}</span>.
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => {
                    const activityIds = topic.activities.map(a => a.id);
                    clearTopicProgress(activityIds);
                    setCurrentActivityIndex(0);
                  }}
                  className="tactile-btn tactile-btn-gray px-6 py-3"
                >
                  Làm lại
                </button>
                <Link 
                  href={`/subjects/${subjectId}`} 
                  className="tactile-btn tactile-btn-primary px-8 py-3"
                >
                  Bài học tiếp theo
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityView;
