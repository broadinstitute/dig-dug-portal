// Match identifiers carried by the existing gene release. This is a lookup,
// not transcript conversion, indel realignment, or an external rsID resolver.
const HGVS_FIELDS = {
    hgvscAliases: ['HGVSc', 'hgvsc', 'hgvs_c'],
    hgvspAliases: ['HGVSp', 'hgvsp', 'hgvs_p', 'protein_change'],
    hgvsgAliases: ['HGVSg', 'hgvsg', 'hgvs_g'],
};
const RS_FIELDS = ['rsids', 'rsid', 'rsId', 'rsID', 'rs_dbSNP', 'Existing_variation', 'existing_variation', 'existingVariation', 'dbSNP', 'ID'];
const clean = value => String(value == null ? '' : value).replace(/\s+/g, '').trim();
function strings(value) {
    return Array.isArray(value) ? value.flatMap(strings) : value == null || typeof value === 'object' ? [] : [String(value)];
}
function rsIdentifiers(row) {
    return [...new Set(RS_FIELDS.flatMap(field => strings(row[field]).flatMap(value => value.match(/\brs\d+\b/gi) || [])).map(value => value.toLowerCase()))];
}
function collectVariantIdentifiers(rows) {
    const aliases = {};
    Object.entries(HGVS_FIELDS).forEach(([output, fields]) => {
        aliases[output] = [...new Set(rows.flatMap(row => fields.flatMap(field => strings(row[field])))
            .flatMap(value => value.split(/[&|,]/)).map(value => value.trim()).filter(value => /(?:^|:)[cpgmn]\./i.test(value)))];
    });
    return { ...aliases, rsids: [...new Set(rows.flatMap(rsIdentifiers))] };
}
function splitHgvs(value) {
    const text = clean(value).toLowerCase();
    const separator = text.lastIndexOf(':');
    return { accession: separator < 0 ? '' : text.slice(0, separator), notation: separator < 0 ? text : text.slice(separator + 1) };
}
function sameHgvs(query, candidate) {
    const left = splitHgvs(query), right = splitHgvs(candidate);
    if (left.accession && left.accession !== right.accession) return false;
    if (left.notation === right.notation) return true;
    // A terminal deletion sequence can be omitted by the release, e.g.
    // c.35delG vs c.35del. Coordinates/operation must still match exactly.
    const deletion = /^([cgmn]\.\S+?)del([acgtn]*)$/;
    const a = left.notation.match(deletion);
    const b = right.notation.match(deletion);
    return Boolean(a && b && a[1] === b[1] && (!a[2] || !b[2] || a[2] === b[2]));
}
function canonicalId(value) { return clean(value).replace(/^chr/i, '').toUpperCase(); }
function isExactVariant(value) { return /^(?:chr)?(?:\d{1,2}|X|Y|M|MT):\d+:[ACGTN*.-]+:[ACGTN*.,-]+$/i.test(clean(value)); }
function isHgvs(value) { return /^(?:[a-z0-9_.]+:)?[cpgmn]\..+$/i.test(clean(value)); }

function matchVariantIdentifiers(rows, input) {
    const text = String(input || '').trim();
    const queries = (isExactVariant(text) ? [text] : text.split(/[,;]+/)).map(clean).filter(Boolean);
    if (!queries.length || queries.some(query => !/^rs\d+$/i.test(query) && !isHgvs(query) && !isExactVariant(query))) {
        return { error: 'Enter a position, HGVS notation, exact variant ID, or rsID.', matches: [], unmatched: [] };
    }
    const matched = new Set();
    const matches = rows.filter(row => {
        let rowMatched = false;
        queries.forEach(query => {
        let found;
        if (/^rs\d+$/i.test(query)) found = rsIdentifiers(row).includes(query.toLowerCase());
        else if (isExactVariant(query)) found = canonicalId(query) === canonicalId(row.id);
        else {
            const values = Object.entries(HGVS_FIELDS).flatMap(([output, fields]) => [output, ...fields].flatMap(field => strings(row[field])));
            found = values.some(value => sameHgvs(query, value));
        }
        if (found) matched.add(query);
        rowMatched = rowMatched || found;
        });
        return rowMatched;
    });
    return { matches, unmatched: queries.filter(query => !matched.has(query)) };
}

module.exports = { collectVariantIdentifiers, matchVariantIdentifiers, sameHgvs };
