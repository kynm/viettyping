import { SpinWheelItem } from '@/types/lesson';
/* eslint-disable */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SpinWheelGame from '../SpinWheelGame';

// Mock framer-motion
jest.mock('framer-motion', () => {
  const React = require('react');
  return {
    motion: {
      div: React.forwardRef(({ children, ...props }: any, ref: any) => {
        const { initial, animate, exit, transition, whileHover, whileTap, onAnimationComplete, ...rest } = props;
        return (
          <div 
            ref={ref} 
            {...rest}
            data-testid={props['data-testid'] || 'motion-div'}
            onClick={() => {
              if (onAnimationComplete) {
                onAnimationComplete();
              }
            }}
          >
            {children}
          </div>
        );
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
  load: jest.fn(),
  pause: jest.fn(),
}));

// Mock useStudent
jest.mock("@/contexts/StudentContext", () => ({
  useStudent: () => ({
    studentInfo: null,
  }),
}));

// Mock useSound
jest.mock('@/contexts/SoundContext', () => ({
  useSound: () => ({
    isMuted: false,
    toggleMute: jest.fn(),
    playSound: jest.fn(),
  }),
}));

describe('SpinWheelGame', () => {
  const mockConfig: SpinWheelItem = {
    id: 'spin-test-game',
    type: 'spin_wheel_items',
    items: ['ba', 'bò', 'ca']
  };

  const mockOnComplete = jest.fn();
  let originalRandom: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    originalRandom = Math.random;
  });

  afterEach(() => {
    jest.useRealTimers();
    Math.random = originalRandom;
  });

  it('should render the wheel and spin button', () => {
    render(<SpinWheelGame gameConfig={mockConfig} onComplete={mockOnComplete} />);
    
    expect(screen.getByRole('button', { name: /Quay Ngay!/i })).toBeInTheDocument();
    expect(screen.getByText('ba')).toBeInTheDocument();
    expect(screen.getByText('bò')).toBeInTheDocument();
    expect(screen.getByText('ca')).toBeInTheDocument();
  });

  it('should spin, select winner, show popup, and trigger onComplete', async () => {
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

    render(<SpinWheelGame gameConfig={mockConfig} onComplete={mockOnComplete} />);
    
    const spinBtn = screen.getByRole('button', { name: /Quay Ngay!/i });
    fireEvent.click(spinBtn);

    expect(spinBtn).toBeDisabled();
    expect(screen.getByText('Đang quay...')).toBeInTheDocument();

    const wheel = screen.getAllByTestId('motion-div')[0];
    fireEvent.click(wheel);

    // After animation complete, popup should appear
    expect(screen.getByText('Bé quay được chữ:')).toBeInTheDocument();
    
    // One of the items should be in the popup
    const textElements = screen.getAllByText(/ba|bò|ca/);
    expect(textElements.length).toBeGreaterThan(0);

    // Click "Tiếp tục" in the popup
    const continueBtn = screen.getByRole('button', { name: /Tiếp tục/i });
    fireEvent.click(continueBtn);

    expect(mockOnComplete).toHaveBeenCalledTimes(1);
    const telemetry = mockOnComplete.mock.calls[0][0];
    expect(telemetry.score).toBe(100);
    expect(telemetry.durationSeconds).toBeGreaterThanOrEqual(0);
  });

  it('should display flashcard image when winner matches a flashcard', async () => {
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

    // Mock Math.random to return 0, which selects the first item 'ba'
    Math.random = () => 0;

    const mockFlashcards = [
      {
        word: 'ba',
        word_uppercase: 'BA',
        spelling_guide: 'bờ-a-ba',
        example_sentence: 'Ba đưa bé đi chơi.',
        image_prompt: 'father and kid',
        image_url: 'https://example.com/ba.png'
      }
    ];

    render(
      <SpinWheelGame 
        gameConfig={mockConfig} 
        onComplete={mockOnComplete} 
        flashcards={mockFlashcards}
      />
    );
    
    const spinBtn = screen.getByRole('button', { name: /Quay Ngay!/i });
    fireEvent.click(spinBtn);

    const wheel = screen.getAllByTestId('motion-div')[0];
    fireEvent.click(wheel);

    // Winner is 'ba'
    expect(screen.getByText('Bé quay được chữ:')).toBeInTheDocument();
    
    // The image should be rendered
    const img = screen.getByAltText('ba');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/ba.png');
  });
});
