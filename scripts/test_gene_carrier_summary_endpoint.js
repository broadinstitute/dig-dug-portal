const assert = require("assert");
const register = require("./gene_carrier_summary_endpoint");

const sampleA = "TEST-A_G38";
const sampleB = "TEST-B_G38";
const variantA = "chr1:100:A:G";
const variantB = "chr1:200:C:T";
const requests = [];
const handlers = {};

const app = { get(path, callback) {
    handlers[path] = callback;
} };

const originalFetch = global.fetch;
global.fetch = async url => {
    const parsed = new URL(url);
    const q = parsed.searchParams.get("q");
    requests.push(`${parsed.pathname}:${q}`);
    if (parsed.pathname.endsWith("/gene-variants-crdc")) {
        return { ok: true, json: async () => ({ data: [
            { chromosome: "1", position: 100, reference: "A", alt: "G", samples: [sampleA] },
            { chromosome: "1", position: 200, reference: "C", alt: "T", samples: [sampleA, sampleB] },
        ] }) };
    }
    if (parsed.pathname.endsWith("/samples-info")) {
        if (q === sampleB) await new Promise(resolve => setTimeout(resolve, 80));
        return { ok: true, json: async () => ({ data: [{
            SampleInVCF: q,
            age_at_enrollment: q === sampleA ? 12 : 1982,
            gender: q === sampleA ? "female" : "male",
            investigator: "test",
            ...(q === sampleA ? { Project: "Project Alpha" } : { clean_name: "Project Beta" }),
            initial_study_affected: q === sampleA ? "Y" : "N",
            genes: q === sampleA ? ["TEST", "OTHER"] : ["TEST", "OTHER", "THIRD"],
        }] }) };
    }
    throw new Error(`Unexpected request: ${parsed.pathname}`);
};

register(app, "http://bioindex.test");

function call(query, path = "/__gene_carrier_summary__") {
    return new Promise(resolve => handlers[path]({ query }, {
        set() {},
        json: resolve,
        status(code) { throw new Error(`Unexpected ${code}`); },
    }));
}

async function waitForReady(query) {
    for (let i = 0; i < 30; i += 1) {
        const result = await call(query);
        if (result.status === "ready") return result;
        await new Promise(resolve => setTimeout(resolve, 10));
    }
    throw new Error("Summary did not finish");
}

