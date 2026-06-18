import { ASSISTANT_ACTIONS } from "../revealKgAssistantTools.js";
import {
    ASSISTANT_ACTION_CATALOG,
    catalogActionIds,
} from "../revealKgAssistantActionCatalog.js";

describe("ASSISTANT_ACTION_CATALOG", () => {
    it("documents every executable assistant action", () => {
        const documented = new Set(catalogActionIds());
        const missing = ASSISTANT_ACTIONS.map(({ action }) => action).filter(
            (action) => !documented.has(action)
        );
        expect(missing).toEqual([]);
    });

    it("uses unique action ids across groups", () => {
        const ids = catalogActionIds();
        expect(ids.length).toBe(new Set(ids).size);
    });

    it("includes descriptions and at least one example per action", () => {
        for (const group of ASSISTANT_ACTION_CATALOG) {
            for (const action of group.actions) {
                expect(String(action.description || "").trim()).not.toBe("");
                expect(action.examples?.length).toBeGreaterThan(0);
            }
        }
    });
});
