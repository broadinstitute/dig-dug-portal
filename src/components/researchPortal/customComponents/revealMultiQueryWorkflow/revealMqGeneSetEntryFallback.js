/**
 * Gene-set entry → main (text-query) path fallback helpers.
 *
 * When gene-set entry APIs are down or return no usable data, offer to rewrite the
 * session as a normal user-query workflow (URL `query=`, extraction, hybrid retrieval).
 */

/**
 * Default fallback query: genes as the subject; no phenotype/gene-set ask
 * (those come back from retrieval).
 */
function buildDefaultGeneSetEntryFallbackQuery(genes) {
    const list = (Array.isArray(genes) ? genes : [])
        .map((g) => String(g || "").trim())
        .filter(Boolean);
    if (!list.length) {
        return "Investigate shared biological mechanisms and pathways among these genes.";
    }
    return `Investigate shared biological mechanisms and pathways among ${list.join(", ")}.`;
}

/**
 * Marks gene-set entry as unable to continue and enables the main-path fallback CTA.
 * @param {"api_error"|"insufficient_data"} reason
 */
function markGeneSetEntryCannotProceed(vm, { message, detail = "", reason = "insufficient_data" } = {}) {
    if (!vm || !vm.geneSetEntry) return;
    vm.geneSetEntry.status = "error";
    vm.$set(vm.geneSetEntry, "offerMainPathFallback", true);
    vm.$set(vm.geneSetEntry, "failureReason", reason);
    const msg = String(message || "Gene-set entry retrieval could not continue.");
    const det = String(detail || "");
    if (typeof vm.$set === "function") {
        vm.$set(vm.geneSetEntry, "progress", { message: msg, detail: det });
    } else {
        vm.geneSetEntry.progress = { message: msg, detail: det };
    }
    if (typeof vm.setLoadStatus === "function") {
        vm.setLoadStatus(msg, true);
    }
    if (typeof vm.setStep === "function") {
        vm.setStep({
            id: "2",
            substep: {
                id: "2.gene-set-entry-live",
                title: msg,
                result: det ? { title: det } : { title: "" },
            },
        });
    }
}

/**
 * Clears gene-set entry mode, writes `query=` (drops `genes=`), fills the search box,
 * and starts search-terms extraction via `vm.queryParse()`.
 * Optional `setKeyParams` injects URL updates (defaults to `@/utils/keyParams`.set).
 */
function switchGeneSetEntryToMainPath(vm, { setKeyParams } = {}) {
    if (!vm) return false;
    const genes =
        vm.geneSetEntry && Array.isArray(vm.geneSetEntry.inputGenes) ? vm.geneSetEntry.inputGenes.slice() : [];
    const query = buildDefaultGeneSetEntryFallbackQuery(genes);
    vm.geneSetEntryProgressDismissed = true;
    vm.geneSetEntry = {
        status: "idle",
        inputGenes: [],
        errors: { phenotypes: null, perPhenotype: {} },
        phenotypesResponse: null,
        topTraits: [],
        progress: { message: "", detail: "" },
        researchIntention: "",
        offerMainPathFallback: false,
        failureReason: null,
    };
    vm.userQuery = query;
    if (Object.prototype.hasOwnProperty.call(vm, "searchPath")) {
        vm.searchPath = "query";
    }
    const applyParams =
        typeof setKeyParams === "function"
            ? setKeyParams
            : (map) => {
                  // Lazy require so unit tests for pure helpers need no `window`.
                  // eslint-disable-next-line global-require
                  const keyParams = require("@/utils/keyParams").default;
                  if (keyParams && typeof keyParams.set === "function") keyParams.set(map);
              };
    applyParams({ genes: null, query, geneSetEntryFail: null });
    if (typeof vm.queryParse === "function") {
        vm.queryParse();
        return true;
    }
    return false;
}

/**
 * After hybrid factorData is built, pin `includedFromRequest` to extracted
 * genes of interest (search-term genes) so heatmap/table can bold them vs context.
 */
function applySearchTermGenesOfInterestFlags(factorData, genesOfInterest) {
    const set = new Set(
        (Array.isArray(genesOfInterest) ? genesOfInterest : [])
            .map((g) => String(g || "").trim().toUpperCase())
            .filter(Boolean)
    );
    if (!set.size || !factorData || typeof factorData !== "object") return factorData;
    Object.keys(factorData).forEach((phenotypeId) => {
        const pData = factorData[phenotypeId];
        if (!pData) return;
        const seen = new Set();
        const factors = [...(pData.factors || []), ...(pData.allFactors || [])];
        factors.forEach((factor) => {
            if (!factor || seen.has(factor)) return;
            seen.add(factor);
            const genes = factor.genes && typeof factor.genes === "object" ? factor.genes : {};
            Object.keys(genes).forEach((geneName) => {
                const entry = genes[geneName];
                if (!entry || typeof entry !== "object") return;
                entry.includedFromRequest = set.has(String(geneName).toUpperCase());
            });
        });
    });
    return factorData;
}

export {
    applySearchTermGenesOfInterestFlags,
    buildDefaultGeneSetEntryFallbackQuery,
    markGeneSetEntryCannotProceed,
    switchGeneSetEntryToMainPath,
};
