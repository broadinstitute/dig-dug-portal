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
        { gene: "SCN1A", n_q_significant: 7, n_q_significant_by_gene: 1, n_tested_hpos: 5000, n_associations: 1, associations: [{ hpo_id: "HP:0001250", q_significant: true, q_significant_by_gene: false, q_significant_by_hpo: true, q_by_gene: .7,
            positive_direction: true, beta_gene_score_sum_approx: 2, se_gene_score_sum_approx: .5, n_samples: 15574, odds_ratio_approx: 4, ci_lower_approx: Math.exp(1.02),
            ci_upper_approx: Math.exp(2.98), p_value: 0.001, q_by_hpo: 0.01 }] },
        { gene: "NEGATIVE", associations: [{ hpo_id: "HP:0001250", q_significant: true,
            positive_direction: false, odds_ratio_approx: 0.5, q_by_hpo: 0.002 }] },
        { gene: 'LARGE', n_q_significant: 99, n_q_significant_by_gene: 2, associations: Array.from({length: 31}, (_, index) => ({hpo_id: 'HP:' + String(index + 1).padStart(7, '0'), p_value: .0001 + index / 10000, q_by_gene: index < 2 ? .01 : .4, q_by_hpo: .001, q_significant: true, q_significant_by_gene: index < 2, positive_direction: index % 2 === 0})) },
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
    assert.equal(response.payload.associations[0].qValue, .7, 'Gene q uses the gene testing family, not the HPO-wise q');
    assert.equal(response.payload.associations[0].qSignificant, false, 'Legacy HPO significance is not used on Gene');
    assert.equal(response.payload.nQSignificant, 1);
    assert.equal(response.payload.nTestedHpos, 5000);
    await handlers['/__gene_hpo_associations__']({query: {gene: 'LARGE'}}, response);
    assert.equal(response.payload.associations.length, 31, 'All delivered rows are returned without a top-15 cutoff');
    assert.equal(response.payload.associations.filter(row => row.qSignificant).length, 2);
    assert.equal(response.payload.associations.filter(row => !row.positiveDirection).length, 15, 'Negative directions remain in the delivery');
    await handlers['/__gene_hpo_associations__']({query: {gene: 'NEGATIVE'}}, response);
    assert.equal(response.payload.associations[0].qValue, null, 'A missing gene-wise q is not replaced by HPO-wise q');
    const indexedSource = path.join(root, 'complete.jsonl.gz');
    const index = path.join(root, 'hpo-gene.sqlite');
    const complete = Array.from({length: 31}, (_, i) => ({gene: 'GENE' + i, selection_rule: 'p_value_lt_0.05', associations: [{hpo_id:'HP:0001250', gene:'GENE'+i, fit_status:'PASS', beta_gene_score_sum_approx:i % 2 ? -1 : 2, se_gene_score_sum_approx:.5, n_samples:100, n_cases:20, n_controls:80, n_positive_samples:10, p_value:.001+i/10000, q_by_hpo:i<3?.01:.4, q_by_gene:.8, positive_direction:i%2===0, odds_ratio_approx:Math.exp(i%2?-1:2), ci_lower_approx:Math.exp(i%2?-2:1), ci_upper_approx:Math.exp(i%2?0:3)}]}));
    fs.writeFileSync(indexedSource, zlib.gzipSync(complete.map(row=>JSON.stringify(row)).join('\n')+'\n'));
    require('node:child_process').execFileSync('python3',['scripts/pb_hpo_gene_index.py','--source',indexedSource,'--database',index]);
    const previousIndex = process.env.PB_HPO_GENE_INDEX; process.env.PB_HPO_GENE_INDEX=index;
    try {
        await handlers['/__hpo_gene_associations__']({query:{hpo:'HP:0001250',view:'all-genes'}},response);
        assert.equal(response.payload.total,31,'All P<0.05 gene rows must remain, without the old 20-row cap');
        assert.equal(response.payload.associations.length,31);
        assert.equal(response.payload.associations.filter(row=>row.beta<0).length,15,'Both effect directions retained');
        assert.equal(response.payload.associations.filter(row=>row.qValue>=.05).length,28,'P delivery is not silently filtered by q');
        assert.equal(response.payload.associations[0].qValue,.01,'HPO view uses stored q_by_hpo');
        assert.equal(response.payload.associations[0].qByGene,.8,'Original gene q is preserved independently');
        assert.equal(response.payload.associations[0].nCases,20);
        assert.equal(response.payload.associations[0].nPositive,10);
        assert.equal(response.payload.associations[1].betaPer0_1Grs,-.1,'Stored coefficient is scaled, never refitted');
        assert.equal(response.payload.completeDelivery,true);
    } finally { if(previousIndex == null) delete process.env.PB_HPO_GENE_INDEX; else process.env.PB_HPO_GENE_INDEX=previousIndex; }
    fs.unlinkSync(indexedSource); fs.unlinkSync(index);
    fs.unlinkSync(file);
    fs.rmdirSync(root);
    console.log("PB_PHENOTYPE_GENE_ENDPOINT_PASS");
}

main().catch(error => { console.error(error); process.exitCode = 1; });
