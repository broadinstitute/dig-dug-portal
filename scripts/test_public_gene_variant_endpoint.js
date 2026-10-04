const assert = require("node:assert/strict");
const register = require("./public_gene_variant_endpoint");

const rows = [
    { chromosome: "1", position: 167824433, reference: "G", alt: "A,T",
      Consequence: "missense_variant", HGVSc: "ENST000001.2:c.123G>A", HGVSp: "ENSP000001.2:p.Gly41Ser", gnomAD_AF: "0.00012", samples: ["PRIVATE-AFFECTED"] },
    { chromosome: "1", position: 167834104, reference: "G", alt: "T",
      Consequence: "missense_variant", samples: [] },
    { chromosome: "1", position: 167824433, reference: "G", alt: "A,T",
      Consequence: "missense_variant", samples: ["PRIVATE-UNAFFECTED"] },
    { chromosome: "1", position: 167844104, reference: "C", alt: "A",
      Consequence: "missense_variant", carrier_count: 3 },
    { chromosome: "1", position: 167854104, reference: "A", alt: "C",
      Consequence: "missense_variant" },
];
const requests = [];
const originalFetch = global.fetch;
global.fetch = async url => {
    requests.push(new URL(String(url)));
    return {
        ok: true,
        json: async () => requests.length === 1
            ? { data: [rows[0], rows[1], rows[4]], continuation: "next-page" }
            : { data: [rows[2], rows[3]], continuation: null },
    };
};

let handler;
register({ get(path, callback) {
    assert.equal(path, "/__public_gene_variants__");
    handler = callback;
} }, "http://private-bioindex");

const response = {
    headers: {},
    statusCode: 200,
    set(name, value) { this.headers[name] = value; return this; },
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.payload = payload; return this; },
};

handler({ query: { gene: "ADCY10" } }, response).then(() => {
    assert.equal(response.statusCode, 200);
    assert.equal(response.headers["Cache-Control"], "private, no-store");
    assert.equal(requests.length, 2);
    assert.equal(requests[0].searchParams.get("q"), "ADCY10");
    assert.equal(requests[0].searchParams.has("limit"), false);
    assert.equal(requests[1].pathname, "/api/bio/cont");
    assert.deepEqual(response.payload.variants.map(row => row.id), [
        "chr1:167824433:G:A,T",
        "chr1:167844104:C:A",
    ]);
    assert.deepEqual(response.payload.variants.map(row => row.carrierCount), [2, 3]);
    assert.equal(response.payload.variants[0].hgvsc, "ENST000001.2:c.123G>A");
    assert.equal(response.payload.variants[0].hgvsp, "ENSP000001.2:p.Gly41Ser");
    assert.equal(response.payload.variants[0].gnomadAF, "0.00012");
    assert.equal(response.payload.distinctCarriers, null, "Gene-level distinct count needs complete sample IDs");
    assert.ok(response.payload.variants.every(row => !Object.hasOwn(row, "samples")));
    assert.ok(!JSON.stringify(response.payload).includes("PRIVATE-"), "No sample ID leaves the public endpoint");
    console.log("PUBLIC_GENE_VARIANT_ENDPOINT_TEST_PASS");
}).catch(error => {
    console.error(error);
    process.exitCode = 1;
}).finally(() => { global.fetch = originalFetch; });
