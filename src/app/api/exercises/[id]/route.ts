import { prisma } from '@/lib/prisma';
import { authorize, endpoint, jsonBody, HttpError, asJson, numberId } from '@/lib/exercises/server';
import { validateExercise } from '@/lib/exercises/engine';
import { validateQuestionMedia } from '@/lib/exercises/media';
type Context = { params: Promise<{ id: string }> };
export async function GET(request: Request, context: Context) {
  return endpoint(async () => {
    const user = await authorize(request, true);
    const exercise = await prisma.exercise.findFirst({ where: { id: numberId((await context.params).id), createdBy: user.id } });
    if (!exercise) throw new HttpError(404, 'Không tìm thấy bài tập.');
    return exercise;
  });
}
export async function PUT(request: Request, context: Context) {
  return endpoint(async () => {
    const user = await authorize(request, true), id = numberId((await context.params).id);
    const body = await jsonBody(request);
    let data;
    try { data = validateExercise(body); } catch (e) { throw new HttpError(400, (e as Error).message); }
    await validateQuestionMedia(data.questions, user.id);
    const updated = await prisma.exercise.updateMany({ where: { id, createdBy: user.id, version: Number(body.version) }, data: { ...data, questions: asJson(data.questions), version: { increment: 1 } } });
    if (!updated.count) throw new HttpError(409, 'Bài đã thay đổi hoặc bạn không có quyền. Tải lại trước khi lưu.');
    return { id, version: Number(body.version) + 1 };
  });
}
export async function DELETE(request: Request, context: Context) {
  return endpoint(async () => {
    const user = await authorize(request, true);
    const result = await prisma.exercise.updateMany({ where: { id: numberId((await context.params).id), createdBy: user.id }, data: { status: 'archived', version: { increment: 1 } } });
    if (!result.count) throw new HttpError(404, 'Không tìm thấy bài tập.');
    return { ok: true };
  });
}
