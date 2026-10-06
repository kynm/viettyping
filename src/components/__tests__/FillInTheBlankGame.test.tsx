import { FillInTheBlankItem } from '@/types/lesson';
/* eslint-disable */
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import FillInTheBlankGame from '../FillInTheBlankGame';

// Mock framer-motion
jest.mock('framer-motion', () => {
  const React = require('react');
  return {
    motion: {
      div: React.forwardRef(({ children, ...props }: any, ref: any) => {
        const { initial, animate, exit, transition, whileHover, whileTap, ...rest } = props;
        return <div ref={ref} {...rest}>{children}</div>;
      }),
      button: React.forwardRef(({ children, ...props }: any, ref: any) => {
        const { whileHover, whileTap, animate, ...rest } = props;
        return <button ref={ref} {...rest}>{children}</button>;
      }),
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
  };
});

// Mock canvas-confetti
jest.mock('canvas-confetti', () => jest.fn());

// Mock useSound
jest.mock('@/contexts/SoundContext', () => ({
  useSound: () => ({
    isMuted: false,
    toggleMute: jest.fn(),
    playSound: jest.fn(),
  }),
}));

// Mock Audio
const mockPlay = jest.fn().mockResolvedValue(undefined);
global.Audio = jest.fn().mockImplementation(() => ({
  play: mockPlay,
  volume: 0,
}));

describe('FillInTheBlankGame', () => {
  const mockConfig: FillInTheBlankItem = {
    id: 'blank-test-game',
    type: 'fill_in_the_blank',
    items: [
      { full_word: 'ba', missing_char: 'a', sentence: 'b_' },
      { full_word: 'bò', missing_char: 'ò', sentence: 'b_' }
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

  it('should render the sentence and virtual keyboard choices', () => {
    render(<FillInTheBlankGame gameConfig={mockConfig} onComplete={mockOnComplete} />);
    
    // Check sentence is displayed (should contain 'b')
    expect(screen.getAllByText('b')[0]).toBeInTheDocument();
    
    // The correct missing char 'a' should be on the keyboard
    expect(screen.getByRole('button', { name: 'a' })).toBeInTheDocument();
  });

  it('should handle correct answers and complete the game with a 100 score', () => {
    // Mock SpeechSynthesis
    const mockSpeak = jest.fn();
    global.window.speechSynthesis = {
      speak: mockSpeak,
      cancel: jest.fn(),
      getVoices: () => [],
      pause: jest.fn(),
      resume: jest.fn(),
    } as any;
    global.SpeechSynthesisUtterance = jest.fn();

    render(<FillInTheBlankGame gameConfig={mockConfig} onComplete={mockOnComplete} />);

    // Item 1: 'ba', missing 'a'
    const btnA = screen.getByRole('button', { name: 'a' });
    fireEvent.click(btnA);

    // Fast-forward transition timeout (2.5 seconds)
    act(() => {
      jest.advanceTimersByTime(2500);
    });

    // Item 2: 'bò', missing 'ò'
    expect(screen.getByRole('button', { name: 'ò' })).toBeInTheDocument();
    const btnO = screen.getByRole('button', { name: 'ò' });
    fireEvent.click(btnO);

    act(() => {
      jest.advanceTimersByTime(2500);
    });

    expect(mockOnComplete).toHaveBeenCalledTimes(1);
    const telemetry = mockOnComplete.mock.calls[0][0];
    expect(telemetry.score).toBe(100);
    expect(telemetry.durationSeconds).toBeGreaterThanOrEqual(0);
    expect(telemetry.errors).toBeUndefined();
  });

  it('should track errors and lower score when incorrect choices are selected', () => {
    render(<FillInTheBlankGame gameConfig={mockConfig} onComplete={mockOnComplete} />);

    // First question correct missing char is 'a'.
    // Let's find a distractor button (a button on keyboard that is NOT 'a').
    // Since mock options are generated randomly combining 'a' and 3 distractors,
    // let's query all buttons on keyboard and find one that isn't 'a'.
    const buttons = screen.getAllByRole('button');
    const wrongBtn = buttons.find(btn => btn.textContent !== 'a');
    expect(wrongBtn).toBeDefined();

    // Click wrong answer
    fireEvent.click(wrongBtn!);

    // Should not call onComplete yet
    expect(mockOnComplete).not.toHaveBeenCalled();

    // Fast-forward shake feedback (1 second)
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Click correct answer 'a'
    const btnA = screen.getByRole('button', { name: 'a' });
    fireEvent.click(btnA);

    act(() => {
      jest.advanceTimersByTime(2500);
    });

    // Item 2: 'bò', missing 'ò'. Answer correctly first try.
    const btnO = screen.getByRole('button', { name: 'ò' });
    fireEvent.click(btnO);

    act(() => {
      jest.advanceTimersByTime(2500);
    });

    expect(mockOnComplete).toHaveBeenCalledTimes(1);
    const telemetry = mockOnComplete.mock.calls[0][0];
    expect(telemetry.score).toBe(50); // 1 out of 2 items had a mistake
    expect(telemetry.errors).toBeDefined();
    expect(telemetry.errors).toHaveLength(1);
    expect(telemetry.errors[0]).toEqual({
      questionId: 'blank-test-game_q0',
      userAnswer: wrongBtn!.textContent,
      correctAnswer: 'a'
    });
  });
});
