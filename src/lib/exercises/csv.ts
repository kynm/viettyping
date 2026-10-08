import { Question } from './contracts';
/** RFC4180-style CSV reader, including quoted delimiters, escaped quotes and multiline cells. */
export function parseQuestionCsv(input: string): Question[] {
  if (input.length > 500000) throw new Error('CSV quá lớn.');
  const rows: string[][] = []; let row: string[] = [], cell = '', quoted = false;
  const source = input.replace(/^\uFEFF/, '');
  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    if (c === '"') { if (quoted && source[i + 1] === '"') { cell += '"'; i++; } else quoted = !quoted; }
    else if (c === ',' && !quoted) { row.push(cell); cell = ''; }
    else if ((c === '\n' || c === '\r') && !quoted) { if (c === '\r' && source[i + 1] === '\n') i++; row.push(cell); if (row.some(Boolean)) rows.push(row); row = []; cell = ''; }
    else cell += c;
  }
  if (quoted) throw new Error('CSV có dấu ngoặc kép chưa đóng.');
  row.push(cell); if (row.some(Boolean)) rows.push(row);
  if (rows.length < 2 || rows.length > 101) throw new Error('CSV cần 1–100 câu hỏi.');
  const header = rows.shift()!.map(h => h.trim().toLowerCase());
  if (!['question', 'a', 'b', 'correct'].every(h => header.includes(h))) throw new Error('Cần các cột Question,A,B,C,D,Correct,Explanation.');
  return rows.map((r, i) => {
    const get = (h: string) => (r[header.indexOf(h)] ?? '').trim();
    const options = ['a', 'b', 'c', 'd'].map(get).filter(Boolean), correct = get('correct');
    const answer = /^[a-d]$/i.test(correct) ? get(correct.toLowerCase()) : correct;
    if (!get('question') || options.length < 2 || !answer || !options.includes(answer)) throw new Error(`Dòng ${i + 2}: câu hỏi hoặc đáp án không hợp lệ.`);
    return { id: `csv_${crypto.randomUUID()}`, type: 'multiple_choice', prompt: get('question'), score: 10, options, acceptedAnswers: [answer], explanation: get('explanation'), passage: '', image: '', audio: '', speechText: '', tokens: [], pairs: [], ignorePunctuation: true };
  });
}
