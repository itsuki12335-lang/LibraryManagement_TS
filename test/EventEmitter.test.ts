import { describe, it, expect } from "vitest";
import { EventEmitter } from "../src/events/EventEmitter";

describe("EventEmitter", () => {
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
        emitter.emit("DATA", { id: "B1" });
        expect(received).toEqual({ id: "B1" });
    });

    it("should support multiple listeners for the same event", () => {
        const emitter = new EventEmitter();
        let count = 0;
        emitter.on("EVT", () => count++);
        emitter.on("EVT", () => count++);
        emitter.emit("EVT");
        expect(count).toBe(2);
    });

    it("should not call other events listeners", () => {
        const emitter = new EventEmitter();
        let called = false;
        emitter.on("A", () => { called = true; });
        emitter.emit("B");
        expect(called).toBe(false);
    });

    it("should remove a specific listener using off()", () => {
        const emitter = new EventEmitter();
        let count = 0;
        const cb = () => count++;
        emitter.on("EVT", cb);
        emitter.off("EVT", cb);
        emitter.emit("EVT");
        expect(count).toBe(0);
    });

    it("should do nothing when emitting an event with no listeners", () => {
        const emitter = new EventEmitter();
        expect(() => emitter.emit("NO_LISTENER")).not.toThrow();
    });
});
