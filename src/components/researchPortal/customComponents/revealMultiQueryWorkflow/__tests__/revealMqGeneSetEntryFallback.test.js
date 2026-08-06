import {
    applySearchTermGenesOfInterestFlags,
    buildDefaultGeneSetEntryFallbackQuery,
    markGeneSetEntryCannotProceed,
    switchGeneSetEntryToMainPath,
} from "../revealMqGeneSetEntryFallback.js";

describe("revealMqGeneSetEntryFallback", () => {
    test("buildDefaultGeneSetEntryFallbackQuery lists genes without phenotype ask", () => {
        expect(buildDefaultGeneSetEntryFallbackQuery(["PCSK9", "APOB"])).toBe(
            "Investigate shared biological mechanisms and pathways among PCSK9, APOB."
        );
        expect(buildDefaultGeneSetEntryFallbackQuery([])).toMatch(/among these genes/);
        expect(buildDefaultGeneSetEntryFallbackQuery(["PCSK9"])).not.toMatch(/phenotype/i);
    });

    test("markGeneSetEntryCannotProceed enables main-path fallback CTA", () => {
        const sets = [];
        const vm = {
            geneSetEntry: {
                status: "loading",
                progress: { message: "", detail: "" },
            },
            $set(obj, key, val) {
                sets.push([key, val]);
                obj[key] = val;
            },
        };
        markGeneSetEntryCannotProceed(vm, {
            reason: "api_error",
            message: "Could not load phenotypes.",
            detail: "503",
        });
        expect(vm.geneSetEntry.status).toBe("error");
        expect(vm.geneSetEntry.offerMainPathFallback).toBe(true);
        expect(vm.geneSetEntry.failureReason).toBe("api_error");
        expect(vm.geneSetEntry.progress.message).toBe("Could not load phenotypes.");
        expect(vm.geneSetEntry.progress.detail).toBe("503");
        expect(sets.some(([k]) => k === "offerMainPathFallback")).toBe(true);
    });

    test("switchGeneSetEntryToMainPath clears genes mode, sets query URL, starts extraction", () => {
        const paramMaps = [];
        let parsed = 0;
        const vm = {
            geneSetEntry: {
                status: "error",
                inputGenes: ["PCSK9", "APOB"],
                offerMainPathFallback: true,
            },
            geneSetEntryProgressDismissed: false,
            userQuery: "",
            searchPath: "genes",
            queryParse() {
                parsed += 1;
            },
        };
        const ok = switchGeneSetEntryToMainPath(vm, {
            setKeyParams: (map) => paramMaps.push(map),
        });
        expect(ok).toBe(true);
        expect(vm.searchPath).toBe("query");
        expect(vm.userQuery).toBe(
            "Investigate shared biological mechanisms and pathways among PCSK9, APOB."
        );
        expect(vm.geneSetEntry.inputGenes).toEqual([]);
        expect(vm.geneSetEntry.status).toBe("idle");
        expect(paramMaps).toEqual([
            {
                genes: null,
                query: "Investigate shared biological mechanisms and pathways among PCSK9, APOB.",
                geneSetEntryFail: null,
            },
        ]);
        expect(parsed).toBe(1);
    });

    test("applySearchTermGenesOfInterestFlags pins includedFromRequest to GOI only", () => {
        const factor = {
            genes: {
                PCSK9: { factorRelevance: 2, includedFromRequest: false },
                LEP: { factorRelevance: 1, includedFromRequest: true },
                APOB: { factorRelevance: 3, includedFromRequest: false },
            },
        };
        const factorData = {
            T2D: { factors: [factor], allFactors: [factor] },
        };
        applySearchTermGenesOfInterestFlags(factorData, ["PCSK9", "APOB"]);
        expect(factor.genes.PCSK9.includedFromRequest).toBe(true);
        expect(factor.genes.APOB.includedFromRequest).toBe(true);
        expect(factor.genes.LEP.includedFromRequest).toBe(false);
    });
});
