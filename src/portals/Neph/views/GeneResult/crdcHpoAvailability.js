// HPO availability checks for the profile inputs.
// This page's data link (BioIndex + the phenotype analyzer service) publishes
// no per-HPO CRDC sample counts, so counts are never available and any HPO
// term known to the ontology can be entered. The analyzer ignores terms it
// holds no data for.

function hpoAvailability(id, counts) {
    if (!counts) return { enabled: true, count: null, reason: '' };
    if (!Object.prototype.hasOwnProperty.call(counts, id)) return { enabled: false, count: null, reason: 'Not available in the CRDC analysis HPO set' };
    const count = counts[id];
    if (!Number.isInteger(count) || count < 0) return { enabled: false, count: null, reason: 'CRDC sample count unavailable' };
    return { enabled: count >= 1, count, reason: count >= 1 ? `${count.toLocaleString()} ${count === 1 ? 'sample' : 'samples'}` : '0 CRDC samples · cannot select' };
}

function validateCrdcHpos() {}

async function loadCrdcHpoCounts() { return null; }

async function requireCrdcHpos(ids) { return ids; }

module.exports = { hpoAvailability, validateCrdcHpos, loadCrdcHpoCounts, requireCrdcHpos };
