const assert = require("assert");
const { resolveSearchTarget } = require("./searchModel");

const genes = new Set(["slc6a7"]);

assert.deepStrictEqual(resolveSearchTarget("BCH-00-00000-00", "", genes), {
    path: "/sampleresult.html",
    param: "query",
    value: "BCH-00-00000-00",
});
assert.deepStrictEqual(resolveSearchTarget("CRDC-MOCK-0001", "", genes), {
    path: "/sampleresult.html",
    param: "query",
    value: "CRDC-MOCK-0001",
});

console.log("PB Front sample routing: PASS");
