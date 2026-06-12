# Tiến Độ Dự Án EasyTyping (Sprint Planning)

*Cập nhật lần cuối: 2026-05-29*

Dự án EasyTyping là hệ thống Web App học tiếng Việt tương tác cao dành cho trẻ 6 tuổi, dựa trên cấu trúc Lesson Config (JSON) định nghĩa bởi AI và quản lý bởi Admin. Để dễ dàng quản lý, công việc được chia thành các Sprint.

---

## 🏁 SPRINT 1: Kiến trúc cốt lõi & Giao diện cơ bản (Foundation & Core UI)
**Trạng thái:** ✅ Đã hoàn thành

- [x] **Quyết định kiến trúc:** Sử dụng "Offline AI Lesson Generation" (ADR-0001). Web app sẽ chạy dựa trên file tĩnh JSON thay vì gọi API AI real-time.
- [x] **Cấu trúc Dữ liệu:** Thiết kế thành công schema JSON chuẩn trong `SYSTEM_PROMPT.md`.
- [x] **Dữ liệu mẫu:** Tạo file `src/data/sample_lesson.json` với chủ đề "Làm quen với chữ B và vần BA".
- [x] **Tài sản (Assets):** Sinh hình ảnh 2D Vector Art thực tế và lưu trữ thành công vào `public/assets/`.
- [x] **Core UI - Flashcard:** Hiệu ứng lật 3D sống động (`framer-motion`) và tích hợp Text-to-Speech.
- [x] **Core UI - Lesson Layout:** Thiết kế Glassmorphism, hiển thị thanh trạng thái, tích hợp Carousel lật thẻ.
- [x] **Màn hình Chính:** Cập nhật Hero Section, Call-to-action chuyển hướng người dùng.
- [x] **DevOps & Tài liệu:** Xuất bản PRD lên GitHub Issue #4, sửa lỗi ESLint, cấu hình `lucide-react`, Build Production thành công.

---

## 🏃‍♂️ SPRINT 2: State Management & Cốt lõi Gamification
**Trạng thái:** 🚧 Đang thực hiện

- [x] **[Task 01]** Xây dựng State Management & Game Controller ([Chi tiết](./tasks/task-01-state-management.md))
  - [x] Khởi tạo `LessonContext` (hoặc Zustand) để quản lý `currentXP`, `streak`, `progress`, `completedGames`.
  - [x] Dựng khung màn hình chơi game (`/lesson/games`) với vai trò "Game Controller".
- [x] **[Task 07]** Gamification & Rewards ([Chi tiết](./tasks/task-07-gamification-rewards.md))
  - [x] Xây dựng **Progress Bar** động ở header.
  - [x] Kích hoạt hiệu ứng bắn pháo hoa (`canvas-confetti`) và Popup mở khóa Huy hiệu.
  - [x] Bổ sung âm thanh hiệu ứng (Ting! cho câu trả lời đúng, Buzz! cho câu sai).

---

## 📅 SPRINT 3: Lõi Mini Games (Phần 1 - Nền tảng)
**Trạng thái:** ⏳ Kế hoạch (To Do)

- [x] **[Task 02]** Matching Game ([Chi tiết](./tasks/task-02-matching-game.md))
  - [x] Logic kéo thả nối từ vựng với hình ảnh sử dụng `@dnd-kit/core`.
- [x] **[Task 03]** True/False Game ([Chi tiết](./tasks/task-03-true-false-game.md))
  - [x] Hiển thị câu hỏi/hình ảnh và yêu cầu trẻ chọn Đúng hoặc Sai.

---

## 📅 SPRINT 4: Lõi Mini Games (Phần 2 - Nâng cao)
**Trạng thái:** ⏳ Kế hoạch (To Do)

- [x] **[Task 04]** Spin Wheel Game ([Chi tiết](./tasks/task-04-spin-wheel-game.md))
  - [x] Vòng quay may mắn chọn chữ/vần kèm hiệu ứng quay và phát âm.
- [x] **[Task 05]** Fill in the Blank ([Chi tiết](./tasks/task-05-fill-blank-game.md))
  - [x] Cung cấp bàn phím ảo, xử lý logic điền ký tự bị khuyết.
- [x] **[Task 06]** Multiple Choice ([Chi tiết](./tasks/task-06-multiple-choice-game.md))
  - [x] Trắc nghiệm hiển thị đáp án đúng trộn lẫn với các phương án nhiễu.

---

## 📅 SPRINT 5: Kiểm thử & Tối ưu hoá (Testing & Polishing)
**Trạng thái:** ✅ Đã hoàn thành

- [x] **[Task 08]** Kiểm thử phần mềm (Testing) ([Chi tiết](./tasks/task-08-setup-testing.md))
  - [x] Cài đặt framework test (Jest / React Testing Library).
  - [x] Viết Unit Tests cho các hàm tính toán XP và logic của Game Engine.
  - [x] Viết kiểm thử cho State Management để đảm bảo tiến trình bài học không bị lỗi.
- [x] **[Task 09]** Tối ưu hóa UI/UX (Polishing) ([Chi tiết](./tasks/task-09-ui-ux-optimization.md))
  - [x] Tối ưu hóa UI/UX, thêm các vi hiệu ứng (micro-animations) để tăng độ mượt mà.

---

## 🏃‍♂️ SPRINT 5.5: Tái cấu trúc Game Engine & Bộ điều phối (Game Engine Refactor)
**Trạng thái:** ✅ Đã hoàn thành

