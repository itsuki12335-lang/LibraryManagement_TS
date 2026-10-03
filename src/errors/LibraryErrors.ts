export class BookNotAvailableError extends Error {
  private readonly bookId: string;
  constructor(bookId: string) {
    super(`Sách ${bookId} hiện không khả dụng để mượn`);
    this.bookId = bookId;
  }
}
export class MemberLimitExceededError extends Error {
  private readonly memberId: string;
  private readonly limit: number;
  constructor(memberId: string, limit: number) {
    super(`Thành viên ${memberId} đã đạt giới hạn mượn ${limit} cuốn`);
    this.memberId = memberId;
    this.limit = limit;
  }
}
export class LoanNotFoundError extends Error {
  private readonly loanId: string;
  constructor(loanId: string) {
    super("Không tìm thấy phiếu mượn có mã " + loanId);
    this.loanId = loanId;
  }
}
export class LoanAlreadyReturnedError extends Error {
  private readonly loanId: string;
  constructor(loanId: string) {
    super("Phiếu mượn " + loanId + " đã được hoàn trả trước đó");
    this.loanId = loanId;
  }
}
export class MemberNotFound extends Error {
  private readonly memberId: string;
  constructor(memberId: string) {
    super(`Không tìm thấy thành viên có mã ${memberId}`);
    this.memberId = memberId;
  }
}
