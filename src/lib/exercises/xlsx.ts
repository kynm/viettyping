import ExcelJS from 'exceljs';
import { parseQuestionCsv } from './csv';
/** Bound ZIP expansion before handing the workbook to the XLSX parser. */
export function validateWorkbookZip(bytes: Buffer) {
  if (bytes.length < 22 || bytes.length > 2_000_000 || bytes.readUInt32LE(0) !== 0x04034b50) throw new Error('Tệp XLSX không hợp lệ hoặc quá 2MB.');
  let end = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) if (bytes.readUInt32LE(i) === 0x06054b50) { end = i; break; }
  if (end < 0 || bytes.readUInt16LE(end + 4) || bytes.readUInt16LE(end + 6)) throw new Error('ZIP không hợp lệ.');
  const count = bytes.readUInt16LE(end + 10), start = bytes.readUInt32LE(end + 16);
  if (count > 500 || !count) throw new Error('Workbook có quá nhiều thành phần.');
  let cursor = start, expanded = 0;
  for (let i = 0; i < count; i++) {
    if (cursor + 46 > end || bytes.readUInt32LE(cursor) !== 0x02014b50 || bytes.readUInt16LE(cursor + 8) & 1) throw new Error('ZIP không hợp lệ hoặc được mã hóa.');
    expanded += bytes.readUInt32LE(cursor + 24);
    if (expanded > 10_000_000) throw new Error('Workbook giải nén vượt quá 10MB.');
    cursor += 46 + bytes.readUInt16LE(cursor + 28) + bytes.readUInt16LE(cursor + 30) + bytes.readUInt16LE(cursor + 32);
  }
}
export async function parseQuestionWorkbook(bytes: Buffer) {
  validateWorkbookZip(bytes);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(bytes as unknown as ExcelJS.Buffer);
  const sheet = workbook.worksheets[0];
  if (!sheet || sheet.rowCount < 2 || sheet.rowCount > 101 || sheet.columnCount > 20) throw new Error('Sheet đầu tiên cần 1–100 câu hỏi và tối đa 20 cột.');
  const rows: string[] = [];
  for (let r = 1; r <= sheet.rowCount; r++) {
    const row: string[] = [];
    for (let c = 1; c <= sheet.columnCount; c++) {
      const cell = sheet.getCell(r, c);
      if (cell.type === ExcelJS.ValueType.Formula) throw new Error('Import không chấp nhận công thức. Hãy chuyển sang giá trị văn bản.');
      if (cell.text.length > 10000) throw new Error('Nội dung ô quá dài.');
      row.push(`"${cell.text.replace(/"/g, '""')}"`);
    }
    rows.push(row.join(','));
  }
  return parseQuestionCsv(rows.join('\n'));
}
