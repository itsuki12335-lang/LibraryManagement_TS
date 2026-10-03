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
  MemberLimitExceededError,
  MemberNotFound,
} from "../errors/LibraryErrors";
import { LoanStatus } from "../enums/LoanStatus";
import { ApiServices } from "./MockApiService";
export class LibraryService {
  private readonly bookRepo = new InMemoryRepository<Book>();
  private readonly memberRepo = new InMemoryRepository<Member>();
  private readonly loanRepo = new InMemoryRepository<Loan>();

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
    return loan;
  }
}
