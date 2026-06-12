import userUtils from "@/utils/userUtils.js";

function mockLocalStorage() {
    const store = new Map();
    return {
        getItem(key) {
            return store.has(key) ? store.get(key) : null;
        },
        setItem(key, value) {
            store.set(key, String(value));
        },
        removeItem(key) {
            store.delete(key);
        },
        clear() {
            store.clear();
        },
    };
}

describe("REVEAL KG Canvas open count", () => {
    beforeEach(() => {
        global.localStorage = mockLocalStorage();
    });

    it("increments open count", () => {
        expect(userUtils.recordRevealKgCanvasOpen()).toBe(1);
        expect(userUtils.recordRevealKgCanvasOpen()).toBe(2);
        expect(userUtils.getRevealKgCanvasOpenCount()).toBe(2);
    });

    it("shows learn companion for the first five opens only", () => {
        expect(userUtils.shouldShowRevealKgLearnCompanion(1)).toBe(true);
        expect(userUtils.shouldShowRevealKgLearnCompanion(5)).toBe(true);
        expect(userUtils.shouldShowRevealKgLearnCompanion(6)).toBe(false);
        expect(userUtils.shouldShowRevealKgLearnCompanion(0)).toBe(false);
    });
});
