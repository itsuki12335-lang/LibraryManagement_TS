# 📋 Quy chuẩn Báo cáo Kết quả Test Case (Test Case Reporting Standard)

Tài liệu này quy định cấu trúc và phong cách báo cáo kết quả kiểm thử (Unit Test / Integration Test) trong suốt quá trình phát triển dự án. Mọi lần chạy test sau này đều phải tuân thủ nghiêm ngặt mô típ này.

---

## 🎯 1. Nguyên tắc cốt lõi (Core Principles)

1. **Tuyệt đối không đưa code mẫu**: Không viết sẵn giải pháp bằng code trong báo cáo; chỉ phân tích luồng dữ liệu, tư duy thuật toán và lý do.
2. **Minh bạch Input & Output**: Mỗi test case phải chỉ rõ dữ liệu đưa vào là gì và kết quả mong đợi ra sao.
3. **Phân nhóm có cấu trúc**: Không liệt kê dàn trải, phải nhóm các test case theo từng khía cạnh nghiệp vụ (Khởi tạo, Luồng chuẩn, Giá trị biên, Chống hồi quy, Tích hợp).
4. **Giải thích cặn kẽ khi Fail**: Nếu test case bị thất bại, phải chỉ rõ giá trị thực tế nhận được là bao nhiêu và phân tích nguyên nhân gốc rễ (Root Cause) về mặt logic.

---

## 📊 2. Cấu trúc Báo cáo Tiêu chuẩn

Mỗi khi chạy kiểm thử (ví dụ: với Vitest), báo cáo phản hồi phải được trình bày theo cấu trúc 3 phần:

### Phần I — Tổng quan kết quả (Summary)
* **Tổng số test cases**: X tests
* **Kết quả**: X Passed | Y Failed
* **Đánh giá sơ bộ**: Tóm tắt trạng thái hiện tại của model/service vừa test.

### Phần II — Phân tích lỗi (Chỉ hiển thị nếu có test bị Fail)
* Liệt kê các lỗi logic khiến test case không đạt.
* Phân tích nguyên nhân tại sao lại phát sinh lỗi (Root Cause).
* Đưa ra hướng tư duy và lý do để khắc phục mà không kèm code mẫu.

### Phần III — Chi tiết từng Case (Mô típ bắt buộc)

Mỗi test case phải được ghi rõ theo cấu trúc sau:

```markdown
* **Case [Số thứ tự]** ([Tên ngắn gọn của kịch bản]):
  * **Input**: [Mô tả chi tiết dữ liệu đầu vào hoặc trạng thái đối tượng]
  * **Output**: [Kết quả mong đợi trả về hoặc ngoại lệ được ném ra]
  * **Kết quả**: **Đúng (Pass)** HOẶC **Sai (Fail)** (Ghi rõ: Nhận được X thay vì Y)
  * **Mục đích / Ý nghĩa**: [Giải thích ngắn gọn tại sao cần kiểm tra trường hợp này]
```

---

## 🗂️ 3. Các nhóm phân loại test case chuẩn

1. **Nhóm Khởi tạo & Toàn vẹn dữ liệu (Data Integrity)**: Kiểm tra constructor, gán giá trị mặc định, tính an toàn kiểu.
2. **Nhóm Luồng nghiệp vụ chuẩn (Happy Path)**: Các kịch bản chạy đúng theo logic thông thường.
3. **Nhóm Giá trị biên & Trường hợp đặc biệt (Edge Cases / Boundaries)**: Mốc 0, số âm, lệch 1 mili-giây, ngày hôm nay, ngày quá khứ/tương lai.
4. **Nhóm Chống hồi quy (Bug Regression Tests)**: Các case viết riêng để bảo vệ hệ thống không bị lặp lại những lỗi logic đã từng xảy ra trong quá khứ.
5. **Nhóm Kịch bản Tích hợp (Integration Flow)**: Mô phỏng chuỗi tương tác xuyên suốt giữa nhiều hàm hoặc nhiều thực thể với nhau.
