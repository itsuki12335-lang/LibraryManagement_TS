import { describe, it, expect, beforeEach } from "vitest";
import { LibraryService } from "../src/services/LibraryService";
import { Book } from "../src/models/Book";
import { Member } from "../src/models/Member";
import { Loan } from "../src/models/Loan";
import { BookStatus } from "../src/enums/BookStatus";
import { LoanStatus } from "../src/enums/LoanStatus";
import {
    BookNotAvailableError,
    MemberLimitExceededError,
    LoanNotFoundError,
    LoanAlreadyReturnedError,
    MemberNotFound
} from "../src/errors/LibraryErrors";

// Helper tạo Book
function makeBook(
    id: string,
    status: BookStatus = BookStatus.AVAILABLE,
    title?: string,
    author?: string
): Book {
    const now = new Date();
    return new Book(
        id,
        title ?? `Clean Architecture ${id}`,
        author ?? "Robert C. Martin",
        `ISBN-${id}`,
        status,
        now,
        now
    );
}

// Helper tạo Member
function makeMember(id: string, loans: string[] = []): Member {
    const now = new Date();
    return new Member(id, `Member ${id}`, `member${id}@test.com`, loans, now, now);
}

// Helper tạo Loan
function makeLoan(options: {
    id: string;
    bookId: string;
    memberId: string;
    dueDate: Date;
    status?: LoanStatus;
    borrowDate?: Date;
}): Loan {
    const now = new Date();
    return new Loan({
        id: options.id,
        bookId: options.bookId,
        memberId: options.memberId,
        borrowDate: options.borrowDate ?? now,
        dueDate: options.dueDate,
        returnDate: options.status === LoanStatus.RETURNED ? now : null,
        status: options.status ?? LoanStatus.ACTIVE,
        createAt: now,
        updateAt: now
    });
}

