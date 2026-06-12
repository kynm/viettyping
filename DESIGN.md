# 🎨 Hệ Thống Thiết Kế Học Tập Phân Tầng Trực Quan (Tactile Tiered Learning)

Hệ thống thiết kế **EasyTyping** được phát triển từ VietTyping và xây dựng dựa trên triết lý **Tactile Play (Chơi mà học trực quan)**. Nó cân bằng giữa tính chất ngộ nghĩnh của một ứng dụng giáo dục cho trẻ em với cấu trúc tinh tế của một sản phẩm EdTech cao cấp. Giao diện người dùng mang lại cảm giác giống như một món đồ chơi vật lý—thân thiện, phản hồi nhanh và kích thích trẻ chạm vào.

Phong cách trực quan là **Tactile / Skeuomorphic Modernism (Hiện đại hóa Skeuomorphic / Trực quan nổi khối)**. Thiết kế tận dụng các khối nổi 3D nhẹ, các nút bấm lấy cảm hứng từ phím cơ (keycaps), kết hợp bảng màu ấm áp để giảm mỏi mắt cho trẻ. Mục tiêu cốt lõi là thúc đẩy cảm giác tiến bộ và thành tích thông qua các phân cấp độ khó của linh vật **"Animal Mastery" (Làm chủ động vật)**, sử dụng sự thay đổi màu sắc chủ đạo rõ rệt để báo hiệu cấp độ và trạng thái tiến bộ của bé.

---

## 📐 Nguyên Tắc Thiết Kế Cho Trẻ Em (Lớp 1 - Lớp 5)

1. **Target Tương Tác Lớn & Nổi Khối:** Mọi nút bấm, thẻ lựa chọn phải có vùng tương tác lớn, kết hợp với bóng đổ phẳng (chunky flat shadow) lệch trục (độ dày offset từ 4px đến 8px) tạo hiệu ứng keycap 3D rõ nét để trẻ cảm nhận được độ lún khi bấm cơ học.
2. **Phản Hồi Xúc Giác Trực Quan:** Khi phần tử được nhấn, nó sẽ dịch chuyển theo trục Y xuống từ 2px-4px, đồng thời bóng đổ dưới chân thu nhỏ lại để tạo phản hồi chân thực.
3. **Màu Sắc Ấm Áp Giảm Mỏi Mắt:** Màu nền luôn sử dụng các tông màu ấm áp (Ivory/Cream), hạn chế màu trắng tinh nhằm bảo vệ mắt trẻ nhỏ và giảm thiểu ánh sáng xanh.
4. **Phân Tầng Theo Màu Sắc Động Vật:** Tốc độ và cấp độ được phản ánh sinh động qua 4 linh vật cốt lõi với 4 màu sắc chủ đề riêng biệt.

---

## 🎨 Bảng Màu (Color Tokens)

Hệ thống thiết kế này sử dụng kiến trúc **Tiered Primary Architecture (Kiến trúc Màu chủ đạo Phân tầng)**. Trong khi màu nền (surface) và văn bản (text) được giữ cố định để bảo đảm tính nhất quán thương hiệu và bảo vệ mắt, thì mã màu `primary` sẽ thay đổi động theo từng cấp độ linh vật:

- **Surface (Nền):** Màu kem ngà (Ivory base) ấm áp, thân thiện như trang giấy.
- **Text (Chữ):** Màu nâu than đậm (Deep Charcoal-Brown) tạo độ tương phản cao nhưng dịu mắt, tránh cảm giác khô khan của màu đen thuần.
- **Bảng phân tầng Tier System:**
  - 🐼 **PandaTyper:** Màu Đỏ May Mắn (Bắt đầu - Beginner) - Mã màu `#e03131`
  - 🐢 **TurtleTyper:** Màu Xanh Lá Cây Ngọc (Kiên trì - Steady) - Mã màu `#006d30`
  - 🐰 **BunnyTyper:** Màu Cam Ấm Áp (Nhanh nhẹn - Fast) - Mã màu `#8f4e00` (Container màu `#ff9f43`)
  - 🐆 **LeopardTyper:** Màu Vàng Gold (Thần tốc - Elite) - Mã màu `#7a5900`

---

## ✍️ Phông Chữ (Typography)

Dự án sử dụng phông chữ **Plus Jakarta Sans** làm mặc định trên toàn bộ hệ thống để đảm bảo nét chữ tròn trịa, hiện đại, hình học rõ ràng và dễ đọc đối với trẻ nhỏ đang tập chữ:

- **Tiêu đề siêu lớn (Display & Headlines):** Độ dày cực đậm (fontWeight: 700 - 800) tạo phân cấp chữ rõ ràng, bắt mắt giống như các sticker dán.
  - Cỡ chữ: `48px` (desktop), `24px` - `32px` (mobile).
