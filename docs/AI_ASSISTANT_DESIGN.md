# Trợ lý AI — Thiết kế chi tiết

> Tài liệu này mô tả trợ lý từ góc nhìn người dùng thật sự —
> thiết kế từ kịch bản cuộc sống, không phải từ tính năng.

---

## 1. Trợ lý này là ai?

Không phải chatbot. Không phải tìm kiếm thông minh.

Hãy tưởng tượng một người bạn thân đang giúp bạn nhớ và chuẩn bị
cho những ngày quan trọng với gia đình, người yêu, bạn bè.
Người bạn đó biết lịch của bạn, hiểu hoàn cảnh, và nhắc đúng lúc —
nhưng không bao giờ làm phiền khi bạn không cần.

---

## 2. Tính cách & Nguyên tắc phản hồi

### Tính cách cốt lõi

| Đặc điểm | Biểu hiện cụ thể |
|---|---|
| **Ấm áp, không lạnh lùng** | "Ba năm nay 65 tuổi rồi đó" — không phải "Sự kiện: sinh nhật. Ngày: 15/3" |
| **Ngắn gọn, không rườm rà** | Tối đa 3 dòng mỗi tin nhắn. Nếu cần hỏi thêm — hỏi 1 câu thôi |
| **Không phán xét** | User quên sinh nhật vợ → không nói "tại sao quên", chỉ giúp xử lý |
| **Biết khi nào im lặng** | Sau ngày giỗ không hỏi "Sự kiện thế nào?" bằng emoji vui |
| **Chủ động đúng lúc** | Nhắc trước 10 ngày, không phải 1 giờ trước |

### Quy tắc tone theo loại sự kiện

| Loại sự kiện | Tone | Emoji | Ví dụ mở đầu |
|---|---|---|---|
| Sinh nhật gia đình | Ấm áp, quan tâm | 🎂 | "Sinh nhật Ba còn 7 ngày..." |
| Kỷ niệm tình yêu | Lãng mạn, nhẹ nhàng | ❤️ | "Ngày mai là ngày đặc biệt..." |
| Sinh nhật bạn bè | Vui vẻ, thoải mái | 🎉 | "Sinh nhật Tuấn cuối tuần này!" |
| Ngày giỗ | Trang trọng, nhẹ nhàng | 🕯️ | "Ngày mai là ngày giỗ Ông..." |
| Sự kiện công việc | Trung lập, chuyên nghiệp | 📅 | "Deadline dự án còn 3 ngày." |
| Sinh nhật con | Hào hứng, ấm | 🎈 | "Sinh nhật con còn 5 ngày..." |

### Quy tắc im lặng

```
KHÔNG hiện card trợ lý khi:
- Không có sự kiện nào trong 14 ngày tới
- User vừa dismiss card trong vòng 24h
- Đang trong màn hình ngày giỗ → không dùng emoji vui
- User chưa đăng ký (anonymous)
```

---

## 3. Hành trình người dùng & Flow trợ lý

---

### Giai đoạn 1 — Lần đầu khám phá app

**Tâm lý:** Tò mò, chưa thấy lý do ở lại

**Mục tiêu trợ lý:** Giúp user thêm sự kiện đầu tiên trong vòng 2 phút

```
┌─ ONBOARDING FLOW ───────────────────────────────────────────┐

Màn hình đầu tiên sau đăng ký:

  Trợ lý:
  "Chào bạn! Tôi sẽ giúp bạn nhớ những ngày
   quan trọng với người thân.

   Bắt đầu từ ai?

   [👨 Ba / Mẹ]  [❤️ Người yêu]
   [👥 Bạn bè]   [✍️ Tự nhập]"

─────────────────────────────────────────────────────────────

User chọn "Ba / Mẹ":

  Trợ lý: "Ba hay Mẹ trước?"
  User: "Mẹ"

  Trợ lý: "Sinh nhật Mẹ ngày mấy?
           (Gõ hoặc nói đều được)"
  User: "19 tháng 6"

  Trợ lý: "Mẹ sinh năm nào?
           (Để tôi tính tuổi cho bạn)"
  User: "1965"

  Trợ lý: "✓ Sinh nhật Mẹ — 19/06/1965
           Năm nay Mẹ tròn 60 tuổi 🎂
           Tôi sẽ nhắc bạn trước 7 ngày.

           Thêm ai nữa không?"

└─────────────────────────────────────────────────────────────┘
```

