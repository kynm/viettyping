# 👨‍👩‍👧‍👦 Hướng Dẫn Đóng Góp (Contributing Guide)

Chào bạn - những ông bố, bà mẹ lập trình viên và các bạn trẻ đam mê EdTech! 

Cảm ơn bạn đã ghé thăm dự án **EasyTyping** - một phiên bản phát triển từ **VietTyping**, dự án bắt đầu từ tình yêu thương của một người bố dành cho con trai (bé Khoai Tây), với mong muốn giúp con làm quen với máy tính và luyện gõ phím tiếng Việt một cách lành mạnh, thú vị thông qua các bài học và mini-game.

> EasyTyping trân trọng ghi nhận tên gọi, nền tảng ban đầu và quyền tác giả của dự án VietTyping.

Việc phát triển EasyTyping dưới dạng một dự án mã nguồn mở (Open Source) là một cơ hội tuyệt vời để chúng ta cùng chung tay xây dựng một sân chơi bổ ích cho con em mình. Mọi đóng góp của bạn - dù là sửa một lỗi chính tả, cải tiến giao diện hay thêm một mini-game mới - đều vô cùng quý giá!

---

## 🚀 Hướng Dẫn Khởi Động Nhanh (Quick Start)

Dự án sử dụng **Next.js (App Router)**, **TypeScript** và **Tailwind CSS**. Bạn có thể thiết lập môi trường chạy thử dưới local chỉ với vài bước đơn giản:

### 1. Fork & Clone dự án
Nhấn nút **Fork** ở góc trên bên phải Repo này để tạo bản sao về tài khoản GitHub của bạn. Sau đó clone về máy:
```bash
git clone https://github.com/YOUR_USERNAME/viettyping.git
cd viettyping
```

### 2. Cài đặt các thư viện (Dependencies)
Sử dụng npm hoặc bun/yarn để cài đặt các package cần thiết:
```bash
npm install
```

### 3. Chạy dự án dưới local
Khởi động development server:
```bash
npm run dev
```
Mở trình duyệt và truy cập: **`http://localhost:3000`** (hoặc `http://localhost:3001` nếu cổng 3000 đang bận).

---

## 🛠️ Cấu Trúc Mã Nguồn (Project Structure)

Để dễ dàng tiếp cận dự án, dưới đây là các thư mục quan trọng bạn cần lưu ý:

```text
viettyping/
├── public/                 # Các file tĩnh (âm thanh .mp3, hình ảnh, icons)
├── src/
│   ├── app/                # Các Pages và Routing (Next.js App Router)
│   │   ├── lesson/         # Luồng học chính (Lesson Coordinator)
│   │   ├── parents/        # Bảng điều khiển dành cho cha mẹ
│   │   └── typing/         # Màn hình luyện gõ chung
│   ├── components/         # Các UI Components dùng chung
│   │   ├── activities/     # Các cấu phần trò chơi/hoạt động (Mini-game)
│   │   └── ui/             # Các khối nút bấm, hộp thoại chunky
│   ├── contexts/           # Quản lý State (XP, Streak, Âm thanh)
│   └── data/               # Cấu hình bài học tĩnh (Lesson config / JSON)
└── DESIGN.md               # Hệ thống thiết kế (Design Tokens) cho trẻ em
```

---

## 🎨 Chuẩn UI/UX Cho Trẻ Em (Bé 6 Tuổi)

Trẻ em học tốt nhất khi giao diện sinh động, phản hồi tức thì và nút bấm to rõ ràng. 

> [!IMPORTANT]
> Trước khi bắt tay vào code giao diện hoặc game mới, vui lòng đọc kỹ tài liệu **[DESIGN.md](file:///Users/wanbi/Code/oss/projects/viettyping/DESIGN.md)**. 
> Tài liệu này định nghĩa rõ các token màu sắc rực rỡ, thiết kế nổi khối (Neobrutalism), bo góc lớn, font chữ tiếng Việt `Be Vietnam Pro` thân thiện, và các nguyên tắc thiết kế giáo dục giúp trẻ không bị quá tải thông tin.

---

## 🤝 Quy Trình Đóng Góp (Contribution Flow)

Dự án luôn hoan nghênh sự đóng góp ở mọi khía cạnh:

1. **Về Ý tưởng & Thiết kế (UX/UI):** 
   - Đề xuất hoặc thiết kế các giao diện đẹp mắt hơn cho các mini-game hiện tại.
   - Thêm các hiệu ứng động, hình vẽ hoạt họa cuốn hút.
2. **Về Kỹ thuật & Tính năng (Code):**
   - Triển khai thêm các mini-game mới phù hợp với học sinh lớp 1.
   - Tối ưu hóa thuật toán phân tích tốc độ gõ phím, xử lý gõ Telex tiếng Việt.
   - Sửa lỗi, tối ưu hóa hiệu năng tải trang.
3. **Về Dữ liệu Bài học (Content):**
   - Đóng góp thêm bài học mới cho các môn Toán, Tiếng Việt, Âm nhạc, Tiếng Anh... tại thư mục [src/data](file:///Users/wanbi/Code/oss/projects/viettyping/src/data).

### Các bước gửi đóng góp (Submit PR)
1. Tạo một nhánh mới từ `main` với tên gợi nhớ:
   ```bash
   git checkout -b feature/ten-tinh-nang
   # hoặc
   git checkout -b bugfix/ten-loi
   ```
2. Thực hiện các chỉnh sửa của bạn. Đảm bảo tuân thủ tiêu chuẩn code (ESLint & TypeScript).
3. Commit các thay đổi với thông điệp rõ nghĩa:
   ```bash
   git commit -m "feat: thêm mini-game ghép thẻ chữ"
   ```
4. Push nhánh của bạn lên GitHub:
   ```bash
   git push origin feature/ten-tinh-nang
   ```
5. Truy cập Repo gốc và nhấn **Compare & pull request**. Hãy mô tả chi tiết những gì bạn đã làm và đính kèm hình ảnh/ảnh động (nếu có thay đổi UI).

---

## 💖 Cảm Ơn Các Bạn!
Mỗi dòng code, mỗi ý kiến đóng góp của bạn đều giúp **EasyTyping** hoàn thiện hơn, mang lại niềm vui học tập lành mạnh cho bé Khoai Tây và hàng ngàn bạn nhỏ khác tại Việt Nam.

Cùng nhau, chúng ta hãy xây dựng một mùa hè bổ ích cho các con! 🚀✨
