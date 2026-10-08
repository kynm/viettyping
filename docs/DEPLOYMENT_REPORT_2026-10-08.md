# Kết quả deploy — 2026-10-08

## Kết quả

Bản cập nhật đã chạy production trên máy Windows/Laragon hiện tại, qua PM2
`easytyping`, cổng 3000, Next.js 16.4.0. PM2 process list đã được save.

## Nguyên nhân và sửa đổi

- Merge chưa hoàn tất: 7 tệp unmerged, hàng loạt conflict marker khiến npm
  `EJSONPARSE`. Đã hợp nhất module bài tập với phiên bản Next 16 và bảo vệ
  đăng nhập hiện có; giữ rate limit và giới hạn request body.
- Hai khối `overrides` trong package.json: hợp nhất để không mất uuid override.
- Prisma DLL bị khóa bởi process PM2 đang chạy: dừng đúng process trước generate.
- Database `easytyping` thiếu 5 migration module bài tập: đã migrate deploy đủ.
- Cấu hình FlatCompat cũ không phù hợp Next 16: dùng flat config gốc.
  React Compiler chưa bật, chẩn đoán compiler để warning; Hooks cơ bản vẫn error.
- TrueFalseGame đọc `image_prompt` từ union không luôn có trường đó: thêm kiểm tra kiểu.
- Nguồn yêu cầu sau reverse proxy: xác thực dùng APP_ORIGIN/EXERCISE_ORIGIN,
  Referer sai định dạng trả 403; kiểm thử regression được viết và thấy fail trước sửa.
- Cookie hết hạn không còn redirect khỏi trang login chỉ dựa vào cookie presence.
- Permissions-Policy cho phép microphone cùng origin để Speaking ghi âm.
- Lệnh clean hoạt động trên Windows; cwd PM2 dựa vào vị trí repository.
- Script `npm run deploy` kiểm tra exit code từng bước, dừng PM2 trước cập nhật,
  kiểm tra/build/migrate trước khởi động, kiểm tra HTTP và save PM2.

## Backup

Database được sao lưu bằng mysqldump `--single-transaction` trước migrate:

`C:/Users/KYNM/.codex/backups/easytyping/before-deploy-20261008-1791433979860.sql`

File 31,833 bytes; nằm ngoài repository. Không reset database thật.

## Kiểm tra

- Prisma generate: passed sau khi dừng PM2.
- Prisma migrate deploy/status: đủ 8 migrations, schema up to date.
- Prisma validate: passed.
- Next production build: passed, gồm TypeScript và tạo 38 static pages.
- Jest: 27 suites, 112 tests passed.
- ESLint: 0 errors, 113 warnings (25 warnings cũ và 88 diagnostics compiler mới).
- API integration production: passed; CRUD, ownership/IDOR/CSRF, lớp/nhóm,
  autosave/concurrency, chấm điểm/typing, review thủ công, audio riêng tư,
  XLSX/TTS, daily practice, badges, leaderboard.
- Browser QA Edge: passed; teacher create/preview, thao tác touch, puzzles/memory,
  offline recording/recovery, review/result reload, autosave, viewport
  375/414/768/1024px.
- HTTP `/`, `/login`, `/exercises`: 200; `/login` với cookie hết hạn: 200.
- Permissions-Policy trong response chứa `microphone=(self)`.
- Manifest/lockfile khớp; không còn conflict marker trong tệp triển khai.
- Script PowerShell được kiểm tra cú pháp; các bước tương ứng đã chạy trong phiên này.

## Giới hạn còn lại

- Test fresh migration trong database tạm không chạy được: `easytyping_user`
  thiếu quyền CREATE DATABASE (MySQL 1044). Migration trên database thật đã passed.
- npm báo 18 vulnerabilities (4 moderate, 14 high), không còn critical.
  Không tự dùng audit fix --force làm thay đổi major version.
- Chưa xác minh một server từ xa hay domain public; phạm vi deploy đã kiểm tra
  là PM2 trên máy hiện tại.
- Script deploy có downtime trong lúc cập nhật và cần backup database trước chạy.
