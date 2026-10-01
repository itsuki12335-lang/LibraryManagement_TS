import { Book } from "../models/Book";
import { BookStatus } from "../enums/BookStatus";
import { BookState } from "./BookState";
import { BookNotAvailableError } from "../errors/LibraryErrors";

export class BorrowedState implements BookState {
  borrow(Book: Book): void {
    throw new BookNotAvailableError(Book.id);
  }
  returnBook(Book: Book): void {
    Book.status = BookStatus.AVAILABLE;
  }
  reserve(Book: Book): void {
    throw new Error("Không thể đặt trước sách đang được mượn");
  }
}
