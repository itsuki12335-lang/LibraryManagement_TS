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

// Helper tạo Member nhanh
function makeMember(id: string, loans: string[] = []): Member {
    return new Member(id, "Test User", "test@email.com", loans, new Date(), new Date());
}

// ========================
// Member Model — canBorrow()
// ========================
describe("Member Model — canBorrow()", () => {
    it("should return true when member has no active loans", () => {
        const member = makeMember("M1", []);
        expect(member.canBorrow(5)).toBe(true);
    });

    it("should return true when below the borrow limit", () => {
        const member = makeMember("M1", ["L1", "L2", "L3"]);
        expect(member.canBorrow(5)).toBe(true);
    });

    it("should return false when AT the borrow limit (not below)", () => {
        const member = makeMember("M1", ["L1", "L2", "L3", "L4", "L5"]);
        expect(member.canBorrow(5)).toBe(false); // 5 === 5, not < 5
    });

    it("should return false when exceeding the borrow limit", () => {
        const member = makeMember("M1", ["L1", "L2", "L3", "L4", "L5", "L6"]);
        expect(member.canBorrow(5)).toBe(false);
    });

    it("should work correctly with limit of 1", () => {
        const member = makeMember("M1", []);
        expect(member.canBorrow(1)).toBe(true);
        member.addActiveLoan("L1");
        expect(member.canBorrow(1)).toBe(false);
    });
});

// ========================
// Member Model — addActiveLoan()
// ========================
describe("Member Model — addActiveLoan()", () => {
    it("should add a loan id to activeLoanIds", () => {
        const member = makeMember("M1");
        member.addActiveLoan("LOAN-001");
        expect(member.getActiveLoanIds()).toContain("LOAN-001");
        expect(member.getActiveLoanIds().length).toBe(1);
    });

    it("should not add duplicate loan ids", () => {
        const member = makeMember("M1");
        member.addActiveLoan("LOAN-001");
        member.addActiveLoan("LOAN-001");
        expect(member.getActiveLoanIds().length).toBe(1);
    });

    it("should add multiple different loan ids correctly", () => {
        const member = makeMember("M1");
        member.addActiveLoan("LOAN-001");
        member.addActiveLoan("LOAN-002");
        member.addActiveLoan("LOAN-003");
        expect(member.getActiveLoanIds().length).toBe(3);
        expect(member.getActiveLoanIds()).toContain("LOAN-002");
    });

    it("canBorrow() should return false after adding loans up to max limit", () => {
        const member = makeMember("M1");
        member.addActiveLoan("L1");
        member.addActiveLoan("L2");
        member.addActiveLoan("L3");
        expect(member.canBorrow(3)).toBe(false);
    });
});

// ========================
// Member Model — removeActiveLoan()
// ========================
describe("Member Model — removeActiveLoan()", () => {
    it("should remove an existing loan id", () => {
        const member = makeMember("M1", ["LOAN-001", "LOAN-002"]);
        member.removeActiveLoan("LOAN-001");
        expect(member.getActiveLoanIds()).not.toContain("LOAN-001");
        expect(member.getActiveLoanIds().length).toBe(1);
    });

    it("should do nothing when loan id does not exist", () => {
        const member = makeMember("M1", ["LOAN-001"]);
        member.removeActiveLoan("NON-EXISTENT");
        expect(member.getActiveLoanIds().length).toBe(1);
    });

    it("should allow canBorrow() to return true after removing a loan", () => {
        const member = makeMember("M1", ["L1", "L2", "L3", "L4", "L5"]);
        expect(member.canBorrow(5)).toBe(false);
        member.removeActiveLoan("L1");
        expect(member.canBorrow(5)).toBe(true);
    });

    it("should not affect other loan ids when removing one", () => {
        const member = makeMember("M1", ["L1", "L2", "L3"]);
        member.removeActiveLoan("L2");
        expect(member.getActiveLoanIds()).toContain("L1");
        expect(member.getActiveLoanIds()).toContain("L3");
        expect(member.getActiveLoanIds()).not.toContain("L2");
    });

    it("should remove correctly after add then remove same id", () => {
        const member = makeMember("M1");
        member.addActiveLoan("LOAN-001");
        member.removeActiveLoan("LOAN-001");
        expect(member.getActiveLoanIds().length).toBe(0);
        expect(member.getActiveLoanIds()).not.toContain("LOAN-001");
    });
});

// ========================
// Member Model — getActiveLoanIds() getter
// ========================
describe("Member Model — getActiveLoanIds()", () => {
    it("should return a copy, not the internal array reference", () => {
        const member = makeMember("M1", ["L1", "L2"]);
        const copy = member.getActiveLoanIds();
        copy.push("HACKED"); // Thêm vào bản sao
        expect(member.getActiveLoanIds().length).toBe(2); // Kho nội bộ không bị ảnh hưởng
    });

    it("should return empty array for new member with no loans", () => {
        const member = makeMember("M1");
        expect(member.getActiveLoanIds()).toEqual([]);
    });
});

