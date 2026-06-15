import {
    formatLiveStepTime,
    formatStepElapsedMs,
    formatStepTimeLabel,
} from "@/components/researchPortal/customComponents/revealMultiQueryWorkflow/revealMqStepTime.js";

describe("revealMqStepTime", () => {
    test("formatStepElapsedMs formats minutes and seconds", () => {
        expect(formatStepElapsedMs(0)).toBeNull();
        expect(formatStepElapsedMs(65000)).toBe("1m05s");
        expect(formatStepElapsedMs(9000)).toBe("0m09s");
    });

    test("formatLiveStepTime uses now minus timeStart", () => {
        const step = { timeStart: 1000 };
        expect(formatLiveStepTime(step, 61000)).toBe("1m00s");
    });

    test("formatStepTimeLabel prefers completed step.time", () => {
        const step = { time: 125000, timeStart: 0 };
        expect(formatStepTimeLabel(step, Date.now())).toBe("2m05s");
    });

    test("formatStepTimeLabel falls back to live elapsed", () => {
        const step = { timeStart: 5000 };
        expect(formatStepTimeLabel(step, 20000)).toBe("0m15s");
    });
});