- **Văn bản nội dung (Body):** Mặc định ở kích thước `18px` (body-lg) hoặc `16px` (body-md) để hiển thị sắc nét trên iPad/máy tính bảng và máy tính để bàn.
- **Nhãn chức năng (Labels):** Định dạng in hoa (label-caps / label-bold), đậm nét và giãn chữ nhẹ để tạo cảm giác giống nhãn dán trên các phím cơ vật lý.

---

## 🧱 Các Thành Phần Giao Giao Diện Cơ Bản (Tactile Components)

### 1. Nút bấm Keycap 3D
Nút bấm luôn có độ dày viền và bóng đổ lệch trục. Phản hồi nhún chân thực khi bấm chuột.
*   **Màu sắc:** Sử dụng màu primary của chủ đề hiện tại.
*   **Shadow:** Sử dụng mã màu đậm hơn 20% của màu primary hiện tại với độ dày 4px-8px.
*   **Chuyển động (Active):** Khi click hoặc gõ phím tương ứng, dịch chuyển Y-axis xuống 2px-4px.

### 2. Thẻ nội dung (Cards)
Sử dụng màu nền giấy ngà ấm áp với viền mỏng và bóng đổ nhẹ ở đáy (2px) để tạo cảm giác nổi trên mặt bàn học. Tất cả các thẻ đều được bo góc cực sâu với `rounded-xl` (16px).

### 3. Vùng nhập liệu & Bàn phím ảo
*   Bàn phím ảo phải mô phỏng trực quan các phím vật lý đang gõ.
*   Khi trẻ gõ đúng ký tự, phím ảo tương ứng sẽ chuyển màu `primary` của chủ đề hiện tại và nhún xuống.

### 4. Khung chứa Linh Vật & Kỹ thuật Hiệu ứng Pop-out (Out of Bounds)
Để tạo ấn tượng thị giác mạnh mẽ (tương tự như hiệu ứng quảng cáo xe máy 3D), linh vật không bị nhốt trong hộp vuông hay hình tròn kín, mà được thiết kế **nổi hẳn ra ngoài biên của khung nền** theo các nguyên tắc sau:
*   **Cấu trúc phân lớp (Layering Structure):**
    *   **Container ngoài cùng:** Phải được thiết kế có `position: relative`, và tuyệt đối **không sử dụng `overflow-hidden`** để phần nhô ra ngoài của linh vật không bị cắt cụt.
    *   **Khung nền phía sau (Background Card):** Có chiều cao nhỏ hơn container ngoài (thường chiếm từ 75% - 80% chiều cao), nằm sát đáy (`absolute bottom-0 w-full z-0`). Khung nền này sử dụng màu sắc chủ đề rực rỡ hoặc màu nhạt đồng bộ môn học (`bgLight50`).
    *   **Linh vật (DinoMascot/PNG Image):** Đặt ở lớp trên cùng (`z-10` hoặc `z-20`), có kích thước lớn hơn khung nền, nhô hẳn phần đầu và nửa thân trên lên trên viền của khung nền (sử dụng định vị tuyệt đối hoặc biên dịch âm như `absolute -top-12` hoặc `bottom-10`).
*   **Hiệu ứng đổ bóng 3D (3D Depth Shadow):**
    *   Sử dụng bộ lọc CSS `filter: drop-shadow(...)` trực tiếp lên hình ảnh PNG trong suốt của linh vật (thay vì `box-shadow` thông thường trên thẻ div bọc ngoài). Bộ lọc này đổ bóng theo đúng đường viền của cơ thể linh vật lên khung nền phía sau và mặt đất, tạo chiều sâu 3D chân thực.
    *   Mức đổ bóng chuẩn: `drop-shadow-[0_10px_15px_rgba(0,0,0,0.3)]`.
*   **Tương tác xúc giác & Chuyển động (Tactile & Micro-animations):**
    *   **Mặc định:** Linh vật đung đưa hoặc nhấp nhô nhẹ nhàng bằng CSS keyframe animation (`animate-dino-body` hoặc `animate-dino-victory`).
    *   **Khi rê chuột (Hover):** Linh vật tự động phóng to nhẹ và nhô lên cao hơn nữa để phản hồi tương tác (`transform hover:scale-110 hover:-translate-y-1 transition-all duration-300`).
*   **Tính Đồng Bộ Thiết Kế:**
    *   Các nhãn chữ (như tên Cấp độ hoặc tên Linh vật) luôn được bo góc tròn kiểu sticker dính (`rounded-full`), có viền dày và đổ bóng phẳng, nằm đè ở chân linh vật hoặc đè lên viền của khung nền để tăng tính liên kết vật lý.

---

## 📝 Tài Nguyên Prompt AI Sinh Ảnh Đồ Họa 3D (Phong Cách Pixar/Disney)

Để duy trì tính đồng bộ trực quan cao cấp trên toàn hệ thống EasyTyping, dưới đây là bộ khung prompt (prompt template) chất lượng cao đã được tối ưu hóa để sinh ảnh minh họa 3D cho linh vật và các môn học khác.

