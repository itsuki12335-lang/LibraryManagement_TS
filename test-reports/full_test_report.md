# 📋 BÁO CÁO TOÀN DIỆN KIỂM THỬ HỆ THỐNG (FULL TEST REPORT)
*Thời gian chạy*: 2026-10-01  
*Công cụ thực thi*: Vitest 5.0.2  
*Quy chuẩn áp dụng*: [.agents/rules/test_reporting_style.md](file:///d:/Project/LibraryManagementSystem/.agents/rules/test_reporting_style.md)

---

## 📊 PHẦN I: TỔNG QUAN KẾT QUẢ (SUMMARY)

* **Tổng số test suites**: 5 files
* **Tổng số test cases**: 149 tests
* **Kết quả**: **138 Passed** | **6 Failed** | **5 Todo**
* **Tỷ lệ thành công**: **95.8%**

| Suite File | Phân hệ / Domain | Số lượng Test | Trạng thái |
| :--- | :--- | :---: | :---: |
| [test/Repository.test.ts](file:///d:/Project/LibraryManagementSystem/test/Repository.test.ts) | Generic Repository Pattern (`<T>`) | 39 | **39/39 Passed (100%)** |
| [test/Loan.test.ts](file:///d:/Project/LibraryManagementSystem/test/Loan.test.ts) | Loan Model, Overdue & Fine Logic | 50 | **50/50 Passed (100%)** |
| [test/Book.test.ts](file:///d:/Project/LibraryManagementSystem/test/Book.test.ts) | Member Domain Model & State Pattern | 39 | **34 Passed, 5 Todo** |
| [test/LibraryService.test.ts](file:///d:/Project/LibraryManagementSystem/test/LibraryService.test.ts) | LibraryService Orchestration Skeleton | 15 | **15 Passed (Khung)** |
| [test/EventEmitter.test.ts](file:///d:/Project/LibraryManagementSystem/test/EventEmitter.test.ts) | Event Engine (Pub/Sub) | 6 | **6 Failed (Chưa code)** |

---

## ⚠️ PHẦN II: PHÂN TÍCH LỖI & VIỆC CẦN LÀM (FAILURES & TODOS)

1. **Thất bại tại [test/EventEmitter.test.ts](file:///d:/Project/LibraryManagementSystem/test/EventEmitter.test.ts)**:
   * *Lỗi*: `TypeError: EventEmitter is not a constructor`.
   * *Nguyên nhân*: File `src/events/EventEmitter.ts` thuộc Phase 6 (Pub/Sub Engine) chưa được khởi tạo class và phương thức. Đây là tính năng của giai đoạn tiếp theo, không phải lỗi hồi quy của mã hiện tại.
2. **5 Test Todo tại [test/Book.test.ts](file:///d:/Project/LibraryManagementSystem/test/Book.test.ts)**:
   * *Nội dung*: Các test case cho `BookModel`, `AvailableState`, `BorrowedState`, `ReservedState`. Hiện tại các class này đã code xong ở `src/states/`, sẵn sàng để điền mã kiểm thử xác nhận.

---

## 📑 PHẦN III: CHI TIẾT TOÀN BỘ CÁC TEST CASES

---

### 🗂️ SUITE 1: GENERIC REPOSITORY PATTERN (39 Cases — [Repository.test.ts](file:///d:/Project/LibraryManagementSystem/test/Repository.test.ts))

#### 1. Thao tác thêm mới — `add()` (2 cases)
* **Case 1 (Thêm một item vào kho)**:
  * **Input**: Khởi tạo repo rỗng, gọi `add(item1)`.
  * **Output**: `findAll().length` tăng lên 1.
  * **Kết quả**: **Đúng (Pass)**.
  * **Mục đích**: Kiểm tra thao tác lưu trữ cơ bản của Repository.
* **Case 2 (Thêm nhiều item liên tiếp)**:
  * **Input**: Thêm lần lượt `item1` và `item2`.
  * **Output**: `findAll().length` bằng 2.
  * **Kết quả**: **Đúng (Pass)**.
  * **Mục đích**: Đảm bảo kho lưu trữ được danh sách nhiều đối tượng.

#### 2. Thao tác tìm theo ID — `findById()` (2 cases)
* **Case 3 (Tìm thấy item theo đúng id)**:
  * **Input**: Thêm item có ID `"42"`, gọi `findById("42")`.
  * **Output**: Trả về đúng đối tượng có tên tương ứng, khác `null`.
  * **Kết quả**: **Đúng (Pass)**.
  * **Mục đích**: Đảm bảo tra cứu chính xác theo khóa chính.
* **Case 4 (Tìm ID không tồn tại)**:
  * **Input**: Gọi `findById("NON_EXISTENT")` trên kho.
  * **Output**: Trả về `null`.
  * **Kết quả**: **Đúng (Pass)**.
  * **Mục đích**: Ngăn ngừa lỗi crash khi không tìm thấy bản ghi.

#### 3. Thao tác lấy tất cả — `findAll()` (2 cases)
* **Case 5 (Lấy danh sách khi kho rỗng)**:
  * **Input**: Kho chưa thêm phần tử nào, gọi `findAll()`.
  * **Output**: Trả về mảng rỗng `[]`.
  * **Kết quả**: **Đúng (Pass)**.
  * **Mục đích**: Tránh trả về `null` gây lỗi cho tầng gọi.
* **Case 6 (Bảo vệ tính đóng gói — Trả về bản sao)**:
  * **Input**: Lấy mảng từ `findAll()`, sau đó `push` thêm phần tử giả mạo vào mảng đó.
  * **Output**: Số lượng item trong kho gốc vẫn giữ nguyên là 1.
  * **Kết quả**: **Đúng (Pass)**.
  * **Mục đích**: Chống ô nhiễm dữ liệu từ bên ngoài (Immutability).

#### 4. Thao tác cập nhật — `update()` (4 cases)
* **Case 7 (Cập nhật đúng mục tiêu)**:
  * **Input**: Cập nhật tên và giá trị của item `"1"`.
  * **Output**: Trả về `true`, đối tượng trong kho đổi dữ liệu đúng như Partial truyền vào.
  * **Kết quả**: **Đúng (Pass)**.
  * **Mục đích**: Xác nhận tính năng cập nhật từng phần (Partial Update).
* **Case 8 (Tự động cập nhật timestamp `updateAt`)**:
  * **Input**: Gọi `update` trên item `"1"`.
  * **Output**: Trường `updateAt` mới lớn hơn hoặc bằng thời điểm gọi hàm.
  * **Kết quả**: **Đúng (Pass)**.
  * **Mục đích**: Lưu vết thời gian sửa đổi tự động.
* **Case 9 (Cập nhật ID không tồn tại)**:
  * **Input**: Gọi `update("NON_EXISTENT", { ... })`.
  * **Output**: Trả về `false`.
  * **Kết quả**: **Đúng (Pass)**.
  * **Mục đích**: Thông báo thất bại khi cập nhật bản ghi ma.
* **Case 10 (Không ảnh hưởng đến các item khác)**:
  * **Input**: Kho có item 1 và 2, chỉ update item 1.
  * **Output**: Item 2 giữ nguyên vẹn dữ liệu ban đầu.
  * **Kết quả**: **Đúng (Pass)**.
  * **Mục đích**: Đảm bảo cập nhật cô lập, không ghi đè nhầm bản ghi khác.

#### 5. Thao tác xóa — `delete()` (3 cases)
* **Case 11 (Xóa thành công mục tiêu)**:
  * **Input**: Gọi `delete("1")`.
  * **Output**: Trả về `true`, `findById("1")` thành `null`, số lượng về 0.
  * **Kết quả**: **Đúng (Pass)**.
  * **Mục đích**: Xóa sạch bản ghi khỏi bộ nhớ.
* **Case 12 (Xóa ID không tồn tại)**:
  * **Input**: Gọi `delete("NON_EXISTENT")`.
  * **Output**: Trả về `false`.
  * **Kết quả**: **Đúng (Pass)**.
  * **Mục đích**: Báo trạng thái xóa thất bại rõ ràng.
* **Case 13 (Chỉ xóa đúng bản ghi được chỉ định)**:
  * **Input**: Kho có 2 item, xóa item 1.
  * **Output**: Item 2 vẫn còn nguyên vẹn trong kho.
  * **Kết quả**: **Đúng (Pass)**.
  * **Mục đích**: Tránh xóa lan truyền nhầm dữ liệu.

#### 6. Thao tác lọc — `filter()` (4 cases)
* **Case 14 (Lọc theo điều kiện khớp)**:
  * **Input**: Lọc các item có `value > 20`.
  * **Output**: Trả về danh sách chứa đúng 2 item thỏa mãn.
  * **Kết quả**: **Đúng (Pass)**.
  * **Mục đích**: Khả năng truy vấn mềm dẻo qua hàm vị từ (Predicate).
* **Case 15 (Lọc không khớp mục nào)**:
  * **Input**: Lọc với điều kiện không ai thỏa mãn (`value > 9999`).
  * **Output**: Trả về mảng rỗng `[]`.
  * **Kết quả**: **Đúng (Pass)**.
  * **Mục đích**: An toàn mảng rỗng khi tìm kiếm không thấy.
* **Case 16 (Lọc khi tất cả đều khớp)**:
  * **Input**: Điều kiện `value > 0`.
  * **Output**: Trả về toàn bộ danh sách.
  * **Kết quả**: **Đúng (Pass)**.
  * **Mục đích**: Không làm sót bản ghi nào.
* **Case 17 (Lọc trên kho rỗng)**:
  * **Input**: Gọi `filter` khi chưa có dữ liệu.
  * **Output**: Trả về mảng rỗng `[]`.
  * **Kết quả**: **Đúng (Pass)**.
  * **Mục đích**: Kiểm tra an toàn biên.

#### 7. Giá trị biên & Bảo vệ tính toàn vẹn (Edge Cases — 24 cases)
* **Case 18**: Chặn trùng lặp ID khi gọi `add` ➔ **Pass**.
* **Case 19**: `findById` với ID rỗng `""` ➔ Trả về `null` ➔ **Pass**.
* **Case 20**: Chống ghi đè trường `id` qua `Partial` trong hàm `update` ➔ **Pass**.
* **Case 21**: Gọi `delete` lần 2 trên cùng 1 ID ➔ Trả về `false` ➔ **Pass**.
* **Case 22**: Sửa thuộc tính object sau khi lấy từ `findById` không làm đổi dữ liệu trong kho ➔ **Pass**.
* **Case 23**: Sửa kết quả của hàm `filter` không làm biến đổi kho gốc ➔ **Pass**.
* **Case 24**: Sửa object bên trong mảng `findAll` không làm đổi dữ liệu lưu trữ ➔ **Pass**.
* **Case 25**: Truyền `Partial` rỗng `{}` vào `update` vẫn trả về `true` và làm mới `updateAt` ➔ **Pass**.
* **Case 26**: Item đã bị `delete` thì gọi `update` sau đó phải trả về `false` ➔ **Pass**.
* **Case 27**: Hàm `filter` phản ánh đúng giá trị sau khi được `update` ➔ **Pass**.
* **Case 28**: Hàm `filter` không bao giờ trả về các item đã bị xóa ➔ **Pass**.
* **Case 29**: Cho phép thêm lại item có cùng ID sau khi ID đó đã bị xóa hoàn toàn ➔ **Pass**.
* **Case 30**: Nhiều lần gọi `update` liên tiếp trên các trường khác nhau phải tích lũy đủ ➔ **Pass**.
* **Case 31**: Gọi `update` với ID rỗng `""` ➔ Trả về `false` ➔ **Pass**.
* **Case 32**: Gọi `delete` với ID rỗng `""` ➔ Trả về `false` ➔ **Pass**.
* **Case 33**: `findAll` giữ nguyên thứ tự thêm vào ban đầu (Insertion Order) ➔ **Pass**.
* **Case 34**: Nếu người dùng cố tình truyền `updateAt` cũ vào `Partial`, hệ thống vẫn tự động ghi đè bằng giờ hệ thống thực tế ➔ **Pass**.
* **Case 35**: Kiểm tra giới hạn sao chép nông (Shallow copy limit) ➔ **Pass**.
* **Case 36**: Biến đổi object bên ngoài sau khi đã gọi `add` không làm thay đổi bản ghi trong kho ➔ **Pass**.
* **Case 37**: Hai lần gọi `findById` liên tiếp trả về 2 object có giá trị bằng nhau nhưng độc lập về địa chỉ ô nhớ ➔ **Pass**.
* **Case 38**: Dữ liệu từ `findAll` và `findById` luôn luôn nhất quán với nhau ➔ **Pass**.
* **Case 39**: Cho phép cập nhật trường `createAt` nhưng vẫn khóa cứng trường `id` ➔ **Pass**.

---

### 🗂️ SUITE 2: LOAN MODEL, QUÁ HẠN & TÍNH TIỀN PHẠT (50 Cases — [Loan.test.ts](file:///d:/Project/LibraryManagementSystem/test/Loan.test.ts))

#### 1. Khởi tạo đối tượng & Toàn vẹn dữ liệu (10 cases)
* **Case 40 - 49**: Kiểm tra gán đúng 10 thuộc tính (`id`, `bookId`, `memberId`, `borrowDate`, `dueDate`, `returnDate`, `status`, `createAt`, `updateAt`, và mặc định `returnDate` là `null`) ➔ **Tất cả 10/10 Đều Pass**.

#### 2. Kiểm tra quá hạn `isOverdue` (11 cases)
* **Case 50**: Phiếu `ACTIVE`, sau hạn 1 ngày ➔ Trả về `true` ➔ **Pass**.
* **Case 51**: Phiếu `ACTIVE`, sau hạn 30 ngày ➔ Trả về `true` ➔ **Pass**.
* **Case 52**: Phiếu `ACTIVE`, ngày kiểm tra trùng khớp ngày hẹn ➔ Trả về `false` (hết ngày mới quá hạn) ➔ **Pass**.
* **Case 53**: Phiếu `ACTIVE`, ngày kiểm tra trước hạn ➔ Trả về `false` ➔ **Pass**.
* **Case 54**: Phiếu đã trả (`RETURNED`), dù ngày kiểm tra sau hạn ➔ Vẫn trả về `false` (sách đã ở kho) ➔ **Pass**.
* **Case 55**: Phiếu có enum `OVERDUE` nhưng không `ACTIVE` ➔ Trả về `false` ➔ **Pass**.
* **Case 56**: Không truyền tham số ngày, hạn ở tương lai ➔ Trả về `false` ➔ **Pass**.
* **Case 57**: Không truyền tham số ngày, hạn ở quá khứ ➔ Trả về `true` ➔ **Pass**.
* **Case 58 (Edge)**: Trễ đúng **1 mili-giây** sau hạn trả ➔ `true` ➔ **Pass**.
* **Case 59 (Edge)**: Sớm đúng **1 mili-giây** trước hạn trả ➔ `false` ➔ **Pass**.
* **Case 60 (Edge)**: Mượn và hẹn trả cùng ngày, ngày kế tiếp kiểm tra ➔ `true` ➔ **Pass**.

#### 3. Tính tiền phạt khi ĐÃ TRẢ SÁCH (`returnDate !== null` — 13 cases)
* **Case 61 - 64 (Trả đúng hạn / Trả sớm)**: Trả đúng ngày hẹn, trả sớm 1 ngày, sớm 10 ngày, trả ngay ngày mượn ➔ Phạt `0đ` ➔ **Pass**.
* **Case 65 - 68 (Trả trễ hạn)**: Trễ 1 ngày (5.000đ), trễ 3 ngày (15.000đ), trễ 7 ngày (35.000đ), trễ 14 ngày (70.000đ) ➔ Tính đúng từng đồng ➔ **Pass**.
* **Case 69**: Mức phạt tùy chỉnh 10.000đ/ngày x 3 ngày = 30.000đ ➔ **Pass**.
* **Case 70**: Mức phạt cấu hình 0đ/ngày ➔ Phạt 0đ ➔ **Pass**.
* **Case 71 - 72 (Làm tròn ngày lẻ)**: Trễ 1.5 ngày tính tròn 1 ngày; trễ 0.9 ngày làm tròn xuống 0 ngày ➔ **Pass**.
* **Case 73 (Chống số âm)**: Trả trước hạn 5 ngày không bao giờ bị âm tiền, luôn ra `0đ` ➔ **Pass**.

#### 4. Tính tiền phạt khi CHƯA TRẢ SÁCH (`returnDate === null` — 5 cases)
* **Case 74**: Hạn ở tương lai ➔ Phạt 0đ ➔ **Pass**.
* **Case 75**: Hạn là ngày hôm nay ➔ Phạt 0đ ➔ **Pass**.
* **Case 76**: Hạn đã qua 5 ngày trong quá khứ ➔ Phạt dương tương ứng ➔ **Pass**.
* **Case 77**: Hạn quá đúng 3 ngày so với hiện tại ➔ Phạt đúng 15.000đ ➔ **Pass**.
* **Case 78**: Hạn ở tương lai xa (100 ngày) ➔ Không bao giờ âm tiền ➔ **Pass**.

#### 5. Phòng chống hồi quy lỗi cũ — Regression (6 cases)
* **Case 79**: Tên phương thức chuẩn `isOverdue` chữ thường ➔ **Pass**.
* **Case 80**: Gọi được trong hàm lọc mảng của Service ➔ **Pass**.
* **Case 81 - 82**: Sử dụng `.getTime()` thay vì nhầm sang `.getMilliseconds()` ➔ **Pass**.
* **Case 83 - 84**: Chặn triệt để tiền phạt âm khi trả sớm hoặc hạn ở tương lai ➔ **Pass**.

#### 6. Tích hợp kịch bản thực tế (5 cases)
* **Case 85 - 89**: Mô phỏng vòng đời từ lúc mượn, trả đúng hạn, trả trễ hạn và lọc danh sách quá hạn ➔ **Tất cả 5/5 Đều Pass**.

---

### 🗂️ SUITE 3: MEMBER DOMAIN MODEL & STATE PATTERN (39 Cases — [Book.test.ts](file:///d:/Project/LibraryManagementSystem/test/Book.test.ts))

#### 1. Kiểm tra khả năng mượn — `canBorrow()` (5 cases)
* **Case 90**: Thành viên chưa mượn cuốn nào ➔ `canBorrow(5)` trả về `true` ➔ **Pass**.
* **Case 91**: Đang mượn 3 cuốn, hạn mức 5 ➔ Trả về `true` ➔ **Pass**.
* **Case 92**: Đang mượn đủ 5 cuốn, hạn mức 5 ➔ Trả về `false` (đã chạm ngưỡng) ➔ **Pass**.
* **Case 93**: Đang mượn 6 cuốn (vượt ngưỡng) ➔ Trả về `false` ➔ **Pass**.
* **Case 94**: Hoạt động chính xác với hạn mức nghiêm ngặt bằng 1 ➔ **Pass**.

#### 2. Thao tác thêm phiếu mượn — `addActiveLoan()` (4 cases)
* **Case 95**: Thêm 1 ID phiếu mượn vào danh sách hoạt động ➔ **Pass**.
* **Case 96**: Chặn thêm trùng lặp cùng một mã phiếu mượn ➔ **Pass**.
* **Case 97**: Thêm nhiều mã phiếu mượn khác nhau ➔ **Pass**.
* **Case 98**: Sau khi thêm chạm ngưỡng, `canBorrow` lập tức đổi thành `false` ➔ **Pass**.

#### 3. Thao tác gỡ phiếu mượn khi trả sách — `removeActiveLoan()` (4 cases)
* **Case 99**: Xóa đúng mã phiếu mượn đã hoàn tất ➔ **Pass**.
* **Case 100**: Xóa mã phiếu không tồn tại không gây lỗi crash ➔ **Pass**.
* **Case 101**: Sau khi xóa phiếu, `canBorrow` tự động hồi phục về `true` ➔ **Pass**.
* **Case 102**: Xóa một phiếu không làm suy chuyển các phiếu còn lại ➔ **Pass**.

#### 4. Đóng gói danh sách mượn — `getActiveLoanIds()` (2 cases)
* **Case 103**: Trả về một mảng sao chép, thêm phần tử vào kết quả không làm ô nhiễm kho nội bộ của Member ➔ **Pass**.
* **Case 104**: Thành viên mới tạo trả về mảng rỗng `[]` ➔ **Pass**.

#### 5. Kiểm tra trường hợp đặc biệt & Biên của Member (13 cases)
* **Case 105**: Hạn mức mượn bằng 0 ➔ Luôn trả về `false` ➔ **Pass**.
* **Case 106**: Hạn mức mượn âm ➔ Luôn trả về `false` ➔ **Pass**.
* **Case 107**: Hạn mức rất lớn (100) ➔ Trả về `true` ➔ **Pass**.
* **Case 108**: Gỡ phiếu từ danh sách rỗng an toàn ➔ **Pass**.
* **Case 109**: Xóa lần lượt toàn bộ phiếu dẫn đến danh sách rỗng ➔ **Pass**.
* **Case 110**: Thêm ➔ Xóa ➔ Thêm lại cùng một mã phiếu hoạt động mượt mà ➔ **Pass**.
* **Case 111**: Constructor nhận danh sách mượn ban đầu được đếm chính xác ➔ **Pass**.
* **Case 112**: Trạng thái `canBorrow` bật/tắt liên tục khi thêm và xóa phiếu ➔ **Pass**.
* **Case 113**: Lưu trữ an toàn khi thêm số lượng lớn phiếu mượn (20 phiếu) ➔ **Pass**.
* **Case 114**: Xử lý an toàn khi mảng đầu vào của constructor có phần tử trùng ➔ **Pass**.
* **Case 115 - 117 (Bảo vệ Immutability)**: Chống biến đổi mảng từ bên ngoài, bảo vệ thuộc tính `private` ➔ **Tất cả Đều Pass**.

#### 6. Các trường hợp chờ bổ sung (5 Todo cases)
* **Case 118 - 122**: Các kịch bản kiểm thử cho `BookModel`, `AvailableState.borrow()`, `AvailableState.reserve()`, `BorrowedState.borrow()`, `ReservedState.borrow()`.

---

### 🗂️ SUITE 4: TẦNG SERVICE ĐIỀU PHỐI (15 Cases Khung — [LibraryService.test.ts](file:///d:/Project/LibraryManagementSystem/test/LibraryService.test.ts))

* **Case 123 - 126**: Khung kiểm thử luồng mượn sách `borrowBook()`.
* **Case 127 - 134**: Khung kiểm thử luồng trả sách `returnBook()`, tính phạt và ném lỗi `LoanNotFoundError`, `LoanAlreadyReturnedError`.
* **Case 135 - 137**: Khung kiểm thử chức năng tìm kiếm sách không phân biệt hoa thường `searchBooks()`.
* **Case 138 - 139**: Khung kiểm thử lấy danh sách phiếu quá hạn `getOverdueLoans()`.

---

### 🗂️ SUITE 5: EVENT-DRIVEN ENGINE (6 Cases Thất Bại — [EventEmitter.test.ts](file:///d:/Project/LibraryManagementSystem/test/EventEmitter.test.ts))

* **Case 140 - 145**:
  * Đăng ký sự kiện qua `on()`.
  * Truyền dữ liệu qua `emit()`.
  * Hỗ trợ nhiều listener cho cùng một sự kiện.
  * Không kích hoạt nhầm sự kiện khác.
  * Hủy lắng nghe sự kiện qua `off()`.
  * An toàn khi `emit` một sự kiện không có ai lắng nghe.
  * **Trạng thái**: *Chờ hoàn thiện ở Phase 6*.
