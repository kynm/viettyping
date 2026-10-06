import { ReactNode, useState } from 'react';
import { act, render, screen } from '@testing-library/react';
import TokenQuestion from '../TokenQuestion';
type DragEvent = { active: { id: string }; over: { id: string } };
let mockDragEnd: (event: DragEvent) => void;
jest.mock('@dnd-kit/core', () => ({
  ...jest.requireActual('@dnd-kit/core'),
  DndContext: ({ children, onDragEnd }: { children: ReactNode; onDragEnd: typeof mockDragEnd }) => { mockDragEnd = onDragEnd; return <div>{children}</div>; },
  KeyboardSensor: jest.fn(), PointerSensor: jest.fn(), useSensor: jest.fn(), useSensors: jest.fn(), closestCenter: jest.fn(),
}));
jest.mock('@dnd-kit/sortable', () => {
  const original = jest.requireActual('@dnd-kit/sortable');
  return { ...original, SortableContext: ({ children }: { children: ReactNode }) => <div>{children}</div>, useSortable: ({ id }: { id: string }) => ({ attributes: { 'data-token-id': id }, listeners: {}, setNodeRef: jest.fn(), transform: null, transition: undefined }) };
});
function Harness({ tokens }: { tokens: string[] }) {
  const [answer, setAnswer] = useState<string[]>([]);
  return <TokenQuestion tokens={tokens} value={answer} onChange={setAnswer} />;
}
describe('Stable token identity', () => {
  it('keeps the same DOM node and identity when a word moves', () => {
    render(<Harness tokens={['c', 't', 'a']} />);
    const a = screen.getByRole('button', { name: 'a' }), t = screen.getByRole('button', { name: 't' });
    const id = a.getAttribute('data-token-id')!;
    act(() => mockDragEnd({ active: { id }, over: { id: t.getAttribute('data-token-id')! } }));
    expect(screen.getByRole('button', { name: 'a' })).toBe(a);
    expect(a.getAttribute('data-token-id')).toBe(id);
    expect([...document.querySelectorAll('[data-token-id]')].map(el => el.textContent)).toEqual(['c', 'a', 't']);
  });
  it('preserves distinct identities when identical letters swap', () => {
    render(<Harness tokens={['o', 'o', 'd']} />);
    const letters = screen.getAllByRole('button', { name: 'o' });
    const first = letters[0].getAttribute('data-token-id')!, second = letters[1].getAttribute('data-token-id')!;
    expect(first).not.toBe(second);
    act(() => mockDragEnd({ active: { id: first }, over: { id: second } }));
    expect([...document.querySelectorAll('[data-token-id]')].map(el => el.getAttribute('data-token-id'))).toEqual([second, first, 'token-2']);
  });
});
