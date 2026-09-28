import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryRepository } from "../src/repository/InMemoryRepository";
import { Entity } from "../src/models/Entity";

// Tạo một Entity đơn giản dùng để test
interface TestItem extends Entity {
    name: string;
    value: number;
}

function makeItem(id: string, name: string, value: number): TestItem {
    return { id, name, value, createAt: new Date(), updateAt: new Date() };
}

describe("InMemoryRepository", () => {

    // --- add() ---
    describe("add()", () => {
        it("should add an item to the repository", () => {
            const repo = new InMemoryRepository<TestItem>();
            const item = makeItem("1", "Alpha", 10);
            repo.add(item);
            expect(repo.findAll().length).toBe(1);
        });

        it("should allow adding multiple items", () => {
            const repo = new InMemoryRepository<TestItem>();
            repo.add(makeItem("1", "Alpha", 10));
            repo.add(makeItem("2", "Beta", 20));
            expect(repo.findAll().length).toBe(2);
        });
    });

    // --- findById() ---
    describe("findById()", () => {
        it("should return the correct item by id", () => {
            const repo = new InMemoryRepository<TestItem>();
            const item = makeItem("42", "Gamma", 99);
            repo.add(item);
            const found = repo.findById("42");
            expect(found).not.toBeNull();
            expect(found!.name).toBe("Gamma");
        });

        it("should return null if id does not exist", () => {
            const repo = new InMemoryRepository<TestItem>();
            expect(repo.findById("NON_EXISTENT")).toBeNull();
        });
    });

    // --- findAll() ---
    describe("findAll()", () => {
        it("should return empty array when repository is empty", () => {
            const repo = new InMemoryRepository<TestItem>();
            expect(repo.findAll()).toEqual([]);
        });

        it("should return a copy of the list (not the original reference)", () => {
            const repo = new InMemoryRepository<TestItem>();
            repo.add(makeItem("1", "Alpha", 10));
            const all = repo.findAll();
            all.push(makeItem("99", "Fake", 0)); // Sửa bản sao
            expect(repo.findAll().length).toBe(1); // Repository gốc không bị ảnh hưởng
        });
    });

    // --- update() ---
    describe("update()", () => {
        it("should update the target item and return true", () => {
            const repo = new InMemoryRepository<TestItem>();
            repo.add(makeItem("1", "Alpha", 10));
            const result = repo.update("1", { name: "Alpha Updated", value: 99 });
            expect(result).toBe(true);
            expect(repo.findById("1")!.name).toBe("Alpha Updated");
            expect(repo.findById("1")!.value).toBe(99);
        });

        it("should update updateAt timestamp on the stored item", () => {
            const repo = new InMemoryRepository<TestItem>();
            const item = makeItem("1", "Alpha", 10);
            const oldUpdateAt = item.updateAt;
            repo.add(item);

            // Đợi 1ms để timestamp khác nhau
            const before = Date.now();
            repo.update("1", { name: "Updated" });
            const stored = repo.findById("1")!;
            expect(stored.updateAt.getTime()).toBeGreaterThanOrEqual(before);
        });

        it("should return false when updating a non-existent id", () => {
            const repo = new InMemoryRepository<TestItem>();
            const result = repo.update("NON_EXISTENT", { name: "Ghost" });
            expect(result).toBe(false);
        });

        it("should not affect other items when updating one", () => {
            const repo = new InMemoryRepository<TestItem>();
            repo.add(makeItem("1", "Alpha", 10));
            repo.add(makeItem("2", "Beta", 20));
            repo.update("1", { name: "Alpha Changed" });
            expect(repo.findById("2")!.name).toBe("Beta");
        });
    });

    // --- delete() ---
    describe("delete()", () => {
        it("should remove the item and return true", () => {
            const repo = new InMemoryRepository<TestItem>();
            repo.add(makeItem("1", "Alpha", 10));
            const result = repo.delete("1");
            expect(result).toBe(true);
            expect(repo.findById("1")).toBeNull();
            expect(repo.findAll().length).toBe(0);
        });

        it("should return false when deleting a non-existent id", () => {
            const repo = new InMemoryRepository<TestItem>();
            const result = repo.delete("NON_EXISTENT");
            expect(result).toBe(false);
        });

        it("should only delete the targeted item, not others", () => {
            const repo = new InMemoryRepository<TestItem>();
            repo.add(makeItem("1", "Alpha", 10));
            repo.add(makeItem("2", "Beta", 20));
            repo.delete("1");
            expect(repo.findAll().length).toBe(1);
            expect(repo.findById("2")!.name).toBe("Beta");
        });
    });

    // --- filter() ---
    describe("filter()", () => {
        it("should return items matching the predicate", () => {
            const repo = new InMemoryRepository<TestItem>();
            repo.add(makeItem("1", "Alpha", 10));
            repo.add(makeItem("2", "Beta", 50));
            repo.add(makeItem("3", "Gamma", 100));
            const result = repo.filter(item => item.value > 20);
            expect(result.length).toBe(2);
            expect(result.map(i => i.name)).toContain("Beta");
            expect(result.map(i => i.name)).toContain("Gamma");
        });

        it("should return empty array if no items match", () => {
            const repo = new InMemoryRepository<TestItem>();
            repo.add(makeItem("1", "Alpha", 10));
            const result = repo.filter(item => item.value > 9999);
            expect(result).toEqual([]);
        });

        it("should return all items if all match the predicate", () => {
            const repo = new InMemoryRepository<TestItem>();
            repo.add(makeItem("1", "Alpha", 10));
            repo.add(makeItem("2", "Beta", 20));
            const result = repo.filter(item => item.value > 0);
            expect(result.length).toBe(2);
        });

        it("should return empty array when repository is empty", () => {
            const repo = new InMemoryRepository<TestItem>();
            const result = repo.filter(item => item.value > 0);
            expect(result).toEqual([]);
        });
    });

    // --- EDGE CASES ---
    describe("Edge Cases", () => {

        // add() — Trùng ID
        it("add(): should not allow adding an item with a duplicate id", () => {
            const repo = new InMemoryRepository<TestItem>();
            repo.add(makeItem("1", "Alpha", 10));
            repo.add(makeItem("1", "Alpha Duplicate", 99)); // trùng id "1"
            // Kho chỉ nên có 1 item (item trùng bị bỏ qua hoặc ghi đè)
            expect(repo.findAll().length).toBe(1);
        });

        // add() — ID rỗng ""
        it("add(): findById with empty string id should return null when nothing added with that id", () => {
            const repo = new InMemoryRepository<TestItem>();
            repo.add(makeItem("1", "Alpha", 10));
            expect(repo.findById("")).toBeNull();
        });

        // update() — Truyền Partial chứa trường id (không được phép đổi id)
        it("update(): should NOT allow overwriting the id field via Partial", () => {
            const repo = new InMemoryRepository<TestItem>();
            repo.add(makeItem("1", "Alpha", 10));
            repo.update("1", { id: "999" } as Partial<TestItem>);
            // Item vẫn phải tìm được bằng id gốc "1"
            expect(repo.findById("1")).not.toBeNull();
            // Không được tìm thấy bằng id mới "999"
            expect(repo.findById("999")).toBeNull();
        });

        // delete() — Xóa cùng 1 item 2 lần
        it("delete(): second delete of same id should return false", () => {
            const repo = new InMemoryRepository<TestItem>();
            repo.add(makeItem("1", "Alpha", 10));
            repo.delete("1");
            const secondDelete = repo.delete("1");
            expect(secondDelete).toBe(false);
        });

        // findById() — Mutation: sửa object trả về từ findById không được ảnh hưởng kho
        it("findById(): mutating the returned object should NOT affect the stored item", () => {
            const repo = new InMemoryRepository<TestItem>();
            repo.add(makeItem("1", "Alpha", 10));
            const found = repo.findById("1")!;
            found.name = "HACKED"; // Thay đổi bên ngoài
            // Kho gốc vẫn phải giữ nguyên giá trị "Alpha"
            expect(repo.findById("1")!.name).toBe("Alpha");
        });

        // filter() — Mutation: sửa object trong kết quả filter không ảnh hưởng kho
        it("filter(): mutating results should NOT affect stored items", () => {
            const repo = new InMemoryRepository<TestItem>();
            repo.add(makeItem("1", "Alpha", 10));
            const results = repo.filter(item => item.value > 0);
            results[0].name = "HACKED";
            expect(repo.findById("1")!.name).toBe("Alpha");
        });

        // findAll() — Mutation: sửa object bên trong mảng findAll không được ảnh hưởng kho
        it("findAll(): mutating objects inside returned array should NOT affect stored items", () => {
            const repo = new InMemoryRepository<TestItem>();
            repo.add(makeItem("1", "Alpha", 10));
            const all = repo.findAll();
            all[0].name = "HACKED"; // Sửa object bên trong mảng
            expect(repo.findById("1")!.name).toBe("Alpha");
        });

        // update() — Partial rỗng {} vẫn phải return true và cập nhật updateAt
        it("update(): empty Partial should still return true and update updateAt", () => {
            const repo = new InMemoryRepository<TestItem>();
            repo.add(makeItem("1", "Alpha", 10));
            const before = Date.now();
            const result = repo.update("1", {});
            expect(result).toBe(true);
            expect(repo.findById("1")!.updateAt.getTime()).toBeGreaterThanOrEqual(before);
            // Các trường khác không thay đổi
            expect(repo.findById("1")!.name).toBe("Alpha");
        });

        // update() → delete() → update() lại → phải trả về false
        it("update(): should return false after item has been deleted", () => {
            const repo = new InMemoryRepository<TestItem>();
            repo.add(makeItem("1", "Alpha", 10));
            repo.delete("1");
            const result = repo.update("1", { name: "Ghost" });
            expect(result).toBe(false);
        });

        // filter() — Phản ánh đúng dữ liệu sau khi update
        it("filter(): should reflect updated values after update()", () => {
            const repo = new InMemoryRepository<TestItem>();
            repo.add(makeItem("1", "Alpha", 10));
            repo.update("1", { value: 999 });
            const result = repo.filter(item => item.value > 500);
            expect(result.length).toBe(1);
            expect(result[0].value).toBe(999);
        });

        // filter() — Không trả về item đã bị xóa
        it("filter(): should NOT include deleted items", () => {
            const repo = new InMemoryRepository<TestItem>();
            repo.add(makeItem("1", "Alpha", 10));
            repo.add(makeItem("2", "Beta", 20));
            repo.delete("1");
            const result = repo.filter(item => item.value > 0);
            expect(result.length).toBe(1);
            expect(result[0].name).toBe("Beta");
        });

        // add() → delete() → add() lại cùng id → phải thành công
        it("add(): should allow re-adding an item with the same id after it was deleted", () => {
            const repo = new InMemoryRepository<TestItem>();
            repo.add(makeItem("1", "Alpha", 10));
            repo.delete("1");
            repo.add(makeItem("1", "Alpha Reborn", 99));
            expect(repo.findAll().length).toBe(1);
            expect(repo.findById("1")!.name).toBe("Alpha Reborn");
        });

        // update() — update nhiều lần liên tiếp phải tích lũy đúng
        it("update(): multiple sequential updates should accumulate correctly", () => {
            const repo = new InMemoryRepository<TestItem>();
            repo.add(makeItem("1", "Alpha", 10));
            repo.update("1", { name: "Beta" });
            repo.update("1", { value: 99 });
            const item = repo.findById("1")!;
            expect(item.name).toBe("Beta");  // update lần 1 còn giữ
            expect(item.value).toBe(99);     // update lần 2 đúng
        });

        // update() — id rỗng "" phải return false
        it("update(): with empty string id should return false", () => {
            const repo = new InMemoryRepository<TestItem>();
            repo.add(makeItem("1", "Alpha", 10));
            expect(repo.update("", { name: "Ghost" })).toBe(false);
        });

        // delete() — id rỗng "" phải return false
        it("delete(): with empty string id should return false", () => {
            const repo = new InMemoryRepository<TestItem>();
            repo.add(makeItem("1", "Alpha", 10));
            expect(repo.delete("")).toBe(false);
        });

        // findAll() — thứ tự phải đúng thứ tự thêm vào (insertion order)
        it("findAll(): should preserve insertion order", () => {
            const repo = new InMemoryRepository<TestItem>();
            repo.add(makeItem("1", "First", 1));
            repo.add(makeItem("2", "Second", 2));
            repo.add(makeItem("3", "Third", 3));
            const all = repo.findAll();
            expect(all[0].name).toBe("First");
            expect(all[1].name).toBe("Second");
            expect(all[2].name).toBe("Third");
        });

        // update() — updateAt trong Partial bị ghi đè bởi system timestamp
        it("update(): explicit updateAt in Partial should be overridden by system timestamp", () => {
            const repo = new InMemoryRepository<TestItem>();
            repo.add(makeItem("1", "Alpha", 10));
            const oldDate = new Date(2000, 1, 1);
            const before = Date.now();
            repo.update("1", { updateAt: oldDate } as Partial<TestItem>);
            expect(repo.findById("1")!.updateAt.getTime()).toBeGreaterThanOrEqual(before);
        });

        // Giới hạn shallow copy — Date fields vẫn là tham chiếu gốc
        it("known limitation: Date fields are still references in shallow copy", () => {
            const repo = new InMemoryRepository<TestItem>();
            repo.add(makeItem("1", "Alpha", 10));
            const found = repo.findById("1")!;
            found.createAt.setFullYear(2000); // Sửa Date object qua tham chiếu
            // ⚠️ Shallow copy không bảo vệ được Date fields
            expect(repo.findById("1")!.createAt.getFullYear()).toBe(2000);
        });

        // add() — Mutate original object SAU KHI add → không ảnh hưởng kho (Đã fix reference bug)
        it("add(): mutating original item AFTER adding SHOULD NOT affect stored item", () => {
            const repo = new InMemoryRepository<TestItem>();
            const item = makeItem("1", "Alpha", 10);
            repo.add(item);
            item.name = "MUTATED FROM OUTSIDE"; // Sửa object gốc sau khi thêm vào kho
            // Kho lưu bản sao độc lập → KHÔNG bị ảnh hưởng từ bên ngoài
            expect(repo.findById("1")!.name).toBe("Alpha");
        });

        // findById() — Gọi 2 lần phải trả về giá trị bằng nhau nhưng KHÁC object reference
        it("findById(): two calls should return equal values but different object references", () => {
            const repo = new InMemoryRepository<TestItem>();
            repo.add(makeItem("1", "Alpha", 10));
            const first = repo.findById("1")!;
            const second = repo.findById("1")!;
            expect(first).toEqual(second);       // Giá trị bằng nhau ✅
            expect(first).not.toBe(second);       // Nhưng khác reference ✅
        });

        // findAll() và findById() — Giá trị phải nhất quán với nhau
        it("findAll() and findById() should return consistent values for same item", () => {
            const repo = new InMemoryRepository<TestItem>();
            repo.add(makeItem("1", "Alpha", 10));
            const fromAll = repo.findAll().find(i => i.id === "1")!;
            const fromById = repo.findById("1")!;
            expect(fromAll.name).toBe(fromById.name);
            expect(fromAll.value).toBe(fromById.value);
        });

        // update() — Cập nhật createAt qua Partial phải thành công (chỉ id bị chặn)
        it("update(): should allow updating createAt via Partial (only id is protected)", () => {
            const repo = new InMemoryRepository<TestItem>();
            repo.add(makeItem("1", "Alpha", 10));
            const newDate = new Date(1999, 5, 15);
            repo.update("1", { createAt: newDate } as Partial<TestItem>);
            expect(repo.findById("1")!.createAt.getFullYear()).toBe(1999);
        });
    });
});
