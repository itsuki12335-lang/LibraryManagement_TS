import { describe, it, expect, beforeEach } from "vitest";
import { LibraryService } from "../src/services/LibraryService";
import { Book } from "../src/models/Book";
import { Member } from "../src/models/Member";
import { BookStatus } from "../src/enums/BookStatus";
import { LoanStatus } from "../src/enums/LoanStatus";
import {
    BookNotAvailableError,
    MemberLimitExceededError,
    LoanNotFoundError,
    LoanAlreadyReturnedError
} from "../src/errors/LibraryErrors";

describe("LibraryService — borrowBook()", () => {
    it("should create a Loan and change book status to BORROWED", async () => {
        // TODO
    });

    it("should throw BookNotAvailableError when book is not AVAILABLE", async () => {
        // TODO
    });

    it("should throw MemberLimitExceededError when member reached borrow limit", async () => {
        // TODO
    });

    it("should emit BOOK_BORROWED event on successful borrow", async () => {
        // TODO
    });
});

describe("LibraryService — returnBook()", () => {
    it("should return a book and change loan status to RETURNED", async () => {
        // TODO
    });

    it("should return fine = 0 when returned on time", async () => {
        // TODO
    });

    it("should return correct fine when returned 3 days late", async () => {
        // TODO
    });

    it("should throw LoanAlreadyReturnedError when loan already returned", async () => {
        // TODO
    });

    it("should throw LoanNotFoundError when loan ID does not exist", async () => {
        // TODO
    });

    it("should emit BOOK_RETURNED event on successful return", async () => {
        // TODO
    });
});

describe("LibraryService — searchBooks()", () => {
    it("should search books by title (case-insensitive)", async () => {
        // TODO
    });

    it("should search books by author (case-insensitive)", async () => {
        // TODO
    });

    it("should return empty array if no match found", async () => {
        // TODO
    });
});

describe("LibraryService — getOverdueLoans()", () => {
    it("should return only ACTIVE loans that are past due date", async () => {
        // TODO
    });

    it("should not return RETURNED loans even if past due date", async () => {
        // TODO
    });
});
