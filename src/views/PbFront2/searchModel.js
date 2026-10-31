// Reuse the existing unified search, with Gene2's entry point and no Sample flow.
const base = require('../PbFront/searchModel');

function resolveSearchTarget(value, selectedKind, geneSymbols) {
    const target = base.resolveSearchTarget(value, selectedKind, geneSymbols);
    if (!target || target.path === '/pb_sample.html') return null;
    return target.path === '/pb_Gene.html' ? { ...target, path: '/pb_gene2.html' } : target;
}

module.exports = { ...base, resolveSearchTarget };
