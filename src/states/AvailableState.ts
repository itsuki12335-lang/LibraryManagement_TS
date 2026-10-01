import { BookStatus } from "../enums/BookStatus";
import { Book } from "../models/Book";
import { BookState } from "./BookState";
export class AvailableState implements BookState {
  borrow(Book: Book): void {
    Book.status = BookStatus.BORROWED;
  }
  reserve(Book: Book): void {
    Book.status = BookStatus.RESERVED;
  }

  returnBook(Book: Book): void {
    throw new Error("Sách chưa được mượn nên chưa thể hoàn trả");
  }
}
