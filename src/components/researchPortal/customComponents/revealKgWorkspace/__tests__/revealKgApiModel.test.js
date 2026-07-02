import revealKgApi, {
    getRevealKgInteractiveModel,
    setRevealKgInteractiveModel,
} from "@/utils/revealKgApi.js";

describe("revealKgApi interactive model", () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
        setRevealKgInteractiveModel("cfde");
        global.fetch = jest.fn(async (url, options = {}) => ({
            ok: true,
            headers: { get: () => "application/json" },
            text: async () =>
                JSON.stringify({
                    entity_type: "gene",
                    items: [],
                    method: "embedding",
                }),
        }));
    });

    afterEach(() => {
        global.fetch = originalFetch;
        setRevealKgInteractiveModel("cfde");
    });

    it("omits model for the default cfde bucket", async () => {
        await revealKgApi.searchInteractiveCatalog("gene", "APOE", 3);
        const [url, options] = global.fetch.mock.calls[0];
        expect(url).toContain("/api/interactive/catalog?");
        expect(url).not.toContain("model=");
        expect(JSON.parse(options.body || "null")).toBeNull();
    });

    it("adds model to GET catalog requests for incubator bucket", async () => {
        setRevealKgInteractiveModel("cfde-inc");
        await revealKgApi.searchInteractiveCatalog("factor", "insulin", 3);
        const [url] = global.fetch.mock.calls[0];
        expect(url).toContain("model=cfde-inc");
        expect(getRevealKgInteractiveModel()).toBe("cfde-inc");
    });

    it("adds model to POST gene-set search bodies", async () => {
        setRevealKgInteractiveModel("cfde-inc");
        await revealKgApi.searchInteractiveGeneSets("diabetes", 5);
        const [, options] = global.fetch.mock.calls[0];
        expect(JSON.parse(options.body)).toMatchObject({
            query: "diabetes",
            model: "cfde-inc",
        });
    });
});
