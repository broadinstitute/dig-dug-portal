const assert = require("assert");
const { resolveSearchTarget } = require("./searchModel");

const genes = new Set(["slc6a7"]);

assert.deepStrictEqual(resolveSearchTarget("BCH-22-44945-01", "", genes), {
    path: "/pb_sample.html",
    param: "query",
    value: "BCH-22-44945-01",
});
assert.deepStrictEqual(resolveSearchTarget("CRDC-MOCK-0001", "", genes), {
    path: "/pb_sample.html",
    param: "query",
    value: "CRDC-MOCK-0001",
});

console.log("PB Front sample routing: PASS");
