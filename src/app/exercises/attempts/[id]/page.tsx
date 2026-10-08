import ExercisePlayer from '@/components/exercise/ExercisePlayer';
export default async function Page({ params }: { params: Promise<{ id: string }> }) { return <main className="mx-auto max-w-3xl px-4 py-8"><ExercisePlayer initialAttemptId={Number((await params).id)} /></main>; }
