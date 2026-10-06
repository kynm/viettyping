import { authorize, endpoint, HttpError } from '@/lib/exercises/server';
import { parseQuestionWorkbook } from '@/lib/exercises/xlsx';
export async function POST(request: Request) {
  return endpoint(async () => {
    await authorize(request, true);
    if (Number(request.headers.get('content-length')) > 2_100_000) throw new HttpError(413, 'XLSX tối đa 2MB.');
    const form = await request.formData(), file = form.get('file');
    if (!(file instanceof File) || !file.name.toLowerCase().endsWith('.xlsx') || file.size > 2000000) throw new HttpError(400, 'Chọn XLSX dưới 2MB.');
    try { return { questions: await parseQuestionWorkbook(Buffer.from(await file.arrayBuffer())) }; }
    catch (e) { throw new HttpError(400, (e as Error).message); }
  });
}
