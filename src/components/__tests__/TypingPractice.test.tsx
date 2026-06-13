/* eslint-disable */
import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import TypingPractice from '../TypingPractice';

jest.mock('framer-motion', () => {
  const React = require('react');
  return {
    motion: {
      div: React.forwardRef(({ children, ...props }: any, ref: any) => {
        const { initial, animate, exit, transition, ...rest } = props;
        return <div ref={ref} {...rest}>{children}</div>;
      }),
      span: React.forwardRef(({ children, ...props }: any, ref: any) => {
        const { initial, animate, exit, transition, ...rest } = props;
        return <span ref={ref} {...rest}>{children}</span>;
      }),
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
  };
});

jest.mock('canvas-confetti', () => jest.fn());
jest.mock('../VirtualKeyboard', () => () => <div data-testid="virtual-keyboard" />);
jest.mock('@/hooks/useTypingSound', () => ({
  useTypingSound: () => ({
    playCorrectSound: jest.fn(),
    playWrongSound: jest.fn(),
  }),
}));

describe('TypingPractice', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('keeps the latest typing accuracy when time expires', () => {
    const onComplete = jest.fn();

    render(
      <TypingPractice
        task={{
          content: 'ab',
          type: 'word',
          description: 'Test',
          time_limit_seconds: 1,
        }}
        onComplete={onComplete}
      />
    );

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'a' } });

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    fireEvent.click(screen.getByRole('button', { name: /Ti.p t.c h.c/i }));

    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        score: 100,
        metadata: expect.objectContaining({
          accuracy: 100,
          incorrectCount: 0,
        }),
      })
    );
  });
});
