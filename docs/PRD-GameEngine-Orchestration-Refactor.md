# PRD: Tái cấu trúc Game Engine & Bộ điều phối bài học (Game Engine & Lesson Coordinator Refactor)

## Problem Statement

Hiện tại, ứng dụng EasyTyping đang gặp phải các vấn đề về kiến trúc liên quan đến cách điều phối bài học (Lesson Orchestration) và sự không nhất quán giữa hai luồng học tập:
1. **Sự phân mảnh và trùng lặp luồng học tập**: Hệ thống tồn tại song song hai luồng điều phối: `ActivityView.tsx` (dùng cho các môn học truyền thống) và chuỗi các trang route `/lesson`, `/lesson/typing`, `/lesson/games` phối hợp cùng `LessonRunner.tsx` (dùng cho cấu hình bài học `LessonConfig` mới).
2. **Logic điều phối bị phân tán (Mất Locality)**: Logic quản lý trạng thái bài học (nhận diện hoàn thành flashcards, tính điểm XP, mở khóa huy hiệu badge, chuyển trang) hiện nằm rải rác ở các trang route (`page.tsx`). Điều này khiến mã nguồn của các trang route bị phình to, khó bảo trì và không thể viết Unit Test/Integration Test cho toàn bộ vòng đời của một bài học (Lesson) mà không phải dựng toàn bộ hệ thống định tuyến (Routing) của Next.js.
3. **Thiếu cơ chế thu thập dữ liệu (Telemetry) chuẩn hóa**: Các component trò chơi (`MatchingGame`, `TrueFalseGame`...) và các hoạt động học tập (`QuizActivity`, `DrawingActivity`...) giao tiếp kết quả thông qua các callback khác nhau, gây khó khăn cho việc tích hợp API lưu trữ telemetry lên backend Java Spring Boot ở Phase 2.

## Solution

Tái cấu trúc lại Game Engine và cơ chế điều phối bài học bằng cách:
1. **Xây dựng bộ điều phối thống nhất `LessonCoordinator`**: Một **Deep Module** quản lý toàn bộ vòng đời của bài học (Flashcard -> Luyện gõ phím -> Mini-games -> Stats Summary -> Complete Popup) tại một nơi duy nhất. Module này nhận cấu hình `LessonConfig` và điều phối việc hiển thị giao diện qua các transition mượt mà của `framer-motion`.
2. **Xây dựng Unified Game Adapter Bridge**: Thiết kế một **Seam** (ranh giới) chung cho tất cả các trò chơi và hoạt động giáo dục. Thống nhất interface đầu vào và dữ liệu telemetry đầu ra (`TelemetryPayload`) để chuẩn bị cho việc tích hợp API ở Phase 2.
3. **Đơn giản hóa các Route Pages**: Biến các trang route thành các **Adapters** cực kỳ mỏng, chỉ làm nhiệm vụ nạp dữ liệu bằng Next.js Server Components (SSR/ISR) và truyền vào `LessonCoordinator`, đồng thời lắng nghe callback hoàn thành để cập nhật context và gửi telemetry.

## User Stories

### Trải nghiệm của học sinh (6 tuổi)
1. Lớp học sinh 6 tuổi muốn quá trình chuyển tiếp từ đọc Flashcards sang Luyện gõ phím và chơi Mini-games diễn ra ngay trên một màn hình mượt mà, để bé không bị phân tâm hoặc mất hứng thú do thời gian tải trang của trình duyệt.
2. Học sinh muốn nhìn thấy thanh tiến độ (Progress Bar) liên tục phản ánh chính xác vị trí của mình trong suốt cả bài học (gồm cả Flashcard, gõ phím và game), giúp bé dễ dàng biết mình sắp hoàn thành bài học chưa.
3. Học sinh muốn khi hoàn thành mỗi mini-game, bé nhận được phản hồi âm thanh vui tai và hiệu ứng động nhẹ nhàng ngay lập tức trước khi chuyển sang game tiếp theo.
4. Học sinh muốn khi hoàn thành tất cả các hoạt động trong bài học, bé được chào đón bằng màn hình chúc mừng rực rỡ (bắn pháo hoa confetti, âm thanh reo hò) và bảng tổng kết rõ ràng, giúp bé cảm thấy tự hào và có động lực học tiếp.

### Trải nghiệm của Quản trị viên (Admin / Giáo viên)
5. Admin muốn tính năng Live Preview trên Admin Dashboard chạy chính xác cùng một bộ điều phối `LessonCoordinator` như ứng dụng thực tế của học sinh, để có thể xem trước chính xác trải nghiệm bài học mà không cần lưu trữ hay chuyển hướng trang web.
6. Giáo viên muốn hệ thống ghi nhận chính xác thời gian bé hoàn thành từng trò chơi và các lỗi sai cụ thể của bé (ví dụ: các từ ghép sai, các từ gõ sai), để giáo viên có thể đánh giá đúng tiến trình nhận thức của học sinh.

