import { render, screen, fireEvent } from '@testing-library/react';
import QuestionRenderer from '../QuestionRenderer';
import { PublicQuestion } from '@/lib/exercises/contracts';
const q: PublicQuestion = { id: 'q1', type: 'multiple_choice', prompt: 'Choose an animal', score: 10, options: ['cat', 'table'], passage: '', image: '', audio: '', speechText: '', tokens: [], pairs: [], choices: [], ignorePunctuation: true };
describe('Question interaction', () => {
  it('offers accessible large choice buttons and stores selected value', () => {
    const change = jest.fn();
    render(<QuestionRenderer question={q} value="cat" onChange={change} />);
    expect(screen.getByRole('button', { name: /cat/ })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: /table/ }));
    expect(change).toHaveBeenCalledWith('table');
  });
  it('provides click alternative for touch drag-and-drop', () => {
    const change = jest.fn();
    render(<QuestionRenderer question={{ ...q, type: 'drag_drop' }} value="" onChange={change} />);
    fireEvent.click(screen.getByRole('button', { name: 'cat' }));
    expect(change).toHaveBeenCalledWith('cat');
  });
  it('collects matching pairs without exposing correct mapping', () => {
    const change = jest.fn();
    render(<QuestionRenderer question={{ ...q, type: 'matching', pairs: [{ id: '0', left: '🐈' }], choices: ['cat', 'table'] }} value={{}} onChange={change} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'cat' } });
    expect(change).toHaveBeenCalledWith({ '0': 'cat' });
  });
  it('saves text answers while typing', () => {
    const change = jest.fn();
    render(<QuestionRenderer question={{ ...q, type: 'fill_blank', options: [] }} value="" onChange={change} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'cat' } });
    expect(change).toHaveBeenCalledWith('cat');
  });
  it('supports a fill-blank dropdown when choices are provided', () => {
    const change = jest.fn();
    render(<QuestionRenderer question={{ ...q, type: 'fill_blank' }} value="" onChange={change} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'cat' } });
    expect(change).toHaveBeenCalledWith('cat');
  });
});
