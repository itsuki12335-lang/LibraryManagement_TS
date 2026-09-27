# 📚 Library Management System — Detailed Learning Roadmap (TypeScript OOP Advanced)

> **Mục tiêu**: Xây dựng hệ thống quản lý thư viện bằng TypeScript nâng cao, luyện chắc **Generics**, **State Pattern**, **Service điều phối nhiều Repository**, **Custom Error Handling** và **Event-Driven Architecture** — chuẩn bị nền tảng trước khi bước sang backend thật (Spring Boot).

---

## 🏗️ Tổng quan Kiến trúc Hệ thống

```
LibraryManagementSystem/
├── src/
│   ├── models/
│   │   ├── Entity.ts              ← Base Interface có ID
│   │   ├── Book.ts                ← Book data model & methods
│   │   ├── Member.ts              ← Member data model & methods
│   │   └── Loan.ts                ← Loan (phiếu mượn) nối Book ↔ Member
│   ├── enums/
│   │   ├── BookStatus.ts          ← AVAILABLE, BORROWED, RESERVED, LOST
│   │   └── LoanStatus.ts          ← ACTIVE, RETURNED, OVERDUE
│   ├── states/
│   │   ├── BookState.ts           ← Interface State Pattern cho Book
│   │   ├── AvailableState.ts
│   │   ├── BorrowedState.ts
│   │   └── ReservedState.ts
│   ├── errors/
│   │   └── LibraryErrors.ts       ← BookNotAvailableError, MemberLimitExceededError...
│   ├── repository/
│   │   ├── IRepository.ts         ← Generic Interface IRepository<T>
│   │   └── InMemoryRepository.ts  ← Generic Class Repository<T>
│   ├── services/
│   │   ├── MockApiService.ts      ← Giả lập API bất đồng bộ (Promise, delay)
│   │   └── LibraryService.ts      ← Business logic điều phối Book + Member + Loan
│   └── events/
│       └── EventEmitter.ts        ← Pub/Sub Event engine
├── test/
│   ├── Repository.test.ts
│   ├── Book.test.ts
│   ├── LibraryService.test.ts
│   └── EventEmitter.test.ts
└── main.ts                        ← Chạy thử toàn bộ flow mượn/trả sách bất đồng bộ
```

---

## 📌 PHASE 1 — Generic Repository Pattern (`<T>`)

> **Mục tiêu**: Nắm vững **Generics (`<T>`)** — viết một tầng lưu trữ dùng chung được cho mọi entity (Book, Member, Loan) mà không lặp code.

### 🎯 Các bước thực hiện:

1. **Tạo Base Interface `Entity`** (file `models/Entity.ts`):
   - `id: string`
   - `createAt: Date`
   - `updateAt: Date`

2. **Thiết kế Generic Interface `IRepository<T extends Entity>`** (file `repository/IRepository.ts`):
   - `add(item: T): void`
   - `findById(id: string): T | null`
   - `findAll(): T[]`
   - `update(id: string, item: Partial<T>): boolean`
   - `delete(id: string): boolean`
   - `filter(predicate: (item: T) => boolean): T[]`

3. **Cài đặt Class `InMemoryRepository<T extends Entity>`** (file `repository/InMemoryRepository.ts`):
   - Quản lý mảng `private items: T[] = []`
   - Triển khai toàn bộ hàm từ `IRepository<T>`
   - `update()` chỉ được ghi đè các field có trong `Partial<T>`, không được đụng vào `id` hay `createAt` — cần loại `id`/`createAt` ra khỏi object cập nhật trước khi merge, tránh dùng `Object.assign` thẳng tay.

4. **Khởi tạo 3 repository độc lập trong `LibraryService`**:
   - `private bookRepo = new InMemoryRepository<Book>()`
   - `private memberRepo = new InMemoryRepository<Member>()`
   - `private loanRepo = new InMemoryRepository<Loan>()`

---

## 📌 PHASE 2 — Core Library Domain Models

> **Mục tiêu**: Xây dựng mô hình dữ liệu thư viện có quan hệ thật sự giữa các entity (Book, Member, Loan tham chiếu chéo nhau qua ID).

### 🎯 Các bước thực hiện:

1. **Định nghĩa Enum** (thư mục `enums/`):
   - `BookStatus`: `AVAILABLE | BORROWED | RESERVED | LOST`
   - `LoanStatus`: `ACTIVE | RETURNED | OVERDUE`

