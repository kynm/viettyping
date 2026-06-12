import { useState, useEffect } from 'react';
import { setStoredValue } from '@/lib/client-storage';

export interface ActivityProgress {
  score: number;
  timestamp: number;
}

export interface UserProgress {
  [activityId: string]: ActivityProgress;
}

const STORAGE_KEY = 'kids_learning_progress';

export const useProgress = () => {
  const [progress, setProgress] = useState<UserProgress>({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load progress from localStorage on mount
    const savedProgress = localStorage.getItem(STORAGE_KEY);
    if (savedProgress) {
      try {
        setProgress(JSON.parse(savedProgress));
      } catch (error) {
        console.error('Failed to parse progress from localStorage:', error);
      }
    }
    setIsLoaded(true);
  }, []);

  const saveProgress = (activityId: string, score: number) => {
    setProgress((prev) => {
      const newProgress = {
        ...prev,
        [activityId]: {
          score,
          timestamp: Date.now(),
        },
      };
      setStoredValue(STORAGE_KEY, JSON.stringify(newProgress));
      return newProgress;
    });
  };

  const getProgress = (activityId: string): ActivityProgress | undefined => {
    return progress[activityId];
  };

  const isActivityCompleted = (activityId: string): boolean => {
    return !!progress[activityId];
  };

  const getTopicProgress = (activityIds: string[]): number => {
    if (activityIds.length === 0) return 0;
    const completedCount = activityIds.filter((id) => !!progress[id]).length;
    return Math.round((completedCount / activityIds.length) * 100);
  };

  const clearTopicProgress = (activityIds: string[]) => {
    setProgress((prev) => {
      const newProgress = { ...prev };
      activityIds.forEach((id) => delete newProgress[id]);
      setStoredValue(STORAGE_KEY, JSON.stringify(newProgress));
      return newProgress;
    });
  };

  return {
    progress,
    isLoaded,
    saveProgress,
    getProgress,
    isActivityCompleted,
    getTopicProgress,
    clearTopicProgress,
  };
};
