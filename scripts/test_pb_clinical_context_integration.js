const assert = require("node:assert/strict");
const fs = require("fs");

const read = (path) => fs.readFileSync(path, "utf8");
const front = read("src/views/KrFront/Template.vue");
const focus = read("src/views/KrClinicalFocus/ClinicalFocusBar.vue");
const geneTemplate = read("src/views/PbGene/Template.vue");
const geneModel = read("src/views/PbGene/pageModel.js");
const variantTemplate = read("src/views/PbVariant/Template.vue");
const variantModel = read("src/views/PbVariant/pageModel.js");
const frontModel = read("src/views/KrFront/pageModel.js");

assert.match(front, /class="glens-purpose-workflows"/);
assert.match(front, /Reset all/);
assert.match(front, /Clear HPO/);
assert.match(front, /persists across PB pages/);
const reviewStep = front.slice(
    front.indexOf('<section class="glens-workflow-step glens-workflow-step--review">'),
    front.indexOf("</section>", front.indexOf('<section class="glens-workflow-step glens-workflow-step--review">')),
);
assert.match(reviewStep, /class="glens-reset-all"/);
assert.match(front, /class="glens-workflow-step glens-workflow-step--search"/);
assert.match(front, /\.glens-workflow-step--search\.glens-workflow-step--complete/);
assert.match(front, />Set<\/button>/);
assert.match(front, /glens-workflow-step--complete/);
assert.match(frontModel, /chr12:102912793:CA:C/);
assert.match(frontModel, /resetSearchSubject/);
assert.doesNotMatch(frontModel, /chr5:150203773:T:A/);
assert.match(focus, /class="glens-clinical-focus-editor-grid"/);
assert.match(focus, /type="checkbox"/);
assert.match(focus, /selectAllTerms/);
assert.match(focus, /selectNoTerms/);
assert.match(focus, /allowedSource \? focus\.source : "orphanet"/);
assert.match(focus, /@keyup\.enter\.prevent="addFirstHpoSearchResult"/);
assert.match(focus, />\s*Add term\s*<\/button>/);

for (const source of [geneTemplate, variantTemplate]) {
    assert.match(source, /href="\/pb_Front\.html"/);
    assert.match(source, /contextTermDetails/);
}
for (const source of [geneModel, variantModel]) {
    assert.match(source, /readClinicalFocus/);
    assert.match(source, /initialContextTerms/);
}
assert.doesNotMatch(variantModel, /this\.activeContextTerms = \[\]/);
assert.match(variantModel, /pbv-evidence--pathogenic/);
assert.match(variantModel, /pbv-evidence--likely-pathogenic/);
assert.match(variantModel, /pbv-evidence--vus/);
assert.match(variantTemplate, /Choose gene context/);

console.log("PB_CLINICAL_CONTEXT_INTEGRATION_TEST_PASS");
