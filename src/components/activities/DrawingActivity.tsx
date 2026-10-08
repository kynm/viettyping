import React, { useState, useEffect } from 'react';
import { ActivityAdapterProps } from '@/types/activity';
import ColoringCanvas from '@/components/ColoringCanvas';
import { ColoringCanvasItem, TelemetryPayload } from '@/types/lesson';

export const DrawingActivity: React.FC<ActivityAdapterProps> = ({ activity, onComplete, onProgressUpdate }) => {
  const [startTime, setStartTime] = useState<number>(0);

  useEffect(() => {
    setStartTime(Date.now());
  }, []);

  const handleCanvasComplete = (telemetry: TelemetryPayload) => {
    const duration = Math.round((Date.now() - startTime) / 1000);
    
    if (onProgressUpdate) {
      onProgressUpdate(100);
    }

    onComplete({
      score: telemetry.score,
      duration: telemetry.durationSeconds || duration,
      rawPayload: {
        action: 'completed_coloring',
        coverage: telemetry.metadata?.colorCoveragePercent || 0,
        bleed: telemetry.metadata?.colorBleedPercent || 0,
      }
    });
  };

  const handleProgress = (percent: number) => {
    if (onProgressUpdate) {
      onProgressUpdate(percent);
    }
  };

  // Convert activity to ColoringCanvas gameConfig structure
  const gameConfig: ColoringCanvasItem = {
    id: activity.id,
    type: 'drawing_coloring_canvas',
    items: [
      {
        outlineSvgName: activity.data?.outlineSvgName || 'heart', // Default to heart if not specified
        title: activity.title,
        targetCoveragePercent: activity.data?.targetCoveragePercent || 70,
      }
    ]
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <ColoringCanvas 
        gameConfig={gameConfig} 
        onComplete={handleCanvasComplete} 
        onProgressUpdate={handleProgress} 
      />
    </div>
  );
};
