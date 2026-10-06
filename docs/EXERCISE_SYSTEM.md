# Hệ thống bài tập tiếng Anh

## Kiến trúc

Module mở rộng Next.js App Router và Prisma/MySQL hiện tại. Không thay thế các môn học, LessonCoordinator, typing, hồ sơ hay session cũ. Đường dẫn chính:

- `/teacher/exercises`: soạn, xem trước, nhân bản, xuất bản/ẩn, lưu trữ và giao bài.
- `/teacher/classrooms`: lớp học, thành viên và nhóm.
- `/teacher/exercises/progress`: dashboard, lọc học sinh và kết quả.
- `/teacher/exercises/attempts/{id}`: xem bài nộp, chấm Writing/Speaking.
- `/exercises`: bài tự luyện, bài giao, đang làm, hoàn thành, Daily Practice.
- `/exercises/attempts/{id}`: URL cố định của một lượt làm; tải lại không tạo lượt mới.
- `/exercises/progress`: điểm, kỹ năng, XP, sao, level, streak và huy hiệu.
- `/exercises/leaderboard`: thi đua trong lớp theo 7/30 ngày; mặc định tắt.

`src/lib/exercises` chứa contract, validation, generator, scoring, authorization, thưởng và import. `src/components/exercise` tách builder, player, controls, type selector, các renderer, lớp học và dashboard. Database là nguồn điểm chính thức; `StudentData` cũ không được dùng để ghi đè điểm/XP của module này.

Course → Unit → Lesson được lưu dưới dạng metadata của Exercise, phù hợp catalog tĩnh hiện tại. Chưa có giao diện quản lý Course/Unit/Lesson độc lập. Một exercise có thể chứa nhiều loại câu hỏi; loại câu nằm trong question contract.

## Database

`User.role` mặc định `STUDENT`; `TEACHER` chỉ được cấp từ CLI quản trị. Các bảng mới:

| Bảng | Trách nhiệm |
| --- | --- |
| exercises | Chủ sở hữu, curriculum, trạng thái, version, câu hỏi riêng tư, opt-in leaderboard |
| exercise_assignments | Học sinh, thời gian mở/đóng, số lượt, giới hạn giây, trộn, visibility |
| student_attempts | Snapshot câu hỏi, answers, revision, deadline, điểm, chấm tay, timing, mode |
| exercise_rewards | XP/sao cho từng học sinh/bài, nâng lên thành tích tốt hơn, không nhân thưởng khi nộp lại |
| exercise_media | Metadata file ảnh/audio; ghi âm liên kết với người sở hữu và lượt làm |
| classrooms / classroom_members | Lớp của giáo viên, học sinh, tên nhóm |
| student_exercise_badges | Huy hiệu đã đạt được, giữ lại khi streak bị gián đoạn |
| student_daily_bonuses | Bonus 10 XP một lần/ngày theo giờ Việt Nam |

Câu hỏi và đáp án là JSON có schema validation, giới hạn 100 câu/bài; không tạo thêm bảng question/options trùng chức năng. Question Bank tái sử dụng nội dung giáo viên đã lưu và đọc tối đa 5 bài mỗi trang. Snapshot trong attempt đảm bảo sửa bài không thay đổi bài đang làm. Archive không xóa kết quả cũ.

Migration mới được thêm theo phase từ `20261006100000` đến `20261006140000`. Migration JSON dùng nullable → backfill → NOT NULL để tương thích dữ liệu có trước.

## 21 dạng bài