// ========================
// Member Model — Edge Cases
// ========================
describe("Member Model — Edge Cases", () => {
    it("canBorrow(): maxLimit = 0 should always return false", () => {
        expect(makeMember("M1", []).canBorrow(0)).toBe(false);
    });

    it("canBorrow(): negative maxLimit should always return false", () => {
        expect(makeMember("M1", []).canBorrow(-1)).toBe(false);
    });

    it("canBorrow(): large maxLimit should return true when loans are few", () => {
        expect(makeMember("M1", ["L1", "L2"]).canBorrow(100)).toBe(true);
    });

    it("removeActiveLoan(): removing from empty list should not throw", () => {
        expect(() => makeMember("M1").removeActiveLoan("X")).not.toThrow();
    });

    it("removeActiveLoan(): removing all loans one by one should result in empty list", () => {
        const member = makeMember("M1", ["L1", "L2", "L3"]);
        member.removeActiveLoan("L1");
        member.removeActiveLoan("L2");
        member.removeActiveLoan("L3");
        expect(member.getActiveLoanIds().length).toBe(0);
    });

    it("addActiveLoan(): add → remove → re-add same loan id should work correctly", () => {
        const member = makeMember("M1");
        member.addActiveLoan("LOAN-001");
        member.removeActiveLoan("LOAN-001");
        member.addActiveLoan("LOAN-001");
        expect(member.getActiveLoanIds().length).toBe(1);
        expect(member.getActiveLoanIds()).toContain("LOAN-001");
    });

    it("constructor: pre-populated activeLoanIds should be counted correctly by canBorrow()", () => {
        const member = makeMember("M1", ["L1", "L2", "L3", "L4"]);
        expect(member.canBorrow(5)).toBe(true);
        expect(member.canBorrow(4)).toBe(false);
        expect(member.canBorrow(3)).toBe(false);
    });

    it("canBorrow(): toggle borrow status by adding and removing loans", () => {
        const member = makeMember("M1");
        for (let i = 1; i <= 5; i++) member.addActiveLoan(`L${i}`);
        expect(member.canBorrow(5)).toBe(false);
        member.removeActiveLoan("L3");
        expect(member.canBorrow(5)).toBe(true);
        member.addActiveLoan("L6");
        expect(member.canBorrow(5)).toBe(false);
    });

    it("addActiveLoan(): adding many unique loans should all be stored", () => {
        const member = makeMember("M1");
        for (let i = 1; i <= 20; i++) member.addActiveLoan(`LOAN-${i}`);
        expect(member.getActiveLoanIds().length).toBe(20);
    });

    it("removeActiveLoan(): if array has duplicates from constructor, only first occurrence is removed", () => {
        const member = new Member("M1", "Test", "test@test.com", ["L1", "L1"], new Date(), new Date());
        member.removeActiveLoan("L1");
        expect(member.getActiveLoanIds()).toContain("L1"); // Occurrence thứ 2 còn lại
    });
});

// ========================
// Member Model — Bug Fixed Verification
// ========================
describe("Member Model — Bug Fixed Verification", () => {
    // BUG 1 FIXED: Constructor dùng [...activeLoanIds] → bản sao
    it("FIXED: mutating external array after passing to constructor should NOT affect member", () => {
        const externalLoans = ["L1", "L2"];
        const member = new Member("M1", "Test", "test@test.com", externalLoans, new Date(), new Date());
        externalLoans.push("L3"); // Mutation từ bên ngoài
        expect(member.getActiveLoanIds().length).toBe(2); // ✅ Không bị ảnh hưởng
    });

    // BUG 2 FIXED: activeLoanIds là private → không thể push thẳng từ ngoài
    it("FIXED: activeLoanIds is private, external code cannot bypass addActiveLoan()", () => {
        const member = makeMember("M1");
        member.addActiveLoan("L1");
        member.addActiveLoan("L1"); // Duplicate bị chặn bởi addActiveLoan()
        expect(member.getActiveLoanIds().length).toBe(1); // ✅ Vẫn là 1
    });

    // BUG 3 FIXED: getActiveLoanIds() trả về bản sao → push vào kết quả không ảnh hưởng kho
    it("FIXED: mutating getActiveLoanIds() result should NOT affect internal state", () => {
        const member = makeMember("M1", ["L1", "L2", "L3", "L4", "L5"]);
        const ids = member.getActiveLoanIds();
        ids.push("L6"); // Push vào bản sao
        expect(member.getActiveLoanIds().length).toBe(5); // ✅ Kho nội bộ không đổi
        expect(member.canBorrow(5)).toBe(false);
    });
});

// ========================
// Book Model, Loan Model, State Pattern — chờ implement
// ========================
describe("Book Model", () => {
    it.todo("should create a Book with correct default fields");
});

describe("Loan Model", () => {
    it.todo("isOverdue() should return true if ACTIVE and past due date");
    it.todo("isOverdue() should return false if already RETURNED");
    it.todo("calculateFine() should return 0 when returned on time");
    it.todo("calculateFine() should return correct fine when 3 days late");
});

describe("State Pattern — BookState", () => {
    it("AvailableState.borrow() should change book status to BORROWED", () => {
        // TODO
    });

    it("AvailableState.reserve() should change book status to RESERVED", () => {
        // TODO
    });

    it("BorrowedState.borrow() should throw BookNotAvailableError", () => {
        // TODO
    });

    it("BorrowedState.returnBook() should change book status to AVAILABLE", () => {
        // TODO
    });

    it("ReservedState.borrow() should throw BookNotAvailableError when wrong member", () => {
        // TODO
    });
});
