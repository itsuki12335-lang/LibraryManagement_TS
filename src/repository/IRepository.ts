import { Entity } from "../models/Entity";
export interface IRepository<T extends Entity> {
    add(item: T): void;
    findById(id: string): T | null;
    findAll(): T[];
    update(id: string, item: Partial<T>): boolean;
    delete(id: string): boolean;
    filter(predicate: (item: T) => boolean): T[];
}