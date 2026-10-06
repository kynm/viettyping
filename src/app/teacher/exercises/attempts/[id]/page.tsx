import TeacherReview from '@/components/exercise/TeacherReview';
export default async function Page({ params }: { params: Promise<{ id: string }> }) { return <TeacherReview id={Number((await params).id)} />; }
