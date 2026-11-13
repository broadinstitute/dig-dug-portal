// Private lookup from the same frozen matrix used by residual PheRS.
// Read on every batch; cache parsed contents only while the file is unchanged.
const fs = require('node:fs');
const path = require('node:path');
module.exports = function createSource(filename = process.env.PB_HPO_TERM_COUNTS_FILE || path.join(__dirname, '../.pb-private-data/rphers/hpo_term_counts.json')) {
    let cached = null, signature = '';
    return function readCounts() {
        try {
            const stat = fs.statSync(filename);
            const current = `${stat.ino}:${stat.size}:${stat.mtimeMs}`;
            if (current === signature && cached) return cached;
            const data = JSON.parse(fs.readFileSync(filename, 'utf8'));
            if (data.version !== 'rphers_matrix_n_terms_v1' || !/^[a-f0-9]{64}$/.test(data.source_matrix_sha256 || '')
                || !data.source_matrix || !data.n_terms_by_sample || !Number.isInteger(data.n_samples)
                || Object.keys(data.n_terms_by_sample).length !== data.n_samples
                || Object.values(data.n_terms_by_sample).some(count => !Number.isInteger(count) || count < 0)) {
                throw new Error('Invalid scoring HPO count source');
            }
            cached = { counts: data.n_terms_by_sample, source: {version:data.version, matrix:data.source_matrix, sha256:data.source_matrix_sha256} };
            signature = current;
            return cached;
        } catch (_) {
            cached = null;
            signature = '';
            return null;
        }
    };
};
