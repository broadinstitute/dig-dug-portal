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

// Missing values remain last in either direction; comparison never changes
// the release records or the independently pinned/search-result groups.
function sortAssociationRows(rows, key, direction, carrierCount) {
    if (!key) return rows;
    const fields = { beta: 'betaPer0_1Grs', ci: 'betaCiLowPer0_1Grs', p: 'pValue', q: 'qValue' };
    const numeric = value => value == null || value === '' || !Number.isFinite(Number(value)) ? null : Number(value);
    const value = row => key === 'ci' && numeric(row.betaCiHighPer0_1Grs) == null
        ? null : numeric(key === 'carriers' ? carrierCount(row.hpoId) : row[fields[key]]);
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

module.exports = { associationKey, filterAssociations, togglePinnedAssociation, sortAssociationRows };
