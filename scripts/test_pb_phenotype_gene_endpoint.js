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
            positive_direction: true, odds_ratio_approx: 4, ci_lower_approx: 2,
            ci_upper_approx: 6, p_value: 0.001, q_by_hpo: 0.01 }] },
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
    fs.unlinkSync(file);
    fs.rmdirSync(root);
    console.log("PB_PHENOTYPE_GENE_ENDPOINT_PASS");
}

main().catch(error => { console.error(error); process.exitCode = 1; });
