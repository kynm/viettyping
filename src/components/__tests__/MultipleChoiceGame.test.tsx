import { MultipleChoiceItem } from '@/types/lesson';
/* eslint-disable */
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import MultipleChoiceGame from '../MultipleChoiceGame';

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

describe('MultipleChoiceGame', () => {
  const mockConfig: MultipleChoiceItem = {
    id: 'mc-test-game',
    type: 'multiple_choice',
    items: [
      { question: 'Con gì kêu meo meo?', correct_answer: 'Mèo', distractors: ['Chó', 'Gà'] },
      { question: 'Quả gì màu đỏ?', correct_answer: 'Táo', distractors: ['Nho', 'Chuối'] }
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

  it('should render the question and choice buttons', () => {
    render(<MultipleChoiceGame gameConfig={mockConfig} onComplete={mockOnComplete} />);
    
    expect(screen.getByText('Con gì kêu meo meo?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mèo' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Chó' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Gà' })).toBeInTheDocument();
  });

  it('should handle correct answers and complete the game with a 100 score', () => {
    render(<MultipleChoiceGame gameConfig={mockConfig} onComplete={mockOnComplete} />);

    // Question 1: correct 'Mèo'
    const btnMeo = screen.getByRole('button', { name: 'Mèo' });
    fireEvent.click(btnMeo);

    // Fast-forward transition timeout (1.5 seconds)
    act(() => {
      jest.advanceTimersByTime(1500);
    });

    // Question 2: correct 'Táo'
    expect(screen.getByText('Quả gì màu đỏ?')).toBeInTheDocument();
    const btnTao = screen.getByRole('button', { name: 'Táo' });
    fireEvent.click(btnTao);

    act(() => {
      jest.advanceTimersByTime(1500);
    });

    expect(mockOnComplete).toHaveBeenCalledTimes(1);
    const telemetry = mockOnComplete.mock.calls[0][0];
    expect(telemetry.score).toBe(100);
    expect(telemetry.durationSeconds).toBeGreaterThanOrEqual(0);
    expect(telemetry.errors).toBeUndefined();
  });

  it('should track errors and lower score when incorrect choices are selected', () => {
    render(<MultipleChoiceGame gameConfig={mockConfig} onComplete={mockOnComplete} />);

    // Click wrong answer 'Chó' for Q1
    const btnCho = screen.getByRole('button', { name: 'Chó' });
    fireEvent.click(btnCho);

    expect(mockOnComplete).not.toHaveBeenCalled();

    // Fast-forward error feedback (1 second)
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Click correct answer 'Mèo'
    const btnMeo = screen.getByRole('button', { name: 'Mèo' });
    fireEvent.click(btnMeo);

    act(() => {
      jest.advanceTimersByTime(1500);
    });

    // Question 2: 'Táo'. Answer correctly.
    const btnTao = screen.getByRole('button', { name: 'Táo' });
    fireEvent.click(btnTao);

    act(() => {
      jest.advanceTimersByTime(1500);
    });

    expect(mockOnComplete).toHaveBeenCalledTimes(1);
    const telemetry = mockOnComplete.mock.calls[0][0];
    expect(telemetry.score).toBe(50);
    expect(telemetry.errors).toBeDefined();
    expect(telemetry.errors).toHaveLength(1);
    expect(telemetry.errors[0]).toEqual({
      questionId: 'mc-test-game_q0',
      userAnswer: 'Chó',
      correctAnswer: 'Mèo'
    });
  });
});
