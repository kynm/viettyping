import { MatchingGameItem } from '@/types/lesson';
/* eslint-disable */
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import MatchingGame from '../MatchingGame';

// We store the onDragEnd handler here so our tests can invoke it manually
let lastOnDragEnd: any = null;

// Mock dnd-kit
jest.mock('@dnd-kit/core', () => {
  const React = require('react');
  return {
    DndContext: ({ children, onDragEnd }: any) => {
      lastOnDragEnd = onDragEnd;
      return <div data-testid="dnd-context">{children}</div>;
    },
    useDraggable: ({ id }: any) => ({
      attributes: {},
      listeners: {},
      setNodeRef: jest.fn(),
      transform: null,
      isDragging: false,
    }),
    useDroppable: ({ id }: any) => ({
      isOver: false,
      setNodeRef: jest.fn(),
    }),
    MouseSensor: jest.fn(),
    TouchSensor: jest.fn(),
    useSensor: jest.fn(),
    useSensors: jest.fn(),
  };
});

jest.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Translate: {
      toString: jest.fn(),
    },
  },
}));

// Mock framer-motion
jest.mock('framer-motion', () => {
  const React = require('react');
  return {
    motion: {
      div: React.forwardRef(({ children, ...props }: any, ref: any) => {
        const { initial, animate, exit, transition, whileHover, whileTap, ...rest } = props;
        return <div ref={ref} {...rest}>{children}</div>;
      }),
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
  };
});

// Mock next/image
jest.mock('next/image', () => {
  return function MockImage({ src, alt }: any) {
    return <img src={src} alt={alt} />;
  };
});

// Mock Audio
const mockPlay = jest.fn().mockResolvedValue(undefined);
global.Audio = jest.fn().mockImplementation(() => ({
  play: mockPlay,
  volume: 0,
}));

// Mock useSound
jest.mock('@/contexts/SoundContext', () => ({
  useSound: () => ({
    isMuted: false,
    toggleMute: jest.fn(),
    playSound: jest.fn(),
  }),
}));

describe('MatchingGame', () => {
  const mockConfig: MatchingGameItem = {
    id: 'matching-test-game',
    type: 'matching_game',
    items: [
      { word: 'ba', image_prompt: '', image_url: '/assets/ba.png' },
      { word: 'bò', image_prompt: '', image_url: '/assets/bo.png' }
    ]
  };

  const mockOnComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should render all word tags and image slots', () => {
    render(<MatchingGame gameConfig={mockConfig} onComplete={mockOnComplete} />);
    
    // Check that slot images exist (the mock next/image renders img tag)
    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(2);

    // Check that draggable words exist
    expect(screen.getByText('ba')).toBeInTheDocument();
    expect(screen.getByText('bò')).toBeInTheDocument();
  });

  it('should complete game with a 100 score when matching perfectly', () => {
    render(<MatchingGame gameConfig={mockConfig} onComplete={mockOnComplete} />);

    // Simulate drag end: match 'ba' to 'ba'
    act(() => {
      lastOnDragEnd({
        active: { id: 'ba' },
        over: { id: 'ba' }
      });
    });

    // Word 'ba' should be removed from unmatched words list (but stays in slot as matched)
    // Actually, in the UI: matches['ba'] is set, so it renders text inside DroppableSlot with id 'ba'
    // Let's match the second word 'bò' to 'bò'
    act(() => {
      lastOnDragEnd({
        active: { id: 'bò' },
        over: { id: 'bò' }
      });
    });

    // It has a setTimeout of 1000ms upon completion
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(mockOnComplete).toHaveBeenCalledTimes(1);
    const telemetry = mockOnComplete.mock.calls[0][0];
    expect(telemetry.score).toBe(100);
    expect(telemetry.durationSeconds).toBeGreaterThanOrEqual(0);
    expect(telemetry.errors).toBeUndefined();
  });

  it('should track incorrect drags and lower the score accordingly', () => {
    render(<MatchingGame gameConfig={mockConfig} onComplete={mockOnComplete} />);

    // Drag word 'ba' onto slot 'bò' (wrong match)
    act(() => {
      lastOnDragEnd({
        active: { id: 'ba' },
        over: { id: 'bò' }
      });
    });

    // Should play buzz sound and not call onComplete
    expect(mockOnComplete).not.toHaveBeenCalled();

    // Now correct matching: drag 'ba' to 'ba'
    act(() => {
      lastOnDragEnd({
        active: { id: 'ba' },
        over: { id: 'ba' }
      });
    });

    // Drag 'bò' to 'bò'
    act(() => {
      lastOnDragEnd({
        active: { id: 'bò' },
        over: { id: 'bò' }
      });
    });

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(mockOnComplete).toHaveBeenCalledTimes(1);
    const telemetry = mockOnComplete.mock.calls[0][0];
    expect(telemetry.score).toBe(50); // 1 slot matched wrong initially ('bò') out of 2 slots
    expect(telemetry.errors).toBeDefined();
    expect(telemetry.errors).toHaveLength(1);
    expect(telemetry.errors[0]).toEqual({
      questionId: 'matching-test-game_slot_bò',
      userAnswer: 'ba',
      correctAnswer: 'bò'
    });
  });
});
