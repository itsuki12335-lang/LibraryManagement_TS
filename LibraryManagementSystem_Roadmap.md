# 📚 Library Management System — Detailed Learning Roadmap (TypeScript OOP Advanced)

> **Mục tiêu**: Xây dựng hệ thống quản lý thư viện bằng TypeScript nâng cao, kế thừa toàn bộ nền tảng đã học từ Kanban Board (Generics, Repository Pattern, Async/Await, Event Emitter) nhưng buộc phải **vá đúng các điểm yếu** đã phát hiện: Service điều phối nhiều entity liên quan, State Pattern thật sự, validation chặt chẽ, và xử lý lỗi rõ ràng bằng Custom Error thay vì boolean/null.

---

## 🏗️ Tổng quan Kiến trúc Hệ thống

```
LibraryManagementSystem/
├── src/
│   ├── models/
│   │   ├── Entity.ts              ← Base Interface có ID (tái dùng từ Kanban)
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
│   │   ├── IRepository.ts         ← Generic Interface IRepository<T> (tái dùng từ Kanban)
│   │   └── InMemoryRepository.ts  ← Generic Class Repository<T> (tái dùng từ Kanban)
│   ├── services/
│   │   ├── MockApiService.ts      ← Giả lập API bất đồng bộ (Promise, delay)
│   │   └── LibraryService.ts      ← Business logic điều phối Book + Member + Loan
│   └── events/
│       └── EventEmitter.ts        ← Pub/Sub Event engine (tái dùng từ Kanban)
├── test/
│   ├── Repository.test.ts
│   ├── Book.test.ts
│   ├── LibraryService.test.ts
│   └── EventEmitter.test.ts
└── main.ts                        ← Chạy thử toàn bộ flow mượn/trả sách bất đồng bộ
```

---

## 📌 PHASE 1 — Generic Repository Pattern (`<T>`) *(tái sử dụng từ Kanban)*

> **Mục tiêu**: Củng cố lại **Generics (`<T>`)** bằng cách áp dụng đúng một Repository cho 3 entity khác nhau (Book, Member, Loan) thay vì chỉ một entity như Kanban.

### 🎯 Các bước thực hiện:

1. **Copy lại `Entity` Interface** từ Kanban:
   - `id: string`
   - `createAt: Date`
   - `updateAt: Date`

2. **Copy lại `IRepository<T extends Entity>` và `InMemoryRepository<T>`** nguyên trạng — không cần viết lại logic, chỉ cần dùng đúng.

3. **Khởi tạo 3 repository riêng biệt trong `LibraryService`**:
   - `private bookRepo = new InMemoryRepository<Book>()`
   - `private memberRepo = new InMemoryRepository<Member>()`
   - `private loanRepo = new InMemoryRepository<Loan>()`
   - Đây là điểm khác biệt đầu tiên so với Kanban: Service phải làm việc với **nhiều repository cùng lúc**, không chỉ một.

---

## 📌 PHASE 2 — Core Library Domain Models

> **Mục tiêu**: Xây dựng mô hình dữ liệu thư viện, có quan hệ thật sự giữa các entity (điều Kanban chưa làm được giữa Board/Column/Task).

### 🎯 Các bước thực hiện:

1. **Định nghĩa Enum**:
   - Enum `BookStatus`: `AVAILABLE | BORROWED | RESERVED | LOST`
   - Enum `LoanStatus`: `ACTIVE | RETURNED | OVERDUE`

2. **Class `Book implements Entity`**:
   - `id`, `title`, `author`, `isbn`, `status: BookStatus`
   - Không tự đổi `status` trực tiếp — mọi thay đổi trạng thái đi qua State Pattern (Phase 3)

3. **Class `Member implements Entity`**:
   - `id`, `name`, `email`, `activeLoanIds: string[]`
   - Method `canBorrow(maxLimit: number): boolean` — kiểm tra chưa vượt giới hạn mượn

4. **Class `Loan implements Entity`**:
   - `id`, `bookId`, `memberId`, `borrowDate`, `dueDate`, `returnDate?`, `status: LoanStatus`
   - Method `isOverdue(): boolean`
   - Method `calculateFine(finePerDay: number): number`

---

## 📌 PHASE 3 — State Pattern cho Book (điểm mới so với Kanban)

> **Mục tiêu**: Ở Kanban, `Task.updateStatus()` cho phép đổi sang bất kỳ trạng thái nào một cách tùy tiện. Phase này buộc luyện **State Pattern thật sự** — mỗi trạng thái tự quyết được phép chuyển đi đâu.

### 🎯 Các bước thực hiện:

1. **Định nghĩa Interface `BookState`**:
   - `borrow(book: Book): void`
   - `returnBook(book: Book): void`
   - `reserve(book: Book): void`
   - Mỗi method throw lỗi nếu hành động không hợp lệ ở trạng thái hiện tại.

2. **Cài đặt `AvailableState`**:
   - `borrow()` → hợp lệ, chuyển `book.status = BORROWED`
   - `reserve()` → hợp lệ, chuyển `book.status = RESERVED`

3. **Cài đặt `BorrowedState`**:
   - `borrow()` → throw `BookNotAvailableError`
   - `returnBook()` → hợp lệ, chuyển về `AvailableState`

4. **Cài đặt `ReservedState`**:
   - `borrow()` → chỉ hợp lệ nếu đúng Member đã đặt trước, ngược lại throw lỗi

---

## 📌 PHASE 4 — Async Service điều phối nhiều Repository (nâng cấp từ Kanban Phase 3)

