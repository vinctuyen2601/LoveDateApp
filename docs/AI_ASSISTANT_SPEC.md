# Trợ lý AI — Đặc tả chức năng

> Mục tiêu: Người dùng cảm nhận đây là một người trợ lý thật sự hiểu họ — không phải chatbot trả lời chung chung, không phải thông báo máy móc.

---

## Triết lý thiết kế

| Nguyên tắc | Giải thích |
|---|---|
| **Chủ động, không bị động** | Trợ lý biết lịch của user, tự nhắc đúng lúc — không cần user hỏi |
| **Cá nhân hoá theo lịch sử** | Nhớ những gì đã xảy ra, gợi ý dựa trên context thực của user |
| **Tone phù hợp từng tình huống** | Trang trọng (ngày giỗ), vui vẻ (sinh nhật bạn), lãng mạn (kỷ niệm) |
| **Ngắn gọn khi đủ, chi tiết khi cần** | Không verbose — đôi khi 1 câu là đủ |
| **Biết giới hạn** | Không pretend biết tất cả, hỏi lại khi thiếu thông tin |

---

## Danh sách chức năng

### F1 — Nhập liệu bằng ngôn ngữ tự nhiên

**Mô tả:**
Thay vì điền form nhiều bước, user có thể gõ/nói một câu để tạo sự kiện.

**Ví dụ input → output:**
```
"Sinh nhật mẹ 15 tháng 8"
→ Tạo sự kiện: Sinh nhật Mẹ | 15/08 | Hằng năm | Nhắc 7 ngày & 1 ngày trước

"Giỗ ông nội âm 10/3"
→ Tạo sự kiện: Ngày giỗ Ông Nội | 10/03 Âm lịch | Hằng năm

"Kỷ niệm 2 năm yêu nhau là 20/11/2022"
→ Tạo sự kiện: Kỷ niệm 2 năm | 20/11/2022 → tính lại hằng năm từ đó
```

**Flow xử lý:**
1. AI parse câu → trích xuất: loại sự kiện, tên, ngày, lịch dương/âm
2. Hiển thị card xác nhận để user review trước khi lưu
3. Nếu thiếu thông tin → hỏi thêm 1 câu ("Sinh nhật ai vậy bạn?")

**Trường hợp biên:**
- Ngày không rõ ("sinh nhật ba khoảng cuối tháng 9") → hỏi ngày cụ thể
- Sự kiện đã tồn tại → cảnh báo trùng, hỏi có muốn cập nhật không
- Câu không liên quan → trả lời lịch sự, redirect về chức năng hỗ trợ

---

### F2 — Nhắc nhở thông minh có context

**Mô tả:**
Thông báo không chỉ là tên sự kiện + ngày, mà kèm thông tin có ý nghĩa giúp user chuẩn bị tốt hơn.

**Ví dụ thông báo:**

| Sự kiện | Thông báo thông thường | Thông báo thông minh |
|---|---|---|
| Sinh nhật Ba | "Sinh nhật Ba ngày mai" | "Sinh nhật Ba ngày mai — năm nay Ba tròn 65 tuổi 🎂" |
| Kỷ niệm | "Kỷ niệm ngày mai" | "Ngày mai là kỷ niệm 3 năm của bạn và [tên]. Bạn đã có kế hoạch chưa?" |
| Ngày giỗ | "Ngày giỗ Bà ngày mai" | "Ngày mai là ngày giỗ thứ 5 của Bà. Hãy dành một khoảnh khắc nhớ về Bà 🕯️" |

**Các loại context bổ sung:**
- Số năm (tròn, đặc biệt)
- Ghi chú / kỷ niệm từ năm trước (nếu user đã ghi)
- Khoảng cách địa lý nếu đã cài đặt (tính năng tương lai)

**Thời điểm gửi nhắc:**
- N ngày trước (do user cấu hình)
- Sáng ngày diễn ra (8:00 sáng)
- Nếu user không phản hồi: nhắc lại nhẹ nhàng vào buổi chiều (tuỳ chọn)

---

### F3 — Gợi ý quà & hoạt động cá nhân hoá