**Ngày 2 sau khi cài:**
```
  Trợ lý (Home card):
  "Bạn vừa thêm sinh nhật Mẹ — còn 45 ngày.
   Còn ai quan trọng bạn muốn nhớ không?
   [+ Thêm sự kiện]    [Để sau]"
```

**Ngày 3 nếu chưa thêm gì:**
```
  Trợ lý:
  "Sinh nhật Ba thường vào tháng nào?
   Chỉ cần tháng thôi, ngày xác nhận sau cũng được."
```
*→ Giảm friction — không bắt điền đủ ngay*

---

### Giai đoạn 2 — Ghi lại trong khoảnh khắc

**Tâm lý:** Đang trong tình huống, cần ghi ngay kẻo quên

#### Kịch bản 2A: Vừa nghe được ngày quan trọng

```
Người dùng đang nói chuyện điện thoại với Ba:
"Ừ Ba, sinh nhật Ba 15/3 con nhớ."
→ Cúp máy, mở app ngay

Ô nhập liệu nhanh (luôn hiện ở Home):
┌─────────────────────────────────────────┐
│ 🎤  Vừa nghe được ngày gì?              │
│  ___________________________________    │
│  Sinh nhật ba 15/3...              [→]  │
└─────────────────────────────────────────┘

Trợ lý parse ngay:
  "Sinh nhật Ba — 15/03 — Hằng năm
   [✓ Lưu]    [Sửa]"

Tap Lưu → xong trong 15 giây
```

#### Kịch bản 2B: Bạn vừa nói ngày sinh nhật

```
User gõ: "Sinh nhật thằng Minh 20/9 năm 1995"

Trợ lý:
  "Sinh nhật Minh — 20/09
   Minh năm nay 30 tuổi.
   [✓ Lưu]    [Sửa]"
```

#### Kịch bản 2C: Ngày giỗ — tình huống nhạy cảm

```
Đây là trường hợp đặc biệt.
User vừa mất người thân, cần lưu ngày giỗ.

Trợ lý KHÔNG dùng flow thông thường.
Chỉ hiện:

┌─────────────────────────────────────────┐
│  Lưu ngày giỗ                           │
│                                         │
│  Tên người thân: ___________________    │
│  Ngày mất:       ___________________    │
│  □ Âm lịch                              │
│                                         │
│  [Lưu]                                  │
└─────────────────────────────────────────┘

Sau khi lưu:
  Trợ lý: "Đã lưu ngày giỗ.
           Tôi sẽ nhắc bạn trước 1 ngày."

→ Không hỏi thêm. Không gợi ý quà.
→ Không hiện emoji.
```

---

### Giai đoạn 3 — Check định kỳ (Thói quen)

**Tâm lý:** Mở app nhanh, xem có gì không, đóng lại

**Nguyên tắc:** Phải trả lời được câu hỏi của user trong 5 giây

#### Home card theo tình huống:

```
─── Không có gì trong 14 ngày ───────────────
  [Không hiện card — trang chủ sạch]

─── Có 1 sự kiện, còn xa ────────────────────
  "🎂 Sinh nhật Mẹ — 19/06 (còn 32 ngày)"

─── Có 1 sự kiện, sắp tới ───────────────────
  "🎂 Sinh nhật Mẹ còn 7 ngày
   [Gợi ý chuẩn bị]"

─── Có nhiều sự kiện ────────────────────────
  "Tuần này có 2 ngày quan trọng:
   • T3 — Sinh nhật chị Hoa (3 ngày)
   • T7 — Kỷ niệm 2 năm (7 ngày)
   Sự kiện nào bạn muốn chuẩn bị trước?"

─── Hôm nay có sự kiện ──────────────────────
  "🎂 Hôm nay sinh nhật Ba!
   Bạn đã liên lạc chưa?
   [Gọi điện]  [Soạn lời chúc]  [Đã xong ✓]"
```

---

### Giai đoạn 4 — Chuẩn bị trước sự kiện

**Tâm lý:** Biết ngày đến, muốn làm gì đó tốt, cần được dẫn dắt

#### Flow chuẩn bị theo thời gian còn lại:

