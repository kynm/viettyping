# PRD: Giai đoạn 2 - Quản trị Dữ liệu Động & Hoàn thiện Luồng Học (Phase 2)

## Problem Statement
Trong Phase 1, ứng dụng EasyTyping hoạt động dựa trên các file dữ liệu cấu trúc bài học (Lesson Config) định dạng JSON được hardcode trực tiếp vào mã nguồn. Vấn đề hiện tại là những người quản trị không có chuyên môn về lập trình (như giáo viên, phụ huynh) không thể tự tạo hay chỉnh sửa nội dung bài học một cách dễ dàng. Việc cập nhật nội dung mới yêu cầu sự can thiệp của Developer và phải build lại toàn bộ ứng dụng.

## Solution
Chuyển đổi EasyTyping sang một kiến trúc quản trị dữ liệu động. Xây dựng một **Admin Dashboard** trực quan (sử dụng Form UI) tích hợp ngay bên trong dự án Next.js hiện tại, cho phép Admin dễ dàng tạo và quản lý bài học. Dữ liệu này sẽ được lưu trữ qua một Backend **Java Spring Boot + MySQL** độc lập. Đồng thời, hoàn thiện luồng học tập (Flow Refinement) bằng cách bổ sung màn hình Tổng kết (Stats Summary) linh hoạt, và tối ưu hóa tốc độ tải trang cho học sinh thông qua cơ chế fetch dữ liệu **SSR / ISR** của Next.js.

## User Stories

1. As a (Là một) Quản trị viên (giáo viên/phụ huynh), I want a (tôi muốn có một) giao diện nhập liệu dạng Form thân thiện, so that (để) tôi có thể tự tạo cấu trúc bài học mới mà không cần thao tác với mã JSON thô.
2. As a Quản trị viên, I want a tính năng Live Preview ngay trong Admin Dashboard, so that tôi có thể xem trước chính xác trải nghiệm bài học sẽ hiển thị ra sao với học sinh trước khi xuất bản.
3. As a Quản trị viên, I want a khả năng cấu hình bật/tắt hiển thị màn hình Tổng kết (Stats Summary) qua biến `summary_config`, so that tôi có thể điều chỉnh nhịp độ khích lệ tùy theo độ khó của từng bài học.
4. As a Học sinh (6 tuổi), I want a trải nghiệm tải trang cực kỳ nhanh chóng và không bị khựng, so that tôi luôn giữ được sự hứng thú và tập trung khi chuyển đổi giữa các bài tập.
5. As a Học sinh, I want a màn hình chúc mừng rực rỡ với pháo hoa và XP sau khi hoàn thành chuỗi bài Luyện gõ phím, so that tôi có động lực tiếp tục chơi phần Mini-games.
6. As a Developer, I want a hệ thống Next.js gọi API đến Java Spring Boot qua phương thức SSR/ISR, so that bảo mật được các API endpoint và cung cấp dữ liệu sẵn sàng ngay từ lần render đầu tiên của trình duyệt.

## Implementation Decisions

- **Architectural Decisions (Kiến trúc Frontend & Backend):**
  - **Admin Dashboard:** Tích hợp trực tiếp vào dự án Next.js hiện có thông qua các route `/admin/...`. Điều này cho phép sử dụng lại các UI Component của ứng dụng học sinh để tái tạo chính xác tính năng Live Preview.
  - **Backend API:** Hệ thống sẽ gọi API đến một Backend Server chạy Java Spring Boot. Database MySQL sẽ lưu trữ toàn bộ người dùng, quá trình học và JSON Lesson Config.
  - **Data Fetching:** Web App Client sẽ sử dụng Server Components của Next.js Router (SSR / ISR) để lấy dữ liệu từ Java Backend trước khi gửi HTML về cho học sinh, thay vì sử dụng `useEffect` ở client-side để tránh delay giao diện.

- **Modules Built/Modified:**
  - `src/app/admin/*`: Xây dựng module Admin Dashboard với các Form nhập liệu bài học.
  - `src/components/StatsSummary.tsx`: Xây dựng component màn hình tổng kết sau khi kết thúc Typing Practice.
  - `SYSTEM_PROMPT.md` & `sample_lesson.json`: Đã cập nhật để hỗ trợ cấu hình `summary_config`.
  - Khởi tạo thư mục `src/services/api` (hoặc tương tự) để cấu hình logic gọi API từ Next.js Server Components sang Java Spring Boot.

## Testing Decisions

- **Kiểm thử hành vi (Behavioral Testing):** Chỉ kiểm tra các hành vi đầu ra cuối cùng, không kiểm tra chi tiết cấu trúc code.
- **Modules được kiểm thử:**
  - Flow tạo dữ liệu: Admin điền Form -> Hệ thống tạo ra được cục JSON đúng chuẩn `Lesson Config`.
  - Flow tải dữ liệu: Next.js Server Components gọi API -> Dữ liệu trả về được mapping đúng vào UI của trang bài học.
- **Phương pháp:** Sử dụng các mock data giả lập API response của Spring Boot để kiểm tra xem Web App có render ra đúng màn hình Flashcard, Typing, Mini-games như mong đợi hay không.

## Out of Scope

- Xây dựng phần mã nguồn thực tế cho Backend Java Spring Boot và thiết kế schema Database MySQL (PRD này chỉ bao phủ phạm vi của Frontend Next.js và cách giao tiếp API).
- Tính năng phân quyền phức tạp (Role-based access control đa cấp độ) cho nhiều tổ chức trường học khác nhau (sẽ làm ở Phase sau nữa).

## Further Notes
- Việc sử dụng SSR/ISR thay vì `useEffect` giúp ứng dụng thân thiện hơn với các dòng máy tính bảng/điện thoại cũ mà phụ huynh cho con em sử dụng (vì server đã xử lý sẵn khối lượng lớn công việc render HTML).
