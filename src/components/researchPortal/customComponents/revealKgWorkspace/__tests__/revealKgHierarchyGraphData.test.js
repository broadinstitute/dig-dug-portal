import { treeRowYOffset } from "../revealKgHierarchyGraphData.js";

const GAPS = { firstGap: 100, defaultGap: 200 };

describe("treeRowYOffset", () => {
    it("uses firstGap only between genes and gene sets", () => {
        expect(treeRowYOffset(1, GAPS, [0, 1])).toBe(100);
        expect(treeRowYOffset(2, GAPS, [0, 1, 2])).toBe(300);
        expect(treeRowYOffset(3, GAPS, [0, 1, 2, 3])).toBe(500);
    });

    it("uses defaultGap between gene sets and mechanisms when genes are absent", () => {
        expect(treeRowYOffset(1, GAPS, [1, 2])).toBe(200);
        expect(treeRowYOffset(2, GAPS, [1, 2, 3])).toBe(400);
    });
});
