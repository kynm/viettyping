import { ButtonHTMLAttributes, InputHTMLAttributes } from 'react';
export const fieldClass = 'w-full min-w-0 max-w-full min-h-12 rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-slate-900 focus:outline-none focus:ring-4 focus:ring-sky-200';
export function ExerciseButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={`min-h-12 min-w-0 max-w-full break-words rounded-xl border-2 border-slate-800 bg-sky-100 px-5 py-3 font-bold text-slate-900 transition hover:bg-sky-200 focus-visible:outline-4 focus-visible:outline-sky-500 disabled:opacity-50 ${props.className ?? ''}`} />;
}
export function ExerciseInput({ label, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return <label className="min-w-0 grid gap-2 font-semibold">{label}<input {...props} className={fieldClass} /></label>;
}
