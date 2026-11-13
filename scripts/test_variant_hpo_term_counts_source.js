const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const assert = require('node:assert/strict');
const createSource = require('./variant_hpo_term_counts_source');
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'pb-n-terms-test-'));
const filename = path.join(directory, 'counts.json');
const payload = {version:'rphers_matrix_n_terms_v1',source_matrix:'approved.tsv.gz',source_matrix_sha256:'a'.repeat(64),n_samples:2,n_terms_by_sample:{A:98,B:0}};
function replace(value) {
    fs.writeFileSync(filename + '.next', JSON.stringify(value));
    fs.renameSync(filename + '.next', filename);
}
try {
    const read = createSource(filename);
    assert.equal(read(),null,'missing source stays unavailable');
    replace(payload);
    assert.deepEqual(read().counts,{A:98,B:0});
    const first = read();
    assert.equal(read(),first,'unchanged input reuses parsed lookup');
    replace({...payload,n_terms_by_sample:{A:101,B:0}});
    assert.equal(read().counts.A,101,'subsequent batches must load a replaced release file');
    replace({...payload,n_terms_by_sample:{A:-1,B:0}});
    assert.equal(read(),null,'invalid source cannot leave old values active');
    replace({...payload,source_matrix_sha256:''});
    assert.equal(read(),null,'counts require input provenance');
    console.log('PB_VARIANT_PERSISTENT_SCORING_HPO_COUNTS_SOURCE_PASS');
} finally { fs.rmSync(directory,{recursive:true,force:true}); }