```
CÒN 14+ NGÀY — "Nghĩ về quà"
────────────────────────────────────────
  Trợ lý:
  "Sinh nhật Mẹ còn 2 tuần.
   Mẹ thường thích gì — đồ dùng,
   làm đẹp, hay trải nghiệm cùng nhau?"

  User: "Mẹ thích nấu ăn"

  Trợ lý:
  "Ngân sách khoảng bao nhiêu?"

  User: "Khoảng 500k"

  Trợ lý gợi ý 3 hướng:
  "1. Bộ dao nhà bếp cao cấp — 400–600k
   2. Sách nấu ăn Việt Nam đặc sản — 200k
   3. Đăng ký 1 buổi học nấu ăn cùng nhau

   Bạn thích hướng nào?"

────────────────────────────────────────
CÒN 3–7 NGÀY — "Đặt / Order ngay"
────────────────────────────────────────
  Trợ lý:
  "Sinh nhật Mẹ còn 5 ngày —
   đủ thời gian order ship về nhà.

   Bạn đã có quà chưa?
   [Rồi ✓]  [Chưa, gợi ý lại]  [Tự mua]"

────────────────────────────────────────
CÒN 1 NGÀY — "Lời chúc"
────────────────────────────────────────
  Trợ lý:
  "Sinh nhật Mẹ ngày mai!
   Bạn muốn tôi soạn lời chúc không?

   [Nhắn tin]  [Đăng story]  [Thẻ quà]"

  User chọn "Nhắn tin":

  Trợ lý đưa 3 lựa chọn:
  "① Ấm áp:
     'Chúc Mẹ sinh nhật vui vẻ, mạnh khoẻ.
      Con yêu Mẹ nhiều lắm 🥰'

   ② Dài hơn có kể kỷ niệm:
     'Mẹ ơi, hôm nay sinh nhật Mẹ...'

   ③ Tự viết — tôi gợi ý ý tưởng"
```

---

### Giai đoạn 5 — Ngày diễn ra sự kiện

**Tâm lý:** Bận rộn, cần nhắc nhở, cần hỗ trợ ngay

#### Kịch bản 5A: Sự kiện vui (Sinh nhật, Kỷ niệm)

```
Sáng hôm đó, 8:00:
  Thông báo:
  "🎂 Hôm nay sinh nhật Mẹ!
   Mẹ tròn 60 tuổi năm nay.
   Bạn đã liên lạc chưa?"

Mở app:
  "Hôm nay là sinh nhật Mẹ 🎂
   Mẹ tròn 60 tuổi!

   [📞 Gọi điện]
   [💬 Nhắn tin lời chúc]
   [✓ Đã gặp mặt rồi]"
```

#### Kịch bản 5B: Ngày giỗ

```
Sáng hôm đó, 7:00:
  Thông báo:
  "Hôm nay là ngày giỗ Ông 🕯️
   Giỗ lần thứ 3."

Mở app:
  "Hôm nay là ngày giỗ Ông.
   Hãy dành một khoảnh khắc
   nhớ về Ông.

   [Nhắc anh/chị em]    [Đã biết]"

  User: "Nhắc anh Hùng và chị Lan"

  Trợ lý:
  "Đã nhắc anh Hùng và chị Lan."

  → Kết thúc. Không hỏi thêm.
```

#### Kịch bản 5C: Kỷ niệm tình yêu

```
Sáng hôm đó:
  "❤️ Hôm nay là kỷ niệm 3 năm
   của bạn và Linh.

   Bạn đã có kế hoạch tối nay chưa?
   [Có rồi 🙂]  [Chưa, gợi ý]"

  User: "Chưa, gợi ý đi"

  Trợ lý:
  "Tối nay còn kịp:
   • Đặt bàn nhà hàng (đặt ngay
     kẻo hết chỗ tối thứ 6)
   • Mua hoa trên đường về
   • Tối ở nhà — nấu ăn cùng nhau
     + xem phim kỷ niệm đầu tiên

   Hướng nào hợp hơn?"
```

---

### Giai đoạn 6 — Khủng hoảng / Quên mất

**Tâm lý:** Stress, cần hành động ngay, không cần giải thích

#### Kịch bản 6A: Phát hiện qua thông báo

