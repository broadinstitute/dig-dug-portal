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

    const variant = await waitForReady({ gene: "TEST", variant: variantA });
    assert.strictEqual(variant.carrierTotal, 1);
    assert.strictEqual(variant.matchedMetadataCount, 1);
    assert.strictEqual(requests.filter(path => path.endsWith(sampleA)).length, 1);
    console.log("Gene and variant carrier summaries: PASS");
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => {
    global.fetch = originalFetch;
});
