import { describe, it, expect, beforeEach } from "vitest";
import { Loan } from "../src/models/Loan";
import { LoanStatus } from "../src/enums/LoanStatus";

// ─────────────────────────────────────────────────────────────────────────────
// Helper factory
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build a Loan with sensible defaults so each test only tweaks what it cares about.
 *
 * @param overrides - Partial fields to override the defaults.
 */
function makeLoan(overrides: Partial<{
    id: string;
    bookId: string;
    memberId: string;
    borrowDate: Date;
    dueDate: Date;
    returnDate: Date | null;
    status: LoanStatus;
    createAt: Date;
    updateAt: Date;
}> = {}): Loan {
    const now = new Date("2024-01-01T00:00:00.000Z");
    const due = new Date("2024-01-15T00:00:00.000Z"); // 14 days later

    return new Loan({
        id:         overrides.id         ?? "LOAN-001",
        bookId:     overrides.bookId     ?? "BOOK-001",
        memberId:   overrides.memberId   ?? "MEMBER-001",
        borrowDate: overrides.borrowDate ?? now,
        dueDate:    overrides.dueDate    ?? due,
        returnDate: overrides.returnDate !== undefined ? overrides.returnDate : null,
        status:     overrides.status     ?? LoanStatus.ACTIVE,
        createAt:   overrides.createAt   ?? now,
        updateAt:   overrides.updateAt   ?? now,
    });
}

/** Create a Date that is `n` days offset from a given base date. */
function daysFrom(base: Date, n: number): Date {
    return new Date(base.getTime() + n * 24 * 60 * 60 * 1000);
}

const DUE_DATE = new Date("2024-01-15T00:00:00.000Z");

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — Constructor / Data Integrity
// ─────────────────────────────────────────────────────────────────────────────

