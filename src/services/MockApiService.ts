import { Loan } from "../models/Loan";

export class MockApiService {
  delay(ms: number): Promise<void> {
    return new Promise((release) => setTimeout(release, ms));
  }

  async saveLoan(loan: Loan): Promise<boolean> {
    await this.delay(1000);
    console.log(`Đã lưu thành công${loan.id}`);
    return true;
  }
}