2. **Class `Book implements Entity`** (file `models/Book.ts`):
   - Field: `id`, `title: string`, `author: string`, `isbn: string`, `status: BookStatus`, `createAt`, `updateAt`
   - Không viết setter đổi `status` trực tiếp trong class này — mọi thay đổi trạng thái phải đi qua State Pattern ở Phase 3.
   - Method `getInfo(): string` — trả về chuỗi mô tả ngắn gọn (title + author + status) để log/debug.

3. **Class `Member implements Entity`** (file `models/Member.ts`):
   - Field: `id`, `name: string`, `email: string`, `activeLoanIds: string[]`, `createAt`, `updateAt`
   - Method `canBorrow(maxLimit: number): boolean` → trả `true` nếu `activeLoanIds.length < maxLimit`
   - Method `addActiveLoan(loanId: string): void` → thêm vào `activeLoanIds`
   - Method `removeActiveLoan(loanId: string): void` → xóa khỏi `activeLoanIds` khi trả sách

4. **Class `Loan implements Entity`** (file `models/Loan.ts`):
   - Field: `id`, `bookId: string`, `memberId: string`, `borrowDate: Date`, `dueDate: Date`, `returnDate: Date | null`, `status: LoanStatus`, `createAt`, `updateAt`
   - Method `isOverdue(referenceDate: Date = new Date()): boolean` → `status === ACTIVE && dueDate < referenceDate`
   - Method `calculateFine(finePerDay: number): number`:
     - Nếu chưa trả (`returnDate === null`) → tính từ `dueDate` đến hôm nay
     - Nếu đã trả → tính từ `dueDate` đến `returnDate`
     - Nếu không trễ → trả về `0`
     - Công thức: `Math.max(0, soNgayTre) * finePerDay`

---

## 📌 PHASE 3 — State Pattern cho Book

> **Mục tiêu**: Thay vì cho phép đổi `status` sang bất kỳ giá trị nào tùy tiện, mỗi trạng thái của Book phải tự quyết được phép chuyển tiếp sang trạng thái nào, và tự throw lỗi khi hành động không hợp lệ.

### 🎯 Các bước thực hiện:

1. **Định nghĩa Interface `BookState`** (file `states/BookState.ts`):
   - `borrow(book: Book): void`
   - `returnBook(book: Book): void`
   - `reserve(book: Book): void`

2. **Cài đặt `AvailableState implements BookState`** (file `states/AvailableState.ts`):
   - `borrow(book)` → hợp lệ: gán `book.status = BookStatus.BORROWED`
   - `reserve(book)` → hợp lệ: gán `book.status = BookStatus.RESERVED`
   - `returnBook(book)` → không hợp lệ ở trạng thái này: `throw new Error("Sách chưa được mượn nên không thể trả")`

3. **Cài đặt `BorrowedState implements BookState`** (file `states/BorrowedState.ts`):
   - `borrow(book)` → không hợp lệ: `throw new BookNotAvailableError(book.id)`
   - `returnBook(book)` → hợp lệ: gán `book.status = BookStatus.AVAILABLE`
   - `reserve(book)` → không hợp lệ: `throw new Error("Không thể đặt trước sách đang được mượn")`

4. **Cài đặt `ReservedState implements BookState`** (file `states/ReservedState.ts`):
   - `borrow(book)` → chỉ hợp lệ nếu người mượn đúng là người đã đặt trước (cần truyền thêm `memberId` để so sánh); nếu khác → `throw new BookNotAvailableError(book.id)`
   - `returnBook(book)` → không hợp lệ (sách đang đặt trước, chưa ai mượn)

5. **Hàm ánh xạ trạng thái sang State object**, viết trong `LibraryService` hoặc một `BookStateFactory` riêng:
   - `getState(status: BookStatus): BookState` → trả về đúng instance state tương ứng để gọi method lên đó.

---

## 📌 PHASE 4 — Custom Error Handling

> **Mục tiêu**: Thay vì trả `boolean`/`null` chung chung khi có lỗi, mỗi loại lỗi nghiệp vụ phải là một class riêng, mang thông tin rõ ràng để tầng gọi phía trên biết chính xác chuyện gì đã xảy ra.

### 🎯 Các bước thực hiện:

1. **Viết `LibraryErrors.ts`** (thư mục `errors/`):
   - `class BookNotAvailableError extends Error` — nhận `bookId` trong constructor, set message `"Sách {bookId} hiện không khả dụng để mượn"`
   - `class MemberLimitExceededError extends Error` — nhận `memberId` và `limit`, set message `"Thành viên {memberId} đã đạt giới hạn mượn {limit} cuốn"`
   - `class LoanNotFoundError extends Error` — nhận `loanId`
   - `class LoanAlreadyReturnedError extends Error` — nhận `loanId`