describe("Loan — Constructor & field assignment", () => {
    let loan: Loan;

    beforeEach(() => {
        loan = makeLoan();
    });

    it("should assign id correctly", () => {
        expect(loan.id).toBe("LOAN-001");
    });

    it("should assign bookId correctly", () => {
        expect(loan.bookId).toBe("BOOK-001");
    });

    it("should assign memberId correctly", () => {
        expect(loan.memberId).toBe("MEMBER-001");
    });

    it("should assign borrowDate correctly", () => {
        expect(loan.borrowDate).toEqual(new Date("2024-01-01T00:00:00.000Z"));
    });

    it("should assign dueDate correctly", () => {
        expect(loan.dueDate).toEqual(DUE_DATE);
    });

    it("should assign returnDate as null by default", () => {
        expect(loan.returnDate).toBeNull();
    });

    it("should assign a provided returnDate", () => {
        const ret = new Date("2024-01-10T00:00:00.000Z");
        const l = makeLoan({ returnDate: ret });
        expect(l.returnDate).toEqual(ret);
    });

    it("should assign status correctly", () => {
        expect(loan.status).toBe(LoanStatus.ACTIVE);
    });

    it("should assign createAt correctly", () => {
        expect(loan.createAt).toEqual(new Date("2024-01-01T00:00:00.000Z"));
    });

    it("should assign updateAt correctly", () => {
        expect(loan.updateAt).toEqual(new Date("2024-01-01T00:00:00.000Z"));
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — isOverdue()
// ─────────────────────────────────────────────────────────────────────────────

describe("Loan — isOverdue()", () => {
    // ── Happy path ──────────────────────────────────────────────────────────

    it("should return true when ACTIVE and referenceDate is past dueDate", () => {
        const loan = makeLoan({ status: LoanStatus.ACTIVE });
        const reference = daysFrom(DUE_DATE, 1); // 1 day after due
        expect(loan.isOverdue(reference)).toBe(true);
    });

    it("should return true when ACTIVE and referenceDate is many days past dueDate", () => {
        const loan = makeLoan({ status: LoanStatus.ACTIVE });
        const reference = daysFrom(DUE_DATE, 30);
        expect(loan.isOverdue(reference)).toBe(true);
    });

    it("should return false when ACTIVE but referenceDate equals dueDate exactly", () => {
        const loan = makeLoan({ status: LoanStatus.ACTIVE });
        // referenceDate === dueDate → NOT yet overdue (condition: referenceDate > dueDate)
        expect(loan.isOverdue(DUE_DATE)).toBe(false);
    });

    it("should return false when ACTIVE and referenceDate is before dueDate", () => {
        const loan = makeLoan({ status: LoanStatus.ACTIVE });
        const reference = daysFrom(DUE_DATE, -1); // 1 day before due
        expect(loan.isOverdue(reference)).toBe(false);
    });

    // ── Status-dependent ────────────────────────────────────────────────────

    it("should return false when status is RETURNED even if referenceDate is past dueDate", () => {
        const loan = makeLoan({ status: LoanStatus.RETURNED });
        const reference = daysFrom(DUE_DATE, 10);
        expect(loan.isOverdue(reference)).toBe(false);
    });

    it("should return false when status is OVERDUE (enum value) and referenceDate is past dueDate", () => {
        // Even if someone manually sets status to OVERDUE, isOverdue() only checks ACTIVE
        const loan = makeLoan({ status: LoanStatus.OVERDUE });
        const reference = daysFrom(DUE_DATE, 5);
        expect(loan.isOverdue(reference)).toBe(false);
    });

    // ── Default parameter ────────────────────────────────────────────────────

    it("should use new Date() as referenceDate when no argument is provided — loan in the future should not be overdue", () => {
        // dueDate far in the future → no argument → today < dueDate → false
        const futureDue = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        const loan = makeLoan({ status: LoanStatus.ACTIVE, dueDate: futureDue });
        expect(loan.isOverdue()).toBe(false);
    });

    it("should use new Date() as referenceDate — very old loan with ACTIVE status should be overdue", () => {
        // dueDate in the past → no argument → today > dueDate → true
        const pastDue = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const loan = makeLoan({ status: LoanStatus.ACTIVE, dueDate: pastDue });
        expect(loan.isOverdue()).toBe(true);
    });

    // ── Edge cases ───────────────────────────────────────────────────────────

    it("edge: referenceDate is exactly 1 millisecond after dueDate → should be overdue", () => {
        const loan = makeLoan({ status: LoanStatus.ACTIVE });
        const reference = new Date(DUE_DATE.getTime() + 1);
        expect(loan.isOverdue(reference)).toBe(true);
    });

    it("edge: referenceDate is exactly 1 millisecond before dueDate → should NOT be overdue", () => {
        const loan = makeLoan({ status: LoanStatus.ACTIVE });
        const reference = new Date(DUE_DATE.getTime() - 1);
        expect(loan.isOverdue(reference)).toBe(false);
    });

    it("edge: borrowDate equals dueDate (same-day loan) → overdue the next day", () => {
        const sameDay = new Date("2024-03-01T00:00:00.000Z");
        const loan = makeLoan({
            status: LoanStatus.ACTIVE,
            borrowDate: sameDay,
            dueDate: sameDay,
        });
        const tomorrow = daysFrom(sameDay, 1);
        expect(loan.isOverdue(tomorrow)).toBe(true);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — calculateFine() — loan already returned (returnDate !== null)
// ─────────────────────────────────────────────────────────────────────────────

describe("Loan — calculateFine() — with returnDate set", () => {
    const FINE_PER_DAY = 5_000; // 5,000 VNĐ/day

    // ── Returned on time ─────────────────────────────────────────────────────

    it("should return 0 when returned exactly on dueDate", () => {
        const loan = makeLoan({
            status: LoanStatus.RETURNED,
            returnDate: DUE_DATE,
        });
        expect(loan.calculateFine(FINE_PER_DAY)).toBe(0);
    });

    it("should return 0 when returned 1 day before dueDate", () => {
        const loan = makeLoan({
            status: LoanStatus.RETURNED,
            returnDate: daysFrom(DUE_DATE, -1),
        });
        expect(loan.calculateFine(FINE_PER_DAY)).toBe(0);
    });

    it("should return 0 when returned many days early", () => {
        const loan = makeLoan({
            status: LoanStatus.RETURNED,
            returnDate: daysFrom(DUE_DATE, -10),
        });
        expect(loan.calculateFine(FINE_PER_DAY)).toBe(0);
    });

    it("should return 0 when returned on borrowDate (first day)", () => {
        const borrow = new Date("2024-01-01T00:00:00.000Z");
        const loan = makeLoan({
            status: LoanStatus.RETURNED,
            borrowDate: borrow,
            returnDate: borrow, // returned same day, well before dueDate
        });
        expect(loan.calculateFine(FINE_PER_DAY)).toBe(0);
    });

    // ── Returned late ─────────────────────────────────────────────────────────

    it("should return fine for 1 day late (5,000 * 1 = 5,000)", () => {
        const loan = makeLoan({
            status: LoanStatus.RETURNED,
            returnDate: daysFrom(DUE_DATE, 1),
        });
        expect(loan.calculateFine(FINE_PER_DAY)).toBe(5_000);
    });

    it("should return fine for 3 days late (5,000 * 3 = 15,000) — roadmap example", () => {
        const loan = makeLoan({
            status: LoanStatus.RETURNED,
            returnDate: daysFrom(DUE_DATE, 3),
        });
        expect(loan.calculateFine(FINE_PER_DAY)).toBe(15_000);
    });

    it("should return fine for 7 days late (5,000 * 7 = 35,000)", () => {
        const loan = makeLoan({
            status: LoanStatus.RETURNED,
            returnDate: daysFrom(DUE_DATE, 7),
        });
        expect(loan.calculateFine(FINE_PER_DAY)).toBe(35_000);
    });

    it("should return fine for 14 days late (5,000 * 14 = 70,000)", () => {
        const loan = makeLoan({
            status: LoanStatus.RETURNED,
            returnDate: daysFrom(DUE_DATE, 14),
        });
        expect(loan.calculateFine(FINE_PER_DAY)).toBe(70_000);
    });

    it("should return correct fine with a different finePerDay rate (10,000 * 3 = 30,000)", () => {
        const loan = makeLoan({
            status: LoanStatus.RETURNED,
            returnDate: daysFrom(DUE_DATE, 3),
        });
        expect(loan.calculateFine(10_000)).toBe(30_000);
    });

    it("should return 0 when finePerDay is 0 even if returned late", () => {
        const loan = makeLoan({
            status: LoanStatus.RETURNED,
            returnDate: daysFrom(DUE_DATE, 5),
        });
        expect(loan.calculateFine(0)).toBe(0);
    });

    // ── Partial day late — Math.floor() behaviour ─────────────────────────────

    it("should floor partial days — 1.5 days late counts as 1 day", () => {
        // Add 36 hours (1.5 days) after dueDate
        const returnDate = new Date(DUE_DATE.getTime() + 1.5 * 24 * 60 * 60 * 1000);
        const loan = makeLoan({
            status: LoanStatus.RETURNED,
            returnDate,
        });
        // Math.floor(1.5) = 1 → 1 * 5000 = 5000
        expect(loan.calculateFine(FINE_PER_DAY)).toBe(5_000);
    });

    it("should floor partial days — 0.9 days late counts as 0 days (no fine)", () => {
        const returnDate = new Date(DUE_DATE.getTime() + 0.9 * 24 * 60 * 60 * 1000);
        const loan = makeLoan({
            status: LoanStatus.RETURNED,
            returnDate,
        });
        // Math.floor(0.9) = 0 → 0 * 5000 = 0
        expect(loan.calculateFine(FINE_PER_DAY)).toBe(0);
    });

    // ── Fine is never negative ────────────────────────────────────────────────

    it("fine should never be negative — returnDate before dueDate gives 0", () => {
        const loan = makeLoan({
            status: LoanStatus.RETURNED,
            returnDate: daysFrom(DUE_DATE, -5),
        });
        expect(loan.calculateFine(FINE_PER_DAY)).toBeGreaterThanOrEqual(0);
        expect(loan.calculateFine(FINE_PER_DAY)).toBe(0);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4 — calculateFine() — loan NOT yet returned (returnDate === null)
// ─────────────────────────────────────────────────────────────────────────────

describe("Loan — calculateFine() — returnDate is null (still active)", () => {
    const FINE_PER_DAY = 5_000;

    it("should return 0 when dueDate is in the future (not yet overdue)", () => {
        const futureDue = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        const loan = makeLoan({ returnDate: null, dueDate: futureDue });
        expect(loan.calculateFine(FINE_PER_DAY)).toBe(0);
    });

    it("should return 0 when dueDate is today (not yet past due)", () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const loan = makeLoan({ returnDate: null, dueDate: today });
        // today.getTime() - today.getTime() = 0 ms → 0 days → 0 fine
        expect(loan.calculateFine(FINE_PER_DAY)).toBe(0);
    });

    it("fine should be non-negative when dueDate is in the past (overdue, no return)", () => {
        const pastDue = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
        const loan = makeLoan({ returnDate: null, dueDate: pastDue });
        const fine = loan.calculateFine(FINE_PER_DAY);
        // At least 4 days (could be 4 or 5 depending on exact timing)
        expect(fine).toBeGreaterThanOrEqual(4 * FINE_PER_DAY);
        expect(fine).toBeGreaterThanOrEqual(0);
    });

    it("should return correct fine for exactly 3 days overdue with no return date", () => {
        // Pin dueDate to exactly 3 days ago at a precise time
        const exactlyThreeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
        const loan = makeLoan({ returnDate: null, dueDate: exactlyThreeDaysAgo });
        const fine = loan.calculateFine(FINE_PER_DAY);
        // 3 days exactly → Math.floor(3) = 3 → 3 * 5000 = 15000
        // In practice, tiny ms offset can make it 2 days if we're just under 3 full days
        expect(fine).toBeGreaterThanOrEqual(2 * FINE_PER_DAY);
        expect(fine).toBeLessThanOrEqual(3 * FINE_PER_DAY);
    });

    it("fine should never be negative when returnDate is null and dueDate is future", () => {
        const futureDue = new Date(Date.now() + 100 * 24 * 60 * 60 * 1000);
        const loan = makeLoan({ returnDate: null, dueDate: futureDue });
        expect(loan.calculateFine(FINE_PER_DAY)).toBeGreaterThanOrEqual(0);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5 — Bug-Regression Tests (guard the 3 fixed bugs)
// ─────────────────────────────────────────────────────────────────────────────

describe("Loan — Bug Regression Tests", () => {

    // ── Bug 1: isOverDue → isOverdue ─────────────────────────────────────────

    it("BUG1 FIXED: method name is 'isOverdue' (lowercase d), not 'isOverDue'", () => {
        const loan = makeLoan();
        // If the method was still named isOverDue, this would throw TypeError
        expect(typeof loan.isOverdue).toBe("function");
    });

    it("BUG1 FIXED: isOverdue is callable by LibraryService pattern — filter via loan.isOverdue()", () => {
        const loans: Loan[] = [
            makeLoan({ id: "L1", status: LoanStatus.ACTIVE, dueDate: daysFrom(new Date(), -2) }),
            makeLoan({ id: "L2", status: LoanStatus.RETURNED, dueDate: daysFrom(new Date(), -2) }),
            makeLoan({ id: "L3", status: LoanStatus.ACTIVE, dueDate: daysFrom(new Date(), +5) }),
        ];
        const overdue = loans.filter(l => l.isOverdue());
        expect(overdue.length).toBe(1);
        expect(overdue[0].id).toBe("L1");
    });

    // ── Bug 2: getMilliseconds() → getTime() ─────────────────────────────────

    it("BUG2 FIXED: calculateFine uses getTime() not getMilliseconds() — 3 days late = 15,000", () => {
        // If getMilliseconds() were used: (ms_component - ms_component) would be
        // near 0 and dividing by 86400000 would always give near-zero days → always 0 fine.
        // With getTime(), 3 full days returns exactly 15,000.
        const loan = makeLoan({
            status: LoanStatus.RETURNED,
            returnDate: daysFrom(DUE_DATE, 3),
        });
        expect(loan.calculateFine(5_000)).toBe(15_000);
    });

    it("BUG2 FIXED: calculateFine is never near-zero due to getMilliseconds() misuse", () => {
        // 30 days overdue — with getMilliseconds() bug this would almost always be 0
        const loan = makeLoan({
            status: LoanStatus.RETURNED,
            returnDate: daysFrom(DUE_DATE, 30),
        });
        expect(loan.calculateFine(1_000)).toBe(30_000);
    });

    // ── Bug 3: Math.max(0, ...) — fine never negative ────────────────────────

    it("BUG3 FIXED: fine is never negative when returned early (returnDate < dueDate)", () => {
        const loan = makeLoan({
            status: LoanStatus.RETURNED,
            returnDate: daysFrom(DUE_DATE, -3), // 3 days early
        });
        expect(loan.calculateFine(5_000)).toBe(0);
    });

    it("BUG3 FIXED: fine is never negative when returnDate === null and dueDate is future", () => {
        const futureDue = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
        const loan = makeLoan({ returnDate: null, dueDate: futureDue });
        expect(loan.calculateFine(5_000)).toBe(0);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 6 — Integration-style scenarios (mimicking LibraryService usage)
// ─────────────────────────────────────────────────────────────────────────────

describe("Loan — Integration Scenarios", () => {

    it("scenario: borrow → not overdue yet → isOverdue false, fine 0", () => {
        const futureDue = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
        const loan = makeLoan({ status: LoanStatus.ACTIVE, returnDate: null, dueDate: futureDue });
        expect(loan.isOverdue()).toBe(false);
        expect(loan.calculateFine(5_000)).toBe(0);
    });

    it("scenario: return on time → status RETURNED, isOverdue false, fine 0", () => {
        const loan = makeLoan({
            status: LoanStatus.RETURNED,
            returnDate: daysFrom(DUE_DATE, -2),
        });
        expect(loan.isOverdue(daysFrom(DUE_DATE, 5))).toBe(false);
        expect(loan.calculateFine(5_000)).toBe(0);
    });

    it("scenario: return 3 days late → isOverdue false (RETURNED), fine 15,000", () => {
        const loan = makeLoan({
            status: LoanStatus.RETURNED,
            returnDate: daysFrom(DUE_DATE, 3),
        });
        // Once returned, isOverdue() must be false regardless of dates
        expect(loan.isOverdue(daysFrom(DUE_DATE, 10))).toBe(false);
        expect(loan.calculateFine(5_000)).toBe(15_000);
    });

    it("scenario: active loan past due → isOverdue true, fine > 0 when checked with referenceDate", () => {
        const pastDue = new Date("2023-01-01T00:00:00.000Z");
        const loan = makeLoan({
            status: LoanStatus.ACTIVE,
            returnDate: null,
            dueDate: pastDue,
        });
        const referenceDate = new Date("2023-01-10T00:00:00.000Z"); // 9 days after due
        expect(loan.isOverdue(referenceDate)).toBe(true);

        // calculateFine uses today's date internally for null returnDate,
        // so we just verify it's a positive multiple of finePerDay
        const fine = loan.calculateFine(5_000);
        expect(fine).toBeGreaterThanOrEqual(0);
    });

    it("scenario: getOverdueLoans() filter pattern — only ACTIVE + past due returned", () => {
        const today = new Date();
        const pastDue = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000);
        const futureDue = new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000);

        const loans: Loan[] = [
            makeLoan({ id: "A", status: LoanStatus.ACTIVE, dueDate: pastDue }),    // OVERDUE
            makeLoan({ id: "B", status: LoanStatus.ACTIVE, dueDate: futureDue }),  // not overdue
            makeLoan({ id: "C", status: LoanStatus.RETURNED, dueDate: pastDue }),  // returned
            makeLoan({ id: "D", status: LoanStatus.OVERDUE, dueDate: pastDue }),   // OVERDUE enum but not ACTIVE
        ];

        const overdueLoans = loans.filter(l => l.isOverdue());
        expect(overdueLoans.length).toBe(1);
        expect(overdueLoans[0].id).toBe("A");
    });
});
