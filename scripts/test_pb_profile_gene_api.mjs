import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
globalThis.__pbContextAssociationRequest = createRequire(import.meta.url)('../src/utils/contextAssociationRequest');

const source = readFileSync("src/views/PbPhenotype/profileGeneApi.js", "utf8")
    .replace('import approvedCatalog from "./profileGeneCatalog.generated.json";', "const approvedCatalog = {genes: []};")
    .replace('import { fetchContextAssociations } from "../../utils/contextAssociationRequest";', 'const { fetchContextAssociations } = globalThis.__pbContextAssociationRequest;');
const { fetchProfileGeneAssociations } = await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
const catalog = { genes: ["A", "B", "C"], source: "approved.tsv", sha256: "test" };
const terms = ["HP:0001250", "HP:0001945"];
const result = {
    query_hpo: terms, n_requested: 3, n_tests: 2, fdr_method: "BH",
    gene_associations: {
        A: { status: "ok", p_value: 0.01, fdr: 0.02 },
        B: { status: "ok", p_value: 0.5, fdr: 0.5 },
        C: { status: "no_variance", p_value: null },
    },
};
const calls = [];
const fetcher = async (url, options) => {
    calls.push({url, body: JSON.parse(options.body)});
    return {status: 200, ok: true, json: async () => result};
};
const actual = await fetchProfileGeneAssociations(terms, fetcher, catalog);
assert.equal(calls.length, 1);
assert.equal(calls[0].url, "/phenotype-analyzer-api/co-gene-associations");
assert.deepEqual([calls[0].body.gene, ...calls[0].body.co_genes], catalog.genes);
assert.deepEqual(calls[0].body.terms, terms);
assert.equal(actual.n_tests, 2);
assert.equal(actual.multiple_testing_scope, "all valid genes in approved score source");
assert.deepEqual(Object.keys(actual.gene_associations), ["A", "B"]);
assert.equal(actual.gene_associations.A.fdr, 0.02);

for (const incomplete of [
    {...result, n_requested: 2},
    {...result, gene_associations: {A: result.gene_associations.A}},
    {...result, n_tests: 1},
    {...result, gene_associations: {...result.gene_associations, A: {...result.gene_associations.A, fdr: null}}},
]) {
    await assert.rejects(fetchProfileGeneAssociations(terms, async () =>
        ({status: 200, ok: true, json: async () => incomplete}), catalog), /complete|incomplete/);
}
await assert.rejects(fetchProfileGeneAssociations(terms, async () => ({status: 503, ok: false}), catalog), /503/);
console.log("Full gene profile API compatibility: passed");
