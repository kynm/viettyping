import { TrueFalseItem } from '@/types/lesson';
/* eslint-disable */
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import TrueFalseGame from '../TrueFalseGame';

// Mock framer-motion
jest.mock('framer-motion', () => {
  const React = require('react');
  return {
    motion: {
      div: React.forwardRef(({ children, ...props }: any, ref: any) => {
        // Remove motion props to prevent react warning
        const { initial, animate, exit, transition, whileHover, whileTap, ...rest } = props;
        return <div ref={ref} {...rest}>{children}</div>;
      }),
      img: React.forwardRef(({ ...props }: any, ref: any) => {
        const { initial, animate, exit, transition, ...rest } = props;
        return <img ref={ref} {...rest} />;
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


describe('TrueFalseGame', () => {
  const mockConfig: TrueFalseItem = {
    id: 'tf-test-game',
    type: 'true_false_game',
    items: [
      { correct_word: 'Cá', distractor_word: 'Chó', image_prompt: '/assets/fish.png' },
      { correct_word: 'Táo', distractor_word: 'Lê', image_prompt: '/assets/apple.png' }
    ]
  };

  const mockOnComplete = jest.fn();

  const originalRandom = Math.random;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    Math.random = originalRandom;
    jest.useRealTimers();
  });

  it('should render game and display image with word correctly', () => {
    // Force Math.random to return > 0.5 to show the correct word
    Math.random = () => 0.9;

    render(<TrueFalseGame gameConfig={mockConfig} onComplete={mockOnComplete} />);

    // Check that image is displayed
    const img = screen.getByAltText('Game image');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/assets/fish.png');

    // Check displayed word is the correct word
    expect(screen.getByText('Cá')).toBeInTheDocument();
    
    // Check buttons are present
    expect(screen.getByRole('button', { name: /Đúng/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sai/i })).toBeInTheDocument();
  });

  it('should process correct answers and call onComplete with 100 score', async () => {
    // Force Math.random to return > 0.5 to show correct words
    Math.random = () => 0.9;

    render(<TrueFalseGame gameConfig={mockConfig} onComplete={mockOnComplete} />);

    // Câu 1: Hiển thị "Cá" (là correct word). Người chơi click "Đúng" -> Chính xác!
    const dungBtn = screen.getByRole('button', { name: /Đúng/i });
    fireEvent.click(dungBtn);

    // Fast forward for the 1.5s timeout to transition to next item
    act(() => {
      jest.advanceTimersByTime(1500);
    });

    // Câu 2: Hiển thị "Táo" (là correct word). Người chơi click "Đúng" -> Chính xác!
    expect(screen.getByText('Táo')).toBeInTheDocument();
    fireEvent.click(dungBtn);

    act(() => {
      jest.advanceTimersByTime(1500);
    });

    // Game completed, onComplete should be called
    expect(mockOnComplete).toHaveBeenCalledTimes(1);
    const telemetry = mockOnComplete.mock.calls[0][0];
    
    expect(telemetry.score).toBe(100);
    expect(telemetry.durationSeconds).toBeGreaterThanOrEqual(0);
    expect(telemetry.errors).toBeUndefined(); // No errors
  });

  it('should track errors and call onComplete with lower score when wrong answers are chosen', () => {
    // Force Math.random to return > 0.5 to show correct words
    Math.random = () => 0.9;

    render(<TrueFalseGame gameConfig={mockConfig} onComplete={mockOnComplete} />);

    // Câu 1: Hiển thị "Cá" (là correct word). Người chơi click "Sai" -> Chọn Sai!
    const saiBtn = screen.getByRole('button', { name: /Sai/i });
    fireEvent.click(saiBtn);

    // Should show error feedback and not transition immediately
    expect(mockOnComplete).not.toHaveBeenCalled();

    // Fast forward 1s to clear error shake animation
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Người chơi chọn lại, click "Đúng" -> Đúng
    const dungBtn = screen.getByRole('button', { name: /Đúng/i });
    fireEvent.click(dungBtn);

    // Fast forward 1.5s to transition to next item
    act(() => {
      jest.advanceTimersByTime(1500);
    });

    // Câu 2: Hiển thị "Táo". Người chơi click "Đúng" -> Đúng
    expect(screen.getByText('Táo')).toBeInTheDocument();
    fireEvent.click(dungBtn);

    act(() => {
      jest.advanceTimersByTime(1500);
    });

    // Game completed
    expect(mockOnComplete).toHaveBeenCalledTimes(1);
    const telemetry = mockOnComplete.mock.calls[0][0];
    
    // 1 out of 2 questions was wrong on first attempt -> score 50
    expect(telemetry.score).toBe(50);
    expect(telemetry.errors).toBeDefined();
    expect(telemetry.errors).toHaveLength(1);
    expect(telemetry.errors[0]).toEqual({
      questionId: 'tf-test-game_q0',
      userAnswer: 'Sai',
      correctAnswer: 'Đúng'
    });
  });
});