| Type | Cấu hình | Chấm |
| --- | --- | --- |
| multiple_choice | options + acceptedAnswers | Chọn một đáp án |
| matching | pairs: left/right | Đúng toàn bộ cặp; chọn qua dropdown hỗ trợ touch/keyboard |
| drag_drop | options + acceptedAnswers | Kéo bằng pointer/touch hoặc bấm chọn |
| missing_letters | prompt có chữ thiếu + acceptedAnswers | Nhập từ hoàn chỉnh |
| word_scramble | tokens là chữ + acceptedAnswers | Ghép chữ theo thứ tự |
| sentence_scramble | tokens là từ + acceptedAnswers | Ghép câu theo thứ tự |
| odd_one_out | options + acceptedAnswers | Chọn từ khác nhóm |
| fill_blank | prompt + acceptedAnswers; options tùy chọn | Nhập đáp án hoặc chọn dropdown; drag_drop dùng khi muốn kéo từ |
| true_false | options True/False + acceptedAnswers | Chọn đúng/sai |
| word_search | acceptedAnswers là 1–10 từ tiếng Anh | Generator ngang/dọc/chéo; chọn hai đầu hoặc kéo; tìm đủ từ |
| crossword | pairs: clue=word | Generator, nhập từng ô; không gửi chữ đáp án ra API học sinh |
| memory | pairs: gợi ý/từ | Lật thẻ chọn cặp; đánh giá khi nộp bài |
| listen_choose | audio + options + acceptedAnswers | Nghe và chọn |
| listen_type | audio + acceptedAnswers | Nghe và nhập |
| read_choose | passage + options + acceptedAnswers | Đọc và chọn; kết hợp câu True/False/Fill Blank cùng passage khi cần |
| error_correction | prompt câu sai + acceptedAnswers | So sánh câu sửa |
| sentence_transformation | prompt câu gốc + nhiều acceptedAnswers | So sánh một đáp án được chấp nhận |
| writing | prompt + minWords/maxWords | Lưu bài, kiểm tra số từ, giáo viên chấm |
| speaking | prompt | MediaRecorder, nghe lại, lưu audio riêng tư, giáo viên chấm |
| typing | passage là mẫu + acceptedAnswers khớp mẫu | Điểm, WPM, accuracy, errors, thời gian |
| typing_race | giống typing | Countdown, tốc độ, accuracy, progress |

Điểm câu tự động là toàn bộ `score` hoặc 0. Text không phân biệt hoa thường, chuẩn hóa khoảng trắng và có tùy chọn bỏ dấu câu. Câu viết/nói có điểm từng phần và nhận xét của giáo viên. Kết quả chưa chấm xong được ghi `needsReview`, chưa cấp thưởng. Không phụ thuộc AI hoặc speech-to-text.

Timing gõ được lưu bằng đồng hồ server theo khoảng giữa những lần autosave/chuyển câu. WPM trên màn hình là đo tức thời tại thiết bị; WPM trong kết quả là ước lượng từ thời gian server ghi nhận, gồm các khoảng nghỉ/offline. Errors là khác biệt ký tự của bài cuối cùng, không phải tổng số lần bấm sai rồi sửa.

## API

Tất cả endpoint bài tập yêu cầu session hợp lệ. Mutation, kể cả login/register/logout, yêu cầu Origin cùng host và body hợp lệ. Nếu reverse proxy dùng origin khác Request.url, đặt APP_ORIGIN=https://your-school.example (alias EXERCISE_ORIGIN cũng hỗ trợ). Login/Me trả role chỉ đọc; public register luôn tạo STUDENT. Cookie hết hạn không chặn việc mở login.

