
let applyPortalGeneData = null;
try {
    const enableLocalFixture = process.env.VUE_APP_PB_GENE_LOCAL_FIXTURE === "true";
    const generatedFixtures = enableLocalFixture
        ? require.context(".", false, /^\.\/portalGeneData\.generated\.js$/)
        : { keys: () => [] };
    if (enableLocalFixture && generatedFixtures.keys().includes("./portalGeneData.generated.js")) {
        const mod = generatedFixtures("./portalGeneData.generated.js");
        applyPortalGeneData = mod.applyPortalGeneData;
    }
} catch (e) {
}

export const pbGeneFixturePipeline = applyPortalGeneData
    ? [{ key: "rds-fixture", description: "RDS export for gene page.", apply: applyPortalGeneData }]
    : [];

export const fixtureGeneSymbol = applyPortalGeneData
    ? String(((applyPortalGeneData({}) || {}).geneInfo || {}).symbol || "").trim().toUpperCase()
    : "";

export function applyPbGeneFixturePipeline(baseState, requestedSymbolOverride = null) {
    const requestedSymbol = String(
        requestedSymbolOverride != null
            ? requestedSymbolOverride
            : ((baseState.geneInfo || {}).symbol || "")
    ).trim().toUpperCase();
    return pbGeneFixturePipeline.reduce(
        (state, step) => {
            const next = step.apply(state);
            const fixtureSymbol = String(((next || {}).geneInfo || {}).symbol || "").trim().toUpperCase();
            if (requestedSymbol && fixtureSymbol && requestedSymbol !== fixtureSymbol) {
                return state;
            }
            return next;
        },
        baseState
    );
}

export const fixtureLoaded = applyPortalGeneData !== null;
