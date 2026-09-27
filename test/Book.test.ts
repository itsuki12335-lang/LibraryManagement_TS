import { describe, it, expect } from "vitest";
import { Book } from "../src/models/Book";
import { Member } from "../src/models/Member";
import { Loan } from "../src/models/Loan";
import { BookStatus } from "../src/enums/BookStatus";
import { LoanStatus } from "../src/enums/LoanStatus";
import { AvailableState } from "../src/states/AvailableState";
import { BorrowedState } from "../src/states/BorrowedState";
import { ReservedState } from "../src/states/ReservedState";
import { BookNotAvailableError } from "../src/errors/LibraryErrors";

describe("Book Model", () => {
    it.todo("should create a Book with correct default fields");
});

describe("Member Model", () => {
    it.todo("canBorrow() should return true when below limit");
    it.todo("canBorrow() should return false when at max limit");
});

describe("Loan Model", () => {
    it.todo("isOverdue() should return true if ACTIVE and past due date");
    it.todo("isOverdue() should return false if already RETURNED");
    it.todo("calculateFine() should return 0 when returned on time");
    it.todo("calculateFine() should return correct fine when 3 days late");
});

describe("State Pattern — BookState", () => {
    // AvailableState
    it("AvailableState.borrow() should change book status to BORROWED", () => {
        // TODO
    });

    it("AvailableState.reserve() should change book status to RESERVED", () => {
        // TODO
    });

    // BorrowedState
    it("BorrowedState.borrow() should throw BookNotAvailableError", () => {
        // TODO
    });

    it("BorrowedState.returnBook() should change book status to AVAILABLE", () => {
        // TODO
    });

    // ReservedState
    it("ReservedState.borrow() should throw BookNotAvailableError when wrong member", () => {
        // TODO
    });
});
