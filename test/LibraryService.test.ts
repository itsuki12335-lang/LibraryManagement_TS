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
    LoanAlreadyReturnedError
} from "../src/errors/LibraryErrors";

function makeBook(id: string, status: BookStatus = BookStatus.AVAILABLE): Book {
    const now = new Date();
    return new Book(id, `Clean Architecture ${id}`, "Robert C. Martin", `ISBN-${id}`, status, now, now);
}

function makeMember(id: string, loans: string[] = []): Member {
    const now = new Date();
    return new Member(id, `Member ${id}`, `member${id}@test.com`, loans, now, now);
}

function makeLoan(options: {
    id: string;
    bookId: string;
    memberId: string;
    dueDate: Date;
    status?: LoanStatus;
}): Loan {
    const now = new Date();
    return new Loan({
        id: options.id,
        bookId: options.bookId,
        memberId: options.memberId,
        borrowDate: now,
        dueDate: options.dueDate,
        returnDate: options.status === LoanStatus.RETURNED ? now : null,
        status: options.status ?? LoanStatus.ACTIVE,
        createAt: now,
        updateAt: now
    });
}

describe("LibraryService — borrowBook()", () => {
    let service: LibraryService;

    beforeEach(() => {
        service = new LibraryService();
    });

    it("should create a Loan and change book status to BORROWED", async () => {
        const book = makeBook("B1", BookStatus.AVAILABLE);
        const member = makeMember("M1", []);
        service.bookRepo.add(book);
        service.memberRepo.add(member);

        const loan = await service.borrowBook(book.id, member.id);

        expect(loan).toBeDefined();
        expect(loan.bookId).toBe(book.id);
        expect(loan.memberId).toBe(member.id);
        expect(loan.status).toBe(LoanStatus.ACTIVE);

        const updatedBook = service.bookRepo.findById(book.id);
        expect(updatedBook?.status).toBe(BookStatus.BORROWED);

        const updatedMember = service.memberRepo.findById(member.id);
        expect(updatedMember?.getActiveLoanIds()).toContain(loan.id);
    });

    it("should throw BookNotAvailableError when book is not AVAILABLE", async () => {
        const book = makeBook("B2", BookStatus.BORROWED);
        const member = makeMember("M2", []);
        service.bookRepo.add(book);
        service.memberRepo.add(member);

        await expect(service.borrowBook(book.id, member.id)).rejects.toThrow(BookNotAvailableError);
    });

    it("should throw MemberLimitExceededError when member reached borrow limit", async () => {
        const book = makeBook("B3", BookStatus.AVAILABLE);
        const member = makeMember("M3", ["L1", "L2", "L3", "L4", "L5"]);
        service.bookRepo.add(book);
        service.memberRepo.add(member);

        await expect(service.borrowBook(book.id, member.id)).rejects.toThrow(MemberLimitExceededError);
    });

    it("should emit BOOK_BORROWED event on successful borrow", async () => {
        // TODO: Phase 6 - EventEmitter integration
    });
});

describe("LibraryService — returnBook()", () => {
    let service: LibraryService;

    beforeEach(() => {
        service = new LibraryService();
    });

    it("should return a book and change loan status to RETURNED", async () => {
        const book = makeBook("B10", BookStatus.BORROWED);
        const member = makeMember("M10", ["L10"]);
        const futureDueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const loan = makeLoan({
            id: "L10",
            bookId: book.id,
            memberId: member.id,
            dueDate: futureDueDate,
            status: LoanStatus.ACTIVE
        });

        service.bookRepo.add(book);
        service.memberRepo.add(member);
        service.loanRepo.add(loan);

        const fine = await service.returnBook(loan.id);

        expect(fine).toBe(0);

        const updatedLoan = service.loanRepo.findById(loan.id);
        expect(updatedLoan?.status).toBe(LoanStatus.RETURNED);
        expect(updatedLoan?.returnDate).toBeInstanceOf(Date);

        const updatedBook = service.bookRepo.findById(book.id);
        expect(updatedBook?.status).toBe(BookStatus.AVAILABLE);

        const updatedMember = service.memberRepo.findById(member.id);
        expect(updatedMember?.getActiveLoanIds()).not.toContain(loan.id);
    });

    it("should return fine = 0 when returned on time", async () => {
        const book = makeBook("B11", BookStatus.BORROWED);
        const member = makeMember("M11", ["L11"]);
        const futureDueDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
        const loan = makeLoan({
            id: "L11",
            bookId: book.id,
            memberId: member.id,
            dueDate: futureDueDate,
            status: LoanStatus.ACTIVE
        });

        service.bookRepo.add(book);
        service.memberRepo.add(member);
        service.loanRepo.add(loan);

        const fine = await service.returnBook(loan.id);
        expect(fine).toBe(0);
    });

    it("should return correct fine when returned 3 days late", async () => {
        const book = makeBook("B12", BookStatus.BORROWED);
        const member = makeMember("M12", ["L12"]);
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
        const loan = makeLoan({
            id: "L12",
            bookId: book.id,
            memberId: member.id,
            dueDate: threeDaysAgo,
            status: LoanStatus.ACTIVE
        });

        service.bookRepo.add(book);
        service.memberRepo.add(member);
        service.loanRepo.add(loan);

        const fine = await service.returnBook(loan.id);
        expect(fine).toBe(15000); // 3 * 5000
    });

    it("should throw LoanAlreadyReturnedError when loan already returned", async () => {
        const book = makeBook("B13", BookStatus.AVAILABLE);
        const member = makeMember("M13", []);
        const loan = makeLoan({
            id: "L13",
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

    it("should throw LoanNotFoundError when loan ID does not exist", async () => {
        await expect(service.returnBook("NON_EXISTING_LOAN")).rejects.toThrow(LoanNotFoundError);
    });

    it("should emit BOOK_RETURNED event on successful return", async () => {
        // TODO: Phase 6 - EventEmitter integration
    });
});

describe("LibraryService — searchBooks()", () => {
    it("should search books by title (case-insensitive)", async () => {
        // TODO: Phase 5 method searchBooks
    });

    it("should search books by author (case-insensitive)", async () => {
        // TODO: Phase 5 method searchBooks
    });

    it("should return empty array if no match found", async () => {
        // TODO: Phase 5 method searchBooks
    });
});

describe("LibraryService — getOverdueLoans()", () => {
    it("should return only ACTIVE loans that are past due date", async () => {
        // TODO: Phase 5 method getOverdueLoans
    });

    it("should not return RETURNED loans even if past due date", async () => {
        // TODO: Phase 5 method getOverdueLoans
    });
});
