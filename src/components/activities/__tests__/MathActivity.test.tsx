import { render, screen } from '@testing-library/react';
import { MathActivity } from '../MathActivity';
import { Activity } from '@/data/subjects';
jest.mock('@/hooks/useTypingSound', () => ({ useTypingSound: () => ({ playCorrectSound: jest.fn(), playWrongSound: jest.fn() }) }));
jest.mock('../QuizActivity', () => ({ QuizActivity: () => <div data-testid="quiz">Quiz</div> }));
describe('Existing math activity regression', () => {
  it('switches between quiz and vertical math without conditional hook ordering', () => {
    const activity: Activity = { id: 'math', type: 'math', title: 'Math', content: '', instructions: '', data: {} };
    const props = { activity, onComplete: jest.fn() };
    const view = render(<MathActivity {...props} />);
    expect(screen.getByTestId('quiz')).toBeInTheDocument();
    view.rerender(<MathActivity {...props} activity={{ ...activity, data: { subtype: 'vertical', operand1: 12, operand2: 3, operator: '+' } }} />);
    expect(screen.queryByTestId('quiz')).not.toBeInTheDocument();
    view.rerender(<MathActivity {...props} />);
    expect(screen.getByTestId('quiz')).toBeInTheDocument();
  });
});
