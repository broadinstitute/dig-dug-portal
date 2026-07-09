import { ASSISTANT_ACTIONS } from "../revealKgAssistantTools.js";
import {
    ASSISTANT_ACTION_CATALOG,
    ASSISTANT_ACTION_CATALOG_SECTIONS,
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

    it("organizes actions into Commands and Research sections", () => {
        expect(ASSISTANT_ACTION_CATALOG_SECTIONS.map((section) => section.section)).toEqual([
            "Commands",
            "Research",
        ]);
        for (const section of ASSISTANT_ACTION_CATALOG_SECTIONS) {
            expect(String(section.intro || "").trim()).not.toBe("");
            expect(section.groups?.length).toBeGreaterThan(0);
        }
        const sectionIds = ASSISTANT_ACTION_CATALOG_SECTIONS.flatMap((section) =>
            section.groups.flatMap((group) => group.actions.map((action) => action.id))
        );
        expect(sectionIds.length).toBe(catalogActionIds().length);
        expect(new Set(sectionIds).size).toBe(sectionIds.length);
    });
});
