let cached = null;
let pending = null;

function hpoAvailability(id, counts, status) {
    if (status !== 'ready' || !counts) return { enabled: false, count: null, reason: status === 'error' ? 'CRDC sample counts unavailable. Retry to check this HPO.' : 'Checking CRDC sample availability…' };
    if (!Object.prototype.hasOwnProperty.call(counts, id)) return { enabled: false, count: null, reason: 'Not available in the CRDC analysis HPO set' };
    const count = counts[id];
    if (!Number.isInteger(count) || count < 0) return { enabled: false, count: null, reason: 'CRDC sample count unavailable' };
    return { enabled: count >= 1, count, reason: count >= 1 ? `${count.toLocaleString()} ${count === 1 ? 'sample' : 'samples'}` : '0 CRDC samples · cannot select' };
}

function validateCrdcHpos(ids, counts, status, label = id => id) {
    if (!ids.length) return;
    if (status !== 'ready' || !counts) throw new Error(status === 'error' ? 'CRDC sample availability could not be checked. Retry before applying this profile.' : 'Wait for CRDC sample availability to finish loading.');
    const unsupported = [...new Set(ids)].filter(id => !hpoAvailability(id, counts, status).enabled);
    if (unsupported.length) throw new Error(`Each HPO must be recorded in at least 1 CRDC sample. Unavailable: ${unsupported.map(id => `${label(id)}${label(id) === id ? '' : ` (${id})`}`).join(', ')}. Remove or replace these terms.`);
}

async function loadCrdcHpoCounts(fetcher) {
    if (cached) return cached;
    if (!pending) pending = (async () => {
        const response = await (fetcher || fetch)('/phenotype-analyzer-api/pb/__pb_phenotype_profile__/hpo-counts');
        if (!response.ok) throw new Error('CRDC sample availability could not be checked. Retry before applying this profile.');
        const result = await response.json();
        if (!result.counts || typeof result.counts !== 'object' || Array.isArray(result.counts) || !Object.keys(result.counts).length || Object.values(result.counts).some(n => !Number.isInteger(n) || n < 0)) throw new Error('CRDC sample availability returned invalid counts. Retry before applying this profile.');
        cached = Object.freeze(result.counts);
        return cached;
    })().finally(() => { pending = null; });
    return pending;
}

async function requireCrdcHpos(ids, label) {
    const counts = await loadCrdcHpoCounts();
    validateCrdcHpos(ids, counts, 'ready', label);
    return counts;
}

module.exports = { hpoAvailability, validateCrdcHpos, loadCrdcHpoCounts, requireCrdcHpos };
