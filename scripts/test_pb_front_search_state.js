const assert = require("node:assert/strict");
const fs = require("fs");
const vm = require("vm");

const source = fs
    .readFileSync("src/views/KrFront/pageModel.js", "utf8")
    .replace(/^import .*;\n/gm, "")
    .replace(/export /g, "")
    + "\nglobalThis.frontExports = { createFrontPageState, frontComputed, frontMethods };";

let contextCleared = false;
const context = {
    clearClinicalFocus: () => { contextCleared = true; },
    hasClinicalFocus: () => false,
};
vm.createContext(context);
vm.runInContext(source, context);

const { createFrontPageState, frontComputed, frontMethods } = context.frontExports;
const state = createFrontPageState();
Object.entries(frontComputed).forEach(([name, getter]) => {
    Object.defineProperty(state, name, { get: () => getter.call(state) });
});
Object.entries(frontMethods).forEach(([name, method]) => {
    state[name] = method.bind(state);
});

state.activeMode = "gene";
state.query = "ADCY10";
state.confirmSearchSubject();
assert.equal(state.searchSubjectConfirmed, true);

state.activeMode = "variant";
state.resetSearchSubject();
assert.equal(state.query, "");
assert.equal(state.confirmedSearchKey, "");
assert.equal(state.pendingMessage, "");
assert.equal(state.activeSearchValue, "");

state.confirmSearchSubject();
assert.equal(state.searchSubjectConfirmed, false);
assert.match(state.pendingMessage, /Enter/i);

state.query = "chr1:167822129:C:CT";
state.confirmSearchSubject();
state.resetFront();
assert.equal(state.activeMode, "cohort");
assert.equal(state.query, "");
assert.equal(state.workflowReviewOpen, false);
assert.equal(contextCleared, true);

console.log("PB_FRONT_SEARCH_STATE_PASS");