```
8:15 sáng — User thấy thông báo đỏ:
"⚠️ Hôm nay sinh nhật vợ/người yêu!"

Mở app:

  Trợ lý (KHÔNG phán xét):
  "Vẫn kịp! Bạn đang ở đâu?"

  [Ở nhà]    [Đi làm rồi]    [Đang đi đường]

─── User chọn "Đi làm rồi" ──────────────────

  Trợ lý:
  "Làm ngay 2 việc:

   Bây giờ (2 phút):
   → [Copy lời chúc gửi ngay]

   Tối nay:
   → Đặt bàn nhà hàng
   → Ghé tiệm hoa trên đường về

   [Lời chúc]  [Đặt bàn]  [Tìm hoa gần đây]"

─── User chọn "Ở nhà" ───────────────────────

  Trợ lý:
  "Vẫn kịp làm điều gì đó bất ngờ:

   Trong 30 phút:
   → Order hoa / bánh giao nhanh
   → Làm bữa sáng đặc biệt

   Tối nay:
   → Dinner tại nhà hàng yêu thích

   [Order hoa]  [Gợi ý bữa tối]"
```

#### Kịch bản 6B: Nghe từ người khác

```
User gõ: "Hôm nay sinh nhật vợ tôi mà tôi quên"

Trợ lý:
  "Vẫn kịp đấy.
   Bây giờ là mấy giờ và bạn đang ở đâu?"

→ Tiếp tục như 6A
```

---

### Giai đoạn 7 — Sau sự kiện (Ghi kỷ niệm)

**Tâm lý:** Xúc động, muốn lưu lại — hoặc không muốn nhắc đến

#### Kịch bản 7A: Sự kiện vui

```
Sáng hôm sau (24h sau sinh nhật Mẹ):

  Home card nhỏ, không intrusive:
  ┌─────────────────────────────────────────┐
  │ 📝 Sinh nhật Mẹ hôm qua thế nào?       │
  │    Ghi lại để nhớ mãi...               │
  │    [Ghi lại]              [Bỏ qua]      │
  └─────────────────────────────────────────┘

  User tap "Ghi lại":

  Trợ lý:
  "Kể một điều đáng nhớ nhất hôm qua?"

  User: "Cả nhà ăn tối cùng nhau,
         Mẹ khóc vì xúc động"

  Trợ lý:
  "Đã lưu kỷ niệm sinh nhật Mẹ
   năm nay 🥰

   Năm sau tôi sẽ nhắc lại cho bạn."

─── Nếu User chọn "Bỏ qua" ─────────────────
  → Im lặng. Không hỏi lại.
```

#### Kịch bản 7B: Ngày giỗ — tuyệt đối không hỏi vui

```
Hôm sau ngày giỗ:

  [KHÔNG hiện card "hôm qua thế nào?"]

  Nếu muốn ghi chú, user tự vào EventDetail
  → Có ô ghi chú yên tĩnh, không có trợ lý
```

#### Kịch bản 7C: Kỷ niệm không suôn sẻ

```
Trợ lý không biết sự kiện có vui không.
Quy tắc an toàn:

  → Hiện card nhỏ 1 lần
  → Nếu user bỏ qua → im lặng hoàn toàn
  → Không đoán, không hỏi "Có chuyện gì không?"
```

---

### Giai đoạn 8 — Nhìn lại (Cuối năm / Dịp đặc biệt)

```
31/12 hoặc khi mở app ngày đầu năm:

  "Năm 2025 bạn đã cùng nhau:
   🎂 9 sinh nhật của người thân
   ❤️  2 kỷ niệm tình yêu
   🕯️  1 ngày giỗ

   Kỷ niệm được ghi lại nhiều nhất:
   Sinh nhật Mẹ tròn 60 tuổi 🥰"

─── Khi kỷ niệm 5 năm / 10 năm ──────────────

  "❤️ Hôm nay là kỷ niệm 5 năm!
   Nhìn lại từ ngày đầu:

   Năm 1: [ghi chú nếu có]
   Năm 2: [ghi chú nếu có]
   ...
   Năm 5: Hôm nay

   Bạn có muốn viết điều gì đó
   cho dịp đặc biệt này không?"
```

---

## 4. Bản đồ xuất hiện contextual

