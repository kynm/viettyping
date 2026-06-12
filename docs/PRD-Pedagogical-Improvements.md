# PRD: Cải tiến Sư phạm & Rèn luyện Kỹ năng Chuyên biệt (Pedagogical & Fine Motor Skills Improvements)

## Problem Statement

Dựa trên nhận xét tổng kết từ giáo viên đối với trẻ 6 tuổi, hệ thống EasyTyping hiện tại đang thiếu các giải pháp hỗ trợ chuyên biệt cho các điểm yếu sau của học sinh:
1. **Tốc độ viết/gõ phím còn chậm**: Bài tập gõ phím hiện tại chỉ kiểm tra độ chính xác, chưa hỗ trợ theo dõi, đo lường hoặc khuyến khích tốc độ gõ phù hợp để giúp bé tăng tốc độ viết.
2. **Tính toán chưa cẩn thận & thiếu vận dụng thực tế**: Các bài tập toán học hiện tại chỉ ở dạng trắc nghiệm lý thuyết đơn giản, chưa liên hệ thực tiễn và chưa có cơ chế nhắc nhở trẻ kiểm tra kỹ lưỡng kết quả để rèn tính cẩn thận.
3. **Kỹ năng vận động tinh (Fine Motor Skills) chưa đều**: Nhận xét "tô màu còn chưa đều" phản ánh khả năng điều khiển tay của trẻ chưa khéo léo. Ứng dụng hiện tại chưa có hoạt động vẽ/tô màu tương tác để rèn luyện kỹ năng này.
4. **Sự tập trung trong giờ học còn hạn chế**: Trẻ dễ bị xao nhãng bởi các yếu tố UI xung quanh, thiếu động lực gamification thúc đẩy sự tập trung liên tục.

## Solution

Nâng cấp các tính năng giáo dục tương tác và cải tiến UX/UI nhắm mục tiêu khắc phục các vấn đề sư phạm nêu trên:
1. **Chế độ Luyện tốc độ gõ (Typing Speed Trial)**: Tích hợp hệ thống đo tốc độ WPM (Words Per Minute) được nhân cách hóa qua hình ảnh các loài vật chạy đua (Rùa, Thỏ, Báo) và cơ chế giới hạn thời gian sinh động.
2. **Bài tập Toán thực tế kéo thả (Drag & Drop Real Math)**: Xây dựng trò chơi đi chợ, chia kẹo trực quan thông qua kéo thả đối tượng vật lý, kèm cơ chế hướng dẫn bé tự rà soát lại kết quả (Second Chance).
3. **Hệ thống Tô màu tương tác thông minh (Coloring Canvas)**: Phát triển một Activity tô màu trên HTML5 Canvas giúp trẻ luyện cơ tay điều khiển chuột/ngón tay tô màu đều, không lem ngoài viền.
4. **Cơ chế Pomodoro Động & Giao diện Siêu tập trung (Focus Mode & Interactive Pomodoro)**: Tích hợp vòng lặp tập trung 15 phút và nghỉ ngơi 3 phút. Trong 15 phút tập trung, bé được đồng hành bởi một "hạt giống" lớn dần lên. Khi hết giờ, hệ thống khóa bài học và kích hoạt 3 phút giải lao tương tác (vận động nhẹ theo nhân vật 2D hoặc tập hát/nhận biết nốt nhạc).

## User Stories

### Rèn luyện tốc độ (Tiếng Việt & Tiếng Anh)
1. As a child, I want to see a cute animal (turtle, rabbit, cheetah) run across the screen based on my typing speed, so that I feel motivated to type faster without feeling stressed by raw speed numbers.
2. As a child, I want to play a "Time Attack" typing mode where I have to type a sentence before the timer bar runs out, so that I can practice my quick-writing reflex.
3. As a parent/teacher, I want to see the child's average words-per-minute (WPM) and accuracy in the final lesson summary, so that I can track their progress over time.

### Rèn luyện cẩn thận & Vận dụng (Toán)
4. As a child, I want to play a shopping game where I drag coins into a wallet or put apples into a basket to solve math problems, so that I can see how math applies to my daily life.
5. As a child, I want the system to give me a gentle visual hint when my answer is wrong instead of immediately telling me I failed, so that I learn to review and correct my work carefully.

### Rèn luyện vận động tinh (Mĩ thuật)
6. As a child, I want to use a virtual brush to color inside different animal outlines, so that I can practice my hand-eye coordination.
7. As a child, I want the app to detect if I color outside the lines or leave large uncolored areas and nudge me to fill them in, so that I can improve my coloring technique.

### Rèn luyện sự tập trung & Pomodoro (Trải nghiệm, Thể chất & Âm nhạc)
8. As a child, I want a distraction-free screen when I am typing or playing games, so that I can focus entirely on the learning task.
9. As a child, I want to unlock a special "Focus Star" or "Zen Badge" if I complete an activity without any major mistakes or delays, so that I feel rewarded for my attention span.
10. As a child, I want to see my seed grow into a big beautiful tree while I study for 15 minutes, so that I have a clear, fun visual of my study time.
11. As a child, I want the app to guide me through physical stretches or play a fun nursery song for 3 minutes after studying, so that my eyes and body can relax.
12. As a parent, I want the learning screens to be locked during the 3-minute break, so that my child is encouraged to stand up and rest instead of staring at the screen.

## Implementation Decisions

### 1. Modules & Giao diện mới

