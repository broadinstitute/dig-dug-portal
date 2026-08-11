import {
    convertSingleQuotedStrings,
    escapeInteriorUnescapedQuotes,
    escapeRawControlsInStrings,
    normalizeSmartQuotes,
    repairLlmJsonText,
    stripJsonComments,
    stripTrailingCommas,
    tryParseJsonWithRepair,
} from "@/utils/llmJsonRepair.js";
import { parseLlmJsonResponse } from "@/utils/llmUsageUtils.js";

describe("llmJsonRepair", () => {
    test("escapeInteriorUnescapedQuotes fixes prose double quotes", () => {
        const raw =
            '{"hypothesis":"recognized as "altered-self" by receptors","ok":true}';
        const { text, applied } = escapeInteriorUnescapedQuotes(raw);
        expect(applied).toBe(true);
        expect(JSON.parse(text)).toEqual({
            hypothesis: 'recognized as "altered-self" by receptors',
            ok: true,
        });
    });

    test("normalizeSmartQuotes converts curly doubles", () => {
        const raw = '{"a":\u201Chello\u201D}';
        const { text, applied } = normalizeSmartQuotes(raw);
        expect(applied).toBe(true);
        expect(JSON.parse(text)).toEqual({ a: "hello" });
    });

    test("stripTrailingCommas removes commas before } and ]", () => {
        const raw = '{"a":[1,2,],"b":{"c":1,},}';
        const { text, applied } = stripTrailingCommas(raw);
        expect(applied).toBe(true);
        expect(JSON.parse(text)).toEqual({ a: [1, 2], b: { c: 1 } });
    });

    test("stripJsonComments removes line and block comments outside strings", () => {
        const raw = '{\n  // note\n  "a": 1, /* x */\n  "b": "keep // me"\n}';
        const { text, applied } = stripJsonComments(raw);
        expect(applied).toBe(true);
        expect(JSON.parse(text)).toEqual({ a: 1, b: "keep // me" });
    });

    test("escapeRawControlsInStrings escapes literal newlines", () => {
        const raw = '{"a":"line1\nline2"}';
        const { text, applied } = escapeRawControlsInStrings(raw);
        expect(applied).toBe(true);
        expect(JSON.parse(text)).toEqual({ a: "line1\nline2" });
    });

    test("convertSingleQuotedStrings converts simple single-quoted tokens", () => {
        const raw = "{'a':'b'}";
        const { text, applied } = convertSingleQuotedStrings(raw);
        expect(applied).toBe(true);
        expect(JSON.parse(text)).toEqual({ a: "b" });
    });

    test("repairLlmJsonText stacks multiple repairs", () => {
        const raw = '{\n  // x\n  "h": "said "hi" then",\n}';
        const { text, repairs } = repairLlmJsonText(raw);
        expect(repairs).toEqual(
            expect.arrayContaining(["strip_comments", "interior_unescaped_quotes", "trailing_commas"])
        );
        expect(JSON.parse(text)).toEqual({ h: 'said "hi" then' });
    });

    test("tryParseJsonWithRepair returns repaired payload for altered-self case", () => {
        const raw =
            '{"hypothesis":"causes them to be recognized as "altered-self" by pattern-recognition receptors"}';
        const result = tryParseJsonWithRepair(raw);
        expect(result.ok).toBe(true);
        expect(result.repaired).toBe(true);
        expect(result.repairs).toContain("interior_unescaped_quotes");
        expect(result.json.hypothesis).toContain('"altered-self"');
    });

    test("tryParseJsonWithRepair leaves valid JSON alone", () => {
        const raw = '{"a":1,"b":"x"}';
        const result = tryParseJsonWithRepair(raw);
        expect(result).toEqual({
            ok: true,
            json: { a: 1, b: "x" },
            parseError: null,
            repaired: false,
            repairs: [],
        });
    });

    test("tryParseJsonWithRepair still fails on truncated objects", () => {
        const result = tryParseJsonWithRepair('{"a":1,"b":');
        expect(result.ok).toBe(false);
        expect(result.json).toBeNull();
    });
});

describe("parseLlmJsonResponse + repair", () => {
    test("salvages unescaped quotes inside hypothesis prose", () => {
        const raw =
            '```json\n{"hypotheses":[{"hypothesis":"recognized as "altered-self" by lectins"}]}\n```';
        const result = parseLlmJsonResponse(raw);
        expect(result.ok).toBe(true);
        expect(result.repaired).toBe(true);
        expect(result.json.hypotheses[0].hypothesis).toContain('"altered-self"');
    });

    test("valid JSON reports repaired false", () => {
        const result = parseLlmJsonResponse('{"ok":true}');
        expect(result.ok).toBe(true);
        expect(result.repaired).toBe(false);
        expect(result.json).toEqual({ ok: true });
    });
});
