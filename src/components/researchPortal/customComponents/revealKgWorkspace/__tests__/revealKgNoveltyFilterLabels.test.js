import { describeNoveltyFilter } from "../revealKgGraphFilterUtils.js";
import { summarizeVisibilityFilterLayer } from "../revealKgVisibilityFilterUtils.js";

describe("novelty filter labels", () => {
    it("describes visibility in plain language", () => {
        expect(
            describeNoveltyFilter({ noveltyKnown: true, noveltyNovel: false })
        ).toBe("Show known nodes only");
        expect(
            describeNoveltyFilter({ noveltyKnown: false, noveltyNovel: true })
        ).toBe("Show novel nodes only");
    });

    it("uses the visibility label in filter layer summaries", () => {
        expect(
            summarizeVisibilityFilterLayer({
                noveltyKnown: false,
                noveltyNovel: true,
            })
        ).toBe("Show novel nodes only");
    });
});
