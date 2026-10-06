import { parseQuestionCsv } from '../csv';
describe('Teacher CSV import', () => {
  it('parses Excel UTF8 CSV with quoted commas, newlines and escapes', () => {
    const qs = parseQuestionCsv('\uFEFFQuestion,A,B,C,D,Correct,Explanation\r\n"A cat, or a dog?",Cat,Dog,,,A,"This is a ""cat"".\nLook carefully."');
    expect(qs[0]).toMatchObject({ prompt: 'A cat, or a dog?', options: ['Cat', 'Dog'], acceptedAnswers: ['Cat'], explanation: 'This is a "cat".\nLook carefully.' });
  });
  it('rejects incorrect answers, oversized files and invalid headers', () => {
    expect(() => parseQuestionCsv('Question,A,B,Correct\nQ,cat,dog,Z')).toThrow();
    expect(() => parseQuestionCsv('wrong,headers\na,b')).toThrow();
    expect(() => parseQuestionCsv('x'.repeat(500001))).toThrow();
  });
});
