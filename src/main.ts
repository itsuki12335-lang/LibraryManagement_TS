import { LibraryService } from "./services/LibraryService";
import { Book } from "./models/Book";
import { Member } from "./models/Member";
import { Loan } from "./models/Loan";
import { BookStatus } from "./enums/BookStatus";
import { LoanStatus } from "./enums/LoanStatus";
import { generateId } from "./utils/GenerateId";

async function main() {
    console.log("================================================================================");
    console.log("📚 HỆ THỐNG QUẢN LÝ THƯ VIỆN — CHƯƠNG TRÌNH DEMO TÍCH HỢP (MAIN FLOW)");
    console.log("================================================================================\n");

    // 1. Khởi tạo Service trung tâm
    const service = new LibraryService();

    // 2. Đăng ký lắng nghe sự kiện (Pub/Sub Event Listeners)
    console.log("🎧 [BƯỚC 1] ĐĂNG KÝ CÁC LISTENER LẮNG NGHE SỰ KIỆN");
    service.eventEmit.on("BOOK_BORROWED", (data: any) => {
        console.log(`   📢 [EVENT: BOOK_BORROWED] -> Sách [${data.bookId}] đã được mượn bởi Bạn đọc [${data.memberId}] | Mã phiếu: ${data.loanId}`);
    });

    service.eventEmit.on("BOOK_RETURNED", (data: any) => {
        console.log(`   📢 [EVENT: BOOK_RETURNED] -> Đã trả sách phiếu [${data.loanId}] | Tiền phạt ghi nhận: ${data.fine.toLocaleString("vi-VN")} VND`);
    });
    console.log("   ✅ Đã thiết lập sẵn sàng các bộ lắng nghe sự kiện.\n");

    // 3. Nạp dữ liệu mẫu (Seeding Data)
    console.log("📦 [BƯỚC 2] NẠP DỮ LIỆU SÁCH VÀ BẠN ĐỌC MẪU");
    const book1 = new Book("B001", "Clean Architecture", "Robert C. Martin", "ISBN-001", BookStatus.AVAILABLE, new Date(), new Date());
    const book2 = new Book("B002", "The Pragmatic Programmer", "Andy Hunt", "ISBN-002", BookStatus.AVAILABLE, new Date(), new Date());
    const book3 = new Book("B003", "Refactoring", "Martin Fowler", "ISBN-003", BookStatus.BORROWED, new Date(), new Date());

    service.bookRepo.add(book1);
    service.bookRepo.add(book2);
    service.bookRepo.add(book3);

    const member1 = new Member("M001", "Nguyễn Văn A", "vana@gmail.com", [], new Date(), new Date());
    const member2 = new Member("M002", "Trần Thị B", "thib@gmail.com", [], new Date(), new Date());

    service.memberRepo.add(member1);
    service.memberRepo.add(member2);

    console.log(`   * Đã thêm ${service.bookRepo.findAll().length} cuốn sách vào kho.`);
    console.log(`   * Đã đăng ký ${service.memberRepo.findAll().length} thành viên vào hệ thống.\n`);

    // 4. Tìm kiếm sách
    console.log("🔍 [BƯỚC 3] TÌM KIẾM SÁCH ĐA NĂNG (SEARCH BOOKS)");
    const searchResultTitle = await service.searchBooks("clean");
    console.log(`   * Tìm kiếm theo từ khóa 'clean': Tìm thấy ${searchResultTitle.length} cuốn: [${searchResultTitle.map(b => b.title).join(", ")}]`);

    const searchResultAuthor = await service.searchBooks("FOWLER");
    console.log(`   * Tìm kiếm theo tác giả 'FOWLER': Tìm thấy ${searchResultAuthor.length} cuốn: [${searchResultAuthor.map(b => `${b.title} - ${b.author}`).join(", ")}]\n`);

    // 5. Mượn sách thành công (Happy Path)
    console.log("📖 [BƯỚC 4] BẠN ĐỌC THỰC HIỆN MƯỢN SÁCH");
    console.log(`   * Thành viên [${member1.name}] mượn cuốn [${book1.title}]...`);
    const loan = await service.borrowBook(book1.id, member1.id);
    console.log(`   * Mượn thành công! Hạn trả: ${loan.dueDate.toLocaleDateString("vi-VN")}`);
    console.log(`   * Trạng thái sách sau khi mượn: ${service.bookRepo.findById(book1.id)?.status}\n`);

    // 6. Xử lý lỗi khi mượn sách không khả dụng (State Pattern chặn)
    console.log("⚠️ [BƯỚC 5] THỬ MƯỢN SÁCH ĐANG Ở TRẠNG THÁI 'BORROWED'");
    try {
        console.log(`   * Thành viên [${member2.name}] thử mượn cuốn [${book3.title}] (đang được mượn)...`);
        await service.borrowBook(book3.id, member2.id);
    } catch (error: any) {
        console.log(`   ❌ Bị chặn bởi State Pattern: "${error.message}"\n`);
    }

    // 7. Giả lập trả sách quá hạn và tính phạt
    console.log("💰 [BƯỚC 6] TRẢ SÁCH VÀ TÍNH PHẠT QUÁ HẠN");
    // Giả lập một phiếu mượn quá hạn 4 ngày
    const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);
    const overdueLoan = new Loan({
        id: generateId("LOAN"),
        bookId: book2.id,
        memberId: member2.id,
        borrowDate: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
        dueDate: fourDaysAgo,
        returnDate: null,
        status: LoanStatus.ACTIVE,
        createAt: new Date(),
        updateAt: new Date()
    });

    service.loanRepo.add(overdueLoan);
    book2.status = BookStatus.BORROWED;
    service.bookRepo.update(book2.id, book2);
    member2.addActiveLoan(overdueLoan.id);
    service.memberRepo.update(member2.id, member2);

    console.log(`   * Thành viên [${member2.name}] trả cuốn [${book2.title}] (trễ hạn 4 ngày)...`);
    const fine = await service.returnBook(overdueLoan.id);
    console.log(`   * Tiền phạt cần thu: ${fine.toLocaleString("vi-VN")} VND`);
    console.log(`   * Sách [${book2.title}] đã khôi phục trạng thái: ${service.bookRepo.findById(book2.id)?.status}\n`);

    // 8. Kiểm tra danh sách phiếu mượn quá hạn
    console.log("🚨 [BƯỚC 7] QUÉT CÁC PHIẾU MƯỢN QUÁ HẠN HIỆN TẠI (OVERDUE CHECK)");
    // Thêm một phiếu mượn đang active bị trễ hạn để kiểm tra
    const lateLoan = new Loan({
        id: generateId("LOAN"),
        bookId: book1.id,
        memberId: member2.id,
        borrowDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        dueDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        returnDate: null,
        status: LoanStatus.ACTIVE,
        createAt: new Date(),
        updateAt: new Date()
    });
    service.loanRepo.add(lateLoan);

    const overdueList = await service.getOverdueLoans();
    console.log(`   * Tìm thấy ${overdueList.length} phiếu mượn đang quá hạn cần gửi thông báo nhắc nhở.`);
    overdueList.forEach(l => {
        console.log(`     - Phiếu [${l.id}] | Sách ID: ${l.bookId} | Bạn đọc: ${l.memberId} | Hạn trả: ${l.dueDate.toLocaleDateString("vi-VN")}`);
    });

    console.log("\n================================================================================");
    console.log("🎉 TOÀN BỘ KỊCH BẢN TÍCH HỢP HOÀN TẤT THÀNH CÔNG RỰC RỠ!");
    console.log("================================================================================");
}

main().catch(err => {
    console.error("Lỗi chương trình:", err);
});
