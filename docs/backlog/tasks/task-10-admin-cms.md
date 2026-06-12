# Task 10: Admin CMS Dashboard (Phase 2)

## 🎯 Mục tiêu
Chuyển đổi EasyTyping sang một kiến trúc quản trị dữ liệu động. Xây dựng một **Admin Dashboard** trực quan (sử dụng Form UI) tích hợp ngay bên trong dự án Next.js hiện tại, cho phép Admin dễ dàng tạo và quản lý bài học mà không cần biết lập trình.

## 📋 Mô tả công việc

1. **Khởi tạo Route & Layout**
   - Tạo thư mục `src/app/admin` với `layout.tsx` thiết kế riêng cho Dashboard.
   - Xây dựng sidebar navigation để quản lý Môn học, Chủ đề, và Bài học.

2. **Xây dựng Dynamic Forms**
   - Tạo trang `src/app/admin/lessons/create/page.tsx`.
   - Phân chia Form thành các blocks:
     - Thông tin bài học (`lesson_title`, `topic`).
     - Flashcards (Dynamic list cho phép thêm/sửa/xóa thẻ).
     - Luyện gõ phím (Typing practice blocks).
     - Mini games (Các section tương ứng cho 5 loại game).

3. **Cấu hình API & Backend (Java Spring Boot)**
   - Khởi tạo thư mục `src/services/api/` để quản lý các hàm gọi API đến Spring Boot.
   - Triển khai Data Fetching bằng Next.js Server Components (SSR/ISR) để tối ưu hoá hiệu suất cho học sinh.

4. **Live Preview**
   - Cho phép Admin xem trước cấu trúc bài học trước khi lưu, tái sử dụng các components UI từ Phase 1.

## 🛠 Tech Stack đề xuất
- **UI:** Next.js, Tailwind CSS, `react-hook-form` để quản lý Form state.
- **Backend (External):** Java Spring Boot + MySQL.
- **Data Fetching:** Native `fetch` với SSR/ISR.
