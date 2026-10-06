# Exercise implementation report — 2026-10-06

## Completed

- Audit được viết trước implementation; giữ lại các môn học, LessonCoordinator, typing, hồ sơ và session cũ.
- 21 dạng bài trong typed registry, server validation/scoring và renderer riêng; đáp án thay thế, normalization hoa thường/khoảng trắng và tùy chọn dấu câu.
- Teacher builder: type cards, metadata lớp 1–9, thêm/nhân bản/xóa/kéo đổi vị trí, preview tương tác, draft/publish/unpublish, duplicate bài, archive và assign.
- Question Bank theo owner và bộ lọc; thêm câu, random từ trang kết quả; import CSV/XLSX có preview/confirm.
- Classroom/roster/group và giao bài hàng loạt; lịch, time limit, attempts, random câu/lựa chọn và result/answer visibility.
- Student player không reload khi đổi câu; URL attempt cố định; autosave định kỳ kể cả khi gõ liên tục, local recovery, online retry, optimistic revision, immutable snapshot.
- Media upload có kiểm tra, thumbnail WebP; TTS Windows tạo WAV ở server; không gửi transcript dictation cho học sinh.
- Writing lưu text/word count; Speaking ghi âm/nghe lại, IndexedDB recovery và audio riêng tư; teacher grading từng phần và feedback.
- Result/review server-authoritative; dashboard, skill scores, completion rate, weak/strong skills, students need help, top exercises và lọc học sinh.
- XP/sao high-water theo bài, daily bonus một lần/ngày Việt Nam, level, badges persist, streak; class leaderboard 7/30 ngày opt-in. Điểm ẩn không bị suy ra từ XP/sao/badges.
- Teacher page/API role + owner checks; CSRF, IDOR, role injection, private answers, private recordings, deadline và idempotent submit/rewards.
- 5 bộ seed: Animals lớp 3 (10), Present Simple lớp 6 (10), Reading lớp 8 (5), 16 dạng cơ bản, 5 dạng nâng cao. Demo teacher/student đã tạo với password ngẫu nhiên ở file local Git-ignored.
- Lint cleanup cho mã cũ, typed Web Speech, conditional Hooks fix trong MathActivity, test fixtures cập nhật. Không thêm lint-disable để che lỗi.
- Next.js/eslint-config-next 15.5.27, uuid override đã vá, non-breaking dependency fixes; build chạy lint/type checks; self-host font cũ cùng giấy phép OFL.

## Database

5 migrations mới: core engine; manual review/media; classrooms; daily/badges; typing timing. 8 migrations tổng cộng đã deploy trên MySQL hiện tại. JSON thêm vào bảng có dữ liệu dùng nullable → backfill → NOT NULL. Fresh deployment được kiểm tra trong database tạm riêng rồi xóa đúng database đó.

Tables: exercises, exercise_assignments, student_attempts, exercise_rewards, exercise_media, classrooms, classroom_members, student_exercise_badges, student_daily_bonuses. User mở rộng role default STUDENT; profile/session/snapshot cũ không duplicate. Course/unit/lesson là metadata; question payload heterogenous được validate và lưu JSON. Question Bank tái sử dụng nội dung bài, không copy sang table riêng.

Migration vừa tạo trong phiên phát triển này được rà soát bỏ schema diff không liên quan và đồng bộ checksum trên database local trước bàn giao. Không sửa các migration lịch sử của dự án.

## API

