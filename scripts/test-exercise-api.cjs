// Integration test against a running Next server and the configured MySQL DB.
// Uses isolated random users/sessions and removes only records created by this run.
const assert = require('node:assert/strict');
const { randomBytes, createHash } = require('node:crypto');
const { PrismaClient } = require('@prisma/client');
const { demos } = require('./exercise-demo-data.cjs');
const db = new PrismaClient();
const base = process.env.EXERCISE_TEST_URL || 'http://localhost:3001';
const users = [], ids = [];
async function user(role) {
  const u = await db.user.create({ data: { username: `ex_test_${randomBytes(6).toString('hex')}`, role, passwordHash: 'disabled-test-login' } });
  users.push(u.id);
  const token = randomBytes(32).toString('hex');
  await db.session.create({ data: { userId: u.id, tokenHash: createHash('sha256').update(token).digest('hex'), expiresAt: new Date(Date.now() + 600000) } });
  return { ...u, token };
}
async function api(path, who, method = 'GET', body, expected = 200, origin = base) {
  const res = await fetch(base + path, { method, headers: { Cookie: who ? `viettyping_session=${who.token}` : '', Origin: origin, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json();
  assert.equal(res.status, expected, `${method} ${path}: ${JSON.stringify(data)}`);
  return data;
}
async function main() {
  const teacher = await user('TEACHER'), student = await user('STUDENT'), other = await user('STUDENT'), otherTeacher = await user('TEACHER');
  const registered = await api('/api/auth/register', null, 'POST', { username: `ex_reg_${randomBytes(6).toString('hex')}`, password: randomBytes(24).toString('base64'), role: 'TEACHER' }, 201);
  users.push(registered.user.id);
  assert.equal((await db.user.findUnique({ where: { id: registered.user.id } })).role, 'STUDENT');
  assert.equal((await api('/api/auth/me', teacher)).user.role, 'TEACHER');
  await api('/api/auth/login', teacher, 'POST', {}, 403, 'https://evil.example');
  await api('/api/auth/logout', teacher, 'POST', {}, 403, 'https://evil.example');
  await api('/api/auth/register', null, 'POST', {}, 403, 'https://evil.example');
  await api('/api/exercises', null, 'GET', null, 401);
  await api('/api/exercises', student, 'POST', demos[0], 403);
  await api('/api/exercises', teacher, 'POST', demos[0], 403, 'https://evil.example');
  for (const d of demos) {
    const e = await api('/api/exercises', teacher, 'POST', d); ids.push(e.id);
    const saved = await api(`/api/exercises/${e.id}`, teacher);
    assert.equal(saved.questions.length, d.questions.length);
    await api(`/api/exercises/${e.id}`, student, 'GET', null, 403);
    await api(`/api/exercises/${e.id}`, otherTeacher, 'GET', null, 404);
  }
  const id = ids[3], e = await api(`/api/exercises/${id}`, teacher);
  await api(`/api/exercises/${id}`, teacher, 'PUT', { ...e, title: e.title + ' edited' });
  await api(`/api/exercises/${id}`, teacher, 'PUT', { ...e, title: 'stale edit' }, 409);
  const schedule = { username: student.username, startsAt: new Date(Date.now() - 60000).toISOString(), endsAt: new Date(Date.now() + 600000).toISOString(), attemptsAllowed: 1, timeLimit: 0, showResult: true, showAnswer: false, randomQuestions: true, randomAnswers: true };
  await api(`/api/exercises/${id}/assign`, teacher, 'POST', schedule);
  const attempts = await Promise.all([api(`/api/exercises/${id}/attempts`, student, 'POST', {}), api(`/api/exercises/${id}/attempts`, student, 'POST', {})]);
  assert.equal(attempts[0].id, attempts[1].id);
  const attempt = attempts[0];
  assert(!JSON.stringify(attempt).includes('acceptedAnswers'));
  assert.equal(attempt.review, null);
  await api(`/api/attempts/${attempt.id}`, other, 'GET', null, 404);
  await api(`/api/attempts/${attempt.id}`, other, 'PUT', { answers: {}, currentIndex: 0, revision: 0 }, 404);
  const original = demos[3].questions;
  const answers = Object.fromEntries(original.map(q => [q.id, q.type === 'matching' ? Object.fromEntries(q.pairs.map((p, i) => [String(i), p.right])) : q.acceptedAnswers[0]]));
  const saved = await api(`/api/attempts/${attempt.id}`, student, 'PUT', { answers, currentIndex: 4, revision: 0 });
  assert.equal(saved.currentIndex, 4);
  await api(`/api/attempts/${attempt.id}`, student, 'PUT', { answers: {}, currentIndex: 0, revision: 0 }, 409);
  const resumed = await api(`/api/exercises/${id}/attempts`, student, 'POST', {});
  assert.deepEqual(resumed.answers, answers);
  const submitted = await api(`/api/attempts/${attempt.id}`, student, 'PUT', { answers, currentIndex: 4, revision: saved.revision, submit: true, score: 999999 });
  assert.equal(submitted.result.score, 160);
  assert.equal(submitted.typing.length, 2);
  assert(submitted.typing.every(t => Number.isFinite(t.wpm) && t.accuracy === 100 && t.duration >= 1));
  assert.equal(submitted.review, null);
  const duplicate = await api(`/api/attempts/${attempt.id}`, student, 'PUT', { answers: {}, currentIndex: 0, revision: 0, submit: true });
  assert.equal(duplicate.result.score, 160);
  assert.equal(await db.exerciseReward.count({ where: { studentId: student.id, exerciseId: id } }), 1);
  await api(`/api/exercises/${id}/attempts`, student, 'POST', {}, 403);
  const progress = await api('/api/exercises/progress?teacher=1', teacher);
  assert(progress.attempts.some(a => a.id === attempt.id && a.score === 160));
  await api('/api/exercises/progress?teacher=1', student, 'GET', null, 403);
  await api(`/api/exercises/${ids[0]}`, teacher, 'DELETE');
  await api(`/api/exercises/${ids[0]}/attempts`, student, 'POST', {}, 404);
  // Deadline and visibility policies are enforced on server, independent of client timer.
  const timed = await api(`/api/exercises/${ids[1]}/attempts`, other, 'POST', {});
  await db.studentAttempt.update({ where: { id: timed.id }, data: { deadline: new Date(Date.now() - 1000), showResult: false, showAnswer: false } });
  const expired = await api(`/api/attempts/${timed.id}`, other, 'PUT', { answers: { grammar_0: 'is' }, currentIndex: 0, revision: 0, submit: true });
  assert(expired.submittedAt); assert.equal(expired.result, null); assert.equal(expired.review, null);
  assert.equal((await db.studentAttempt.findUnique({ where: { id: timed.id } })).score, 0);
  const advancedId = ids[4];
  const advanced = await api(`/api/exercises/${advancedId}`, teacher);
  const creative = await api(`/api/exercises/${advancedId}/attempts`, student, 'POST', {});
  const creativeAnswers = {};
  for (const q of advanced.questions) {
    if (q.type === 'word_search') creativeAnswers[q.id] = q.puzzle.entries.map(e => [...e.word].map((_, i) => `${e.row + (e.direction === 'across' ? 0 : i)},${e.col + (e.direction === 'down' ? 0 : i)}`).join(';'));
    if (q.type === 'memory') creativeAnswers[q.id] = Object.fromEntries(q.pairs.map((p, i) => [String(i), p.right]));
    if (q.type === 'crossword') { const cells = {}; q.puzzle.grid.forEach((row, r) => row.forEach((c, col) => { if (c) cells[`${r}_${col}`] = c; })); creativeAnswers[q.id] = cells; }
    if (q.type === 'writing') creativeAnswers[q.id] = 'My family is kind and happy.';
  }
  const audioForm = new FormData(); audioForm.set('attemptId', String(creative.id)); audioForm.set('file', new Blob([Buffer.from([26, 69, 223, 163, 0, 0, 0, 0])], { type: 'audio/webm;codecs=opus' }), 'recording.webm');
  const uploaded = await fetch(base + '/api/exercises/media', { method: 'POST', headers: { Cookie: `viettyping_session=${student.token}`, Origin: base }, body: audioForm });
  assert.equal(uploaded.status, 200); const audio = await uploaded.json(); creativeAnswers.speaking = audio.url;
  await api(audio.url, other, 'GET', null, 404);
  const audioRes = await fetch(base + audio.url, { headers: { Cookie: `viettyping_session=${teacher.token}` } }); assert.equal(audioRes.status, 200);
  const pending = await api(`/api/attempts/${creative.id}`, student, 'PUT', { answers: creativeAnswers, currentIndex: 0, revision: 0, submit: true });
  assert.equal(pending.needsReview, true); assert.equal(pending.result, null);
  await api(`/api/attempts/${creative.id}/review`, student, 'GET', null, 403);
  await api(`/api/attempts/${creative.id}/review`, otherTeacher, 'GET', null, 404);
  const review = await api(`/api/attempts/${creative.id}/review`, teacher);
  await api(`/api/attempts/${creative.id}/review`, teacher, 'PUT', { revision: review.revision, manualGrades: { writing: { score: 999, feedback: '' } } }, 400);
  await api(`/api/attempts/${creative.id}/review`, teacher, 'PUT', { revision: review.revision, manualGrades: { writing: { score: 8, feedback: 'Good vocabulary' }, speaking: { score: 10, feedback: 'Clear speech' } } });
  assert.equal((await api(`/api/attempts/${creative.id}`, student)).result.score, 48);
  const classroom = await api('/api/exercises/classrooms', teacher, 'POST', { name: 'QA classroom' });
  await api(`/api/exercises/classrooms/${classroom.id}`, teacher, 'PUT', { username: student.username, groupName: 'Blue' });
  await api(`/api/exercises/classrooms/${classroom.id}`, otherTeacher, 'GET', null, 404);
  await api(`/api/exercises/${advancedId}/assign`, teacher, 'POST', { ...schedule, username: undefined, classId: classroom.id, groupName: 'Blue' });
  assert.equal(await db.exerciseAssignment.count({ where: { exerciseId: advancedId, studentId: student.id } }), 1);
  await api(`/api/exercises/leaderboard?classId=${classroom.id}`, other, 'GET', null, 404);
  assert.equal((await api(`/api/exercises/leaderboard?classId=${classroom.id}`, student)).items.length, 0);
  const editable = await api(`/api/exercises/${id}`, teacher);
  await api(`/api/exercises/${id}`, teacher, 'PUT', { ...editable, leaderboardEnabled: true });
  assert.equal((await api(`/api/exercises/leaderboard?classId=${classroom.id}`, student)).items[0].xp, 30);
  const practiceFilters = { grade: 6, skill: 'Grammar', difficulty: 'easy', count: 3, daily: true };
  const daily = await api('/api/exercises/practice', student, 'POST', practiceFilters);
  assert.equal((await api('/api/exercises/practice', student, 'POST', practiceFilters)).id, daily.id);
  const grammarAnswers = Object.fromEntries(demos[1].questions.map(q => [q.id, q.acceptedAnswers[0]]));
  await api(`/api/attempts/${daily.id}`, student, 'PUT', { answers: Object.fromEntries(daily.questions.map(q => [q.id, grammarAnswers[q.id]])), currentIndex: 0, revision: 0, submit: true });
  assert.equal(await db.studentDailyBonus.count({ where: { studentId: student.id } }), 1);
  assert(await db.studentExerciseBadge.findUnique({ where: { studentId_badge: { studentId: student.id, badge: 'Perfect Score' } } }));
  const workbook = new (require('exceljs').Workbook)(), sheet = workbook.addWorksheet('Questions'); sheet.addRow(['Question', 'A', 'B', 'Correct']); sheet.addRow(['An animal?', 'Cat', 'Table', 'A']);
  const form = new FormData(); form.set('file', new Blob([await workbook.xlsx.writeBuffer()]), 'questions.xlsx');
  const imported = await fetch(base + '/api/exercises/import', { method: 'POST', headers: { Cookie: `viettyping_session=${teacher.token}`, Origin: base }, body: form }); assert.equal(imported.status, 200); assert.equal((await imported.json()).questions[0].acceptedAnswers[0], 'Cat');
  const tts = await api('/api/exercises/tts', teacher, 'POST', { text: 'Cat' }); assert(tts.url.endsWith('.wav'));
  await api('/api/exercises/tts', student, 'POST', { text: 'Cat' }, 403);
  const imageBytes = await require('sharp')({ create: { width: 1200, height: 600, channels: 3, background: '#3b82f6' } }).png().toBuffer();
  const imageForm = new FormData(); imageForm.set('file', new Blob([imageBytes], { type: 'image/png' }), 'photo.png');
  const imageUpload = await fetch(base + '/api/exercises/media', { method: 'POST', headers: { Cookie: `viettyping_session=${teacher.token}`, Origin: base }, body: imageForm }); assert.equal(imageUpload.status, 200);
  const image = await imageUpload.json(); assert(image.url.endsWith('.webp'));
  await api(image.url, student, 'GET', null, 404);
  const photoExercise = await api(`/api/exercises/${id}`, teacher); photoExercise.questions[0].image = image.url;
  await api(`/api/exercises/${id}`, teacher, 'PUT', photoExercise);
  const thumbnail = await fetch(base + image.url, { headers: { Cookie: `viettyping_session=${student.token}` } });
  const metadata = await require('sharp')(Buffer.from(await thumbnail.arrayBuffer())).metadata(); assert.equal(metadata.width, 640); assert.equal(metadata.height, 320);
  const blockedImage = await fetch(base + '/api/exercises/media', { method: 'POST', headers: { Cookie: `viettyping_session=${student.token}`, Origin: base }, body: imageForm }); assert.equal(blockedImage.status, 403);
  const hidden = await api(`/api/exercises/${ids[2]}/attempts`, other, 'POST', {});
  await db.studentAttempt.update({ where: { id: hidden.id }, data: { showResult: false } });
  await api(`/api/attempts/${hidden.id}`, other, 'PUT', { answers: Object.fromEntries(demos[2].questions.map(q => [q.id, q.acceptedAnswers[0]])), currentIndex: 0, revision: 0, submit: true });
  assert.equal((await db.exerciseReward.findUnique({ where: { studentId_exerciseId: { studentId: other.id, exerciseId: ids[2] } } })).xp, 10);
  assert.equal(await db.studentExerciseBadge.count({ where: { studentId: other.id, badge: 'Perfect Score' } }), 0);
  const completedCatalog = await api('/api/exercises?state=completed', student); assert(completedCatalog.items.every(e => e.attempt?.submittedAt));
  console.log('Exercise API integration passed: CRUD, ownership/IDOR/CSRF, assignments/classes/groups, autosave, concurrency, grading/typing, manual review, private audio, XLSX/TTS, daily practice, badges and leaderboard.');
}
main().catch(e => { console.error(e.message); process.exitCode = 1; }).finally(async () => {
  const files = await db.exerciseMedia.findMany({ where: { userId: { in: users } }, select: { id: true } });
  for (const file of files) if (/^[a-f0-9-]{36}\.(wav|webm|m4a|mp3|jpg|png|webp)$/.test(file.id)) await require('node:fs/promises').unlink(require('node:path').join(process.cwd(), '.exercise-media', file.id)).catch(() => {});
  await db.exerciseReward.deleteMany({ where: { studentId: { in: users } } });
  await db.studentAttempt.deleteMany({ where: { studentId: { in: users } } });
  await db.exerciseAssignment.deleteMany({ where: { studentId: { in: users } } });
  await db.exercise.deleteMany({ where: { createdBy: { in: users } } });
  await db.classroom.deleteMany({ where: { teacherId: { in: users } } });
  await db.user.deleteMany({ where: { id: { in: users } } });
  await db.$disconnect();
});
