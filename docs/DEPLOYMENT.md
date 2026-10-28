# Deploy EasyTyping trên Windows / Laragon

## Điều kiện

- Node.js >= 20.9, npm và PM2 đã có trong PATH.
- MySQL đang chạy; `.env` chứa `DATABASE_URL` của database cần deploy.
- Hoàn tất merge Git trước khi deploy; không bỏ qua dấu conflict trong mã nguồn.
- Sao lưu database trước khi áp dụng migration. Không dùng `prisma migrate reset`
  hoặc `db push --accept-data-loss` trên dữ liệu thật.
- Upload được lưu trong `.exercise-media`; giữ thư mục này qua các lần deploy.
- Nếu dùng reverse proxy, đặt `APP_ORIGIN` bằng origin trình duyệt thực tế
  (ví dụ `https://school.example`, không thêm slash cuối). Speaking cần HTTPS
  hoặc localhost và quyền microphone của trình duyệt.

## Cập nhật

```powershell
npm run deploy
```

Script `scripts/deploy.ps1` chạy tuần tự, kiểm tra exit code từng bước:

1. Kiểm tra merge và công cụ, dừng PM2 `easytyping` nếu đã tồn tại.
2. `npm ci`, `npm run db:generate`, `npm run clean`.
3. TypeScript, ESLint và Jest.
4. Production build và `prisma migrate deploy`.
5. Khởi động PM2 từ `ecosystem.config.js`, kiểm tra HTTP và lưu danh sách PM2.

Ứng dụng ngừng phục vụ trong lúc cập nhật. Nếu bước kiểm tra/build/migration thất bại,
script dừng; sửa lỗi rồi chạy lại. Không khởi động một build chưa hoàn thành.
PM2 save lưu danh sách process; vẫn cần cơ chế khởi động PM2 khi Windows restart.

## Tự khởi động trên Windows

Chạy một lần bằng tài khoản Windows vận hành ứng dụng (không cần Administrator):

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/install-windows-startup.ps1
```

Installer tạo `EasyTyping.vbs` trong Startup của tài khoản hiện tại, dùng đường dẫn
Node/PM2 tuyệt đối và chạy nền khi đăng nhập Windows. Trong Laragon, bật Run at
startup và Start All automatically để MySQL cũng chạy khi đăng nhập. Cơ chế này
chạy sau khi đăng nhập, không phục vụ trước màn hình đăng nhập Windows.

`scripts/start-windows.ps1` chờ truy vấn MySQL thành công, gọi PM2 bằng file JavaScript
thực (tránh lỗi Node đọc `npm.cmd`), kiểm tra `/login`, rồi lưu PM2. Gọi lại script
không tạo thêm instance ứng dụng. Bản build phải có sẵn; startup không tự build hoặc
migrate dữ liệu. Dùng `start-easytyping.cmd` để khởi động thủ công cùng quy trình.

Log: `%LOCALAPPDATA%\EasyTyping\logs\startup.log`. Truy cập
`http://localhost:3000`. Domain Laragon mặc định trỏ vào thư mục mã nguồn sẽ trả 403;
muốn dùng domain riêng cần cấu hình Apache reverse proxy tới cổng 3000.

Để tắt tự khởi động, xóa `EasyTyping.vbs` trong thư mục mở bằng `shell:startup`.

## Kiểm tra và xử lý lỗi

```powershell
pm2 status
pm2 logs easytyping --lines 50 --nostream
npx prisma migrate status
Invoke-WebRequest http://localhost:3000/login -UseBasicParsing
```

- `EJSONPARSE`, `<<<<<<< HEAD`: merge chưa hoàn tất.
- Prisma `EPERM ... query_engine-windows.dll.node`: còn process Node đang giữ Prisma.
  Dừng đúng process của ứng dụng trước khi generate/cài lại; không tắt tất cả Node.
- `Unknown argument role` hoặc thiếu bảng bài tập: generate client và deploy migration.
- Lỗi cấu hình ESLint cũ: Next 16 dùng flat config trực tiếp từ `eslint-config-next`.
  React Compiler chưa bật: các chẩn đoán migration của compiler hiện là warning;
  Rules of Hooks và TypeScript vẫn chặn deploy.
- Lỗi 403 sau reverse proxy: kiểm tra `APP_ORIGIN`, Origin và URL bên ngoài.
- Microphone bị chặn: kiểm tra Permissions-Policy, HTTPS và quyền trình duyệt.

Kiểm thử integration tạo dữ liệu ngẫu nhiên và tự dọn dữ liệu của run:

```powershell
$env:EXERCISE_TEST_URL = 'http://localhost:3000'
npm run test:exercise:api
npm run test:exercise:migrations
```

Bài kiểm tra migration cần quyền tạo/xóa database tạm `exercise_qa_*`.