(async () => {
    await call({ gene: "TEST" });
    await new Promise(resolve => setTimeout(resolve, 20));
    const partial = await call({ gene: "TEST" });
    assert.strictEqual(partial.status, "loading");
    assert.strictEqual(partial.total, 2);
    assert.strictEqual(partial.completed, 1);
    assert.strictEqual(partial.matchedMetadataCount, 1);
    assert.deepStrictEqual(partial.geneCarrierDemographics.bySex, [{ label: "female", count: 1 }]);
    const partialFilter = await call({ gene: "TEST", start: "100", end: "200", bins: "2", sex: "Female" }, "/__gene_locus_filter__");
    assert.strictEqual(partialFilter.status, "partial");
    assert.strictEqual(partialFilter.distinctCarriers, 1);

    const gene = await waitForReady({ gene: "TEST" });
    assert.strictEqual(gene.carrierTotal, 2);
    assert.strictEqual(gene.matchedMetadataCount, 2);
    assert.deepStrictEqual(gene.coCarrierGenes.find(row => row.gene === "OTHER"),
        { gene: "OTHER", count: 2, denominator: 2 });
    assert.deepStrictEqual(gene.geneCarrierDemographics.bySex,
        [{ label: "female", count: 1 }, { label: "male", count: 1 }]);
    assert.deepStrictEqual(gene.geneCarrierDemographics.byProject,
        [{ project: "Project Alpha", count: 1 }, { project: "Project Beta", count: 1 }]);
    assert.deepStrictEqual(gene.geneCarrierDemographics.byAge,
        [{ band: "10-13", count: 1 }, { band: "Unknown", count: 1 }]);
    assert.ok(!JSON.stringify(gene).includes(sampleA));
    assert.ok(!JSON.stringify(gene).includes(sampleB));

    const filtered = await call({ gene: "TEST", start: "100", end: "200", bins: "2", age: "10-13" }, "/__gene_locus_filter__");
    assert.strictEqual(filtered.status, "ready");
    assert.strictEqual(filtered.distinctCarriers, 1);
    assert.deepStrictEqual(filtered.carrierDensity, [1, 1]);
    assert.strictEqual(filtered.variantCounts[variantA], 1);
    assert.strictEqual(filtered.variantCounts[variantB], 1);
    assert.ok(!JSON.stringify(filtered).includes(sampleA));
    assert.ok(!JSON.stringify(filtered).includes(sampleB));

    const affected = await call({ gene: "TEST", start: "100", end: "200", bins: "2", scope: "Affected" }, "/__gene_locus_filter__");
    assert.strictEqual(affected.distinctCarriers, 1);

    const project = await call({ gene: "TEST", start: "100", end: "200", bins: "2", layout: "public", project: "Project Alpha" }, "/__gene_locus_filter__");
    assert.strictEqual(project.distinctCarriers, 1);
    assert.strictEqual(project.variantCounts[variantB], 1);
    const cleanNameProject = await call({ gene: "TEST", start: "100", end: "200", bins: "2", layout: "public", project: "Project Beta" }, "/__gene_locus_filter__");
    assert.strictEqual(cleanNameProject.distinctCarriers, 1);
    assert.strictEqual(cleanNameProject.variantCounts[variantB], 1);
    assert.strictEqual(cleanNameProject.variantCounts[variantA], 0);

    const variant = await waitForReady({ gene: "TEST", variant: variantA });
    assert.strictEqual(variant.carrierTotal, 1);
    assert.strictEqual(variant.matchedMetadataCount, 1);
    assert.strictEqual(requests.filter(path => path.endsWith(sampleA)).length, 1);

    // A failed BioIndex lookup must not become a cached "ready, 0 metadata" result.
    const retryHandlers = {};
    const retryVariant = "chr1:300:G:A";
    let sampleAvailable = false;
    let sampleRequests = 0;
    global.fetch = async url => {
        const parsed = new URL(url);
        if (parsed.pathname.endsWith("/gene-variants-crdc")) {
            return { ok: true, json: async () => ({ data: [
                { chromosome: "1", position: 300, reference: "G", alt: "A", samples: [sampleA] },
            ] }) };
        }
        if (parsed.pathname.endsWith("/samples-info")) {
            sampleRequests += 1;
            if (!sampleAvailable) throw new Error("temporary BioIndex failure");
            return { ok: true, json: async () => ({ data: [
                { SampleInVCF: sampleA, sex: "female", genes: ["TEST", "OTHER"] },
            ] }) };
        }
        throw new Error(`Unexpected request: ${parsed.pathname}`);
    };
    register({ get(path, callback) { retryHandlers[path] = callback; } }, "http://bioindex.test");
    const callRetry = () => new Promise(resolve => retryHandlers["/__gene_carrier_summary__"](
        { query: { gene: "TEST", variant: retryVariant } },
        { set() {}, json: resolve, status(code) { throw new Error(`Unexpected ${code}`); } }
    ));
    let failed;
    for (let i = 0; i < 30; i += 1) {
        failed = await callRetry();
        if (failed.status === "error") break;
        await new Promise(resolve => setTimeout(resolve, 50));
    }
    assert.strictEqual(failed.status, "error");
    assert.strictEqual(sampleRequests, 3);
    sampleAvailable = true;
    let recovered;
    for (let i = 0; i < 30; i += 1) {
        recovered = await callRetry();
        if (recovered.status === "ready") break;
        await new Promise(resolve => setTimeout(resolve, 10));
    }
    assert.strictEqual(recovered.status, "ready");
    assert.strictEqual(recovered.matchedMetadataCount, 1);
    assert.deepStrictEqual(recovered.coCarrierGenes,
        [{ gene: "OTHER", count: 1, denominator: 1 }]);

    // An initially empty metadata index can be rebuilt while the server stays up.
    // Reopening an incomplete variant summary must query the sample again.
    const refreshHandlers = {};
    const refreshVariant = "chr1:400:C:T";
    let metadataIndexed = false;
    let refreshSampleRequests = 0;
    global.fetch = async url => {
        const parsed = new URL(url);
        if (parsed.pathname.endsWith("/gene-variants-crdc")) {
            return { ok: true, json: async () => ({ data: [
                { chromosome: "1", position: 400, reference: "C", alt: "T", samples: [sampleA] },
            ] }) };
        }
        if (parsed.pathname.endsWith("/samples-info")) {
            refreshSampleRequests += 1;
            return { ok: true, json: async () => ({ data: metadataIndexed ? [{
                SampleInVCF: sampleA, sex: "female", genes: ["TEST", "OTHER"],
            }] : [] }) };
        }
        throw new Error(`Unexpected request: ${parsed.pathname}`);
    };
    register({ get(path, callback) { refreshHandlers[path] = callback; } }, "http://bioindex.test");
    const callRefresh = (refresh = false) => new Promise(resolve => refreshHandlers["/__gene_carrier_summary__"](
        { query: { gene: "TEST", variant: refreshVariant, ...(refresh ? { refresh: "1" } : {}) } },
        { set() {}, json: resolve, status(code) { throw new Error(`Unexpected ${code}`); } }
    ));
    let empty;
    for (let i = 0; i < 100; i += 1) {
        empty = await callRefresh();
        if (empty.status === "ready") break;
        await new Promise(resolve => setTimeout(resolve, 20));
    }
    assert.strictEqual(empty.status, "ready");
    assert.strictEqual(empty.matchedMetadataCount, 0);
    metadataIndexed = true;
    let refreshed = await callRefresh(true);
    for (let i = 0; i < 30; i += 1) {
        refreshed = await callRefresh(true);
        if (refreshed.status === "ready" && refreshed.matchedMetadataCount === 1) break;
        await new Promise(resolve => setTimeout(resolve, 10));
    }
    assert.strictEqual(refreshed.status, "ready");
    assert.strictEqual(refreshed.matchedMetadataCount, 1);
    assert.strictEqual(refreshSampleRequests, 4);

    // A transient no-row response should retry before producing an incomplete summary.
    const transientHandlers = {};
    const transientVariant = "chr1:450:G:C";
    let transientSampleRequests = 0;
    global.fetch = async url => {
        const parsed = new URL(url);
        if (parsed.pathname.endsWith("/gene-variants-crdc")) {
            return { ok: true, json: async () => ({ data: [
                { chromosome: "1", position: 450, reference: "G", alt: "C", samples: [sampleA] },
            ] }) };
        }
        if (parsed.pathname.endsWith("/samples-info")) {
            transientSampleRequests += 1;
            return { ok: true, json: async () => ({ data: transientSampleRequests < 3 ? [] : [
                { SampleInVCF: "UNRELATED_SAMPLE", sex: "male", genes: ["WRONG"] },
                { SampleInVCF: sampleA, sex: "female", genes: ["TEST"] },
            ] }) };
        }
        throw new Error(`Unexpected request: ${parsed.pathname}`);
    };
    register({ get(path, callback) { transientHandlers[path] = callback; } }, "http://bioindex.test");
    const callTransient = () => new Promise(resolve => transientHandlers["/__gene_carrier_summary__"](
        { query: { gene: "TEST", variant: transientVariant } },
        { set() {}, json: resolve, status(code) { throw new Error(`Unexpected ${code}`); } }
    ));
    let transient;
    for (let i = 0; i < 100; i += 1) {
        transient = await callTransient();
        if (transient.status === "ready") break;
        await new Promise(resolve => setTimeout(resolve, 20));
    }
    assert.strictEqual(transient.status, "ready");
    assert.strictEqual(transient.matchedMetadataCount, 1);
    assert.strictEqual(transientSampleRequests, 3);
    assert.deepStrictEqual(transient.geneCarrierDemographics.bySex,
        [{ label: "female", count: 1 }]);

    // Forward the browser's BioIndex session token so private Project fields
    // are available to this server-side aggregate, without sharing caches
    // between authenticated sessions.
    const authHandlers = {};
    const authVariant = "chr1:500:A:G";
    const authCalls = [];
    global.fetch = async (url, options = {}) => {
        const parsed = new URL(url);
        const token = options.headers && options.headers["x-bioindex-access-token"];
        authCalls.push({ path: parsed.pathname, token });
        if (parsed.pathname.endsWith("/gene-variants-crdc")) {
            return { ok: true, json: async () => ({ data: [
                { chromosome: "1", position: 500, reference: "A", alt: "G", samples: [sampleA] },
            ] }) };
        }
        if (parsed.pathname.endsWith("/samples-info")) {
            return { ok: true, json: async () => ({ data: [{
                SampleInVCF: sampleA, sex: "female", genes: ["TEST"],
                Project: token === "session-one" ? "Project Alpha" : "Project Beta",
            }] }) };
        }
        throw new Error(`Unexpected request: ${parsed.pathname}`);
    };
    register({ get(path, callback) { authHandlers[path] = callback; } }, "http://bioindex.test");
    const callAuthenticated = token => new Promise(resolve => authHandlers["/__gene_carrier_summary__"](
        { query: { gene: "TEST", variant: authVariant }, headers: { cookie: `session=${token}` } },
        { set() {}, json: resolve, status(code) { throw new Error(`Unexpected ${code}`); } }
    ));
    const waitUntilReady = async token => {
        let result;
        for (let i = 0; i < 30; i += 1) {
            result = await callAuthenticated(token);
            if (result.status === "ready") return result;
            await new Promise(resolve => setTimeout(resolve, 10));
        }
        return result;
    };
    const firstSession = await waitUntilReady("session-one");
    const secondSession = await waitUntilReady("session-two");
    assert.deepStrictEqual(firstSession.geneCarrierDemographics.byProject,
        [{ project: "Project Alpha", count: 1 }]);
    assert.deepStrictEqual(secondSession.geneCarrierDemographics.byProject,
        [{ project: "Project Beta", count: 1 }]);
    assert(authCalls.length >= 4);
    assert(authCalls.every(call => call.token === "session-one" || call.token === "session-two"));
    console.log("Gene and variant carrier summaries: PASS");
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => {
    global.fetch = originalFetch;
});
