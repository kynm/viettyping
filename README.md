# VietTyping - Luyện Gõ Phím Đa Môn Học Cho Học Sinh Lớp 1

Một ứng dụng web tương tác được thiết kế chuyên biệt để giúp trẻ em (đặc biệt là học sinh lớp 1) rèn luyện kỹ năng **gõ phím máy tính**, đồng thời ôn tập và tiếp thu kiến thức của **tất cả các môn học cơ bản** một cách thú vị và hiệu quả.

## 🎯 Tính năng chính & Triết lý giáo dục

### ⌨️ Luyện Gõ Phím Là Cốt Lõi:
Toàn bộ hệ thống bài học và mini-game được tối ưu hóa cho thao tác gõ phím. Trẻ vừa học chữ, làm toán, tìm hiểu thế giới, vừa hình thành phản xạ gõ phím chính xác từ nhỏ.

### 📚 Bao phủ toàn bộ môn học Lớp 1:

1. **Tiếng Việt** - Gõ bảng chữ cái, tập đánh vần, gõ từ vựng và câu ngắn.
2. **Toán** - Gõ các phép tính cộng trừ, số học cơ bản (Ví dụ: gõ `1 + 1 = 2`).
3. **Tự nhiên và xã hội** - Gõ tên các loài vật, cây cối, hiện tượng thiên nhiên.
4. **Đạo đức** - Gõ các từ khóa về giá trị sống, câu chào hỏi lễ phép.
5. **Âm nhạc** - Gõ tên nốt nhạc, lời bài hát ngắn.
6. **Hoạt động trải nghiệm** - Gõ các từ khóa kỹ năng sống cơ bản.
7. **Tiếng Anh** - Luyện gõ từ vựng Tiếng Anh căn bản.
8. **Mỹ thuật** - Gõ tên các màu sắc, hình khối.

## 🚀 Cách sử dụng

1. **Khởi động**: Nhấn "Bắt đầu học ngay!" từ màn hình chào mừng.
2. **Chọn môn học**: Trẻ chọn môn học muốn ôn tập (ví dụ: Toán, Tiếng Việt) hoặc chọn mục luyện gõ chung.
3. **Chọn bài học/chủ đề**: Hệ thống sẽ tải dữ liệu cấu hình bài học của môn đó.
4. **Luyện gõ phím**: Trẻ tương tác với các trò chơi (gõ từ đang xuất hiện, điền vào chỗ trống bằng bàn phím, hoặc trắc nghiệm bằng cách nhấn phím số 1-4) để vượt qua thử thách.
5. **Nhận thưởng**: Theo dõi tiến độ, nhận XP và Huy hiệu khi gõ nhanh, chính xác.

## 🎨 Đặc điểm nổi bật

- **Giao diện thân thiện**: Thiết kế đẹp mắt và dễ sử dụng cho trẻ em
- **Tương tác cao**: Nhiều loại hoạt động khác nhau
- **Phân cấp độ khó**: Từ dễ đến khó phù hợp với từng lứa tuổi
- **Theo dõi tiến độ**: Hiển thị tiến độ học tập rõ ràng
- **Responsive**: Hoạt động tốt trên mọi thiết bị

## 🛠️ Công nghệ sử dụng

- **Next.js 15** - Framework React cho web
- **TypeScript** - Ngôn ngữ lập trình có type-safe
- **Tailwind CSS** - Framework CSS utility-first
- **React Icons** - Thư viện icon cho React

## 📋 Yêu cầu hệ thống

- Node.js 18+
- npm hoặc yarn
- Trình duyệt web hiện đại

## 🏃‍♂️ Cài đặt và chạy

```bash
# Clone repository
git clone [repository-url]

# Di chuyển vào thư mục dự án
cd viettyping

# Cài đặt dependencies
npm install

# Chạy ứng dụng ở chế độ development
npm run dev

# Mở trình duyệt và truy cập http://localhost:3000
```

### Đăng nhập và MySQL

Ứng dụng dùng Prisma và MySQL trên `127.0.0.1:3306` để lưu tài khoản, hồ sơ học sinh, tiến độ, XP và huy hiệu. Tài khoản đăng nhập bằng username chữ thường không dấu, không yêu cầu email.

```bash
# Tạo file .env từ mẫu và sửa thông tin kết nối MySQL
cp .env.example .env

# Tạo database trước, sau đó chạy migration
npm run db:generate
npm run db:deploy

# Khởi động ứng dụng
npm run dev
```