2. **Quy tắc dùng lỗi**: Mọi method trong `LibraryService` khi gặp điều kiện nghiệp vụ không thỏa phải `throw` đúng loại lỗi tương ứng — không được `return false` hay `return null` để báo lỗi im lặng.

---

## 📌 PHASE 5 — Async Service điều phối nhiều Repository

> **Mục tiêu**: Đây là phần lõi của dự án — một nghiệp vụ (mượn sách) phải đụng vào cả 3 entity (Book, Member, Loan) trong cùng một luồng xử lý, có validate và có bắn sự kiện.

### 🎯 Các bước thực hiện:

1. **Viết `MockApiService`** (file `services/MockApiService.ts`):
   - `delay(ms: number): Promise<void>` — mô phỏng độ trễ mạng 500–1000ms bằng `setTimeout` bọc trong Promise
   - `async saveLoan(loan: Loan): Promise<boolean>` — giả lập lưu phiếu mượn xuống server, gọi `delay()` trước khi trả `true`

2. **Sinh ID đúng cách** — viết một hàm dùng chung, ví dụ trong file `utils/generateId.ts`:
   - `generateId(prefix: string): string` → trả về `` `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}` ``
   - Dùng hàm này cho mọi entity mới tạo (Book, Member, Loan) — không được gán ID cố định bằng chuỗi tĩnh.

3. **Viết `LibraryService.borrowBook(bookId: string, memberId: string): Promise<Loan>`**:
   - B1: `bookRepo.findById(bookId)` — nếu `null`, throw `BookNotAvailableError(bookId)`
   - B2: Lấy `BookState` tương ứng với `book.status`, gọi `state.borrow(book)` — nếu không hợp lệ, State tự throw lỗi
   - B3: `memberRepo.findById(memberId)` — nếu `null`, throw lỗi tương tự cho Member
   - B4: Gọi `member.canBorrow(5)` — nếu `false`, throw `MemberLimitExceededError(memberId, 5)`
   - B5: Tạo `Loan` mới: `borrowDate = new Date()`, `dueDate = borrowDate + 14 ngày`, `status = ACTIVE`, `id = generateId("LOAN")`
   - B6: `loanRepo.add(loan)`, `bookRepo.update(bookId, { status: book.status })`, `member.addActiveLoan(loan.id)`, `memberRepo.update(memberId, { activeLoanIds: member.activeLoanIds })`
   - B7: `await apiService.saveLoan(loan)` — giả lập đồng bộ lên server
   - B8: `eventEmitter.emit("BOOK_BORROWED", { bookId, memberId, loanId: loan.id })`
   - B9: `return loan`

4. **Viết `LibraryService.returnBook(loanId: string): Promise<number>`** (trả về số tiền phạt):
   - B1: `loanRepo.findById(loanId)` — nếu `null`, throw `LoanNotFoundError(loanId)`
   - B2: Nếu `loan.status !== ACTIVE`, throw `LoanAlreadyReturnedError(loanId)`
   - B3: Set `loan.returnDate = new Date()`, `loan.status = RETURNED`
   - B4: Tính `fine = loan.calculateFine(5000)` (ví dụ 5.000đ/ngày trễ)
   - B5: Lấy Book tương ứng, gọi `state.returnBook(book)` để đổi về `AVAILABLE`
   - B6: Cập nhật lại `loanRepo`, `bookRepo`, và gọi `member.removeActiveLoan(loanId)` rồi cập nhật `memberRepo`
   - B7: `eventEmitter.emit("BOOK_RETURNED", { loanId, fine })`
   - B8: `return fine`

5. **Viết `LibraryService.getOverdueLoans(): Promise<Loan[]>`**:
   - `loanRepo.filter(loan => loan.isOverdue())`

6. **Viết `LibraryService.searchBooks(keyword: string): Promise<Book[]>`**:
   - `bookRepo.filter(book => book.title.toLowerCase().includes(keyword.toLowerCase()) || book.author.toLowerCase().includes(keyword.toLowerCase()))`

---

## 📌 PHASE 6 — Event-Driven State Engine (Pub/Sub Pattern)

> **Mục tiêu**: Xây một cơ chế cho phép các phần khác của hệ thống "lắng nghe" khi có hành động nghiệp vụ xảy ra, mà không cần gọi trực tiếp lẫn nhau.

### 🎯 Các bước thực hiện:

