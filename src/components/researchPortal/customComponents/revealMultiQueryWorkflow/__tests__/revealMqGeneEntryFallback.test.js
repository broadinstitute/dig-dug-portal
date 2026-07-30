import {
    applySearchTermGenesOfInterestFlags,
    buildDefaultGeneEntryFallbackQuery,
    markGeneEntryCannotProceed,
    switchGeneEntryToMainPath,
} from "../revealMqGeneEntryFallback.js";

describe("revealMqGeneEntryFallback", () => {
    test("buildDefaultGeneEntryFallbackQuery lists genes without phenotype ask", () => {
        expect(buildDefaultGeneEntryFallbackQuery(["PCSK9", "APOB"])).toBe(
            "Investigate shared biological mechanisms and pathways among PCSK9, APOB."
        );
        expect(buildDefaultGeneEntryFallbackQuery([])).toMatch(/among these genes/);
        expect(buildDefaultGeneEntryFallbackQuery(["PCSK9"])).not.toMatch(/phenotype/i);
    });

    test("markGeneEntryCannotProceed enables main-path fallback CTA", () => {
        const sets = [];
        const vm = {
            geneEntry: {
                status: "loading",
                progress: { message: "", detail: "" },
            },
            $set(obj, key, val) {
                sets.push([key, val]);
                obj[key] = val;
            },
        };
        markGeneEntryCannotProceed(vm, {
            reason: "api_error",
            message: "Could not load phenotypes.",
            detail: "503",
        });
        expect(vm.geneEntry.status).toBe("error");
        expect(vm.geneEntry.offerMainPathFallback).toBe(true);
        expect(vm.geneEntry.failureReason).toBe("api_error");
        expect(vm.geneEntry.progress.message).toBe("Could not load phenotypes.");
        expect(vm.geneEntry.progress.detail).toBe("503");
        expect(sets.some(([k]) => k === "offerMainPathFallback")).toBe(true);
    });

    test("switchGeneEntryToMainPath clears genes mode, sets query URL, starts extraction", () => {
        const paramMaps = [];
        let parsed = 0;
        const vm = {
            geneEntry: {
                status: "error",
                inputGenes: ["PCSK9", "APOB"],
                offerMainPathFallback: true,
            },
            geneEntryProgressDismissed: false,
            userQuery: "",
            queryParse() {
                parsed += 1;
            },
        };
        const ok = switchGeneEntryToMainPath(vm, {
            setKeyParams: (map) => paramMaps.push(map),
        });
        expect(ok).toBe(true);
        expect(vm.userQuery).toBe(
            "Investigate shared biological mechanisms and pathways among PCSK9, APOB."
        );
        expect(vm.geneEntry.inputGenes).toEqual([]);
        expect(vm.geneEntry.status).toBe("idle");
        expect(paramMaps).toEqual([
            {
                genes: null,
                query: "Investigate shared biological mechanisms and pathways among PCSK9, APOB.",
                geneEntryFail: null,
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
