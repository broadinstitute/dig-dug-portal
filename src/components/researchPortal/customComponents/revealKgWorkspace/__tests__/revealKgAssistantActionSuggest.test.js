import {
    ASSISTANT_ACTION_PHRASES,
    ASSISTANT_ACTION_VERBS,
    ASSISTANT_ENTITY_TYPES,
    ASSISTANT_GRAPH_TERMS,
    buildAssistantAutocompleteSuggestions,
    expectsNounTarget,
    isViewModifierContext,
    looksLikeNodeLabelToken,
    matchAssistantSuggestActions,
    matchAssistantSuggestEntityTypes,
    matchAssistantSuggestGraphTerms,
    matchAssistantSuggestPhrases,
} from "../revealKgAssistantActionSuggest.js";

describe("matchAssistantSuggestActions", () => {
    it("matches verb prefix only, not full phrases", () => {
        const matches = matchAssistantSuggestActions("sel");
        expect(matches[0].insertText).toBe("select");
        expect(matches[0].label).toBe("Select");
        expect(matches.map((item) => item.insertText)).toContain("unselect");
    });

    it("returns explain and expand for ex", () => {
        const verbs = matchAssistantSuggestActions("ex").map((item) => item.insertText);
        expect(verbs).toContain("explain");
        expect(verbs).toContain("expand");
    });

    it("matches deselect to unselect", () => {
        const matches = matchAssistantSuggestActions("des");
        expect(matches[0].insertText).toBe("unselect");
    });
});

describe("looksLikeNodeLabelToken", () => {
    it("detects gene-like tokens", () => {
        expect(looksLikeNodeLabelToken("BRCA1")).toBe(true);
        expect(looksLikeNodeLabelToken("sel")).toBe(false);
    });
});

describe("expectsNounTarget", () => {
    it("is true after an action verb", () => {
        expect(expectsNounTarget("select ", 7)).toBe(true);
        expect(expectsNounTarget("filter genes related to ", 24)).toBe(false);
    });
});

describe("matchAssistantSuggestEntityTypes", () => {
    it("matches gene, trait, mechanism, and gene set", () => {
        expect(matchAssistantSuggestEntityTypes("gen").map((item) => item.insertText)).toEqual(
            expect.arrayContaining(["gene", "gene set"])
        );
        expect(matchAssistantSuggestEntityTypes("tra")[0].insertText).toBe("trait");
        expect(matchAssistantSuggestEntityTypes("mec")[0].insertText).toBe("mechanism");
    });
});

describe("matchAssistantSuggestGraphTerms", () => {
    it("matches node, nodes, and graph", () => {
        expect(matchAssistantSuggestGraphTerms("nod").map((item) => item.insertText)).toEqual(
            expect.arrayContaining(["node", "nodes"])
        );
        expect(matchAssistantSuggestGraphTerms("gra")[0].insertText).toBe("graph");
    });
});

describe("matchAssistantSuggestPhrases", () => {
    it("matches jumping edges", () => {
        const matches = matchAssistantSuggestPhrases("jump");
        expect(matches.map((item) => item.insertText)).toContain("jumping edges");
    });

    it("matches contextual edges", () => {
        const matches = matchAssistantSuggestPhrases("cont");
        expect(matches[0].insertText).toBe("contextual edges");
    });
});

describe("isViewModifierContext", () => {
    it("is true after show or hide", () => {
        expect(isViewModifierContext("show ", 5)).toBe(true);
        expect(isViewModifierContext("hide ", 5)).toBe(true);
    });
});

describe("buildAssistantAutocompleteSuggestions", () => {
    const graphNodes = [
        { node_id: "gene:BRCA1", label: "BRCA1", type: "gene" },
        { node_id: "trait:T2D", label: "Type 2 diabetes", type: "trait" },
    ];

    it("prefers verbs for lowercase prefixes", () => {
        const items = buildAssistantAutocompleteSuggestions({
            token: "sel",
            text: "sel",
            tokenStart: 0,
            graphNodes,
        });
        expect(items[0].kind).toBe("action");
        expect(items[0].insertText).toBe("select");
    });

    it("prefers nodes for gene-like tokens", () => {
        const items = buildAssistantAutocompleteSuggestions({
            token: "BRCA",
            text: "BRCA",
            tokenStart: 0,
            graphNodes,
        });
        expect(items.every((item) => item.kind === "node")).toBe(true);
        expect(items[0].insertText).toBe("BRCA1");
    });

    it("shows nodes after a verb", () => {
        const text = "select BRC";
        const items = buildAssistantAutocompleteSuggestions({
            token: "BRC",
            text,
            tokenStart: text.indexOf("BRC"),
            graphNodes,
        });
        expect(items.every((item) => item.kind === "node")).toBe(true);
    });

    it("shows entity types after a verb", () => {
        const text = "select gen";
        const items = buildAssistantAutocompleteSuggestions({
            token: "gen",
            text,
            tokenStart: text.indexOf("gen"),
            graphNodes,
        });
        expect(items.some((item) => item.kind === "entity" && item.insertText === "gene")).toBe(true);
    });

    it("shows edge phrases after show", () => {
        const text = "show jump";
        const items = buildAssistantAutocompleteSuggestions({
            token: "jump",
            text,
            tokenStart: text.indexOf("jump"),
            graphNodes,
        });
        expect(items.some((item) => item.insertText === "jumping edges")).toBe(true);
        expect(items.every((item) => item.kind === "node")).toBe(false);
    });
});

describe("ASSISTANT_ACTION_VERBS", () => {
    it("inserts single-word verbs only", () => {
        for (const entry of ASSISTANT_ACTION_VERBS) {
            expect(entry.verb).not.toMatch(/\s/);
        }
    });
});

describe("ASSISTANT_ACTION_PHRASES", () => {
    it("includes jumping and contextual edges", () => {
        const phrases = ASSISTANT_ACTION_PHRASES.map((entry) => entry.phrase);
        expect(phrases).toContain("jumping edges");
        expect(phrases).toContain("contextual edges");
    });
});

describe("ASSISTANT_ENTITY_TYPES", () => {
    it("includes core entity nouns", () => {
        const phrases = ASSISTANT_ENTITY_TYPES.map((entry) => entry.phrase);
        expect(phrases).toEqual(
            expect.arrayContaining(["gene", "gene set", "mechanism", "trait"])
        );
    });
});

describe("ASSISTANT_GRAPH_TERMS", () => {
    it("includes node, nodes, and graph", () => {
        const phrases = ASSISTANT_GRAPH_TERMS.map((entry) => entry.phrase);
        expect(phrases).toEqual(expect.arrayContaining(["node", "nodes", "graph"]));
    });
});