**Mô tả:**
Khi sự kiện sắp đến, trợ lý chủ động hỏi để đưa ra gợi ý phù hợp với người đó, không phải danh sách chung chung.

**Flow hội thoại mẫu:**
```
Trợ lý: "Sinh nhật Mẹ còn 10 ngày. Bạn muốn tôi gợi ý quà không?"
User: "Có"
Trợ lý: "Mẹ bạn thường thích gì — đồ dùng gia đình, thời trang, hay trải nghiệm?"
User: "Mẹ thích nấu ăn"
Trợ lý: "Ngân sách khoảng bao nhiêu?"
User: "500k–1tr"
Trợ lý: → 3 gợi ý cụ thể phù hợp
```

**Kết quả gợi ý phải:**
- Cụ thể (không phải "tặng hoa") 
- Có phân nhóm: Thiết thực / Trải nghiệm / Kỷ niệm
- Có gợi ý lời chúc đi kèm

**Lịch sử gợi ý:**
- Lưu lại gợi ý đã dùng để tránh lặp lại năm sau
- "Năm ngoái bạn tặng Mẹ nồi chiên không dầu — năm nay thử trải nghiệm nhà hàng?"

---

### F4 — Chế độ "Quên mất" (Phút chót)

**Mô tả:**
User nhận ra ngày quan trọng là hôm nay nhưng chưa chuẩn bị gì. Trợ lý xử lý khủng hoảng.

**Trigger:**
- User mở app vào ngày có sự kiện mà chưa đánh dấu hoàn thành
- Hoặc user tự gõ: "Hôm nay sinh nhật vợ mà tôi quên"

**Trợ lý phản hồi gồm:**
1. **Không phán xét** — không nói "tại sao quên"
2. **Gợi ý có thể làm ngay** (trong 1–2 tiếng):
   - Đặt hoa giao nhanh
   - Đặt bàn nhà hàng tối nay
   - Ý tưởng surprise tại nhà
3. **Lời chúc soạn sẵn** — copy & paste ngay
4. **Lên kế hoạch bù** — "Cuối tuần này có thể làm gì đặc biệt hơn?"

---

### F5 — Nhật ký cảm xúc sau sự kiện

**Mô tả:**
Sau mỗi sự kiện qua đi, trợ lý hỏi nhẹ nhàng để user ghi lại kỷ niệm. Dần dần tạo ra timeline cảm xúc theo năm.

**Ví dụ hội thoại:**
```
[Ngày hôm sau sinh nhật Ba]
Trợ lý: "Sinh nhật Ba hôm qua thế nào? Muốn ghi lại điều gì không?"
User: "Cả nhà ăn tối cùng nhau, ba vui lắm"
Trợ lý: [Lưu ghi chú] "Đã lưu kỷ niệm cho sinh nhật Ba năm nay 🥰"
```

**Dữ liệu lưu lại:**
- Ghi chú ngắn của user (text)
- Ảnh (tuỳ chọn, tương lai)
- Cảm xúc (vui / bình thường / buồn)
- Tự động gắn với sự kiện và năm tương ứng

**Hiển thị lại:**
- Năm sau, khi đến ngày đó: "Năm ngoái bạn ghi: *Cả nhà ăn tối cùng nhau, ba vui lắm* 🥰"
- Tab "Kỷ niệm" — timeline theo từng sự kiện qua các năm

---

### F6 — Tóm tắt & Điểm nhìn tổng quan

**Mô tả:**
Trợ lý chủ động tóm tắt định kỳ để user không bỏ sót điều gì quan trọng.

**Loại tóm tắt:**

**Tuần tới:**
```
"Tuần này bạn có 2 sự kiện:
• Thứ 3 — Sinh nhật chị Hương (còn 3 ngày)
• Thứ 7 — Kỷ niệm 1 năm (còn 7 ngày — cần chuẩn bị không?)"
```

**Tháng đặc biệt:**
```
"Tháng 11 năm nay có 3 ngày quan trọng:
Sinh nhật Ba (65 tuổi — tròn!) + Kỷ niệm 3 năm + Ngày giỗ Ông
→ Tháng bận nhộn đấy, bạn có muốn lên kế hoạch trước không?"
```

