const assert = require('node:assert/strict');
const { randomBytes, createHash } = require('node:crypto');
const { PrismaClient } = require('@prisma/client');
const { demos } = require('./exercise-demo-data.cjs');
const { mkdir } = require('node:fs/promises');
const path = require('node:path');
const db = new PrismaClient(), users = [];
const base = process.env.EXERCISE_TEST_URL || 'http://localhost:3002';
let browser;
async function user(role) {
  const password = randomBytes(24).toString('base64');
  const u = await db.user.create({ data: { username: `ex_ui_${randomBytes(6).toString('hex')}`, role, passwordHash: await require('bcryptjs').hash(password, 12), profile: { create: { name: 'QA', nickname: 'QA', grade: 'Lớp 3' } } } });
  users.push(u.id); const token = randomBytes(32).toString('hex');
  await db.session.create({ data: { userId: u.id, tokenHash: createHash('sha256').update(token).digest('hex'), expiresAt: new Date(Date.now() + 600000) } });
  return { ...u, token, password };
}
async function main() {
  const playwright = require(process.env.EXERCISE_PLAYWRIGHT_MODULE || 'playwright');
  browser = await playwright.chromium.launch({ channel: 'msedge', headless: true, args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
  const teacher = await user('TEACHER'), student = await user('STUDENT');
  const exercise = await db.exercise.create({ data: { ...demos[3], title: `QA English adventure ${teacher.id}`, createdBy: teacher.id } });
  const context = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, permissions: ['microphone'] });
  await context.addCookies([{ name: 'viettyping_session', value: student.token, url: base }]);
  const page = await context.newPage(), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(base + '/exercises');
  await page.getByRole('heading', { name: exercise.title }).waitFor();
  for (const width of [375, 414, 768, 1024]) {
    await page.setViewportSize({ width, height: 900 });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `Catalog overflow at ${width}`);
  }
  await page.setViewportSize({ width: 375, height: 812 });
  await page.locator(`a[href="/exercises/${exercise.id}"]`).click();
  await page.getByRole('button', { name: /B. cat/ }).waitFor();
  await page.getByRole('button', { name: /B. cat/ }).tap();
  await page.getByRole('button', { name: 'Tiếp', exact: true }).tap();
  await page.getByRole('textbox').fill('is');
  await page.getByText('Đã đồng bộ', { exact: true }).waitFor();
  await page.reload();
  await page.getByRole('textbox').waitFor();
  assert.equal(await page.getByRole('textbox').inputValue(), 'is');
  await context.setOffline(true);
  await page.getByRole('textbox').fill('are');
  await page.getByText(/Chưa đồng bộ/).waitFor();
  await context.setOffline(false);
  await page.getByText('Đã đồng bộ', { exact: true }).waitFor();
  await page.reload(); await page.getByRole('textbox').waitFor();
  assert.equal(await page.getByRole('textbox').inputValue(), 'are');
  await page.getByRole('textbox').fill('is');
  await page.getByRole('button', { name: 'Tiếp', exact: true }).tap();
  await page.getByRole('combobox').first().selectOption('cat');
  await page.getByRole('combobox').nth(1).selectOption('dog');
  await page.getByRole('button', { name: 'Tiếp', exact: true }).tap();
  const word = page.getByRole('button', { name: 'am', exact: true });
  await word.scrollIntoViewIfNeeded();
  const from = await word.boundingBox(), slot = await page.getByText('Kéo một từ vào đây', { exact: true }).boundingBox();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: from.x + from.width / 2, y: from.y + from.height / 2 }] });
  for (let i = 1; i <= 10; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: from.x + from.width / 2 + (slot.x + slot.width / 2 - from.x - from.width / 2) * i / 10, y: from.y + from.height / 2 + (slot.y + slot.height / 2 - from.y - from.height / 2) * i / 10 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  assert.equal(await word.getAttribute('aria-pressed'), 'true', 'Touch drag must select answer');
  await page.getByText('Đã đồng bộ', { exact: true }).waitFor();
  for (const width of [375, 414, 768, 1024]) { await page.setViewportSize({ width, height: 900 }); assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `Player overflow at ${width}`); }
  await page.setViewportSize({ width: 375, height: 812 });
  const out = path.resolve('.next/exercise-qa'); await mkdir(out, { recursive: true });
  await page.screenshot({ path: path.join(out, 'student-mobile.png'), fullPage: true });
  await page.getByRole('button', { name: 'Tiếp', exact: true }).click();
  await page.getByRole('textbox').fill('cat');
  await page.getByRole('button', { name: 'Tiếp', exact: true }).click();
  await page.setViewportSize({ width: 1024, height: 900 });
  async function orderTokens(target) {
    await page.getByRole('button', { name: target[0], exact: true }).waitFor();
    for (let wanted = 0; wanted < target.length; wanted++) {
      const tiles = page.locator('button[aria-roledescription="sortable"]');
      await tiles.first().waitFor();
      const texts = await tiles.allTextContents(), index = texts.indexOf(target[wanted]);
      assert(index >= wanted, `Token must remain available: ${JSON.stringify({ wanted, target, texts })}`);
      if (index !== wanted) {
        const tile = page.getByRole('button', { name: target[wanted], exact: true });
        await tile.focus(); await tile.press('Space');
        await page.waitForTimeout(50); // Let keyboard sensor activation reach the next frame.
        for (let move = index; move > wanted; move--) { await tile.press('ArrowLeft'); await page.waitForTimeout(80); }
        await tile.press('Space');
        await page.waitForTimeout(300); // Sortable layout animation and focus restoration complete.
      }
    }
    assert.deepEqual(await page.locator('button[aria-roledescription="sortable"]').allTextContents(), target);
    await page.getByRole('button', { name: 'Lưu thứ tự này' }).click();
  }
  await orderTokens(['c', 'a', 't']);
  await page.getByRole('button', { name: 'Tiếp', exact: true }).click();
  await orderTokens(['I', 'go', 'to', 'school']);
  await page.setViewportSize({ width: 375, height: 812 });
  await page.getByRole('button', { name: 'Tiếp', exact: true }).click();
  await page.getByRole('button', { name: /table/ }).click();
  await page.getByRole('button', { name: 'Tiếp', exact: true }).click();
  await page.getByRole('button', { name: /True/ }).click();
  await page.getByRole('button', { name: 'Tiếp', exact: true }).click();
  await page.locator('audio').evaluate(audio => audio.play());
  await page.getByRole('button', { name: /cat/ }).click();
  await page.getByRole('button', { name: 'Tiếp', exact: true }).click();
  await page.getByRole('textbox').fill('cat');
  await page.getByRole('button', { name: 'Tiếp', exact: true }).click();
  await page.getByRole('button', { name: /a cat/ }).click();
  await page.getByRole('button', { name: 'Tiếp', exact: true }).click();
  await page.getByRole('textbox').fill('She goes to school every day.');
  await page.getByRole('button', { name: 'Tiếp', exact: true }).click();
  await page.getByRole('textbox').fill('I have learned English for three years.');
  await page.getByRole('button', { name: 'Tiếp', exact: true }).click();
  await page.getByRole('textbox').fill('I love English.');
  await page.getByRole('button', { name: 'Tiếp', exact: true }).click();
  await page.getByRole('textbox').fill('My cat is happy.');
  await page.getByText('Đã đồng bộ', { exact: true }).waitFor();
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Nộp bài', exact: true }).click();
  await page.getByText('160 / 160', { exact: true }).waitFor();
  const teacherContext = await browser.newContext({ viewport: { width: 1024, height: 900 } });
  await teacherContext.addCookies([{ name: 'viettyping_session', value: teacher.token, url: base }]);
  const teacherPage = await teacherContext.newPage(); teacherPage.on('pageerror', e => errors.push(e.message));
  await teacherPage.goto(base + '/teacher/exercises');
  await teacherPage.getByRole('button', { name: '+ Tạo bài' }).click();
  await teacherPage.setViewportSize({ width: 375, height: 812 });
  await teacherPage.getByLabel('Tên bài tập', { exact: true }).waitFor();
  if (!await teacherPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)) {
    const out = path.resolve('.next/exercise-qa'); await mkdir(out, { recursive: true });
    await teacherPage.screenshot({ path: path.join(out, 'teacher-overflow.png'), fullPage: true });
    console.log(await teacherPage.evaluate(() => [...document.querySelectorAll('input,select,button,section')].filter(el => el.getBoundingClientRect().right > innerWidth + 1).slice(0, 10).map(el => ({ tag: el.tagName, class: el.className, width: el.getBoundingClientRect().width, text: el.textContent?.slice(0, 50) }))));
  }
  assert(await teacherPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Teacher builder overflow at 375');
  await teacherPage.setViewportSize({ width: 1024, height: 900 });
  await teacherPage.getByLabel('Tên bài tập', { exact: true }).fill('Browser-created exercise');
  await teacherPage.getByLabel('Nội dung', { exact: true }).fill('She ___ a student.');
  await teacherPage.getByLabel(/Đáp án chấp nhận/).fill('is');
  await teacherPage.getByLabel(/Lựa chọn/).fill('is|are|am');
  await teacherPage.getByRole('button', { name: 'Xem trước', exact: true }).click();
  await teacherPage.getByRole('button', { name: /A. is/ }).click();
  await teacherPage.getByRole('button', { name: 'Lưu bài tập', exact: true }).click();
  await teacherPage.getByRole('heading', { name: 'Browser-created exercise' }).waitFor();
  assert.equal(await db.exercise.count({ where: { createdBy: teacher.id, title: 'Browser-created exercise' } }), 1);
  const advancedResponse = await fetch(base + '/api/exercises', { method: 'POST', headers: { Cookie: `viettyping_session=${teacher.token}`, Origin: base, 'Content-Type': 'application/json' }, body: JSON.stringify({ ...demos[4], title: `QA creative ${teacher.id}` }) });
  assert.equal(advancedResponse.status, 200); const advanced = await advancedResponse.json();
  await page.goto(`${base}/exercises/${advanced.id}`); await page.getByRole('heading', { name: 'Find the animal words.' }).waitFor();
  const advancedAttempt = await db.studentAttempt.findFirst({ where: { studentId: student.id, exerciseId: advanced.id } });
  const puzzle = advancedAttempt.snapshot[0].puzzle;
  for (const e of puzzle.entries) {
    const endR = e.row + (e.direction === 'across' ? 0 : e.word.length - 1), endC = e.col + (e.direction === 'down' ? 0 : e.word.length - 1);
    await page.locator(`[data-row="${e.row}"][data-col="${e.col}"]`).click(); await page.locator(`[data-row="${endR}"][data-col="${endC}"]`).click();
  }
  await page.getByText(/Đã tìm:/).filter({ hasText: 'CAT' }).waitFor();
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Word search must scroll within its container');
  await page.getByRole('button', { name: 'Tiếp', exact: true }).click();
  const crossword = advancedAttempt.snapshot[1].puzzle.grid;
  for (let r = 0; r < crossword.length; r++) for (let c = 0; c < crossword[r].length; c++) if (crossword[r][c]) await page.getByLabel(`Hàng ${r + 1} cột ${c + 1}`, { exact: true }).fill(crossword[r][c]);
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Crossword must scroll within its container');
  await page.getByRole('button', { name: 'Tiếp', exact: true }).click();
  await page.getByRole('button', { name: 'Lật thẻ gợi ý' }).first().click(); await page.getByRole('button', { name: 'Lật thẻ từ' }).first().click();
  await page.getByText('1 / 2 cặp đã chọn', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Tiếp', exact: true }).click();
  await page.getByRole('textbox').fill('My family is kind and happy.');
  await page.getByRole('button', { name: 'Tiếp', exact: true }).click();
  await page.getByRole('button', { name: '🎙 Bắt đầu ghi âm' }).click();
  await page.getByRole('button', { name: '⏹ Dừng ghi âm' }).waitFor();
  await context.setOffline(true);
  await page.waitForTimeout(800); // Actual MediaRecorder needs time to produce a chunk.
  await page.getByRole('button', { name: '⏹ Dừng ghi âm' }).click();
  await page.getByText(/Ghi âm đang chờ đồng bộ/).waitFor();
  await context.setOffline(false);
  await page.getByText('Đã lưu ghi âm', { exact: true }).waitFor();
  await page.getByText('Đã đồng bộ', { exact: true }).waitFor();
  await page.reload(); await page.getByText('Đã lưu ghi âm', { exact: true }).waitFor();
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Nộp bài', exact: true }).click();
  await page.getByText('Đã lưu bài làm. Đang chờ giáo viên chấm.', { exact: true }).waitFor();
  await teacherPage.goto(`${base}/teacher/exercises/attempts/${advancedAttempt.id}`);
  await teacherPage.getByRole('heading', { name: 'Write about your family.' }).waitFor();
  const gradeFields = teacherPage.getByRole('spinbutton'); await gradeFields.nth(0).fill('8'); await gradeFields.nth(1).fill('10');
  await teacherPage.getByRole('button', { name: 'Lưu điểm và nhận xét' }).click(); await teacherPage.getByText('Đã chấm xong.', { exact: true }).waitFor();
  await page.reload(); await page.getByRole('heading', { name: '🎉 Đã hoàn thành!' }).waitFor();
  assert.equal((await db.studentAttempt.findUnique({ where: { id: advancedAttempt.id } })).needsReview, false);
  await db.studentProfile.delete({ where: { userId: teacher.id } });
  const loginContext = await browser.newContext(); const loginPage = await loginContext.newPage();
  await loginContext.addCookies([{ name: 'viettyping_session', value: randomBytes(32).toString('hex'), url: base }]);
  loginPage.on('pageerror', e => errors.push(e.message));
  await loginPage.goto(base + '/login');
  await loginPage.getByPlaceholder('Ví dụ: nguyen_van_an').fill(teacher.username);
  await loginPage.getByLabel('Mật khẩu', { exact: true }).fill(teacher.password);
  await loginPage.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await loginPage.waitForURL('**/teacher/exercises');
  await loginPage.getByRole('heading', { name: 'Bài tập của giáo viên' }).waitFor();
  assert.deepEqual(errors, [], 'No JavaScript page errors');
  console.log('Browser QA passed: teacher creation/preview/mobile, choice/matching, touch drag, puzzles/memory, offline recording/recovery, manual grading/result reload, autosave and 375/414/768/1024px overflow.');
}
main().catch(e => { console.error(e.message); process.exitCode = 1; }).finally(async () => {
  if (browser) await browser.close();
  const files = await db.exerciseMedia.findMany({ where: { userId: { in: users } }, select: { id: true } });
  for (const file of files) if (/^[a-f0-9-]{36}\.(wav|webm|m4a|mp3|jpg|png|webp)$/.test(file.id)) await require('node:fs/promises').unlink(path.join(process.cwd(), '.exercise-media', file.id)).catch(() => {});
  await db.exerciseReward.deleteMany({ where: { studentId: { in: users } } });
  await db.studentAttempt.deleteMany({ where: { studentId: { in: users } } });
  await db.exerciseAssignment.deleteMany({ where: { studentId: { in: users } } });
  await db.exercise.deleteMany({ where: { createdBy: { in: users } } });
  await db.classroom.deleteMany({ where: { teacherId: { in: users } } });
  await db.user.deleteMany({ where: { id: { in: users } } });
  await db.$disconnect();
});