| Method | Endpoint | Quyền / chức năng |
| --- | --- | --- |
| GET / POST | /api/exercises | Catalog an toàn / tạo bài (teacher) |
| GET / PUT / DELETE | /api/exercises/{id} | Owner teacher; PUT có version; DELETE archive |
| POST | /api/exercises/{id}/assign | Owner teacher; username hoặc classId + groupName |
| POST | /api/exercises/{id}/attempts | Tạo/tiếp tục, enforce lịch và giới hạn lượt |
| GET / PUT | /api/attempts/{id} | Học sinh sở hữu; PUT answers/currentIndex/revision/submit |
| GET / PUT | /api/attempts/{id}/review | Owner teacher; chấm câu viết/nói và nhận xét |
| GET | /api/exercises/question-bank | Teacher; pagination và bộ lọc |
| POST | /api/exercises/import | Teacher; XLSX → preview JSON; không tự lưu |
| POST | /api/exercises/media | Upload ảnh/audio của teacher hoặc ghi âm thuộc attempt |
| GET | /api/exercises/media/{name} | Owner upload; media đã publish/own snapshot; ghi âm chỉ owner hoặc teacher sở hữu bài |
| POST | /api/exercises/tts | Teacher; TTS Windows optional, trả URL WAV |
| GET / POST | /api/exercises/classrooms | Teacher; danh sách / tạo lớp |
| GET / PUT | /api/exercises/classrooms/{id} | Owner teacher; roster / thêm, đổi nhóm, bỏ thành viên |
| POST | /api/exercises/practice | Bộ lọc grade/skill/unit/difficulty/count, daily tùy chọn |
| GET | /api/exercises/progress | Self; teacher=1 cho owner teacher, student=username tùy chọn |
| GET | /api/exercises/leaderboard | Thành viên/owner của lớp; classId, period |

400: dữ liệu sai; 401: chưa đăng nhập; 403: thiếu quyền/ngoài lịch/hết lượt; 404: không tồn tại hoặc không thuộc quyền; 409: version/revision thay đổi; 413/429: giới hạn upload; 503: TTS host chưa hỗ trợ.

Student DTO không chứa acceptedAnswers, explanation, crossword solution hay transcript TTS. Review chỉ xuất hiện sau submit và khi `showAnswer` cho phép. Danh sách từ cần tìm, đoạn mẫu luyện gõ và gợi ý ô chữ là nội dung bài, được công khai để chơi. DTO loại bỏ cả các trường không dùng còn sót từ type cũ. XP/sao/badges không phản ánh điểm ẩn; leaderboard không đưa điểm ẩn vào trung bình.

## Quy trình giáo viên

1. Chọn dạng bài bằng card, nhập tên, lớp 1–9, skill, difficulty, course/unit/lesson và thời gian.
2. Thêm/nhân bản/xóa câu; kéo handle hoặc dùng ↑/↓ để đổi vị trí. Nhập dữ liệu của dạng câu theo bảng trên.
3. Upload PNG/JPG/WEBP/MP3/WAV; hệ thống kiểm tra kích thước, MIME và magic bytes. Hoặc nhập text và tạo WAV từ TTS trước khi publish câu nghe.
4. Import CSV UTF-8/XLSX theo `Question,A,B,C,D,Correct,Explanation`, xem preview, xác nhận thêm câu. XLSX tối đa 2MB, 100 câu, không nhận formula; có kiểm tra giới hạn ZIP expansion.
5. Lấy câu từ Question Bank theo grade/unit/lesson/skill/type/difficulty/search. Nút random lấy tối đa số câu đang có trên trang kết quả hiện tại.
6. Xem trước tương tác, chọn draft/published và lưu. Có version để tránh ghi đè tab khác.
7. Tạo lớp và thành viên; giao cho một username, hoặc nhập mã lớp và tên nhóm. Cài startsAt/endsAt, timeLimit, attemptsAllowed, trộn câu/lựa chọn, showResult/showAnswer.
8. Xem dashboard và mở bài đã nộp để nghe/chấm Writing/Speaking. Bảng thi đua chỉ đưa vào các bài teacher bật.

## Quy trình học sinh và offline recovery

Chọn bài, bắt đầu/tiếp tục/xem kết quả. Player đổi câu không reload, đồng bộ answers và vị trí bằng revision. Draft được lưu localStorage ngay khi thay đổi; retry khi online. GET server luôn kiểm tra quyền trước khi đọc draft. Tab khác thay đổi revision sẽ báo xung đột và yêu cầu tải lại.

