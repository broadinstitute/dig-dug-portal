import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync("src/views/PbPhenotype/phenotypeModel.js");
const model = await import(`data:text/javascript;base64,${source.toString("base64")}`);
const { diseaseRows, ageBand, validAge, sortTableRows, formatStatistic } = model;

const terms = {};
const associations = {};
const add = (id, frequency, parents = []) => {
    terms[id] = [id, "", parents];
    associations[id] = [[0, frequency, 0]];
};
add("q1", "Very frequent (99-80%)");
add("q2", "Obligate (100%)");
add("q3", "Obligate (100%)");
for (let i = 1; i <= 4; i++) add(`v${i}`, "Very frequent (99-80%)");
for (let i = 1; i <= 4; i++) add(`f${i}`, "Frequent (79-30%)");
const mockup = { terms, associations, diseases: [["540", "FHL", []]] };
const query = ["q1", "q2", "q3"];
const result = diseaseRows(mockup, query)[0];
assert.equal(result.profile.length, 11);
assert.ok(Math.abs(result.denominator - 8.6239) < 1e-10);
assert.ok(Math.abs(result.numerator - 2.8811) < 1e-10);
assert.equal(result.score.toFixed(2), "0.50");
assert.equal(diseaseRows(mockup, query, ["v1", "v2"])[0].penaltyWeight, 0.8911);
assert.ok(Math.abs(diseaseRows(mockup, query, ["v1", "v2"])[0].score -
    Math.max(0, result.score - 0.5 * 0.8911)) < 1e-10);

const hierarchy = {
    terms: {
        parent: ["Parent", "", []],
        child: ["Child", "", ["parent"]],
        grandchild: ["Grandchild", "", ["child"]],
        absent: ["Absent", "", []],
    },
    associations: {
        parent: [[0, "Very frequent (99-80%)", 0]],
        child: [[0, "Very frequent (99-80%)", 0]],
        grandchild: [[0, "Frequent (79-30%)", 0]],
        absent: [[0, "Excluded (0%)", 0]],
    },
    diseases: [["1", "Hierarchy", []]],
};
const broad = diseaseRows(hierarchy, ["parent"])[0];
assert.equal(broad.denominator, 0.8911); // equal-weight ancestor is removed
assert.equal(broad.numerator, 0.8911); // full annotations match upward
assert.equal(diseaseRows(hierarchy, ["child"])[0].numerator, 0.8911);
assert.equal(diseaseRows(hierarchy, ["grandchild"])[0].numerator, 0.5446);
assert.equal(diseaseRows(hierarchy, ["absent"]).length, 0);
assert.equal(diseaseRows({
    terms: hierarchy.terms,
    associations: { child: [[0, "Very frequent (99-80%)", 0]] },
    diseases: hierarchy.diseases,
}, ["parent"]).length, 0); // the one-term table remains exact
assert.equal(diseaseRows(hierarchy, ["parent"], ["absent"])[0].penaltyWeight, 0);
assert.equal(diseaseRows({
    terms: hierarchy.terms,
    associations: { parent: [[0, "Very frequent (99-80%)", 0]] },
    diseases: hierarchy.diseases,
}, ["child"]).length, 0); // a broader annotation does not match down

for (const [age, expected] of [
    [0, "0"], [0.9, "0"], [1, "1–2"], [2.9, "1–2"],
    [3, "3–5"], [5, "3–5"], [6, "6–9"], [9, "6–9"],
    [10, "10–13"], [13, "10–13"], [14, "14–17"],
    [17, "14–17"], [18, "18+"], [100, "18+"],
    [-1, "Unknown"], [101, "Unknown"], ["n/a", "Unknown"],
    [null, "Unknown"], [true, "Unknown"],
]) assert.equal(ageBand(age), expected);
assert.equal(validAge("100"), 100);
assert.equal(validAge(""), null);

const sortable = [{ id: "B", value: 2 }, { id: "A", value: null }, { id: "C", value: 1 }];
assert.deepEqual(sortTableRows(sortable, { key: "value", dir: "asc" }, { value: (row) => row.value }).map((row) => row.id), ["C", "B", "A"]);
assert.deepEqual(sortTableRows(sortable, { key: "value", dir: "desc" }, { value: (row) => row.value }).map((row) => row.id), ["B", "C", "A"]);
assert.equal(formatStatistic(-0.368), "-0.368");

console.log("Phenotype profile scoring and age bands: passed");
