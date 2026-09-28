import { BookStatus } from "../enums/BookStatus";
import { Entity } from "./Entity";
export class Book implements Entity {
    id: string;
    title: string;
    author: string;
    isbn: string;
    status: BookStatus;
    createAt: Date;
    updateAt: Date;

    constructor(id: string, title: string, author: string, isbn: string, status: BookStatus,
        createAt: Date, updateAt: Date) {
        this.id = id;
        this.title = title;
        this.author = author;
        this.isbn = isbn;
        this.status = status;
        this.createAt = createAt;
        this.updateAt = updateAt;
    }
    getInfo(): string {
        return `ID: ${this.id} | Title: ${this.title} | Author: ${this.author} | Status: ${this.status}`
    }
}