### Trải nghiệm của Nhà phát triển (Developer)
7. Developer muốn khi thêm một trò chơi mini-game mới (ví dụ: game nối từ, kéo thả mảnh ghép mới), chỉ cần tạo một component trò chơi thỏa mãn interface của `GameAdapter` mà không phải sửa đổi hay can thiệp vào logic điều phối luồng cốt lõi của `LessonCoordinator`.
8. Developer muốn có khả năng viết Unit Test độc lập cho luồng bài học (từ đầu đến cuối) bằng cách mock dữ liệu `LessonConfig` và chạy mô phỏng hành vi của người dùng ngay trên component `LessonCoordinator`.

## Implementation Decisions

### 1. Module và Interface mới

- **`LessonCoordinator` Component**:
  - Giao diện đầu vào (Props Interface):
    ```typescript
    interface LessonCoordinatorProps {
      config: LessonConfig;
      onActivityComplete?: (activityId: string, telemetry: TelemetryPayload) => void;
      onAllActivitiesComplete: (summary: LessonSummary) => void;
      initialStep?: LessonStep;
    }
    ```
  - Logic nội bộ: Quản lý trạng thái bước hiện tại (`flashcards` | `typing_practice` | `mini_games` | `summary`). Điều khiển việc hiển thị màn hình con tương ứng.

- **Unified Game Seam (`GameAdapterProps`)**:
  - Định nghĩa interface chuẩn hóa cho tất cả các mini-games và activities:
    ```typescript
    interface TelemetryPayload {
      score: number;
      durationSeconds: number;
      errors?: Array<{
        questionId: string;
        userAnswer: string;
        correctAnswer: string;
      }>;
      metadata?: Record<string, any>;
    }

    interface GameAdapterProps<T> {
      gameConfig: T;
      onComplete: (telemetry: TelemetryPayload) => void;
      onProgressUpdate?: (percent: number) => void;
    }
    ```

### 2. Các thay đổi và điều chỉnh kiến trúc

- **Hợp nhất Mini-game Components**:
  - Cập nhật các game `MatchingGame`, `TrueFalseGame`, `SpinWheelGame`, `FillInTheBlankGame`, `MultipleChoiceGame` để tuân thủ `GameAdapterProps`. Chúng sẽ trả về đầy đủ `TelemetryPayload` (ví dụ: thời gian thực tế hoàn thành và chi tiết các câu trả lời sai) thay vì chỉ gọi callback `onComplete()` trống rỗng như trước.
- **Tách biệt logic trong các trang Route**:
  - Đơn giản hóa `/lesson/page.tsx` để biến nó thành trang tổng hợp hoặc trang đích nạp `LessonCoordinator`. Các route con `/lesson/typing` và `/lesson/games` có thể được loại bỏ hoặc giữ lại làm các adapter độc lập cho mục đích học tập chuyên biệt (nếu cần), nhưng luồng bài học chính sẽ chạy tập trung trên một màn hình duy nhất dưới sự điều phối của `LessonCoordinator`.
- **Tập trung hóa State gamification**:
  - Logic phân bổ XP, streak và mở khóa badge sẽ được kích hoạt thông qua callback `onAllActivitiesComplete` của `LessonCoordinator` trên trang route cha. Tránh việc các component con trực tiếp gọi Context API (`useLesson`) nhằm duy trì tính độc lập tối đa cho Engine chạy bài học.

## Testing Decisions

### Nguyên tắc kiểm thử
- Tập trung vào kiểm thử hành vi đầu ra (Behavioral Testing) thay vì kiểm tra chi tiết cấu trúc code bên trong.
- Đảm bảo ranh giới kiểm thử nằm ở các giao diện công khai (Interfaces).

### Các Module được kiểm thử
1. **`LessonCoordinator`**:
   - Sử dụng React Testing Library để viết integration test.
   - Giả lập (Mock) cấu hình `LessonConfig` đầu vào.
   - Kiểm tra hành vi chuyển đổi màn hình: Flashcards -> Nhấn nút tiếp tục -> Typing Practice -> Hoàn thành -> Mini-games -> Hoàn thành tất cả -> Hiển thị Popup chúc mừng và gọi đúng callback `onAllActivitiesComplete` với đầy đủ dữ liệu tổng kết.
2. **Các Game Adapters**:
   - Viết các test độc lập cho từng game (ví dụ: `MatchingGame.test.tsx`, `TrueFalseGame.test.tsx`).
   - Xác minh rằng khi người chơi hoàn thành tất cả các thử thách trong game, adapter bắn ra đúng sự kiện `onComplete` kèm theo `TelemetryPayload` hợp lệ.

## Out of Scope

- Phát triển phần API Endpoint lưu trữ dữ liệu telemetry trên Java Spring Boot (Phase 2).
- Thiết kế giao diện quản trị Form UI trên Admin Dashboard (sẽ được thực hiện trong một PRD khác về CMS Động).
- Thay đổi cấu trúc cơ sở dữ liệu MySQL để lưu trữ tiến trình học tập của trẻ.

## Further Notes

- Đảm bảo tất cả các hiệu ứng chuyển đổi màn hình (Exit/Enter transitions) trong `LessonCoordinator` sử dụng `<AnimatePresence>` của `framer-motion` để tạo cảm giác mượt mà và trực quan cho trẻ 6 tuổi.
- Sử dụng các hình ảnh minh họa sống động và bảng màu rực rỡ (Curated Color Palettes) để kích thích thị giác của trẻ theo đúng tinh thần của thiết kế EdTech.