describe("LibraryService — Comprehensive Test Suite", () => {
    let service: LibraryService;

    beforeEach(() => {
        service = new LibraryService();
    });

    // ==========================================
    // 1. getState() — Book State Mapping
    // ==========================================
    describe("getState()", () => {
        it("should return AvailableState when book status is AVAILABLE", () => {
            const book = makeBook("B_ST_1", BookStatus.AVAILABLE);
            const state = service.getState(book);
            expect(state.constructor.name).toBe("AvailableState");
        });

        it("should return BorrowedState when book status is BORROWED", () => {
            const book = makeBook("B_ST_2", BookStatus.BORROWED);
            const state = service.getState(book);
            expect(state.constructor.name).toBe("BorrowedState");
        });

        it("should return ReservedState when book status is RESERVED", () => {
            const book = makeBook("B_ST_3", BookStatus.RESERVED);
            const state = service.getState(book);
            expect(state.constructor.name).toBe("ReservedState");
        });

        it("should throw an Error when book status is LOST", () => {
            const book = makeBook("B_ST_4", BookStatus.LOST);
            expect(() => service.getState(book)).toThrow("Sách đã bị mất");
        });
    });

    // ==========================================
    // 2. borrowBook() — Luồng mượn & Edge Cases
    // ==========================================
    describe("borrowBook()", () => {
        it("Happy Path: should create a Loan with 14 days duration and update all repos", async () => {
            const book = makeBook("B1", BookStatus.AVAILABLE);
            const member = makeMember("M1", []);
            service.bookRepo.add(book);
            service.memberRepo.add(member);

            const beforeTime = Date.now();
            const loan = await service.borrowBook(book.id, member.id);

            expect(loan).toBeDefined();
            expect(loan.bookId).toBe(book.id);
            expect(loan.memberId).toBe(member.id);
            expect(loan.status).toBe(LoanStatus.ACTIVE);
            expect(loan.returnDate).toBeNull();

            // Kiểm tra hạn trả đúng 14 ngày (dung sai 2 giây)
            const expectedDueTime = beforeTime + 14 * 24 * 60 * 60 * 1000;
            expect(Math.abs(loan.dueDate.getTime() - expectedDueTime)).toBeLessThan(2000);

            // Kiểm tra trạng thái trong Repository
            const storedBook = service.bookRepo.findById(book.id);
            expect(storedBook?.status).toBe(BookStatus.BORROWED);

            const storedMember = service.memberRepo.findById(member.id);
            expect(storedMember?.getActiveLoanIds()).toContain(loan.id);

            const storedLoan = service.loanRepo.findById(loan.id);
            expect(storedLoan).toBeDefined();
            expect(storedLoan?.id).toBe(loan.id);
        });

        it("Edge Case: should throw BookNotAvailableError when book does not exist", async () => {
            const member = makeMember("M_NON_EXIST", []);
            service.memberRepo.add(member);

            await expect(service.borrowBook("GHOST_BOOK_ID", member.id)).rejects.toThrow(BookNotAvailableError);
        });

        it("Edge Case: should throw BookNotAvailableError when book is already BORROWED", async () => {
            const book = makeBook("B_ALREADY_BORROWED", BookStatus.BORROWED);
            const member = makeMember("M_BORROW_FAIL", []);
            service.bookRepo.add(book);
            service.memberRepo.add(member);

            await expect(service.borrowBook(book.id, member.id)).rejects.toThrow(BookNotAvailableError);
        });

        it("Edge Case: should throw MemberNotFound when member does not exist in repo", async () => {
            const book = makeBook("B_NO_MEMBER", BookStatus.AVAILABLE);
            service.bookRepo.add(book);

            await expect(service.borrowBook(book.id, "GHOST_MEMBER_ID")).rejects.toThrow(MemberNotFound);
        });

        it("Boundary Case: should allow borrowing when member has 4 loans (below limit 5)", async () => {
            const book = makeBook("B_LIMIT_4", BookStatus.AVAILABLE);
            const member = makeMember("M_LIMIT_4", ["L1", "L2", "L3", "L4"]);
            service.bookRepo.add(book);
            service.memberRepo.add(member);

            const loan = await service.borrowBook(book.id, member.id);
            expect(loan).toBeDefined();

            const updatedMember = service.memberRepo.findById(member.id);
            expect(updatedMember?.getActiveLoanIds().length).toBe(5);
        });

        it("Boundary Case: should throw MemberLimitExceededError when member has exactly 5 loans", async () => {
            const book = makeBook("B_LIMIT_5", BookStatus.AVAILABLE);
            const member = makeMember("M_LIMIT_5", ["L1", "L2", "L3", "L4", "L5"]);
            service.bookRepo.add(book);
            service.memberRepo.add(member);

            await expect(service.borrowBook(book.id, member.id)).rejects.toThrow(MemberLimitExceededError);
        });

        it("Boundary Case: should throw MemberLimitExceededError when member has more than 5 loans", async () => {
            const book = makeBook("B_LIMIT_OVER", BookStatus.AVAILABLE);
            const member = makeMember("M_LIMIT_OVER", ["L1", "L2", "L3", "L4", "L5", "L6"]);
            service.bookRepo.add(book);
            service.memberRepo.add(member);

            await expect(service.borrowBook(book.id, member.id)).rejects.toThrow(MemberLimitExceededError);
        });

        it("Sequential Flow: same member borrowing multiple books sequentially", async () => {
            const book1 = makeBook("SEQ_B1", BookStatus.AVAILABLE);
            const book2 = makeBook("SEQ_B2", BookStatus.AVAILABLE);
            const member = makeMember("SEQ_M1", []);
            service.bookRepo.add(book1);
            service.bookRepo.add(book2);
            service.memberRepo.add(member);

            const loan1 = await service.borrowBook(book1.id, member.id);
            const loan2 = await service.borrowBook(book2.id, member.id);

            expect(loan1.id).not.toBe(loan2.id);

            const updatedMember = service.memberRepo.findById(member.id);
            expect(updatedMember?.getActiveLoanIds()).toEqual([loan1.id, loan2.id]);
        });

        it("Event: should emit BOOK_BORROWED event on successful borrow", async () => {
            const book = makeBook("EVT_B1", BookStatus.AVAILABLE);
            const member = makeMember("EVT_M1", []);
            service.bookRepo.add(book);
            service.memberRepo.add(member);

            let eventData: any = null;
            const emitter = (service as any).eventEmit || (service as any).eventEmitter;
            emitter.on("BOOK_BORROWED", (data: any) => {
                eventData = data;
            });

            const loan = await service.borrowBook(book.id, member.id);

            expect(eventData).not.toBeNull();
            expect(eventData.bookId).toBe(book.id);
            expect(eventData.memberId).toBe(member.id);
            expect(eventData.loanId).toBe(loan.id);
        });
    });

    // ==========================================
    // 3. returnBook() — Luồng trả, Phạt & Edge Cases
    // ==========================================
    describe("returnBook()", () => {
        it("Happy Path: should return on-time book with fine = 0 and update states", async () => {
            const book = makeBook("RET_B1", BookStatus.BORROWED);
            const member = makeMember("RET_M1", ["RET_L1"]);
            const futureDue = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            const loan = makeLoan({
                id: "RET_L1",
                bookId: book.id,
                memberId: member.id,
                dueDate: futureDue,
                status: LoanStatus.ACTIVE
            });

            service.bookRepo.add(book);
            service.memberRepo.add(member);
            service.loanRepo.add(loan);

            const fine = await service.returnBook(loan.id);
            expect(fine).toBe(0);

            // Kiểm tra trạng thái đã chuyển đổi
            const updatedLoan = service.loanRepo.findById(loan.id);
            expect(updatedLoan?.status).toBe(LoanStatus.RETURNED);
            expect(updatedLoan?.returnDate).toBeInstanceOf(Date);

            const updatedBook = service.bookRepo.findById(book.id);
            expect(updatedBook?.status).toBe(BookStatus.AVAILABLE);

            const updatedMember = service.memberRepo.findById(member.id);
            expect(updatedMember?.getActiveLoanIds()).not.toContain(loan.id);
        });

        it("Boundary Case: returning exactly on dueDate should have fine = 0", async () => {
            const book = makeBook("RET_B_DUE", BookStatus.BORROWED);
            const member = makeMember("RET_M_DUE", ["RET_L_DUE"]);
            // Due date chính là thời điểm hiện tại
            const exactDue = new Date();
            const loan = makeLoan({
                id: "RET_L_DUE",
                bookId: book.id,
                memberId: member.id,
                dueDate: exactDue,
                status: LoanStatus.ACTIVE
            });

            service.bookRepo.add(book);
            service.memberRepo.add(member);
            service.loanRepo.add(loan);

            const fine = await service.returnBook(loan.id);
            expect(fine).toBe(0);
        });

        it("Fine Calculation: returning 1 day late should fine 5,000đ", async () => {
            const book = makeBook("RET_B_1D", BookStatus.BORROWED);
            const member = makeMember("RET_M_1D", ["RET_L_1D"]);
            const oneDayLate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
            const loan = makeLoan({
                id: "RET_L_1D",
                bookId: book.id,
                memberId: member.id,
                dueDate: oneDayLate,
                status: LoanStatus.ACTIVE
            });

            service.bookRepo.add(book);
            service.memberRepo.add(member);
            service.loanRepo.add(loan);

            const fine = await service.returnBook(loan.id);
            expect(fine).toBe(5000);
        });

        it("Fine Calculation: returning 5 days late should fine 25,000đ", async () => {
            const book = makeBook("RET_B_5D", BookStatus.BORROWED);
            const member = makeMember("RET_M_5D", ["RET_L_5D"]);
            const fiveDaysLate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
            const loan = makeLoan({
                id: "RET_L_5D",
                bookId: book.id,
                memberId: member.id,
                dueDate: fiveDaysLate,
                status: LoanStatus.ACTIVE
            });

            service.bookRepo.add(book);
            service.memberRepo.add(member);
            service.loanRepo.add(loan);

            const fine = await service.returnBook(loan.id);
            expect(fine).toBe(25000);
        });

        it("Edge Case: should throw LoanNotFoundError when loanId does not exist", async () => {
            await expect(service.returnBook("NON_EXISTING_LOAN")).rejects.toThrow(LoanNotFoundError);
        });

        it("Edge Case: should throw LoanAlreadyReturnedError when loan is already RETURNED", async () => {
            const book = makeBook("RET_B_ALREADY", BookStatus.AVAILABLE);
            const member = makeMember("RET_M_ALREADY", []);
            const loan = makeLoan({
                id: "RET_L_ALREADY",
                bookId: book.id,
                memberId: member.id,
                dueDate: new Date(),
                status: LoanStatus.RETURNED
            });

            service.bookRepo.add(book);
            service.memberRepo.add(member);
            service.loanRepo.add(loan);

            await expect(service.returnBook(loan.id)).rejects.toThrow(LoanAlreadyReturnedError);
        });

        it("Edge Case: should throw BookNotAvailableError if book is missing from repo on return", async () => {
            const member = makeMember("RET_M_MISSING_B", ["L_NO_B"]);
            const loan = makeLoan({
                id: "L_NO_B",
                bookId: "GHOST_BOOK_ID",
                memberId: member.id,
                dueDate: new Date(),
                status: LoanStatus.ACTIVE
            });

            service.memberRepo.add(member);
            service.loanRepo.add(loan);

            await expect(service.returnBook(loan.id)).rejects.toThrow(BookNotAvailableError);
        });

        it("Edge Case: should throw MemberNotFound if member is missing from repo on return", async () => {
            const book = makeBook("RET_B_MISSING_M", BookStatus.BORROWED);
            const loan = makeLoan({
                id: "L_NO_M",
                bookId: book.id,
                memberId: "GHOST_MEMBER_ID",
                dueDate: new Date(),
                status: LoanStatus.ACTIVE
            });

            service.bookRepo.add(book);
            service.loanRepo.add(loan);

            await expect(service.returnBook(loan.id)).rejects.toThrow(MemberNotFound);
        });

        it("Integration Flow: Member reaches limit 5, returns 1 book, then can borrow again", async () => {
            const bookToReturn = makeBook("INT_B1", BookStatus.BORROWED);
            const newBookToBorrow = makeBook("INT_B2", BookStatus.AVAILABLE);
            const member = makeMember("INT_M1", ["L1", "L2", "L3", "L4", "L_RET"]);
            const loanToReturn = makeLoan({
                id: "L_RET",
                bookId: bookToReturn.id,
                memberId: member.id,
                dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
                status: LoanStatus.ACTIVE
            });

            service.bookRepo.add(bookToReturn);
            service.bookRepo.add(newBookToBorrow);
            service.memberRepo.add(member);
            service.loanRepo.add(loanToReturn);

            // 1. Đang ở mốc 5 cuốn -> Mượn thêm sẽ bị chặn
            await expect(service.borrowBook(newBookToBorrow.id, member.id)).rejects.toThrow(MemberLimitExceededError);

            // 2. Trả 1 cuốn sách
            await service.returnBook(loanToReturn.id);

            // 3. Đã giải phóng 1 slot (còn 4 cuốn) -> Mượn thành công!
            const newLoan = await service.borrowBook(newBookToBorrow.id, member.id);
            expect(newLoan).toBeDefined();
            expect(newLoan.bookId).toBe(newBookToBorrow.id);
        });

        it("Event: should emit BOOK_RETURNED event on successful return", async () => {
            const book = makeBook("EVT_B2", BookStatus.BORROWED);
            const member = makeMember("EVT_M2", ["EVT_L2"]);
            const loan = makeLoan({
                id: "EVT_L2",
                bookId: book.id,
                memberId: member.id,
                dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // trễ 2 ngày -> fine = 10000
                status: LoanStatus.ACTIVE
            });

            service.bookRepo.add(book);
            service.memberRepo.add(member);
            service.loanRepo.add(loan);

            let eventData: any = null;
            const emitter = (service as any).eventEmit || (service as any).eventEmitter;
            emitter.on("BOOK_RETURNED", (data: any) => {
                eventData = data;
            });

            const fine = await service.returnBook(loan.id);

            expect(eventData).not.toBeNull();
            expect(eventData.loanId).toBe(loan.id);
            expect(eventData.fine).toBe(fine);
            expect(eventData.fine).toBe(10000);
        });
    });

    // ==========================================
    // 4. searchBooks() — Đa dạng từ khóa & Edge Cases
    // ==========================================
    describe("searchBooks()", () => {
        beforeEach(() => {
            service.bookRepo.add(makeBook("SB1", BookStatus.AVAILABLE, "The Pragmatic Programmer", "Andy Hunt"));
            service.bookRepo.add(makeBook("SB2", BookStatus.AVAILABLE, "Refactoring", "Martin Fowler"));
            service.bookRepo.add(makeBook("SB3", BookStatus.AVAILABLE, "Clean Code", "Robert C. Martin"));
            service.bookRepo.add(makeBook("SB4", BookStatus.AVAILABLE, "Clean Architecture", "Robert C. Martin"));
        });

        it("should match by partial title in lowercase", async () => {
            const results = await service.searchBooks("pragmatic");
            expect(results.length).toBe(1);
            expect(results[0].id).toBe("SB1");
        });

        it("should match by partial author in uppercase", async () => {
            const results = await service.searchBooks("FOWLER");
            expect(results.length).toBe(1);
            expect(results[0].id).toBe("SB2");
        });

        it("should return multiple books matching the same author keyword", async () => {
            const results = await service.searchBooks("Martin");
            // "Martin Fowler" (SB2) + "Robert C. Martin" (SB3, SB4) = 3 books!
            expect(results.length).toBe(3);
        });

        it("should return multiple books matching the same title prefix", async () => {
            const results = await service.searchBooks("clean");
            // "Clean Code" (SB3) + "Clean Architecture" (SB4) = 2 books
            expect(results.length).toBe(2);
        });

        it("Edge Case: should return empty array when keyword matches nothing", async () => {
            const results = await service.searchBooks("Python Machine Learning");
            expect(results).toEqual([]);
        });

        it("Edge Case: searching with empty string should return all books in repo", async () => {
            const results = await service.searchBooks("");
            expect(results.length).toBe(4);
        });

        it("Edge Case: searching when repo is empty should return empty array", async () => {
            const emptyService = new LibraryService();
            const results = await emptyService.searchBooks("Java");
            expect(results).toEqual([]);
        });
    });

    // ==========================================
    // 5. getOverdueLoans() — Quá hạn & Edge Cases
    // ==========================================
    describe("getOverdueLoans()", () => {
        it("should return empty array when no loans exist in repository", async () => {
            const results = await service.getOverdueLoans();
            expect(results).toEqual([]);
        });

        it("should return empty array when all active loans are on-time", async () => {
            const futureDue = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
            service.loanRepo.add(makeLoan({ id: "L_ONTIME_1", bookId: "B1", memberId: "M1", dueDate: futureDue }));
            service.loanRepo.add(makeLoan({ id: "L_ONTIME_2", bookId: "B2", memberId: "M2", dueDate: futureDue }));

            const results = await service.getOverdueLoans();
            expect(results).toEqual([]);
        });

        it("should return only overdue ACTIVE loans and exclude RETURNED loans", async () => {
            const overdueDue = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
            const futureDue = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

            // Loan 1: Quá hạn & ACTIVE -> PHẢI LẤY
            service.loanRepo.add(makeLoan({ id: "OD_ACTIVE_1", bookId: "B1", memberId: "M1", dueDate: overdueDue, status: LoanStatus.ACTIVE }));
            // Loan 2: Quá hạn nhưng đã RETURNED -> KHÔNG LẤY
            service.loanRepo.add(makeLoan({ id: "OD_RET_2", bookId: "B2", memberId: "M2", dueDate: overdueDue, status: LoanStatus.RETURNED }));
            // Loan 3: Chưa tới hạn & ACTIVE -> KHÔNG LẤY
            service.loanRepo.add(makeLoan({ id: "ONTIME_ACTIVE_3", bookId: "B3", memberId: "M3", dueDate: futureDue, status: LoanStatus.ACTIVE }));

            const results = await service.getOverdueLoans();
            expect(results.length).toBe(1);
            expect(results[0].id).toBe("OD_ACTIVE_1");
        });

        it("should return multiple overdue loans if multiple members are overdue", async () => {
            const overdueDue1 = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
            const overdueDue2 = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);

            service.loanRepo.add(makeLoan({ id: "MULTI_OD_1", bookId: "B1", memberId: "M1", dueDate: overdueDue1, status: LoanStatus.ACTIVE }));
            service.loanRepo.add(makeLoan({ id: "MULTI_OD_2", bookId: "B2", memberId: "M2", dueDate: overdueDue2, status: LoanStatus.ACTIVE }));

            const results = await service.getOverdueLoans();
            expect(results.length).toBe(2);
        });
    });
});