1. **Viết Class `EventEmitter`** (file `events/EventEmitter.ts`):
   - `private listeners: Map<string, Function[]> = new Map()`
   - `on(event: string, callback: Function): void` — thêm callback vào mảng của đúng key `event` trong map (tạo mảng mới nếu chưa có)
   - `emit(event: string, data?: any): void` — lấy mảng callback theo `event`, lần lượt gọi từng callback với `data`
   - `off(event: string, callback: Function): void` — lọc bỏ đúng callback đó khỏi mảng

2. **Tích hợp vào `LibraryService`**:
   - Bắn `"BOOK_BORROWED"` khi mượn thành công (đã nêu ở Phase 5)
   - Bắn `"BOOK_RETURNED"` khi trả thành công, kèm số tiền phạt
   - Bắn `"LOAN_OVERDUE"` — gọi định kỳ (hoặc trong `main.ts` demo) khi `getOverdueLoans()` phát hiện có phiếu quá hạn
   - Bắn `"MEMBER_LIMIT_EXCEEDED"` ngay trước khi `borrowBook` throw `MemberLimitExceededError`, để phần UI/log có thể phản ứng riêng

---

## 📌 PHASE 7 — Automated Unit Testing & Integration Flow

> **Mục tiêu**: Viết test cho đúng những nhánh nghiệp vụ dễ sai nhất **trước khi** code phần đó, để tự bắt lỗi logic ngay khi vừa viết ra thay vì phát hiện muộn.

### 🎯 Các bước thực hiện:

1. **Unit Test `InMemoryRepository<T>`**:
   - `add()` rồi `findById()` phải trả đúng object vừa thêm
   - `update()` chỉ thay đổi đúng field truyền vào, không đụng tới `id`/`createAt`
   - `delete()` xong thì `findById()` phải trả `null`

2. **Unit Test State Pattern**:
   - `AvailableState.borrow()` → `book.status` phải chuyển thành `BORROWED`
   - `BorrowedState.borrow()` → phải `throw BookNotAvailableError`
   - `BorrowedState.returnBook()` → `book.status` phải chuyển về `AVAILABLE`

3. **Unit Test `LibraryService` (viết trước khi code hàm tương ứng)**:
   - Mượn sách đang `BORROWED` → expect throw `BookNotAvailableError`
   - Member đã có 5 loan active, mượn thêm → expect throw `MemberLimitExceededError`
   - Trả sách đúng hạn (`returnDate <= dueDate`) → `fine === 0`
   - Trả sách trễ 3 ngày, `finePerDay = 5000` → `fine === 15000`
   - Trả một `loanId` đã `RETURNED` → expect throw `LoanAlreadyReturnedError`
   - `getOverdueLoans()` → chỉ chứa loan có `status === ACTIVE` và `dueDate` đã qua, không lẫn loan đã `RETURNED`

4. **Unit Test `EventEmitter`**:
   - `on()` một callback rồi `emit()` → callback phải được gọi đúng 1 lần với đúng data
   - `off()` xong rồi `emit()` lại → callback không được gọi nữa

5. **Kịch bản tích hợp hoàn chỉnh trong `main.ts`**:
   - Khởi tạo `LibraryService` ➔ thêm vài Book và Member mẫu ➔ gọi `borrowBook()` (async) ➔ log ra Event `"BOOK_BORROWED"` nhận được ➔ giả lập thời gian trôi qua khỏi `dueDate` ➔ gọi `returnBook()` ➔ in ra số tiền phạt và Event `"BOOK_RETURNED"` ➔ gọi `getOverdueLoans()` để kiểm tra danh sách trước khi có ai trả trễ.

---

## 🏁 Kết quả đầu ra sau khi hoàn thành dự án này:

1. **Thành thạo Generics áp dụng cho nhiều entity**: Một `IRepository<T>` dùng chung được cho Book, Member, Loan mà không viết lại logic lưu trữ.
2. **Nắm vững State Pattern**: Biết cách để một entity tự giới hạn hành vi hợp lệ của chính nó theo trạng thái hiện tại, thay vì cho phép đổi trạng thái tùy tiện.
3. **Biết cách viết Service điều phối nghiệp vụ phức tạp**: Một hành động (mượn sách) chạm đúng vào nhiều entity liên quan, có thứ tự bước rõ ràng.
4. **Thành thạo Custom Error Handling**: Sẵn sàng chuyển sang exception handling chuẩn của Spring Boot (`@ControllerAdvice`, `@ExceptionHandler`) sau này.
5. **Thói quen test-first**: Viết test cho nhánh nghiệp vụ dễ sai trước khi code, giảm rủi ro lặp lại các lỗi logic ẩn.
