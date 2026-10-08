'use client';
import { ReactNode } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
export default function SortableQuestion({ id, children }: { id: string; children: ReactNode }) {
  const { setNodeRef, transform, transition, attributes, listeners } = useSortable({ id });
  return <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className="min-w-0 grid gap-2"><button {...attributes} {...listeners} style={{ touchAction: 'none' }} className="min-h-12 rounded-xl border-2 bg-sky-50 px-4 text-left font-semibold" aria-label={`Đổi vị trí câu ${id}`}>⠿ Kéo để đổi vị trí câu hỏi</button>{children}</div>;
}
