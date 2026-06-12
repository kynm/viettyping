# VietTyping

## Mục tiêu & Vision
Xây dựng một ứng dụng web giáo dục tương tác cao, tập trung chuyên sâu vào kỹ năng **luyện gõ phím (typing practice)** dành cho học sinh lớp 1 (6 tuổi). Điểm nổi bật là ứng dụng bao quát **đa dạng các môn học** trong chương trình lớp 1 (Toán, Tiếng Việt, Tự nhiên & Xã hội...), giúp trẻ vừa rèn luyện phản xạ gõ phím thành thạo, vừa ôn tập kiến thức thông qua các bài học được số hóa dưới dạng mini-game sinh động.

## Users & Personas
- **Học sinh (Trẻ em 6 tuổi - Lớp 1):** Người dùng chính, học kiến thức toàn diện các môn học và luyện gõ phím máy tính thông qua việc tương tác với các mini-game rực rỡ, âm thanh vui nhộn, và nhận phần thưởng XP/Badge.
- **Quản trị viên (Admin) / Giáo viên:** Những người không có chuyên môn về lập trình. Họ sử dụng giao diện Form UI (Admin Dashboard) thân thiện để tự thiết kế và tạo nội dung bài học.

## Tech Stack & Rationale
- **Framework/Core:** Next.js (App Router), React, TypeScript.
- **Backend (Phase 2):** Java Spring Boot cung cấp REST API cho cả Web App (Client) và Admin Dashboard.
- **Database (Phase 2):** MySQL lưu trữ tiến trình học tập, tài khoản và nội dung bài học.
- **Styling:** Tailwind CSS (thiết kế rực rỡ, bo góc, màu sắc tươi sáng, glassmorphism).
- **Animations:** `framer-motion` (cho các hiệu ứng lật thẻ flashcard, thanh tiến độ mượt mà, hiệu ứng lên cấp).
- **Drag & Drop:** `@dnd-kit/core` hoặc `react-beautiful-dnd` (cho mini-game tìm mảnh ghép).
- **Gamification/Effects:** `canvas-confetti` (hiệu ứng bắn pháo hoa khi chiến thắng).
- **State Management:** React Context API (quản lý XP, Streak, và Progress).

## Constrains (time, resource)
- **Offline AI:** Dữ liệu bài học (kể cả phương án nhiễu) được tạo trước offline thông qua các mô hình AI (ChatGPT, Gemini) và lưu dưới dạng JSON. Web App không gọi API AI real-time.
- **Tài nguyên tĩnh:** Hình ảnh minh họa được developer tạo ra dựa trên Image Prompt do AI sinh ra và lưu tĩnh trong thư mục `assets`. Ở Phase 1, toàn bộ dữ liệu nằm trong tệp JSON. Phase 2 mới lưu vào Database.

## Glossary
- **Subject** (Môn học): Khái niệm cấp cao nhất, ví dụ: Toán, Tiếng Việt, Tiếng Anh.
- **Topic** (Chủ đề): Một phần nhỏ trong môn học, bao gồm nhiều bài học (Lesson) cùng chủ đề.
- **Lesson** / **Lesson Config**: Tập hợp các Activity có cùng mục tiêu học tập. Dữ liệu bài học được tạo qua Form UI trên Admin Dashboard, lưu trữ ở MySQL và trả về dạng JSON.
- **Activity**: Đơn vị học tập nhỏ nhất mà học sinh tương tác trực tiếp (Atomic Unit of Learning). Gồm các dạng: Quiz, Typing, Drawing, Game (các Mini-game như Matching, True/False bản chất là một loại Activity).
- **Web App** (Ứng dụng Web Client): Phần mềm hiển thị trò chơi và hoạt động học tập cho học sinh, tiêu thụ dữ liệu từ backend API.
- **Admin Dashboard** (Màn hình Quản trị): Giao diện web dành riêng cho Admin (giáo viên/phụ huynh) thiết kế nội dung bài học. Bao gồm 8 phân hệ cốt lõi:
  1. *Quản lý khóa học (Course Management)*: Thiết lập chương trình và cấu hình Lesson Config JSON.
  2. *Khóa học (Course Catalog)*: Quản lý lớp học và đăng ký/phân bổ học sinh.
  3. *Bài viết (Parent Blog)*: Quản lý các bài viết cẩm nang hướng dẫn cho phụ huynh.
  4. *Danh mục (Categories)*: Quản lý danh mục phân loại bài viết và môn học.
  5. *Người dùng (User Directory)*: Quản lý tài khoản Phụ huynh, Giáo viên, Học sinh.
  6. *Tiến độ học viên (Student Progress)*: Theo dõi lịch sử hoàn thành hoạt động học tập.
  7. *Thống kê điểm (Learning Analytics)*: Báo cáo hiệu suất học tập (WPM, độ chính xác %, XP).
  8. *Email Marketing (Email Notifications)*: Gửi bản tin tự động và báo cáo tuần cho phụ huynh.
