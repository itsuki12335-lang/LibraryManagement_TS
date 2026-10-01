import { InMemoryRepository } from "../repository/InMemoryRepository";
import { Book } from "../models/Book";
import { BookStatus } from "../enums/BookStatus";
import { BookState } from "../states/BookState";
import { AvailableState } from "../states/AvailableState";
import { BorrowedState } from "../states/BorrowedState";
import { ReservedState } from "../states/ReservedState";
import { Loan } from "../models/Loan";
import { Member } from "../models/Member";
export class LibraryService {
  private bookRepo = new InMemoryRepository<Book>();
  private memberRepo = new InMemoryRepository<Member>();
  private loanRepo = new InMemoryRepository<Loan>();

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
}