> **Mục tiêu**: Ở Kanban, `BoardService` chỉ đụng tới `Task` dù `Board`/`Column` đã có sẵn logic. Phase này buộc `LibraryService` phải thật sự phối hợp 3 repository + validate input + custom error trong cùng một luồng nghiệp vụ.

### 🎯 Các bước thực hiện:

1. **Viết `LibraryErrors.ts`**:
   - `class BookNotAvailableError extends Error {}`
   - `class MemberLimitExceededError extends Error {}`
   - `class LoanNotFoundError extends Error {}`
   - `class LoanAlreadyReturnedError extends Error {}`

2. **Viết `MockApiService`** (tái dùng cấu trúc từ Kanban):
   - `delay(ms: number): Promise<void>`
   - `async saveLoan(loan: Loan): Promise<boolean>`

3. **Viết `LibraryService.borrowBook(bookId, memberId): Promise<Loan>`**:
   - Kiểm tra Book tồn tại và đang ở state `AVAILABLE` → nếu không, throw `BookNotAvailableError`
   - Kiểm tra Member chưa vượt giới hạn mượn (vd tối đa 5 cuốn) → nếu vượt, throw `MemberLimitExceededError`
   - Tạo `Loan` mới với ID sinh đúng cách (không lặp lại bug "T1" cứng của Kanban): `"LOAN-" + Date.now() + "-" + random`
   - Đổi `Book` sang `BORROWED` qua State Pattern
   - Emit `"BOOK_BORROWED"`

4. **Viết `LibraryService.returnBook(loanId): Promise<void>`**:
   - Kiểm tra Loan tồn tại và đang `ACTIVE` → nếu không, throw `LoanNotFoundError` hoặc `LoanAlreadyReturnedError`
   - Set `returnDate`, đổi `Loan.status = RETURNED`
   - Đổi `Book` về `AVAILABLE` qua State Pattern
   - Tính phạt trễ hạn bằng `loan.calculateFine()`
   - Emit `"BOOK_RETURNED"`

5. **Viết `LibraryService.getOverdueLoans(): Promise<Loan[]>`**:
   - Lọc `Loan` đang `ACTIVE` và `dueDate < hôm nay`

6. **Viết `LibraryService.searchBooks(keyword): Promise<Book[]>`**:
   - Tìm theo `title` hoặc `author` (case-insensitive)

---

## 📌 PHASE 5 — Event-Driven State Engine (Pub/Sub Pattern) *(tái sử dụng từ Kanban)*

> **Mục tiêu**: Củng cố lại Pub/Sub Pattern, mở rộng thêm các sự kiện nghiệp vụ mới.

### 🎯 Các bước thực hiện:

1. **Copy lại `EventEmitter`** nguyên trạng từ Kanban (`on`, `emit`, `off`).

2. **Tích hợp Event vào `LibraryService`**:
   - Bắn sự kiện `"BOOK_BORROWED"` khi mượn sách thành công.
   - Bắn sự kiện `"BOOK_RETURNED"` khi trả sách thành công.
   - Bắn sự kiện `"LOAN_OVERDUE"` khi phát hiện phiếu mượn quá hạn.
   - Bắn sự kiện `"MEMBER_LIMIT_EXCEEDED"` khi một Member cố mượn vượt giới hạn.

---

## 📌 PHASE 6 — Automated Unit Testing & Integration Flow (nâng cấp: test-first cho phần dễ sai)

> **Mục tiêu**: Ở Kanban, bug "ID cứng T1" không được test nào bắt được. Phase này luyện thói quen **viết test trước khi code** cho đúng những nhánh nghiệp vụ dễ sai nhất.

### 🎯 Các bước thực hiện:

1. **Unit Test Generic Repository** (tái dùng logic test từ Kanban):
   - Kiểm tra `add`, `findById`, `update`, `delete`, `filter` trên `Book`, `Member`, `Loan`.

2. **Unit Test State Pattern**:
   - `AvailableState.borrow()` → chuyển đúng sang `BorrowedState`
   - `BorrowedState.borrow()` → phải throw `BookNotAvailableError`

3. **Unit Test `LibraryService` (viết trước khi code)**:
   - Mượn sách khi hết available → throw `BookNotAvailableError`
   - Mượn sách khi Member đạt giới hạn → throw `MemberLimitExceededError`
   - Trả sách đúng hạn → `fine === 0`
   - Trả sách trễ 3 ngày → `fine === 3 * finePerDay`
   - Trả một Loan đã `RETURNED` → throw `LoanAlreadyReturnedError`
   - `getOverdueLoans()` chỉ trả về Loan đang `ACTIVE` và quá hạn

4. **Kịch bản tích hợp hoàn chỉnh (`main.ts`)**:
   - Khởi tạo Library ➔ Thêm sách & thành viên ➔ Mượn sách (Async + State Pattern) ➔ Nhận Event thông báo ➔ Trả sách trễ hạn ➔ Tính phạt ➔ Kiểm tra danh sách quá hạn.

---

## 🏁 Kết quả đầu ra sau khi hoàn thành dự án này:

1. **Thành thạo Service điều phối nhiều Repository**: Biết cách viết nghiệp vụ chạm vào nhiều entity liên quan trong cùng một luồng — kỹ năng thiếu ở Kanban.
2. **Nắm vững State Pattern**: Hiểu cách một entity tự giới hạn hành vi hợp lệ của chính nó, thay vì đổi trạng thái tùy tiện.
3. **Quen với Custom Error & validation tầng service**: Sẵn sàng viết exception handling chuẩn khi chuyển sang Spring Boot (`@ControllerAdvice`).
4. **Thói quen test-first**: Viết test cho nhánh nghiệp vụ dễ sai trước khi code, tránh lặp lại lỗi kiểu "ID cứng" đã gặp ở Kanban.