- **Subject Thumbnail** (Hình thu nhỏ môn học): Ảnh hoạt họa 2D đại diện cho môn học, chứa chữ nghệ thuật sinh động thu hút trẻ em, lưu trữ tĩnh tại `public/assets/thumbnails/`.
- **Hero Slide Banner** (Slide biểu ngữ trang chủ): Trình chiếu slide ảnh hoạt họa giới thiệu các môn học với hiệu ứng chuyển động mượt mà tại trang chủ.
- **Leaderboard** (Bảng xếp hạng): Trang `/leaderboard` xếp hạng thi đua thân thiện cho học sinh dựa trên XP và Streak (chia theo Tuần và Toàn thời gian), hiển thị avatar/nickname hoạt hình dễ thương.
- **Image Prompt**: Câu mô tả chi tiết do AI sinh ra trong Lesson Config để developer tự tạo hình ảnh.
- **Distractor**: Các phương án sai/gây nhiễu do AI sinh sẵn trong Lesson Config.

## Decisions Log
- **Thiết kế hình ảnh môn học:** Mỗi môn học (Subject) sẽ có một hình thumbnail hoạt họa chất lượng cao có sẵn chữ tiêu đề cách điệu thay vì chỉ dùng emoji, nhằm tăng tính thu hút thị giác cho bé 6 tuổi.
- **Hero Section:** Thay thế icon emoji tĩnh bằng một Slide banner hoạt họa sinh động trình chiếu các môn học chính.
- **Leaderboard động viên thân thiện:** Bảng xếp hạng được tổ chức riêng tại trang `/leaderboard` hiển thị thông tin học viên bằng Nickname và Avatar hoạt hình để bảo vệ quyền riêng tư, xếp hạng theo XP & Streak tuần/toàn thời gian, và có phần động viên cá nhân hóa ở dưới cùng cho bé nằm ngoài Top 10.
- **Kiến trúc Admin CMS (Phase 2):** Toàn bộ 8 phân hệ quản trị sẽ được cấu trúc tập trung dưới route `/admin/*`, giao tiếp với Backend Spring Boot API và lưu trữ MySQL, sử dụng Next.js Route Handlers để bảo mật API key và Token JWT.
- **Xác thực và lưu tiến độ ban đầu:** Dùng Next.js Route Handlers + Prisma + MySQL 8 để triển khai tài khoản, session cookie HttpOnly, hồ sơ và snapshot tiến độ ngay trong Web App. Đây là backend vận hành ban đầu; API có thể được thay bằng Spring Boot sau này mà không thay đổi contract phía client (xem ADR 0003).
- **Kiến trúc dữ liệu:** Web App chỉ đọc tệp JSON (hoặc DB sau này), hoàn toàn không kết nối API AI theo thời gian thực để đảm bảo tốc độ và an toàn nội dung.
- **Quản lý đáp án sai:** AI sẽ sinh sẵn các Distractor thay vì thuật toán Web App tự sinh.
- **Loại hình bài học:** Xác định đây là Lesson Data (dữ liệu cấu trúc dành cho ứng dụng chạy mini-game), hoàn toàn không phải văn bản Markdown để phụ huynh đọc chay.
- **Kiến trúc Admin Dashboard (Phase 2):** Gộp chung giao diện Admin vào dự án Next.js hiện tại (route `/admin`) để tái sử dụng UI component và hỗ trợ tính năng Live Preview cho người tạo nội dung.
- **Chiến lược Fetch Data (Phase 2):** Dùng SSR / Incremental Static Regeneration (ISR) thông qua Next.js Server Components để gọi API đến Backend Java Spring Boot, nhằm tối ưu tốc độ tải trang cho học sinh, thay vì dùng `useEffect` ở client-side.
- **Data Structure cho Mini-games:** Cấu trúc `mini_games` trong Lesson Config là một **Array** thay vì Object. Điều này đảm bảo Pedagogical Flow (thứ tự xuất hiện của game) và hỗ trợ Multi-instance (nhiều game cùng loại trong một bài học). Được bảo vệ chặt chẽ bằng **Discriminated Unions** trong TypeScript.
- **Kiến trúc Game Engine (Separation of Concerns):** `LessonRunner` được thiết kế là một **Pure Orchestrator**, chỉ làm nhiệm vụ render game và quản lý state `currentIndex`. Tuyệt đối không gọi Context API hay trigger Gamification effects (Confetti, Audio). Việc lưu điểm (XP) và vinh danh được giao cho Route Page Adapter (`page.tsx`) xử lý qua callback `onAllGamesComplete` nhằm tránh Race Conditions và dễ dàng Unit Test/Tái sử dụng cho tính năng Admin Preview.
- **Chiến lược tích hợp Math Render & H5P theo giai đoạn:** Quyết định hoãn cấu hình Math Render (như KaTeX, MathJax) và H5P Server ở Giai đoạn 1 (Lớp 1 - trẻ 6 tuổi). Thay vào đó, sử dụng các custom React Components để thiết kế các hoạt động toán học trực quan (như đặt tính hàng dọc, trục số) sinh động giống Khan Academy. Việc tích hợp H5P và Math Render sẽ được thực hiện ở các giai đoạn sau (Lớp 2 - 5) (Xem chi tiết tại [ADR 0002](file:///Users/wanbi/Code/oss/projects/viettyping/docs/adr/0002-phased-math-render-h5p-strategy.md)).
- **Thiết kế component Toán đặt tính hàng dọc (Vertical Math):** Dạng Grid căn thẳng hàng chục và hàng đơn vị, ô nhớ (carry) động xuất hiện khi phép tính có nhớ/mượn. Nhập từ phải qua trái (đơn vị trước, chục sau), tự động focus chuyển ô khi đúng và báo lỗi đỏ tại chỗ khi sai chữ số.
- **Hướng dẫn gõ Telex động (Keystroke Bubble Hint):** Hiển thị bong bóng gợi ý tổ hợp phím Telex động (ví dụ `[a] + [s]` trên chữ `á`) ngay phía trên chữ đang cần gõ, cập nhật trạng thái phím đang gõ dở trong tổ hợp.
- **Phân phối âm thanh & hiệu ứng tương tác:** Component tương tác tự phát âm thanh phản hồi nhanh (Ting/Buzz) và chạy hiệu ứng cục bộ (wiggle/bounce) để tăng độ nhạy tương tác. Phần thưởng lớn (Confetti, XP, lên cấp) do Page Adapter cấp trên kiểm soát khi kết thúc toàn bộ bài học.

## Links & Resources
- Tài liệu cấu trúc bài học: `SYSTEM_PROMPT.md`
- Kế hoạch tiến độ: `docs/backlog/progress.md`
- PRD Kiến trúc Game Engine: `docs/PRD-GameController-Refactor.md`
