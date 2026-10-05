import { describe, it, expect } from "vitest";
import { EventEmitter } from "../src/events/EventEmitter";

describe("EventEmitter — Comprehensive Test Suite", () => {
    // ==========================================
    // 1. Luồng chuẩn (Happy Path)
    // ==========================================
    describe("Happy Path", () => {
        it("should call registered callback when event is emitted", () => {
            const emitter = new EventEmitter();
            let called = false;
            emitter.on("TEST", () => { called = true; });
            emitter.emit("TEST");
            expect(called).toBe(true);
        });

        it("should pass data to callback when emitting with data", () => {
            const emitter = new EventEmitter();
            let received: any = null;
            emitter.on("DATA", (data: any) => { received = data; });
            emitter.emit("DATA", { id: "B1", title: "Clean Code" });
            expect(received).toEqual({ id: "B1", title: "Clean Code" });
        });

        it("should support multiple listeners for the same event", () => {
            const emitter = new EventEmitter();
            let count = 0;
            emitter.on("EVT", () => count++);
            emitter.on("EVT", () => count++);
            emitter.emit("EVT");
            expect(count).toBe(2);
        });

        it("should execute listeners in the exact order of registration (FIFO)", () => {
            const emitter = new EventEmitter();
            const order: number[] = [];
            emitter.on("ORDER", () => order.push(1));
            emitter.on("ORDER", () => order.push(2));
            emitter.on("ORDER", () => order.push(3));
            emitter.emit("ORDER");
            expect(order).toEqual([1, 2, 3]);
        });
    });

    // ==========================================
    // 2. Tính cô lập sự kiện (Event Isolation)
    // ==========================================
    describe("Event Isolation", () => {
        it("should not call other events listeners", () => {
            const emitter = new EventEmitter();
            let calledA = false;
            let calledB = false;
            emitter.on("A", () => { calledA = true; });
            emitter.on("B", () => { calledB = true; });

            emitter.emit("A");
            expect(calledA).toBe(true);
            expect(calledB).toBe(false);
        });
    });

    // ==========================================
    // 3. Hủy lắng nghe (off) & Edge Cases
    // ==========================================
    describe("off() & Edge Cases", () => {
        it("should remove a specific listener using off()", () => {
            const emitter = new EventEmitter();
            let count = 0;
            const cb = () => count++;
            emitter.on("EVT", cb);
            emitter.off("EVT", cb);
            emitter.emit("EVT");
            expect(count).toBe(0);
        });

        it("should remove only the targeted callback and keep other listeners intact", () => {
            const emitter = new EventEmitter();
            const called: string[] = [];
            const cb1 = () => called.push("CB1");
            const cb2 = () => called.push("CB2");
            const cb3 = () => called.push("CB3");

            emitter.on("MULTI", cb1);
            emitter.on("MULTI", cb2);
            emitter.on("MULTI", cb3);

            // Gỡ cb2
            emitter.off("MULTI", cb2);
            emitter.emit("MULTI");

            expect(called).toEqual(["CB1", "CB3"]);
        });

        it("Edge Case: should do nothing when off() is called for an unrecorded event", () => {
            const emitter = new EventEmitter();
            expect(() => emitter.off("UNRECORDED_EVENT", () => {})).not.toThrow();
        });

        it("Edge Case: should do nothing when off() is called with a callback that was never added", () => {
            const emitter = new EventEmitter();
            let count = 0;
            const registeredCb = () => count++;
            const unRegisteredCb = () => count += 10;

            emitter.on("EVENT", registeredCb);
            emitter.off("EVENT", unRegisteredCb); // Callback này chưa từng add
            emitter.emit("EVENT");

            expect(count).toBe(1); // Callback đã đăng ký vẫn chạy bình thường
        });

        it("Edge Case: should do nothing safely when emitting an event with no listeners", () => {
            const emitter = new EventEmitter();
            expect(() => emitter.emit("NO_LISTENER")).not.toThrow();
            expect(() => emitter.emit("NO_LISTENER", { some: "data" })).not.toThrow();
        });

        it("Edge Case: should handle emitting falsy data (0, false, null, empty string, empty object)", () => {
            const emitter = new EventEmitter();
            const receivedValues: any[] = [];
            emitter.on("FALSY", (data: any) => receivedValues.push(data));

            emitter.emit("FALSY", 0);
            emitter.emit("FALSY", false);
            emitter.emit("FALSY", null);
            emitter.emit("FALSY", "");
            emitter.emit("FALSY", {});

            expect(receivedValues).toEqual([0, false, null, "", {}]);
        });
    });
});
