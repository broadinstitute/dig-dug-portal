const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const zlib = require("node:zlib");
const register = require("./gene_hpo_association_endpoint");

async function main() {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "pb-phenotype-gene-"));
    const file = path.join(root, "associations.jsonl.gz");
    const rows = [
        { gene: "SCN1A", associations: [{ hpo_id: "HP:0001250", q_significant: true,
            positive_direction: true, beta_gene_score_sum_approx: 2, se_gene_score_sum_approx: .5, n_samples: 15574, odds_ratio_approx: 4, ci_lower_approx: Math.exp(1.02),
            ci_upper_approx: Math.exp(2.98), p_value: 0.001, q_by_hpo: 0.01 }] },
        { gene: "NEGATIVE", associations: [{ hpo_id: "HP:0001250", q_significant: true,
            positive_direction: false, odds_ratio_approx: 0.5, q_by_hpo: 0.002 }] },
    ];
    fs.writeFileSync(file, zlib.gzipSync(rows.map(row => JSON.stringify(row)).join("\n") + "\n"));
    const handlers = {};
    register({ get(route, handler) { handlers[route] = handler; } }, file);
    const response = {
        statusCode: 200, set() { return this; }, status(code) { this.statusCode = code; return this; },
        json(payload) { this.payload = payload; return this; },
    };
    await handlers["/__hpo_gene_associations__"]({ query: { hpo: "HP:0001250" } }, response);
    assert.equal(response.statusCode, 200);
    assert.equal(response.payload.total, 1);
    assert.equal(response.payload.associations[0].gene, "SCN1A");
    assert.ok(Math.abs(response.payload.associations[0].oddsRatio - Math.pow(4, 0.1)) < 1e-12);
    const association = response.payload.associations[0];
    assert.equal(association.beta, 2);
    assert.equal(association.standardError, .5);
    assert.equal(association.betaPer0_1Grs, .2);
    assert.equal(association.standardErrorPer0_1Grs, .05);
    assert.ok(Math.abs(association.betaCiLowPer0_1Grs - .102) < 1e-12);
    assert.ok(Math.abs(association.betaCiHighPer0_1Grs - .298) < 1e-12);
    assert.equal(association.pValue, .001);
    assert.equal(association.qValue, .01);
    assert.equal(association.nSamples, 15574);
    await handlers["/__gene_hpo_associations__"]({ query: { gene: "SCN1A" } }, response);
    assert.equal(response.payload.associations[0].betaPer0_1Grs, association.betaPer0_1Grs);
    assert.equal(response.payload.associations[0].oddsRatio, 4, 'Existing raw OR remains available');
    fs.unlinkSync(file);
    fs.rmdirSync(root);
    console.log("PB_PHENOTYPE_GENE_ENDPOINT_PASS");
}

main().catch(error => { console.error(error); process.exitCode = 1; });
