import { InMemoryRepository } from "../repository/InMemoryRepository";
import { Book } from "../models/Book";
import { BookStatus } from "../enums/BookStatus";
import { BookState } from "../states/BookState";
import { AvailableState } from "../states/AvailableState";
import { BorrowedState } from "../states/BorrowedState";
import { ReservedState } from "../states/ReservedState";
import { Loan } from "../models/Loan";
import { Member } from "../models/Member";
import { generateId } from "../utils/GenerateId";
import {
  BookNotAvailableError,
  LoanAlreadyReturnedError,
  LoanNotFoundError,
  MemberLimitExceededError,
  MemberNotFound,
} from "../errors/LibraryErrors";
import { LoanStatus } from "../enums/LoanStatus";
import { ApiServices } from "./MockApiService";
import { EventEmitter } from "../events/EventEmitter";
export class LibraryService {
  public readonly bookRepo = new InMemoryRepository<Book>();
  public readonly memberRepo = new InMemoryRepository<Member>();
  public readonly loanRepo = new InMemoryRepository<Loan>();
  public readonly eventEmit = new EventEmitter();

  getState(thisBook: Book): BookState {
    if (thisBook.status === BookStatus.AVAILABLE) {
      return new AvailableState();
    } else if (thisBook.status === BookStatus.BORROWED) {
      return new BorrowedState();
    } else if (thisBook.status === BookStatus.RESERVED) {
      return new ReservedState();
    } else {
      throw new Error("Sách đã bị mất");
    }
  }
  async borrowBook(bookId: string, memberId: string): Promise<Loan> {
    const book = this.bookRepo.findById(bookId);
    if (book === null) {
      throw new BookNotAvailableError(bookId);
    } else this.getState(book).borrow(book, memberId);
    const member = this.memberRepo.findById(memberId);
    if (member === null) {
      throw new MemberNotFound(memberId);
    }
    if (member.canBorrow(5) === false) {
      throw new MemberLimitExceededError(member.id, 5);
    }

    const date = new Date();
    const loan = new Loan({
      id: generateId("LOAN"),
      bookId: book.id,
      memberId: member.id,
      borrowDate: date,
      dueDate: new Date(date.getTime() + 14 * 1000 * 24 * 60 * 60),
      returnDate: null,
      status: LoanStatus.ACTIVE,
      createAt: date,
      updateAt: date,
    });
    this.loanRepo.add(loan);
    this.bookRepo.update(book.id, { status: book.status });
    member.addActiveLoan(loan.id);
    this.memberRepo.update(member.id, member);
    const apiServices = new ApiServices();
    await apiServices.saveLoan(loan);
    this.eventEmit.emit("BOOK_BORROWED", { bookId, memberId, loanId: loan.id });
    return loan;
  }
  async returnBook(loanId: string): Promise<number> {
    const loan = this.loanRepo.findById(loanId);
    let fine = 0;
    if (loan === null) {
      throw new LoanNotFoundError(loanId);
    } else {
      if (loan.status !== LoanStatus.ACTIVE) {
        throw new LoanAlreadyReturnedError(loanId);
      }
      loan.returnDate = new Date();
      loan.status = LoanStatus.RETURNED;
      fine = loan.calculateFine(5000);
      const book = this.bookRepo.findById(loan.bookId);
      if (book === null) {
        throw new BookNotAvailableError(loan.bookId);
      }
      this.getState(book).returnBook(book);
      book!.updateAt = new Date();
      this.bookRepo.update(book!.id, {
        status: BookStatus.AVAILABLE,
        updateAt: book!.updateAt,
      });
      loan.updateAt = new Date();
      this.loanRepo.update(loanId, loan);
      const member = this.memberRepo.findById(loan.memberId);
      if (member === null) {
        throw new MemberNotFound(loan.memberId);
      }
      member.removeActiveLoan(loanId);
      this.memberRepo.update(member.id, member);
    }
    this.eventEmit.emit("BOOK_RETURNED", { loanId, fine });
    return fine;
  }
  async getOverdueLoans(): Promise<Loan[]> {
    return this.loanRepo.filter((loan) => loan.isOverdue());
  }
  async searchBooks(keyword: string): Promise<Book[]> {
    return this.bookRepo.filter(
      (book) =>
        book.title.toLowerCase().includes(keyword.toLowerCase()) ||
        book.author.toLowerCase().includes(keyword.toLowerCase()),
    );
  }
}