### 1. Khung Prompt Sinh Linh Vật (Mascot Template)
> Dùng để tạo hình ảnh linh vật đơn lẻ trên nền trơn sáng màu, hỗ trợ việc tách nền và làm hình đại diện.

```text
A cute 3D cartoon baby [TÊN_CON_VẬT] character (mascot named [TÊN_LINH_VẬT]), Pixar or Disney animation style, big sparkling eyes, friendly smile, [ĐẶC_ĐIỂM_NỔI_BẬT_NHƯ_ĐEO_KÍNH_HOẶC_NƠ], studio lighting, soft shadows, volumetric lighting, high depth of field, detailed [VẢI_LÔNG_HOẶC_DA] texture, isolated on a light solid background, front-facing view, extremely adorable and appealing to 6-year-old children.
```

**Ví dụ thực tế đã áp dụng:**
*   **Khủng Long Siêu Phàm (Dino):** `A cute 3D cartoon baby green dinosaur character (mascot named Dino), Pixar or Disney animation style, big sparkling eyes, friendly smile, studio lighting, soft shadows, volumetric lighting, high depth of field, detailed scales texture, isolated on a light solid background, front-facing view, extremely adorable and appealing to 6-year-old children.`
*   **Gấu Trúc Thông Thái (Panda):** `A cute 3D cartoon baby panda character (mascot named Panda), Pixar or Disney animation style, big sparkling eyes, friendly smile, carrying or wearing small round glasses, studio lighting, soft shadows, volumetric lighting, high depth of field, detailed fur texture, isolated on a light solid background, front-facing view, extremely adorable and appealing to 6-year-old children.`

---

### 2. Khung Prompt Sinh Thumbnail Môn Học (Subject Thumbnail Template)
> Dùng để tạo các bức tranh hoạt cảnh có chiều sâu, kết hợp linh vật với các đối tượng/kiến thức môn học cụ thể.

```text
A cute 3D cartoon baby [TÊN_CON_VẬT] character [HÀNH_ĐỘNG_CỦA_CON_VẬT]. Volumetric 3D colorful [ĐỐI_TƯỢNG_MÔN_HỌC_BAY_LƯỢN] floating in the air. Pixar or Disney animation style, big sparkling eyes, friendly smile, studio lighting, soft shadows, volumetric lighting, high depth of field, detailed [BỐI_CẢNH_PHÙ_HỢP] background, extremely adorable and appealing to 6-year-old children.
```

**Các prompt chất lượng đã dùng trong ứng dụng:**
*   **Môn Luyện Gõ 10 Ngón (Khủng Long):** `A cute 3D cartoon baby green dinosaur character excitedly typing on a colorful glowing mechanical computer keyboard. Volumetric bubble letters of the alphabet flying out from the keyboard. Pixar or Disney animation style, big sparkling eyes, friendly smile, studio lighting, soft shadows, volumetric lighting, high depth of field, detailed keyboard keys, isolated on a soft colorful background, extremely adorable and appealing to 6-year-old children.`
*   **Môn Toán Học (Gấu Trúc):** `A cute 3D cartoon baby panda character wearing small round glasses, excitedly pointing to a blackboard with simple math equations like '3 + 4 = 7' and '1 + 1 = 2'. Volumetric colorful 3D numbers floating in the air. Pixar or Disney animation style, big sparkling eyes, friendly smile, studio lighting, soft shadows, volumetric lighting, high depth of field, detailed classroom background, extremely adorable and appealing to 6-year-old children.`
*   **Môn Tiếng Việt (Rùa Con):** `A cute 3D cartoon baby turtle character with a green shell, reading a colorful picture book under a tropical tree. Volumetric 3D colorful Vietnamese alphabet letters like 'A', 'Ă', 'Â', 'B', 'C' floating in the air. Pixar or Disney animation style, big sparkling eyes, friendly smile, studio lighting, soft shadows, volumetric lighting, high depth of field, detailed grassy background with cute flowers, extremely adorable and appealing to 6-year-old children.`
*   **Môn Âm Nhạc (Thỏ Ngọc):** `A cute 3D cartoon baby white rabbit character wearing a little bow, happily singing into a microphone and dancing. Colorful 3D musical notes and sparkles floating in the air. Pixar or Disney animation style, big sparkling eyes, friendly smile, studio lighting, soft shadows, volumetric lighting, high depth of field, playful background with soft lights, extremely adorable and appealing to 6-year-old children.`
*   **Môn Đạo Đức (Báo Đốm):** `A cute 3D cartoon baby leopard character with yellow fur and black spots, gently holding a big glowing red heart with its paws, symbolizing love and kindness. Pixar or Disney animation style, big sparkling eyes, friendly smile, studio lighting, soft shadows, volumetric lighting, high depth of field, warm and cozy colorful background with sparkles, extremely adorable and appealing to 6-year-old children.`