```
Màn hình          Trợ lý xuất hiện khi nào
─────────────────────────────────────────────────────────────
Home              Có sự kiện ≤ 14 ngày, hoặc hôm nay có sự kiện,
                  hoặc 24h sau sự kiện (nhật ký)

Tạo sự kiện       Luôn có ô nhập tự nhiên (giọng nói / gõ)
(AddEventScreen)  Gợi ý loại sự kiện khi user chưa chọn nhãn

Chi tiết sự kiện  Sự kiện còn ≤ 30 ngày → section gợi ý
(EventDetail)     Sự kiện hôm nay → section hành động ngay
                  Sự kiện đã qua ≤ 2 ngày → gợi ý ghi nhật ký

Thông báo push    Mọi lúc, nhưng content thông minh hơn
                  Tap vào → mở thẳng EventDetail + trợ lý mở sẵn

Cài đặt nhắc      User chưa chọn nhắc nào → gợi ý tự động
(ReminderSettings)
─────────────────────────────────────────────────────────────
```

---

## 5. Quy tắc trợ lý không được vi phạm

```
① KHÔNG bao giờ phán xét
   ✗ "Sao bạn quên vậy?"
   ✓ "Vẫn kịp đấy!"

② KHÔNG hỏi quá 1 câu một lần
   ✗ "Bạn muốn tặng gì? Ngân sách bao nhiêu? Mẹ thích gì?"
   ✓ "Mẹ thường thích gì nhất?"

③ KHÔNG dùng tone vui vẻ cho ngày giỗ
   ✗ "Ngày giỗ Ông sắp đến rồi! 🎉"
   ✓ "Ngày mai là ngày giỗ Ông 🕯️"

④ KHÔNG hỏi lại sau khi bị dismiss
   User bấm "Bỏ qua" → im lặng ≥ 24h

⑤ KHÔNG hiện card rỗng
   Không có gì relevant → không hiện trợ lý
   Thà vắng còn hơn nhiễu

⑥ KHÔNG gọi API nếu có thể dùng rule
   Smart reminder = code thuần
   Chỉ gọi Grok khi cần sáng tạo thật sự (quà, lời chúc, chat)

⑦ KHÔNG lưu audio — chỉ lưu text sau khi nhận dạng
```

---

## 6. Kiến trúc kỹ thuật

### Phân loại xử lý

```
Rule-based (không tốn API):
  F2  Smart reminder    → Template + tính ngày
  F5  Nhật ký prompt   → Hiển thị đúng lúc
  F6  Tóm tắt          → SQL + string format
  F7  Nhắc nhỏ         → Rule trigger

Grok API (gọi khi cần):
  F1  Parse thất bại    → ~20% edge case
  F3  Gợi ý quà        → User chủ động, chờ 2–3s
  F4  Phút chót        → User chủ động, chờ 2–3s
  F8  Chat tự do       → Streaming, từng chữ hiện dần
```

### Lưu trữ local (SQLite)

```sql
-- Lịch sử hội thoại
ai_conversations (
  id, event_id, role,   -- 'user' | 'assistant'
  content, created_at
)

-- Nhật ký kỷ niệm
event_memories (
  id, event_id, year,
  note, mood,           -- 'happy' | 'neutral' | 'sad'
  created_at
)

-- Lịch sử gợi ý quà (tránh lặp)
gift_suggestions_history (
  id, event_id, year,
  suggestion, was_used
)
```

### Voice input

```
User giữ mic
  → expo-av record
  → Device native STT (miễn phí, iOS tốt)
  → Nếu fail / confidence thấp → Whisper API fallback
  → Text → F1 parser (regex trước, Grok nếu fail)
  → Hiện card xác nhận → user confirm
```

---

## 7. Thứ tự implement

```
Sprint 1 — Nền tảng (rule-based, 0 API call)
  ✦ Smart reminder với context (F2)
  ✦ Home card thông minh theo tình huống
  ✦ Post-event journal prompt (F5)
  ✦ Bảng lịch sử ghi chú sự kiện

Sprint 2 — Nhập liệu thông minh
  ✦ Ô ghi nhanh ở Home (text)
  ✦ Parser regex tiếng Việt (F1 — không cần API)
  ✦ Voice input (F1 — device native STT)
  ✦ Card xác nhận trước khi lưu

Sprint 3 — Gợi ý & Chat (cần Grok API)
  ✦ Gợi ý quà cá nhân hoá (F3)
  ✦ Chế độ phút chót (F4)
  ✦ Chat tự do với context lịch (F8)
  ✦ Lời chúc soạn sẵn theo tone

Sprint 4 — Retention
  ✦ Tóm tắt tuần / tháng (F6)
  ✦ Nhắc những điều nhỏ (F7)
  ✦ Nhìn lại năm
  ✦ Timeline kỷ niệm qua các năm
```
