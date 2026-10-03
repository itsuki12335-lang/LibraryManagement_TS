import { Entity } from "./Entity";
export class Member implements Entity {
  id: string;
  name: string;
  email: string;
  private activeLoanIds: string[];
  createAt: Date;
  updateAt: Date;

  constructor(
    id: string,
    name: string,
    email: string,
    activeLoanIds: string[],
    createAt: Date,
    updateAt: Date,
  ) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.activeLoanIds = [...activeLoanIds];
    this.createAt = createAt;
    this.updateAt = updateAt;
  }
  getActiveLoanIds() {
    return [...this.activeLoanIds];
  }

  canBorrow(maxLimit: number): boolean {
    if (this.activeLoanIds.length < maxLimit) {
      return true;
    }
    return false;
  }

  addActiveLoan(loanId: string): void {
    for (const temp of this.activeLoanIds) {
      if (temp === loanId) {
        return;
      }
    }
    this.activeLoanIds.push(loanId);
    this.updateAt = new Date();
  }

  removeActiveLoan(loanId: string): void {
    const target = this.activeLoanIds.indexOf(loanId);
    if (target !== -1) {
      this.activeLoanIds.splice(target, 1);
      this.updateAt = new Date();
    }
  }
}
