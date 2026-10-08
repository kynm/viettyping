'use client';
import { DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ExerciseButton } from './controls';
import { useCallback, useEffect, useState } from 'react';
function Tile({ id, text }: { id: string; text: string }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  return <button ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, touchAction: 'none' }} {...attributes} {...listeners} className="min-h-14 rounded-xl border-2 border-slate-800 bg-amber-100 px-5 py-3 text-xl font-bold">{text}</button>;
}
export default function TokenQuestion({ tokens, value, onChange }: { tokens: string[]; value: string[]; onChange: (value: string[]) => void }) {
  const incoming = JSON.stringify(value.length === tokens.length ? value : tokens);
  const makeItems = useCallback((words: string[]) => {
    const used = new Set<number>();
    return words.map((text, position) => {
      const original = tokens.findIndex((token, i) => token === text && !used.has(i));
      if (original >= 0) used.add(original);
      return { id: original >= 0 ? `token-${original}` : `external-${position}`, text };
    });
  }, [tokens]);
  const [items, setItems] = useState(() => makeItems(JSON.parse(incoming)));
  useEffect(() => {
    setItems(previous => JSON.stringify(previous.map(item => item.text)) === incoming ? previous : makeItems(JSON.parse(incoming)));
  }, [incoming, makeItems]);
  const ids = items.map(item => item.id);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  return <div className="min-w-0 grid gap-5"><p>Kéo các mảnh để đổi thứ tự. Bàn phím: Space, phím mũi tên, Space.</p><DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={({ active, over }) => { if (over && active.id !== over.id) { const next = arrayMove(items, ids.indexOf(String(active.id)), ids.indexOf(String(over.id))); setItems(next); onChange(next.map(item => item.text)); }; }}><SortableContext items={ids} strategy={rectSortingStrategy}><div className="flex flex-wrap gap-3">{items.map(item => <Tile key={item.id} id={item.id} text={item.text} />)}</div></SortableContext></DndContext><ExerciseButton onClick={() => onChange(items.map(item => item.text))}>Lưu thứ tự này</ExerciseButton></div>;
}

