# EasyCheck SEO Audit

Module độc lập đánh giá SEO kỹ thuật, on-page, nội dung, schema/entity và mức sẵn sàng cho AI Search của website giới thiệu `easycheck.io.vn`. Module chỉ đọc dữ liệu công khai, không dùng database và không sửa giao diện website chính.

## Chạy thủ công

Yêu cầu Node.js 20 trở lên. Từ thư mục gốc dự án:

```powershell
node .\seo-audit\scripts\audit.mjs
```

Giới hạn số trang khi cần chạy nhanh:

```powershell
node .\seo-audit\scripts\audit.mjs --max-urls 20
```

Kết quả được ghi vào `reports/YYYY-MM-DD-seo-audit.{json,html}`, đồng thời cập nhật `reports/latest.{json,html}`. Lịch sử 365 lần chạy gần nhất nằm ở `storage/history.json`; log nằm ở `storage/audit.log`.

Crawler ưu tiên sitemap, sau đó crawl internal link. Cấu hình an toàn nằm trong `config/site.json`: whitelist domain, timeout, delay, giới hạn URL và các đường dẫn bị loại trừ. Concurrency luôn bị khóa tối đa 3 kể cả khi file cấu hình đặt cao hơn.

## Cấu hình

- `config/scoring.json`: trọng số 100 điểm và ngưỡng kiểm tra.
- `config/keywords.json`: từ khóa mục tiêu; mỗi từ khóa được ghép với landing page tốt nhất hoặc đưa vào Content Gap.
- `config/ai-prompts.json`: câu hỏi dùng để đánh giá khả năng website cung cấp câu trả lời cho AI Search.
- `config/site.json`: domain, crawl limit, delay, timeout và whitelist.

Module không gọi ChatGPT, Gemini hay Perplexity. AI readiness được suy ra từ nội dung trả lời trực tiếp, FAQ/schema, bảng giá, tính năng, nội dung so sánh, thông tin thương hiệu và liên hệ.

## Lập lịch Windows

Mở Task Scheduler → **Create Task**:

1. Chọn tài khoản có quyền đọc thư mục dự án và bật **Run whether user is logged on or not**.
2. Trigger hằng ngày lúc `02:00`, hoặc hằng tuần vào Chủ nhật lúc `03:00`.
3. Action **Start a program**: `powershell.exe`.
4. Arguments: `-NoProfile -ExecutionPolicy Bypass -File "C:\laragon\www\easytyping\seo-audit\run-audit.ps1"`.
5. Start in: `C:\laragon\www\easytyping\seo-audit`.

Có thể kiểm tra trước bằng:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\seo-audit\run-audit.ps1
```

## Lập lịch Linux

Cấp quyền chạy một lần: `chmod +x seo-audit/run-audit.sh`. Cron chạy mỗi ngày lúc 02:00:

```cron
0 2 * * * /path/to/project/seo-audit/run-audit.sh
```

## Telegram

Sao chép `config/telegram.example.json` thành `config/telegram.json`, điền `botToken`, `chatId` và đặt `enabled` thành `true`. Không commit token thật. Bot chỉ gửi khi điểm dưới 70, critical tăng hoặc điểm giảm ít nhất 10; trạng thái bình thường chỉ được ghi log.

```json
{
  "enabled": true,
  "botToken": "123456:secret",
  "chatId": "-100123456789"
}
```

## Dashboard và cách đọc điểm

Mở `reports/latest.html` bằng trình duyệt. Dashboard có tổng điểm, điểm theo nhóm, biểu đồ lịch sử, bộ lọc mức độ/nhóm lỗi, danh sách URL ưu tiên, checklist và nút tải JSON. JSON chứa thêm broken links, trang thiếu schema/meta/CTA, thin content, top URL, content gaps và kết quả từng AI prompt.

Chạy unit test parser:

```powershell
node --test .\seo-audit\scripts\audit.test.mjs
```
