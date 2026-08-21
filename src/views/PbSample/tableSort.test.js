const assert = require("assert");
const { sortedRows } = require("./tableSort");

const rows = [
    { rank: 2, sampleId: "BCH-10", age: 8 },
    { rank: 1, sampleId: "BCH-2", age: 19 },
    { rank: 3, sampleId: "BCH-1", age: 8 },
];

assert.deepStrictEqual(sortedRows(rows, { key: "age", direction: "asc" }).map((row) => row.rank), [2, 3, 1]);
assert.deepStrictEqual(sortedRows(rows, { key: "sampleId", direction: "desc" }).map((row) => row.rank), [2, 1, 3]);
assert.deepStrictEqual(rows.map((row) => row.rank), [2, 1, 3]);
console.log("PB Sample table sorting: PASS");
