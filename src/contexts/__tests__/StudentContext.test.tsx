import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { useAuth } from '@/contexts/AuthContext';
import { StudentProvider, useStudent } from '../StudentContext';

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

function TestConsumer() {
  const { studentInfo, isLoaded, updateStudentInfo } = useStudent();

  return (
    <div>
      <span data-testid="loaded">{String(isLoaded)}</span>
      <span data-testid="nickname">{studentInfo?.nickname ?? ''}</span>
      <button
        onClick={() => updateStudentInfo({
          name: 'Nguyen Van An',
          nickname: 'An',
          grade: 'Lop 1',
          avatar: 'A',
          theme: 'turtle',
        })}
      >
        Update profile
      </button>
    </div>
  );
}

describe('StudentContext guest mode', () => {
  beforeEach(() => {
    localStorage.clear();
    mockedUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      refreshUser: jest.fn(),
      logout: jest.fn(),
    });
    global.fetch = jest.fn();
  });

  it('loads the student profile from localStorage without an account', async () => {
    localStorage.setItem('viettyping_student_profile', JSON.stringify({
      name: 'Nguyen Van An',
      nickname: 'An',
      grade: 'Lop 1',
      avatar: 'A',
      theme: 'turtle',
    }));

    render(<StudentProvider><TestConsumer /></StudentProvider>);

    await waitFor(() => expect(screen.getByTestId('loaded')).toHaveTextContent('true'));
    expect(screen.getByTestId('nickname')).toHaveTextContent('An');
    expect(document.documentElement).toHaveAttribute('data-theme', 'turtle');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('saves guest profile changes locally without calling the profile API', async () => {
    render(<StudentProvider><TestConsumer /></StudentProvider>);
    await waitFor(() => expect(screen.getByTestId('loaded')).toHaveTextContent('true'));

    act(() => screen.getByText('Update profile').click());

    expect(JSON.parse(localStorage.getItem('viettyping_student_profile') ?? '{}')).toMatchObject({
      nickname: 'An',
      theme: 'turtle',
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