Danh sách endpoint/status code đầy đủ: [EXERCISE_SYSTEM.md](EXERCISE_SYSTEM.md#api). Teacher endpoints kiểm tra role và createdBy; attempt endpoints kiểm tra studentId. Student DTO bỏ answer/explanation/transcript/solution, tọa độ đáp án Word Search và các field không dùng. Word Search chấm theo đường ô đã chọn, không chấm theo danh sách từ khai báo. Review chỉ sau submit và khi teacher cho phép.

Auth vẫn dùng bcrypt + username + hashed HttpOnly session. Thay đổi liên quan: role read-only, Origin protection cho login/register/logout, teacher landing redirect, cho phép mở login với cookie stale. Public register không nhận role từ client. Profile selector hỗ trợ lớp 1–9; teacher không bị modal hồ sơ học sinh chặn dashboard. Cache draft/recording được xóa khi logout trên máy dùng chung.

Media draft chỉ uploader được đọc; media published hoặc thuộc snapshot được phép; recording chỉ student owner hoặc teacher owner. Media tham chiếu khi authoring được kiểm tra loại, tồn tại và ownership; không được dùng ghi âm bài làm làm audio public.

## UI

Student: /exercises, /exercises/attempts/{id}, /exercises/progress, /exercises/leaderboard.
Teacher: /teacher/exercises, /teacher/classrooms, /teacher/exercises/progress, /teacher/exercises/attempts/{id}.

Controls tối thiểu 48px, typography lớn, wrap/min-width phù hợp mobile, grid chữ scroll nội bộ. Drag/drop có pointer/touch và keyboard/click alternatives. Animation hoàn thành và lật thẻ tôn trọng prefers-reduced-motion. Lesson/typing cũ dùng cùng font self-host, không redesign toàn hệ thống.

## Tests

- Jest + Testing Library: 109 tests / 26 suites passed.
- TypeScript toàn dự án: passed; không dùng ignoreBuildErrors.
- ESLint toàn dự án: 0 errors; 25 warnings ở mã cũ; phần mới không có warning.
- Production build Next 15.5.27: passed với type/lint checks bật.
- MySQL API integration: CRUD/version conflicts, role/ownership/IDOR/CSRF, assignment/class/group, concurrent start, autosave/revision/recovery, scoring/typing, idempotence, deadlines, hidden results/review/XP, private audio, manual review, XLSX/TTS, thumbnail, daily rewards, badges và leaderboard.
- Browser Edge/Chromium: 16 dạng cơ bản hoàn thành 160/160; keyboard token ordering, real audio playback, typing countdown; puzzles/memory/writing và recording offline → online → reload → teacher grade → student result reload. Teacher create/preview và login redirect. Overflow kiểm tra 375/414/768/1024px và builder 375px. Không có uncaught JavaScript page errors; network errors khi mô phỏng offline là có chủ ý.
- Fresh MySQL migration test: all migrations deploy, STUDENT default, JSON defaults, FKs và legacy StudentData cùng hoạt động.
- Prisma validate và migrate status: valid/up to date.

Scripts tạo accounts/sessions tạm và chỉ dọn dữ liệu của chính run. Database migration QA được tạo với tên exercise_qa_<random>, xác minh và xóa đúng tên đó; database thật không bị reset.

## Known Issues

- 25 lint warnings kế thừa: image optimization và hook dependencies. Không có lint error/TypeScript error được chấp nhận trong bản bàn giao.
- npm audit sau security updates còn 30 findings (20 moderate, 10 high), chủ yếu toolchain/dependencies kế thừa, 0 critical. Không dùng audit fix --force vì đề xuất có downgrade/major changes. Không tuyên bố toàn repository đã được security-certified.
- TTS adapter chỉ Windows/System.Speech có voice en-US; host khác upload audio, không chặn engine.
- Upload cần persistent writable volume; chưa có object-storage adapter hoặc job dọn file không được tham chiếu.
- Reassignment cập nhật row hiện có và không tự reset số lượt; dùng duplicate exercise khi cần assessment mới.
- Course/unit/lesson chưa có catalog editor độc lập. Random bank lấy từ trang đang xem; student random/daily lấy từ một published exercise phù hợp, tối đa số câu có sẵn.
- Memory chọn cặp và chấm khi submit; không báo đáp án ngay trước nộp. Crossword có thể có cụm rời nếu vocabulary không giao chữ.
- Server WPM/timing là ước lượng theo autosave; errors dựa text cuối, không lưu mỗi keystroke. Mobile QA là viewport/touch emulation; chưa kiểm thử mọi máy iOS/Android thật.
- Logout xóa cache offline; nên đồng bộ trước khi logout. Ghi âm đang thu chưa dừng không bảo đảm phục hồi khi đóng browser.
- XP English mới hiển thị ở progress/leaderboard mới; chưa quy đổi sang Shop/typing XP client-side cũ.
- AI generation, pronunciation/fluency feedback và adaptive learning là optional extension chưa bật vì repository không có runtime AI service.

## Recommended Next Steps

1. Theo dõi/fix advisory còn lại bằng upgrades được regression-test; tối ưu hooks/images warnings cũ.
2. Object-storage/retention adapter, physical-device QA và load test với dữ liệu lớn.
3. Course catalog editor, bank sampling rộng hơn, server XP bridge với Shop sau khi XP cũ được chuyển sang ledger tin cậy.
4. AI/speech feedback optional; teacher preview/confirm bắt buộc trước lưu/publish.

Sources: [Next release](https://github.com/vercel/next.js/releases/tag/v15.5.27), [uuid advisory](https://github.com/uuidjs/uuid/security/advisories/GHSA-w5hq-g745-h8pq), [ExcelJS](https://github.com/exceljs/exceljs), [Sharp](https://sharp.pixelplumbing.com/api-resize/).

## Modified Files

- .env.example
- .gitignore
- CONTEXT.md
- README.md
- docs/EXERCISE_IMPLEMENTATION_REPORT.md
- docs/EXERCISE_SYSTEM.md
- docs/EXERCISE_SYSTEM_AUDIT.md
- docs/qa/exercise-student-mobile.png
- next.config.ts
- package-lock.json
- package.json
- prisma/migrations/20261006100000_exercise_engine/migration.sql
- prisma/migrations/20261006110000_exercise_review_media/migration.sql
- prisma/migrations/20261006120000_exercise_classrooms/migration.sql
- prisma/migrations/20261006130000_exercise_daily_badges/migration.sql
- prisma/migrations/20261006140000_exercise_typing_metrics/migration.sql
- prisma/schema.prisma
- public/assets/exercise-audio/cat.wav
- public/fonts/OFL-PlusJakartaSans.txt
- public/fonts/PlusJakartaSans-variable.ttf
- scripts/exercise-demo-data.cjs
- scripts/grant-teacher-role.cjs
- scripts/seed-exercises.cjs
- scripts/test-exercise-api.cjs
- scripts/test-exercise-browser.cjs
- scripts/test-exercise-migrations.cjs
- src/app/api/attempts/[id]/review/route.ts
- src/app/api/attempts/[id]/route.ts
- src/app/api/auth/login/route.ts
- src/app/api/auth/logout/route.ts
- src/app/api/auth/me/route.ts
- src/app/api/auth/register/route.ts
- src/app/api/exercises/[id]/assign/route.ts
- src/app/api/exercises/[id]/attempts/route.ts
- src/app/api/exercises/[id]/route.ts
- src/app/api/exercises/classrooms/[id]/route.ts
- src/app/api/exercises/classrooms/route.ts
- src/app/api/exercises/import/route.ts
- src/app/api/exercises/leaderboard/route.ts
- src/app/api/exercises/media/[name]/route.ts
- src/app/api/exercises/media/route.ts
- src/app/api/exercises/practice/route.ts
- src/app/api/exercises/progress/route.ts
- src/app/api/exercises/question-bank/route.ts
- src/app/api/exercises/route.ts
- src/app/api/exercises/tts/route.ts
- src/app/exercises/[id]/page.tsx
- src/app/exercises/attempts/[id]/page.tsx
- src/app/exercises/leaderboard/page.tsx
- src/app/exercises/page.tsx
- src/app/exercises/progress/page.tsx
- src/app/layout.tsx
- src/app/leaderboard/page.tsx
- src/app/login/page.tsx
- src/app/not-found.tsx
- src/app/page.tsx
- src/app/shop/page.tsx
- src/app/teacher/classrooms/page.tsx
- src/app/teacher/exercises/attempts/[id]/page.tsx
- src/app/teacher/exercises/page.tsx
- src/app/teacher/exercises/progress/page.tsx
- src/app/teacher/layout.tsx
- src/app/typing/[lessonId]/page.tsx
- src/app/typing/asmr/page.tsx
- src/app/typing/page.tsx
- src/app/typing/turtle-rescue/page.tsx
- src/components/ActivityView.tsx
- src/components/AsmrKeyboard.tsx
- src/components/ColoringCanvas.tsx
- src/components/FillInTheBlankGame.tsx
- src/components/Flashcard.tsx
- src/components/MultipleChoiceGame.tsx
- src/components/Navigation.tsx
- src/components/RealWorldMathGame.tsx
- src/components/ReportCardAnalyzer.tsx
- src/components/SpinWheelGame.tsx
- src/components/StudentConfigModal.tsx
- src/components/SubjectSelector.tsx
- src/components/TrueFalseGame.tsx
- src/components/TypingPractice.tsx
- src/components/VisualWorldBackground.tsx
- src/components/__tests__/FillInTheBlankGame.test.tsx
- src/components/__tests__/MatchingGame.test.tsx
- src/components/__tests__/MultipleChoiceGame.test.tsx
- src/components/__tests__/SpinWheelGame.test.tsx
- src/components/__tests__/TrueFalseGame.test.tsx
- src/components/activities/DrawingActivity.tsx
- src/components/activities/ListeningActivity.tsx
- src/components/activities/MathActivity.tsx
- src/components/activities/__tests__/MathActivity.test.tsx
- src/components/exercise/AssignmentForm.tsx
- src/components/exercise/ClassroomManager.tsx
- src/components/exercise/DragDropQuestion.tsx
- src/components/exercise/ExerciseBuilder.tsx
- src/components/exercise/ExerciseCatalog.tsx
- src/components/exercise/ExerciseLeaderboard.tsx
- src/components/exercise/ExercisePlayer.tsx
- src/components/exercise/ExerciseProgress.tsx
- src/components/exercise/ExerciseTypeSelector.tsx
- src/components/exercise/MatchingQuestion.tsx
- src/components/exercise/MediaUpload.tsx
- src/components/exercise/MemoryQuestion.tsx
- src/components/exercise/PracticeForm.tsx
- src/components/exercise/PuzzleQuestion.tsx
- src/components/exercise/QuestionBank.tsx
- src/components/exercise/QuestionBuilder.tsx
- src/components/exercise/QuestionImport.tsx
- src/components/exercise/QuestionRenderer.tsx
- src/components/exercise/SortableQuestion.tsx
- src/components/exercise/SpeakingRecorder.tsx
- src/components/exercise/TeacherReview.tsx
- src/components/exercise/TokenQuestion.tsx
- src/components/exercise/TtsAudio.tsx
- src/components/exercise/TypingQuestion.tsx
- src/components/exercise/WritingQuestion.tsx
- src/components/exercise/__tests__/ExercisePlayer.test.tsx
- src/components/exercise/__tests__/QuestionRenderer.test.tsx
- src/components/exercise/__tests__/TokenQuestion.test.tsx
- src/components/exercise/api.ts
- src/components/exercise/controls.tsx
- src/components/exercise/exercise.module.css
- src/components/lesson/LessonCoordinator.tsx
- src/components/lesson/LessonRunner.tsx
- src/contexts/AuthContext.tsx
- src/hooks/useWebSpeech.ts
- src/lib/client-storage.ts
- src/lib/exercises/__tests__/csv.test.ts
- src/lib/exercises/__tests__/engine.test.ts
- src/lib/exercises/__tests__/puzzles.test.ts
- src/lib/exercises/__tests__/security.test.ts
- src/lib/exercises/__tests__/storage.test.ts
- src/lib/exercises/__tests__/xlsx.test.ts
- src/lib/exercises/contracts.ts
- src/lib/exercises/csv.ts
- src/lib/exercises/engine.ts
- src/lib/exercises/media.ts
- src/lib/exercises/puzzles.ts
- src/lib/exercises/recording-drafts.ts
- src/lib/exercises/rewards.ts
- src/lib/exercises/server.ts
- src/lib/exercises/xlsx.ts
- src/lib/fonts.ts
- src/lib/request-origin.ts
- src/middleware.ts
- src/types/lesson.ts
