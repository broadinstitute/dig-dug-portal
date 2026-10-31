import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync("src/views/PbPhenotype/phenotypeModel.js");
const model = await import(`data:text/javascript;base64,${source.toString("base64")}`);
const { diseaseRows, unweightedDiseaseRows, narrowingTerms, ageBand, validAge, ageExclusionSummary, sexExclusionSummary, sexCategory, cohortSampleSummary, sortTableRows, formatStatistic } = model;

// Front's selected-term URL and direct Phenotype search must resolve identically.
const releaseSource = readFileSync('src/views/PbPhenotype/orphanetReference.generated.js', 'utf8');
const release = JSON.parse(releaseSource.slice(releaseSource.indexOf(' = ') + 3).trim().replace(/;$/, ''));
const frontUrl = new URL('http://localhost/pb_phenotype.html?query=Chest%20tightness%20%5BHP%3A0031352%5D');
assert.equal(release.terms['HP:0031352'][0], 'Chest tightness');
for (const query of [frontUrl.searchParams.get('query'), 'Chest tightness', 'HP:0031352', 'chest tightness [hp:0031352]', 'Chest tightness [ HP:0031352 ]']) {
    assert.deepEqual(model.resolveHpoIds(release, query), ['HP:0031352']);
}
assert.deepEqual(model.resolveHpoIds(release, 'Chest tightness [HP:0031352], Seizure [HP:0001250]; HP:0031352'), ['HP:0031352', 'HP:0001250']);
assert.deepEqual(model.resolveHpoIds(release, 'not a phenotype'), []);

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
const excludedResult = diseaseRows(mockup, query, ["v1", "v2"])[0];
assert.deepEqual(excludedResult.excludedBy, ["v1", "v2"]);
assert.equal(excludedResult.score, result.score); // exclusion removes a row, never lowers its score
assert.equal(diseaseRows(mockup, query, ["v1"]).filter((row) => !row.excludedBy.length).length, 0);

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
assert.deepEqual(diseaseRows(hierarchy, ["parent"], ["absent"])[0].excludedBy, []);
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

const ageSamples = [
    {age: 0, hpo: ["X", "Y"]}, {age: 0.5, hpo: []},
    {age: 2, hpo: ["X"]}, {age: 10, hpo: []},
    {age: 13, hpo: ["Y"]}, {age: 100, hpo: []},
    {age: 101, hpo: ["X"]}, {age: null, hpo: []},
];
const accessors = {ageOf: (row) => row.age, termsOf: (row) => row.hpo};
const beforeAge = ageExclusionSummary(ageSamples, [], accessors);
const afterAge = ageExclusionSummary(ageSamples, ["X", "Y"], accessors);
assert.equal(afterAge.before, 8);
assert.equal(afterAge.excluded, 4); // one sample with both excluded HPOs counts once
assert.equal(afterAge.remaining, 4);
assert.equal(afterAge.knownBefore, 6);
assert.equal(afterAge.knownRemaining, 3);
for (const bin of afterAge.bins) {
    const original = beforeAge.bins.find((item) => item.label === bin.label);
    assert.equal(bin.remaining + bin.excluded, bin.before);
    assert.equal(bin.before, original.before);
    assert.equal(bin.remainingWidth + bin.excludedWidth, original.remainingWidth); // original bar extent remains fixed
}
assert.deepEqual(afterAge.bins.find((bin) => bin.label === "0"), {
    label: "0", before: 2, remaining: 1, excluded: 1, remainingWidth: 50, excludedWidth: 50,
});
assert.equal(afterAge.bins.find((bin) => bin.label === "Unknown").before, 2);
const allRemoved = ageExclusionSummary(ageSamples.slice(0, 1), ["X"], accessors);
assert.equal(allRemoved.bins[0].excludedWidth, 100);
assert.equal(allRemoved.bins[0].remainingWidth, 0);
assert.ok(ageExclusionSummary([], [], accessors).bins.every((bin) => bin.remainingWidth === 0 && bin.excludedWidth === 0));

assert.equal(sexCategory(" F "), "Female");
assert.equal(sexCategory("MALE"), "Male");
assert.equal(sexCategory("unreported"), "Unknown");
const sexSamples = [
    {sex: "Female", hpo: ["X"]}, {sex: "F", hpo: []},
    {sex: "Male", hpo: ["X", "Y"]}, {sex: "male", hpo: []},
    {sex: "unknown", hpo: ["Y"]}, {sex: "", hpo: []},
];
const sexAfter = sexExclusionSummary(sexSamples, ["X", "Y"], {sexOf: row => row.sex, termsOf: row => row.hpo});
assert.equal(sexAfter.before, 6);
assert.equal(sexAfter.remaining, 3);
assert.equal(sexAfter.excluded, 3);
assert.ok(sexAfter.bins.every(bin => bin.before === 2 && bin.remaining === 1 && bin.excluded === 1 && bin.remainingWidth === 50 && bin.excludedWidth === 50));

