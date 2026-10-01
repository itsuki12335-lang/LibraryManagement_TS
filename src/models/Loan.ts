import { LoanStatus } from "../enums/LoanStatus";
import { Entity } from "./Entity";

export interface LoanOptions {
  id: string;
  bookId: string;
  memberId: string;
  borrowDate: Date;
  dueDate: Date;
  returnDate?: Date | null;
  status: LoanStatus;
  createAt: Date;
  updateAt: Date;
}

export class Loan implements Entity {
  id: string;
  bookId: string;
  memberId: string;
  borrowDate: Date;
  dueDate: Date;
  returnDate?: Date | null;
  status: LoanStatus;
  createAt: Date;
  updateAt: Date;

  constructor(options: LoanOptions) {
    this.id = options.id;
    this.bookId = options.bookId;
    this.memberId = options.memberId;
    this.borrowDate = options.borrowDate;
    this.dueDate = options.dueDate;
    this.returnDate = options.returnDate ?? null;
    this.status = options.status;
    this.createAt = options.createAt;
    this.updateAt = options.updateAt;
  }

  isOverdue(reference: Date = new Date()): boolean {
    if (reference > this.dueDate && this.status === LoanStatus.ACTIVE) {
      return true;
    }
    return false;
  }
  calculateFine(finePerDay: number): number {
    if (this.returnDate === null && Date.now() > this.dueDate.getTime()) {
      const tempFine = Date.now() - this.dueDate.getTime();
      return Math.max(
        0,
        Math.floor(tempFine / (24 * 1000 * 60 * 60)) * finePerDay,
      );
    } else if (
      this.dueDate.getTime() < Date.now() &&
      this.returnDate !== null
    ) {
      const totalDay = this.returnDate!.getTime() - this.dueDate.getTime();
      return Math.max(
        0,
        Math.floor(totalDay / (24 * 60 * 60 * 1000)) * finePerDay,
      );
    }
    return 0;
  }
}