- **Module Đo tốc độ & Time Attack (`TypingSpeedController`)**:
  - Tích hợp bộ đếm thời gian gõ và tính toán WPM thời gian thực.
  - Render component hoạt ảnh con vật di chuyển:
    - `< 10 WPM`: Rùa con 🐢
    - `10 - 25 WPM`: Thỏ lém lỉnh 🐰
    - `> 25 WPM`: Báo tốc độ 🐆
  - Áp dụng `framer-motion` cho thanh thời gian đếm ngược co ngắn lại dần với các màu sắc cảnh báo (Xanh lá -> Vàng -> Đỏ).

- **Module Toán thực tế kéo thả (`RealWorldMathGame`)**:
  - Sử dụng `@dnd-kit/core` để xây dựng tương tác kéo thả.
  - Hỗ trợ các kịch bản bài học dạng: "Bỏ $N$ đồng xu vào ví", "Chia đều quả táo cho 2 bạn".
  - Triển khai cơ chế "Second Chance": Khi trẻ nhấn nút kiểm tra kết quả và bị sai, hệ thống sẽ rung nhẹ khung hình (Visual Shake) và làm nổi bật các đối tượng thừa/thiếu thay vì báo lỗi trực diện.

- **Module Canvas Tô màu (`ColoringCanvas`)**:
  - Sử dụng thẻ `<canvas>` HTML5 với SVG đường viền vẽ sẵn để tô màu các vùng khép kín.
  - Sử dụng thuật toán Flood Fill để tô màu vùng khép kín đối với chế độ Dễ, và chế độ Khó bắt buộc bé tự di màu (brush).
  - Thuật toán phân tích pixel để tính toán:
    - **Tỷ lệ bao phủ (Coverage %)**: diện tích đã tô màu so với diện tích trống trong khung hình.
    - **Tỷ lệ lem (Bleed %)**: diện tích tô màu chệch ra ngoài ranh giới cho phép của SVG.
  - Kích hoạt âm thanh bọt bong bóng vui tai khi cọ vẽ di chuyển để khuyến khích trẻ di đều tay.

- **Giao diện Tiêu điểm & Quản lý Pomodoro (`FocusModeLayout` & `FocusGardenTimer`)**:
  - Khi trẻ bước vào bài học, giao diện ẩn toàn bộ các thanh công cụ điều hướng ngoài luồng học (Kiosk-mode).
  - **Cơ chế Pomodoro Động (15 phút Học / 3 phút Nghỉ)**:
    - Trạng thái `FOCUS` (15 phút): Hiển thị một widget hạt giống nhỏ góc màn hình. Cây sẽ nảy mầm và nở hoa dựa trên phần trăm thời gian 15 phút trôi qua. Tích hợp bộ dò tìm nhàn rỗi (idle detector) quá 30 giây để hiển thị nhắc nhở sinh động nếu bé xao nhãng.
    - Trạng thái `BREAK` (3 phút): Khóa toàn bộ các bài học. Hiển thị màn hình giải trí thư giãn:
      - *Vận động thể chất (Physical stretches)*: Nhân vật hoạt họa hướng dẫn bé vươn vai, quay cổ, xoa mắt.
      - *Cảm thụ âm nhạc (Music break)*: Phát bài hát ngắn có nhịp điệu để bé tập hát theo.
  - Sau khi kết thúc 3 phút nghỉ, hệ thống chuông báo sẽ reo vang để dẫn dắt trẻ quay lại trạng thái học bài mới.
  - Cơ chế **Streak Protection**: Thiết kế pop-up nhắc nhở thân thiện nếu trẻ có dấu hiệu dừng tương tác quá 30 giây để khéo léo kéo sự tập trung của trẻ quay lại.

### 2. Cập nhật Schema & Telemetry

- **Cập nhật `TelemetryPayload`**:
  - Bổ sung các trường đo lường chất lượng học tập:
    ```typescript
    interface TelemetryPayload {
      score: number;
      durationSeconds: number;
      errors?: Array<{
        questionId: string;
        userAnswer: string;
        correctAnswer: string;
      }>;
      metadata?: {
        wpm?: number;               // Tốc độ gõ phím trung bình
        accuracy?: number;          // Độ chính xác gõ phím (%)
        mathRetries?: number;       // Số lần kiểm tra sai trong game Toán
        colorCoveragePercent?: number; // Tỷ lệ tô màu đều (%)
        colorBleedPercent?: number;    // Tỷ lệ tô màu lem (%)
        focusScore?: number;        // Điểm đánh giá sự tập trung (dựa trên thời gian nhàn rỗi)
      };
    }
    ```

## Testing Decisions

### Nguyên tắc kiểm thử
- Kiểm thử tích hợp (Integration Tests) giả lập luồng thao tác kéo thả của trẻ để đảm bảo tính toán đúng số lượng vật phẩm.
- Kiểm thử các hàm tiện ích (Utility Functions) tính toán WPM và tính tỷ lệ bao phủ điểm ảnh của canvas tô màu.

### Các thành phần được kiểm thử
1. **`Math Drag-and-Drop`**:
   - Sử dụng React Testing Library giả lập các sự kiện Pointer để thả vật phẩm vào mục tiêu và kiểm duyệt tính đúng đắn của phép tính.
2. **`Coloring Canvas pixel analysis`**:
   - Viết các Unit Test cho helper tính tỷ lệ pixel vẽ đè lên ranh giới viền SVG.
3. **`Typing WPM Calculation`**:
   - Test hàm tính toán WPM đảm bảo xử lý chính xác các trường hợp gõ ngắt quãng hoặc gõ quá nhanh.

## Out of Scope

- Triển khai chức năng vẽ tự do không theo khung hình.
- Xử lý nhận dạng chữ viết tay của bé bằng AI.
- Hệ thống xếp hạng thời gian thực giữa các học sinh.