const cohortSamples = [
    {cohort: "A", age: 0, sex: "F", affected: "Y", score: -1, excluded: true},
    {cohort: "A", age: 10, sex: "M", affected: "N", score: 0},
    {cohort: "A", age: 20, sex: "unknown", affected: "Y", score: 1},
    {cohort: "A", age: 100, sex: "male", affected: "N", score: null},
    {cohort: "B", age: 101, sex: "", affected: "N", score: null},
    {cohort: "B", age: null, sex: "unknown", affected: "N", score: "invalid"},
    {cohort: "B", age: -1, sex: "", affected: "N", score: false},
    {cohort: "C", age: 5, sex: "F", affected: "Y", score: "2.5"},
    {cohort: "D", age: 8, sex: "M", affected: "Y", score: -2},
    {cohort: "D", age: 9, sex: "M", affected: "Y", score: -4},
];
const cohortAccessors = {cohortOf: row => row.cohort, ageOf: row => row.age,
    sexOf: row => row.sex, affectedOf: row => row.affected, scoreOf: row => row.score};
const cohortStats = cohortSampleSummary(cohortSamples, cohortAccessors);
const cohortA = cohortStats.find(row => row.name === "A");
assert.equal(cohortA.total, 4);
assert.equal(cohortA.affected, 2);
assert.equal(cohortA.medianAge, 15);
assert.equal(cohortA.q1Age, 7.5);
assert.equal(cohortA.q3Age, 40);
assert.deepEqual(cohortA.sex, {female: 1, male: 2, unknown: 1});
assert.equal(cohortA.meanResidualPhers, 0); // zero is a measured score, missing scores are not zero
assert.equal(cohortA.phersKnown, 3);
const cohortB = cohortStats.find(row => row.name === "B");
assert.equal(cohortB.ageKnown, 0);
assert.equal(cohortB.medianAge, null);
assert.equal(cohortB.meanResidualPhers, null);
assert.equal(cohortStats.find(row => row.name === "D").meanResidualPhers, -3); // retain negative residuals
assert.equal(cohortSampleSummary(cohortSamples.filter(row => !row.excluded), cohortAccessors).find(row => row.name === "A").meanResidualPhers, 0.5);
assert.ok(cohortStats.every(row => row.sex.female + row.sex.male + row.sex.unknown === row.total));

const sortable = [{ id: "B", value: 2 }, { id: "A", value: null }, { id: "C", value: 1 }];
assert.deepEqual(sortTableRows(sortable, { key: "value", dir: "asc" }, { value: (row) => row.value }).map((row) => row.id), ["C", "B", "A"]);
assert.deepEqual(sortTableRows(sortable, { key: "value", dir: "desc" }, { value: (row) => row.value }).map((row) => row.id), ["B", "C", "A"]);
assert.equal(formatStatistic(-0.368), "-0.368");

const additional = {profiles: [
    ["OMIM:1", "omim", "OMIM:1", "Complete profile", ["child", "grandchild", "a", "b", "c", "d", "e", "f", "child"], ["GENE1"], ["MONDO:0000001"]],
    ["OMIM:2", "omim", "OMIM:2", "Other OMIM", ["child", "other"], [], []],
    ["DECIPHER:1", "decipher", "DECIPHER:1", "Other source", ["child", "decipher-only"], [], []],
]};
const additionalRows = unweightedDiseaseRows(hierarchy, additional, ["parent", "child"]);
const complete = additionalRows.find((row) => row.code === "OMIM:1");
assert.equal(complete.overlapCount, 2); // overlapping parent/child queries count each annotation once
assert.equal(complete.profile.length, 8); // all unique annotations, with no eight-term preview limit
assert.equal(complete.matchedIds.length, 2);
assert.equal(complete.score, null); // no borrowed frequency weights
assert.deepEqual(complete.genes, [["GENE1"]]);
assert.deepEqual(complete.mondoIds, ["MONDO:0000001"]);
assert.ok(unweightedDiseaseRows(hierarchy, additional, ["parent"], ["grandchild"])
    .find((row) => row.code === "OMIM:1").excludedBy.includes("grandchild"));
assert.deepEqual(unweightedDiseaseRows(hierarchy, additional, ["absent"]), []);
const selectedSource = additionalRows.filter((row) => row.source === "omim");
assert.ok(narrowingTerms(selectedSource, ["parent", "child"], []).length > 0);
assert.ok(narrowingTerms(selectedSource, ["parent", "child"], []).every((row) => row.hpoId !== "decipher-only"));
const completeReference = JSON.parse(readFileSync("src/views/PbPhenotype/additionalDiseaseReferences.generated.json", "utf8"));
assert.equal(completeReference.profiles.filter((row) => row[1] === "omim").length, 8592);
assert.equal(completeReference.profiles.filter((row) => row[1] === "decipher").length, 47);
assert.equal(completeReference.profiles.filter((row) => row[1] === "ddg2p").length, 1718);
assert.ok(completeReference.profiles.some((row) => row[4].length > 8));
assert.ok(completeReference.profiles.every((row) => !row[4].includes("HP:0000007"))); // inheritance is not a phenotype

console.log("Phenotype scoring, reference sources, demographic exclusion bars and cohort statistics: passed");
