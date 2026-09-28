import { InMemoryRepository } from "../repository/InMemoryRepository";
export class LibraryService {
    private bookRepo = new InMemoryRepository<Book>();
    private memberRepo = new InMemoryRepository<Member>();
    private loanRepo = new InMemoryRepository<Loan>();
}