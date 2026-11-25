// A pin keeps a release row visible independently of the current lookup.
// Never recompute, re-rank, or change the release's statistical fields here.
function associationKey(row) { return String(row.hpoId || row.id || ""); }

function filterAssociations(rows, search, pinned = []) {
    const keys = new Set(pinned.map(associationKey));
    const query = String(search || "").trim().toLowerCase();
    return rows.filter(row => !keys.has(associationKey(row)) &&
        (!query || `${row.label || ""} ${associationKey(row)}`.toLowerCase().includes(query)));
}

function togglePinnedAssociation(pinned, row) {
    const key = associationKey(row);
    return pinned.some(item => associationKey(item) === key)
        ? pinned.filter(item => associationKey(item) !== key)
        : [...pinned, { ...row }];
}

function sortAssociationRows(rows, key, direction) {
    if (!key) return rows;
    const fields = { beta: 'betaPer0_1Grs', ci: 'betaCiLowPer0_1Grs', p: 'pValue', q: 'qValue', lambda: 'hpoLambdaGc' };
    const numeric = value => value == null || value === '' || !Number.isFinite(Number(value)) ? null : Number(value);
    const value = row => key === 'ci' && numeric(row.betaCiHighPer0_1Grs) == null
        ? null : key === 'cases' ? associationCaseCount(row) : numeric(row[fields[key]]);
    return rows.map((row, index) => ({ row, index })).sort((a, b) => {
        const av = value(a.row), bv = value(b.row);
        if (av == null || bv == null) return av == null && bv == null ? a.index - b.index : av == null ? 1 : -1;
        let difference = av - bv;
        if (!difference && key === 'ci') {
            const ah = numeric(a.row.betaCiHighPer0_1Grs), bh = numeric(b.row.betaCiHighPer0_1Grs);
            if (ah == null || bh == null) return ah == null && bh == null ? a.index - b.index : ah == null ? 1 : -1;
            difference = ah - bh;
        }
        return difference ? difference * (direction === 'desc' ? -1 : 1) : a.index - b.index;
    }).map(item => item.row);
}

const associationSupportOptions = ['A', 'B', 'C', 'D'];
const associationSupportRules = [
    'A · q < 0.05 and 20+ samples.',
    'B · q < 0.05 and 10–19 samples, or 0.05 ≤ q < 0.10 and 20+ samples.',
    'C · q < 0.05 and 1–9 samples, or 0.05 ≤ q < 0.10 and 1–19 samples.',
    'D · q ≥ 0.10 or zero samples.',
];
const associationSupportHelp = [
    'Grades summarize support for review using the number of samples with this phenotype and the gene-adjusted q-value.',
    ...associationSupportRules,
    'A dash means the count or q-value is missing. P and HPO λ are available as separate context.',
].join('\n\n');

function associationCaseCount(row) {
    const count = row.nCases;
    return Number.isSafeInteger(count) && count >= 0 ? count : null;
}

function associationCaseBand(row) {
    const count = associationCaseCount(row);
    if (count == null) return null;
    if (count >= 20) return '20+';
    if (count >= 10) return '10–19';
    if (count >= 5) return '5–9';
    return count > 0 ? '1–4' : '0';
}

function associationSupport(row) {
    const count = associationCaseCount(row);
    const q = row.qValue;
    if (count == null || !Number.isFinite(q) || q < 0 || q > 1) return null;
    if (count === 0 || q >= .10) return 'D';
    if (q < .05) {
        if (count >= 20) return 'A';
        return count >= 10 ? 'B' : 'C';
    }
    return count >= 20 ? 'B' : 'C';
}

module.exports = { associationKey, filterAssociations, togglePinnedAssociation, sortAssociationRows,
    associationCaseCount, associationCaseBand, associationSupport, associationSupportRules, associationSupportHelp, associationSupportOptions };
