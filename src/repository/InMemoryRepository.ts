import { Entity } from "../models/Entity";
import { IRepository } from "./IRepository";
export class InMemoryRepository<T extends Entity> {
  private items: T[] = [];

  private cloneObject(input: T) {
    const clone = { ...input };
    const temp = Object.getPrototypeOf(input);
    Object.setPrototypeOf(clone, temp);
    return clone;
  }
  add(item: T) {
    for (const temp of this.items) {
      if (temp.id === item.id) {
        return;
      }
    }
    this.items.push(this.cloneObject(item));
  }
  findById(id: string): T | null {
    for (const target of this.items) {
      if (target.id === id) {
        return this.cloneObject(target);
      }
    }
    return null;
  }
  findAll(): T[] {
    return this.items.map((item) => ({ ...item }));
  }
  update(id: string, item: Partial<T>): boolean {
    const target = this.items.find((temp) => temp.id === id);
    if (target) {
      const { id, ...rest } = item;
      Object.assign(target, rest);
      target.updateAt = new Date();
      return true;
    }
    return false;
  }
  delete(id: string): boolean {
    const target = this.items.findIndex((temp) => temp.id === id);
    if (target === -1) {
      return false;
    } else {
      this.items.splice(target, 1);
      return true;
    }
  }
  filter(predicate: (item: T) => boolean): T[] {
    const fil: T[] = [];
    for (const temp of this.items) {
      if (predicate(temp)) fil.push({ ...temp });
    }
    return fil;
  }
}