Ghi âm đã dừng được giữ trong IndexedDB đến khi upload thành công. Khi online trở lại, tự retry; tải lại câu Speaking sẽ khôi phục bản ghi còn chờ. Phải upload thành công trước khi nộp bài nói. Bản ghi đang thu chưa dừng không thể bảo đảm khôi phục nếu đóng trình duyệt. Local draft sau deadline không được dùng để kéo dài thời gian hoặc đổi điểm; server chấm đáp án đã lưu trước hạn.

Khi đăng xuất, cache bài làm và ghi âm trên thiết bị được xóa để bảo vệ máy dùng chung; dữ liệu đã đồng bộ vẫn ở server. Vì vậy chỉ đăng xuất sau khi thấy trạng thái đồng bộ nếu muốn giữ mọi thay đổi offline.

Daily Practice dùng tối đa 10 câu từ một bài published phù hợp và chưa được giao cho học sinh; bonus một lần/ngày. Tự luyện có 1–30 câu tùy số câu bài nguồn. Chế độ này không dùng để bỏ qua giới hạn của bài được giao.

## Cài đặt, demo và vận hành

```powershell
npm install
npm run db:generate
npm run db:deploy
npm run dev
```

Runtime đã kiểm tra: Node 22 và MySQL 8. Browser cần HTTPS hoặc localhost cho microphone, IndexedDB/crypto và recording. TTS server hiện hỗ trợ host Windows có System.Speech và giọng en-US; trên host khác upload audio bình thường, bài nghe vẫn hoạt động.

File upload được lưu ở `.exercise-media/`, metadata trong MySQL. Thư mục cần ghi được và có volume bền vững; backup cùng database. Ghi âm tối đa 2 phút, file tối đa 10MB, mỗi user tối đa 100 upload/ngày. Ảnh được decode/kiểm tra, giới hạn 16 megapixel và chuẩn hóa thumbnail WebP tối đa 640×480. Chưa có object-storage adapter hoặc job xóa file không còn tham chiếu.

```powershell
# Chọn password riêng; không đưa vào Git hay log.
$env:EXERCISE_DEMO_PASSWORD = 'your-private-password-at-least-12-characters'
npm run seed:exercises
Remove-Item Env:EXERCISE_DEMO_PASSWORD

# Cấp quyền cho tài khoản có sẵn từ terminal quản trị của server
node scripts/grant-teacher-role.cjs existing_username
```

Demo: `exercise_teacher`, `exercise_student`; dữ liệu Animals lớp 3 (10 câu), Present Simple lớp 6 (10), Reading lớp 8 (5), 16 dạng cơ bản và 5 dạng nâng cao. Seed không đổi password/quyền tài khoản trùng tên. Trong workspace hiện tại, password demo ngẫu nhiên nằm trong `.exercise-demo-credentials.txt`, được Git ignore.

## Kiểm tra

```powershell
npm run typecheck
npm run lint
npm test -- --runInBand
npm run build
npm run test:exercise:migrations

# Khởi động server trước, ở terminal khác
$env:EXERCISE_TEST_URL = 'http://localhost:3000'
npm run test:exercise:api
# Dùng Playwright đã cài hoặc đường dẫn runtime Playwright của Codex.
$env:EXERCISE_PLAYWRIGHT_MODULE = 'absolute/path/to/playwright'
npm run test:exercise:browser
```

Test API/browser tạo user và session tạm, chỉ xóa dữ liệu của chính lần test. Migration test tạo database `exercise_qa_<random>` riêng, kiểm tra triển khai từ đầu rồi xóa đúng database đó.

## Thêm dạng bài mới

Thêm type vào registry `contracts.ts`; quy định và validate dữ liệu ở `engine.ts`; định nghĩa public DTO riêng không mang solution; viết renderer độc lập và nhánh dispatcher; bổ sung server grading hoặc manual review; cập nhật type selector, seed, test grading/DTO/permission và browser interactions. Không chuyển đáp án đúng sang client để chấm bài có điểm chính thức.

AI generation, feedback grammar/pronunciation và adaptive learning là extension optional trong tương lai. Không có AI service runtime trong repository nên phiên bản này không gọi AI và không tự publish nội dung AI.