- [x] **[Task Refactor 01]** Thiết lập Interface Game chung & Chuyển đổi Game Đúng/Sai ([Chi tiết](./tasks/task-refactor-01-game-interface.md))
- [x] **[Task Refactor 02]** Xây dựng bộ điều phối `LessonCoordinator` cốt lõi với Flashcard ([Chi tiết](./tasks/task-refactor-02-lesson-coordinator.md))
- [x] **[Task Refactor 03]** Tích hợp Luyện gõ phím trực tiếp vào bộ điều phối ([Chi tiết](./tasks/task-refactor-03-typing-integration.md))
- [x] **[Task Refactor 04]** Đồng bộ toàn bộ các Mini-game còn lại ([Chi tiết](./tasks/task-refactor-04-games-adaptation.md))
- [x] **[Task Refactor 05]** Luồng Tổng kết & Vinh danh hoàn thành bài học ([Chi tiết](./tasks/task-refactor-05-rewards-flow.md))

---

## 📅 SPRINT 5.7: Cải tiến Sư phạm & Rèn luyện Kỹ năng Chuyên biệt (Pedagogical & Fine Motor Skills Improvements)
**Trạng thái:** ✅ Đã hoàn thành

- [x] **[Task 15]** Luyện tốc độ gõ phím & Chế độ Time Attack ([Chi tiết](./tasks/task-15-typing-speed-challenge.md))
- [x] **[Task 16]** Trò chơi Toán thực tế kéo thả ([Chi tiết](./tasks/task-16-math-realworld-dragdrop.md))
- [x] **[Task 17]** Trò chơi Tô màu thông minh trên Canvas ([Chi tiết](./tasks/task-17-drawing-coloring-canvas.md))
- [x] **[Task 18]** Giao diện Siêu tập trung & Focus Badge ([Chi tiết](./tasks/task-18-focus-mode-gamification.md))

---

## 📅 SPRINT 5.8: Tối ưu hóa Visual & Hệ thống Vinh danh (Visual & Social Gamification)
**Trạng thái:** ⏳ Kế hoạch (To Do)

- [ ] **[Task 19]** Hình ảnh sinh động & Banner trang chủ
  - [ ] Thiết kế và tích hợp `thumbnailUrl` cho các môn học (Subject).
  - [ ] Sử dụng AI sinh hình ảnh hoạt họa 2D vector đẹp mắt kèm text nghệ thuật, lưu tại `public/assets/thumbnails/`.
  - [ ] Thay thế emoji tĩnh bằng **Hero Slide Banner** chuyển động mượt mà tại Trang chủ (`/`).
- [ ] **[Task 20]** Xây dựng Bảng xếp hạng thi đua (`/leaderboard`)
  - [ ] Tạo trang `/leaderboard` với 2 tab: Tuần (Weekly) và Toàn thời gian (All-time).
  - [ ] Hiển thị thông tin bằng Nickname & Avatar hoạt hình dễ thương bảo mật cho học sinh.
  - [ ] Thiết kế hiệu ứng vinh danh Top 3 (vương miện, huy chương lấp lánh).
  - [ ] Thêm widget động viên cá nhân hóa ở dưới cùng cho học sinh nằm ngoài Top 10 kèm nút học nhanh.

---

## 📅 SPRINT 6: Quản trị Dữ liệu Động (Admin CMS - Phase 2)
**Trạng thái:** ⏳ Kế hoạch (Backlog)

- [ ] **[Task 10]** Admin CMS Dashboard (`/admin`)
  - [ ] Thiết lập cấu trúc giao diện Admin tập trung với thanh điều hướng side-navigation.
  - [ ] Tích hợp phân hệ và biểu mẫu (Form UI) cho 8 chức năng cốt lõi:
    - [ ] **1. Quản lý khóa học (Course Management):** Trình tạo và biên tập Lesson Config (JSON) trực quan.
    - [ ] **2. Khóa học (Course Catalog):** Quản lý lớp học học tập và phân bổ bài học cho học sinh.
    - [ ] **3. Bài viết (Parent Blog):** Soạn thảo, viết bài cẩm nang cho phụ huynh.
    - [ ] **4. Danh mục (Categories):** Cấu hình các danh mục bài viết và phân loại môn học.
    - [ ] **5. Người dùng (User Directory):** Quản lý hồ sơ và phân quyền tài khoản (Admin, Giáo viên, Phụ huynh, Học sinh).
    - [ ] **6. Tiến độ học viên (Student Progress):** Bảng theo dõi lịch sử và hoạt động hoàn thành bài học của học viên.
    - [ ] **7. Thống kê điểm (Learning Analytics):** Báo cáo và biểu đồ WPM, độ chính xác %, XP.
    - [ ] **8. Email Marketing (Email Notifications):** Giao diện gửi newsletter và thiết lập email thông báo tự động.
  - [ ] Kết nối REST API của Backend Java Spring Boot và MySQL, xử lý SSR/ISR và xác thực Token JWT.

---

## 📅 SPRINT 7: Đồng bộ hóa Server-Side & Daily Streak Engine (Phase 3)
**Trạng thái:** ⏳ Kế hoạch (Backlog)

- [ ] **[Task 21]** Đồng bộ Server-Side & Daily Streak Engine ([Chi tiết](./tasks/task-21-server-side-sync.md))
  - [ ] Thiết kế cơ chế offline-first syncQueue lưu trữ hàng đợi đồng bộ.
  - [ ] Đồng bộ hóa hồ sơ, XP, Level và danh sách bài học hoàn thành với Java Spring Boot API.
  - [ ] Cải tiến logic tính Streak chuẩn xác theo ngày học thực tế trên Server.
  - [ ] Tích hợp trạng thái đồng bộ đám mây trực quan lên UI Header của học sinh.

