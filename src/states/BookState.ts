import { Book } from "../models/Book";

export interface BookState {
  borrow(Book: Book, memberId?: string): void;
  returnBook(Book: Book): void;
  reserve(Book: Book): void;
}