Mỗi tài khoản có dữ liệu học tập riêng. Khi đăng nhập lần đầu, dữ liệu cũ trong trình duyệt sẽ được chuyển lên MySQL nếu tài khoản chưa có dữ liệu; khi đăng xuất, dữ liệu local của học sinh được xóa khỏi trình duyệt.

## 📚 Cấu trúc dữ liệu

### Môn học (Subject)

```typescript
interface Subject {
  id: string; // ID duy nhất
  name: string; // Tên môn học
  description: string; // Mô tả
  icon: string; // Emoji icon
  color: string; // Màu gradient
  topics: Topic[]; // Danh sách chủ đề
  grade?: string; // Khối lớp
}
```

### Chủ đề (Topic)

```typescript
interface Topic {
  id: string; // ID duy nhất
  title: string; // Tiêu đề chủ đề
  description: string; // Mô tả
  content: string; // Nội dung học
  activities: Activity[]; // Danh sách hoạt động
  difficulty: 'easy' | 'medium' | 'hard'; // Độ khó
  estimatedTime: number; // Thời gian ước tính (phút)
}
```

### Hoạt động (Activity)

```typescript
interface Activity {
  id: string; // ID duy nhất
  type:
    | 'typing'
    | 'quiz'
    | 'drawing'
    | 'listening'
    | 'reading'
    | 'math'
    | 'game';
  title: string; // Tiêu đề hoạt động
  content: string; // Nội dung
  instructions: string; // Hướng dẫn
  targetScore?: number; // Điểm mục tiêu
  timeLimit?: number; // Giới hạn thời gian (giây)
}
```

## 🚀 Giai đoạn 2 (Phase 2): Quản trị dữ liệu động & Hoàn thiện luồng học

Sau khi hoàn thành bộ khung tĩnh ở Phase 1, Phase 2 sẽ tập trung vào:
1. **Hệ thống Quản trị (Admin Panel) & Headless CMS:**
   - Tích hợp một Headless CMS (như Sanity, Supabase) hoặc tự xây dựng Admin Dashboard bằng Next.js.
   - Hỗ trợ giáo viên/phụ huynh quản lý, tạo mới và upload các bài học dưới dạng JSON động (Lesson Config) mà không cần can thiệp vào code gốc.
2. **Tinh chỉnh luồng học (Flow Refinement):**
   - Bổ sung **Màn hình Tổng kết (Stats Summary)** sinh động (hiệu ứng Confetti, XP, Streak, số từ gõ đúng) ngay sau khi bé hoàn thành phần Luyện gõ (TypingPractice) trước khi chuyển qua Mini-games.
3. **Lưu trữ dữ liệu (Database Integration):**
   - Kết nối Database để lưu trữ đồng bộ tiến độ học tập thực tế và tài khoản học sinh.

## 🎯 Lộ trình phát triển

- [x] Hệ thống môn học cơ bản
- [x] Hoạt động gõ phím
- [x] Hoạt động trắc nghiệm cơ bản
- [x] Giao diện responsive
- [x] Hệ thống âm thanh
- [x] Lưu tiến độ học tập
- [ ] Chế độ chơi nhóm
- [x] Báo cáo chi tiết cho phụ huynh
- [ ] Thêm animation và hiệu ứng
- [ ] Hỗ trợ offline

## 👨‍👩‍👧‍👦 Đối tượng sử dụng

- **Học sinh lớp 1-5**: Học tập các môn học cơ bản
- **Phụ huynh**: Hỗ trợ con em học tập tại nhà
- **Giáo viên**: Công cụ hỗ trợ giảng dạy

## 🤝 Đóng góp (Contributing)

Dự án VietTyping luôn chào đón mọi sự đóng góp từ cộng đồng, đặc biệt là từ các ông bố, bà mẹ lập trình viên muốn xây dựng một ứng dụng học tập tuyệt vời cho con em mình.

* **Hướng dẫn cài đặt & gửi đóng góp**: Xem chi tiết tại [CONTRIBUTING.md](file:///Users/wanbi/Code/oss/projects/viettyping/CONTRIBUTING.md).
* **Quy chuẩn thiết kế giao diện trẻ em**: Xem các token và quy tắc UX/UI tại [DESIGN.md](file:///Users/wanbi/Code/oss/projects/viettyping/DESIGN.md).

## 📞 Liên hệ

Nếu bạn có thắc mắc hoặc đề xuất, vui lòng tạo issue trên GitHub repository.

---

**Chúc các bé học tập vui vẻ và hiệu quả! 🎉**

