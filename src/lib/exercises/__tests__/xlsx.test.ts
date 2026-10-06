/** @jest-environment node */
import ExcelJS from 'exceljs';
import { parseQuestionWorkbook, validateWorkbookZip } from '../xlsx';
describe('XLSX teacher import', () => {
  it('reads the first sheet and returns previewable questions', async () => {
    const workbook = new ExcelJS.Workbook(), sheet = workbook.addWorksheet('Questions');
    sheet.addRow(['Question', 'A', 'B', 'C', 'D', 'Correct', 'Explanation']);
    sheet.addRow(['What is this?', 'Cat', 'Dog', '', '', 'A', 'An animal']);
    const data = await workbook.xlsx.writeBuffer();
    const questions = await parseQuestionWorkbook(Buffer.from(data));
    expect(questions[0]).toMatchObject({ prompt: 'What is this?', acceptedAnswers: ['Cat'], explanation: 'An animal' });
  });
  it('rejects arbitrary ZIP bytes, excessive input and formula cells', async () => {
    expect(() => validateWorkbookZip(Buffer.from('bad'))).toThrow();
    expect(() => validateWorkbookZip(Buffer.alloc(2000001))).toThrow();
    const workbook = new ExcelJS.Workbook(), sheet = workbook.addWorksheet('Questions');
    sheet.addRow(['Question', 'A', 'B', 'Correct']); sheet.addRow(['Q', { formula: '1+1', result: 2 }, 'B', 'A']);
    await expect(parseQuestionWorkbook(Buffer.from(await workbook.xlsx.writeBuffer()))).rejects.toThrow(/công thức/);
  });
});
