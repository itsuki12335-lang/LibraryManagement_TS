import { BookStatus } from "../enums/BookStatus";
import { Book } from "../models/Book";
import { BookState } from "./BookState";
import { BookNotAvailableError } from "../errors/LibraryErrors";

export class ReservedState implements BookState {
  private readonly reservedByMemberId: string;
  constructor(reservedByMemberId: string = "") {
    this.reservedByMemberId = reservedByMemberId;
  }

  borrow(Book: Book, memberId?: string): void {
    if (memberId === this.reservedByMemberId) {
      Book.status = BookStatus.BORROWED;
    } else throw new BookNotAvailableError(Book.id);
  }
  returnBook(Book: Book): void {
    throw new Error("Sách đang được đặt trước . Không thể hoàn trả");
  }
  reserve(Book: Book): void {
    throw new Error("Sách này đã được đặt trước");
  }
}
