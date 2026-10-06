import { Question } from './contracts';
type Entry = NonNullable<Question['puzzle']>['entries'][number];
export function wordAtPath(grid: string[][], path: string) {
  const parts = path.split(';');
  if (parts.length < 2 || parts.length > 15 || parts.some(p => !/^\d+,\d+$/.test(p))) return '';
  const points = parts.map(p => p.split(',').map(Number));
  const dr = points[1][0] - points[0][0], dc = points[1][1] - points[0][1];
  if (Math.abs(dr) > 1 || Math.abs(dc) > 1 || (!dr && !dc)) return '';
  if (points.some(([r, c], i) => r !== points[0][0] + dr * i || c !== points[0][1] + dc * i || !grid[r]?.[c])) return '';
  return points.map(([r, c]) => grid[r][c]).join('');
}
export function generateWordSearch(words: string[], random = Math.random) {
  const size = Math.max(10, Math.max(...words.map(w => w.length))), grid: string[][] = Array.from({ length: size }, () => Array(size).fill(''));
  const entries: Entry[] = [];
  for (const word of words) {
    let placed = false;
    for (let attempt = 0; attempt < 1000 && !placed; attempt++) {
      const d = Math.floor(random() * 3), dr = d === 0 ? 0 : 1, dc = d === 1 ? 0 : 1;
      const row = Math.floor(random() * (size - dr * (word.length - 1))), col = Math.floor(random() * (size - dc * (word.length - 1)));
      if ([...word].every((c, i) => !grid[row + dr * i][col + dc * i] || grid[row + dr * i][col + dc * i] === c)) {
        [...word].forEach((c, i) => { grid[row + dr * i][col + dc * i] = c; });
        entries.push({ word, clue: word, row, col, direction: d === 0 ? 'across' : d === 1 ? 'down' : 'diagonal' }); placed = true;
      }
    }
    if (!placed) {
      // Dense random placements can trap later words; bounded inputs always fit row-wise.
      const fallback = Array.from({ length: size }, () => Array.from({ length: size }, () => String.fromCharCode(65 + Math.floor(random() * 26))));
      const fallbackEntries: Entry[] = words.map((word, row) => { [...word].forEach((c, col) => { fallback[row][col] = c; }); return { word, clue: word, row, col: 0, direction: 'across' }; });
      return { grid: fallback, entries: fallbackEntries };
    }
  }
  for (const row of grid) for (let i = 0; i < row.length; i++) if (!row[i]) row[i] = String.fromCharCode(65 + Math.floor(random() * 26));
  return { grid, entries };
}
export function generateCrossword(pairs: { left: string; right: string }[]) {
  const size = 31, grid: string[][] = Array.from({ length: size }, () => Array(size).fill(''));
  const entries: Entry[] = [];
  const items = pairs.map(p => ({ word: p.right.toUpperCase(), clue: p.left })).sort((a, b) => b.word.length - a.word.length);
  function place(word: string, clue: string, row: number, col: number, direction: 'across' | 'down', intersect: boolean) {
    const dr = direction === 'down' ? 1 : 0, dc = direction === 'across' ? 1 : 0;
    if (row < 0 || col < 0 || row + dr * word.length >= size || col + dc * word.length >= size) return false;
    if ((grid[row - dr]?.[col - dc] || '') || (grid[row + dr * word.length]?.[col + dc * word.length] || '')) return false;
    let crosses = 0;
    for (let i = 0; i < word.length; i++) {
      const r = row + dr * i, c = col + dc * i;
      if (grid[r][c]) { if (grid[r][c] !== word[i]) return false; crosses++; }
      else if (direction === 'across' ? (grid[r - 1]?.[c] || grid[r + 1]?.[c]) : (grid[r]?.[c - 1] || grid[r]?.[c + 1])) return false;
    }
    if (intersect && !crosses) return false;
    [...word].forEach((c, i) => { grid[row + dr * i][col + dc * i] = c; });
    entries.push({ word, clue, row, col, direction }); return true;
  }
  for (const item of items) {
    let placed = false;
    if (!entries.length) placed = place(item.word, item.clue, 15, 8, 'across', false);
    else for (let r = 0; r < size && !placed; r++) for (let c = 0; c < size && !placed; c++) for (let i = 0; i < item.word.length && !placed; i++) if (grid[r][c] === item.word[i]) {
      for (const direction of ['across', 'down'] as const) if (place(item.word, item.clue, direction === 'down' ? r - i : r, direction === 'across' ? c - i : c, direction, true)) { placed = true; break; }
    }
    if (!placed) {
      for (let r = 0; r < size && !placed; r++) for (let c = 0; c < size && !placed; c++) placed = place(item.word, item.clue, r, c, 'across', false);
    }
    if (!placed) throw new Error('Không đủ chỗ cho ô chữ. Giảm số từ.');
  }
  const occupied = grid.flatMap((row, r) => row.flatMap((c, col) => c ? [{ r, col }] : []));
  const minR = Math.min(...occupied.map(p => p.r)), minC = Math.min(...occupied.map(p => p.col)), maxR = Math.max(...occupied.map(p => p.r)), maxC = Math.max(...occupied.map(p => p.col));
  return { grid: grid.slice(minR, maxR + 1).map(row => row.slice(minC, maxC + 1)), entries: entries.map(e => ({ ...e, row: e.row - minR, col: e.col - minC })) };
}
