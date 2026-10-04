import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../src/views/PbGene/summaryTable.js", import.meta.url), "utf8");
const { paginate, sortAssociations, sortCoCarrierGenes, sortInvestigators } =
    await import(`data:text/javascript,${encodeURIComponent(source)}`);

const associations = [
    { hpoId: "A", label: "Zeta", oddsRatio: 2, pValue: 0.1, qValue: 0.5 },
    { hpoId: "B", label: "Alpha", oddsRatio: 10, pValue: 0.001, qValue: 0.01 },
    { hpoId: "C", label: "Beta", oddsRatio: null, pValue: null, qValue: null },
];
assert.deepEqual(sortAssociations(associations, "oddsRatio", "asc").map(row => row.hpoId), ["A", "B", "C"]);
assert.deepEqual(sortAssociations(associations, "pValue", "desc").map(row => row.hpoId), ["A", "B", "C"]);
assert.deepEqual(sortAssociations(associations, "qValue", "asc").map(row => row.hpoId), ["B", "A", "C"]);
assert.deepEqual(paginate(sortAssociations(associations, "label", "asc"), 2, 2).map(row => row.hpoId), ["A"]);

const genes = [
    { gene: "ZFY", count: 8, denominator: 100 },
    { gene: "ABCA", count: 4, denominator: 10 },
];
assert.deepEqual(sortCoCarrierGenes(genes, "gene", "asc").map(row => row.gene), ["ABCA", "ZFY"]);
assert.deepEqual(sortCoCarrierGenes(genes, "count", "desc").map(row => row.gene), ["ZFY", "ABCA"]);
assert.deepEqual(sortCoCarrierGenes(genes, "overlap", "desc").map(row => row.gene), ["ABCA", "ZFY"]);

const investigators = [{ inv: "Zed", count: 2 }, { inv: "Amy", count: 5 }];
assert.deepEqual(sortInvestigators(investigators, "inv", "asc").map(row => row.inv), ["Amy", "Zed"]);
assert.deepEqual(sortInvestigators(investigators, "count", "asc").map(row => row.inv), ["Zed", "Amy"]);
assert.deepEqual(sortInvestigators(investigators, "count", "desc").map(row => row.inv), ["Amy", "Zed"]);

console.log("Gene summary sorting and pagination: PASS");