**Nhìn lại năm:**
```
"Năm 2024 bạn đã kỷ niệm 12 sự kiện với gia đình và người thân.
Sự kiện được nhắc đến nhiều nhất: Sinh nhật Ba 🎂"
```

---

### F7 — Nhắc những điều nhỏ (Kết nối cảm xúc)

**Mô tả:**
Những nhắc nhở nhỏ không phải về deadline, mà về sự hiện diện và quan tâm.

**Ví dụ:**
- "Đã 2 tháng kể từ ngày giỗ Ông. Bạn đã ghé thăm Bà chưa?"
- "Sinh nhật Mẹ còn 1 tháng — thường thì bạn hay gọi điện trước không?"
- "Hôm nay là ngày mưa, năm ngoái đúng ngày kỷ niệm cũng mưa — bạn có nhớ không?" *(nếu có ghi chú)*

**Nguyên tắc:**
- Chỉ gợi ý, không thúc ép
- Có thể tắt loại thông báo này trong cài đặt
- Không spam — tối đa 1 lần/tuần

---

### F8 — Hỏi & Đáp tự do (Chat)

**Mô tả:**
User có thể hỏi trợ lý bất kỳ điều gì liên quan đến lịch, sự kiện, mối quan hệ.

**Phạm vi hỗ trợ:**
```
✅ "Kỷ niệm của tôi và anh ấy là bao nhiêu năm rồi?"
✅ "Sinh nhật nào trong tháng 12?"
✅ "Tôi nên tặng gì cho người 70 tuổi?"
✅ "Ngày giỗ âm lịch năm nay là ngày dương nào?"
✅ "Lời chúc sinh nhật cho sếp"
```

**Ngoài phạm vi:**
```
❌ Tin tức, thời tiết, tra cứu thông tin chung
→ Trả lời lịch sự + hướng dẫn về đúng chức năng
```

---

## Kiến trúc dữ liệu cần thiết

| Dữ liệu | Mục đích | Độ ưu tiên |
|---|---|---|
| Ghi chú sau sự kiện | F5 — Nhật ký kỷ niệm | Cao |
| Lịch sử gợi ý quà | F3 — Không lặp lại | Trung bình |
| Lịch sử hội thoại với AI | F1, F8 — Context nhất quán | Cao |
| Profile sở thích từng người | F3 — Cá nhân hoá | Thấp (học dần) |

---

## Thứ tự implement đề xuất

```
Giai đoạn 1 — Nền tảng (MVP)
  F1  Nhập liệu ngôn ngữ tự nhiên
  F2  Nhắc nhở thông minh có context
  F8  Chat cơ bản (hỏi về lịch của mình)

Giai đoạn 2 — Giá trị thêm
  F3  Gợi ý quà cá nhân hoá
  F4  Chế độ phút chót
  F5  Nhật ký cảm xúc

Giai đoạn 3 — Retention & Wow
  F6  Tóm tắt định kỳ
  F7  Nhắc những điều nhỏ
```

---

## Quyết định kiến trúc

| # | Câu hỏi | Quyết định |
|---|---|---|
| 1 | Lưu hội thoại ở đâu? | **Local** (SQLite, cùng DB hiện tại) |
| 2 | Model AI nào? | **Grok API** chính + rule-based fallback cho F1 |
| 3 | Điểm vào UI? | **Contextual** — xuất hiện đúng nơi đúng lúc (xem bên dưới) |
| 4 | Anonymous user? | **Phải đăng ký** mới dùng được trợ lý |
| 5 | Tối ưu chi phí | Rule-based cho F2/F5/F6/F7, Grok chỉ cho F1 edge-case + F3/F4/F8 |

---

## Bản đồ UI Contextual — Trợ lý xuất hiện ở đâu

> Trợ lý không có tab riêng. Nó xuất hiện đúng màn hình, đúng thời điểm user cần.

---

### Màn hình Home (Dashboard)

**Vị trí:** Card nổi bật ở đầu trang, chỉ hiện khi có nội dung

