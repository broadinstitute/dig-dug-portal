// The ontology is static. Keep it outside Vue's reactive result tree and build
// normalized search strings once, rather than creating thousands of DOM options.
function createHpoSearchIndex(terms) {
    const byName = Object.create(null);
    const entries = Object.entries(terms).map(([id, term]) => {
        const name = term[0];
        const normalized = name.toLowerCase();
        if (!byName[normalized]) byName[normalized] = id;
        return Object.freeze({ id, name, normalized, normalizedId: id.toLowerCase() });
    });
    return Object.freeze({ entries: Object.freeze(entries), byName: Object.freeze(byName) });
}

function hpoSuggestions(index, query, limit = 30) {
    const text = String(query || '').trim().toLowerCase();
    if (text.length < 2) return [];
    const prefix = [], other = [];
    for (const entry of index.entries) {
        if (entry.normalizedId.startsWith(text) || entry.normalized.startsWith(text)) {
            prefix.push(entry);
            if (prefix.length === limit) break;
        } else if (other.length < limit && entry.normalized.includes(text)) other.push(entry);
    }
    return prefix.concat(other).slice(0, limit);
}

function resolveIndexedHpo(index, query) {
    const text = String(query || '').trim();
    const id = text.match(/^(HP:\d{7})$/i) || text.match(/\[\s*(HP:\d{7})\s*\]$/i);
    return id ? id[1].toUpperCase() : index.byName[text.toLowerCase()] || '';
}

module.exports = { createHpoSearchIndex, hpoSuggestions, resolveIndexedHpo };
