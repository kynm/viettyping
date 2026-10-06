'use client';
import { DndContext, useDraggable, useDroppable, PointerSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
function Word({ id, selected, onClick }: { id: string; selected: boolean; onClick: () => void }) {
  const { setNodeRef, attributes, listeners, transform } = useDraggable({ id });
  return <button ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform), touchAction: 'none' }} {...attributes} {...listeners} aria-pressed={selected} onClick={onClick} className="min-h-12 rounded-xl border-2 border-slate-800 bg-sky-100 px-5 py-3 font-bold">{id}</button>;
}
function Slot({ value }: { value: string }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'answer-slot' });
  return <div ref={setNodeRef} className={`min-h-20 rounded-2xl border-2 border-dashed p-5 text-center text-2xl font-bold ${isOver ? 'bg-sky-200' : 'bg-sky-50'}`}>{value || 'Kéo một từ vào đây'}</div>;
}
export default function DragDropQuestion({ options, value, onChange }: { options: string[]; value: string; onChange: (value: string) => void }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor));
  return <DndContext sensors={sensors} onDragEnd={({ active, over }) => { if (over?.id === 'answer-slot') onChange(String(active.id)); }}><div className="min-w-0 grid gap-5"><Slot value={value} /><p>Có thể bấm vào từ để chọn, hoặc kéo vào ô.</p><div className="flex flex-wrap gap-3">{options.map(o => <Word key={o} id={o} selected={value === o} onClick={() => onChange(o)} />)}</div></div></DndContext>;
}
