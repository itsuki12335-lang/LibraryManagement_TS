import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryRepository } from "../src/repository/InMemoryRepository";
import { Book } from "../src/models/Book";
import { Member } from "../src/models/Member";
import { Loan } from "../src/models/Loan";

describe("InMemoryRepository<Book>", () => {
    it.todo("should add a book and find it by id");
    it.todo("should return all books with findAll()");
    it.todo("should update an existing book");
    it.todo("should delete a book by id");
    it.todo("should filter books by AVAILABLE status");
});

describe("InMemoryRepository<Member>", () => {
    it.todo("should add a member and find it by id");
});

describe("InMemoryRepository<Loan>", () => {
    it.todo("should add a loan and find it by id");
});