```
┌─────────────────────────────────────────┐
│ 🤖  Sinh nhật Ba còn 3 ngày             │
│     Ba tròn 65 tuổi năm nay — dịp tròn! │
│     [Gợi ý quà]  [Soạn lời chúc]        │
└─────────────────────────────────────────┘
```

**Khi nào hiện:**
- Có sự kiện trong 7 ngày tới → hiện nhắc nhở thông minh (F2)
- Ngày diễn ra sự kiện mà chưa chuẩn bị → "phút chót" (F4)
- Sau sự kiện 1 ngày → prompt ghi nhật ký (F5)
- Không có sự kiện gần → ẩn card hoàn toàn

---

### Màn hình Tạo sự kiện (AddEventScreen)

**Vị trí:** Ô input có icon trợ lý ở step đầu tiên (chọn nhãn)

```
┌─────────────────────────────────────────┐
│ Hoặc mô tả bằng lời...                  │
│ ┌─────────────────────────────────────┐ │
│ │ 🤖 "Sinh nhật mẹ 15 tháng 8..."    │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

**Hành vi:**
- User gõ câu tự nhiên → AI parse → điền sẵn form → user confirm
- Nếu parse thành công: chuyển thẳng đến step xác nhận
- Nếu thiếu thông tin: hỏi inline, không mở chat riêng

---

### Màn hình Chi tiết sự kiện (EventDetailScreen)

**Vị trí:** Section "Trợ lý gợi ý" cuối màn hình, chỉ hiện khi sự kiện trong 30 ngày tới

```
┌─────────────────────────────────────────┐
│ 💡 Gợi ý cho sự kiện này               │
│                                         │
│ Còn 12 ngày — đủ thời gian chuẩn bị.   │
│ [Gợi ý quà]  [Soạn lời chúc]  [Hỏi thêm]│
└─────────────────────────────────────────┘
```

**Hành vi:**
- Tap "Gợi ý quà" → mở flow hội thoại F3 (inline sheet, không navigate)
- Tap "Soạn lời chúc" → AI sinh lời chúc theo tone phù hợp
- Tap "Hỏi thêm" → mở chat tự do F8, context đã biết là sự kiện nào

---

### Màn hình Cài đặt nhắc nhở (ReminderSettings)

**Vị trí:** Hint text bên dưới khi user không chọn nhắc nào

```
┌─────────────────────────────────────────┐
│ 💡 Gợi ý: Sự kiện này còn 45 ngày —    │
│    nhắc trước 7 ngày và 1 ngày là hợp lý│
│    [Áp dụng gợi ý]                      │
└─────────────────────────────────────────┘
```

---

### Thông báo push (Notification)

**Không phải AI nhưng có context từ AI:**

```
Thông báo thông thường:
"Sinh nhật Ba ngày mai"

Thông báo thông minh (F2):
"Sinh nhật Ba ngày mai 🎂 Ba tròn 65 tuổi —
 Bạn đã chuẩn bị gì chưa? Mở app để xem gợi ý"
```

**Tap vào thông báo** → mở thẳng EventDetailScreen với section trợ lý đang mở

---

### Màn hình sau sự kiện — Nhật ký (F5)

**Vị trí:** Card xuất hiện trên Home ngày hôm sau

```
┌─────────────────────────────────────────┐
│ 📝  Sinh nhật Ba hôm qua thế nào?       │
│     Ghi lại để nhớ mãi...               │
│                                         │
│  [Ghi lại kỷ niệm]      [Bỏ qua]        │
└─────────────────────────────────────────┘
```

Tap "Ghi lại" → mở inline text input nhỏ, không navigate sang màn hình mới

---

## Nguyên tắc UI Contextual

| Nguyên tắc | Cụ thể |
|---|---|
| **Không interrupt** | Chỉ hiện khi có nội dung liên quan — không hiện card rỗng |
| **Inline trước** | Ưu tiên xử lý ngay trong màn hình, chỉ mở chat khi thật sự cần |
| **Dismissible** | Mọi card đều có nút bỏ qua rõ ràng |
| **Không lặp lại** | Đã dismiss → không hiện lại trong 24h |
| **Tone theo context** | Ngày giỗ: không dùng emoji vui; sinh nhật bạn bè: thoải mái hơn |
