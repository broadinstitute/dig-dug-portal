function variantFacets(row, lofteeValue, amValue, revelValue) {
    const value = String(row.clinvar || row.classification || '').toLowerCase();
    const clinvar = !value || /unavailable|no assertion|not provided|^—$/.test(value) ? 'No ClinVar'
        : /conflict/.test(value) ? 'Other classification'
        : /pathogenic/.test(value) ? 'P/LP'
        : /uncertain|vus/.test(value) ? 'VUS'
        : /benign/.test(value) ? 'B/LB' : 'Other classification';
    const consequence = /missense/.test(String(row.consequence || '')) ? 'Missense' : 'Other';
    return { clinvar, consequence, loftee: /^(HC|high confidence)$/i.test(String(lofteeValue || '').trim()),
        annotations: [ ...(Number.isFinite(amValue) ? ['AM annotated'] : []), ...(Number.isFinite(revelValue) ? ['REVEL annotated'] : []) ] };
}

function matchesVariantFacets(facets, filters) {
    return (!filters.clinvar.length || filters.clinvar.includes(facets.clinvar)) &&
        (!filters.consequence.length || filters.consequence.includes(facets.consequence)) &&
        (!(filters.annotations || []).length || filters.annotations.some(label => facets.annotations.includes(label))) &&
        (!filters.loftee || facets.loftee);
}

module.exports = { variantFacets, matchesVariantFacets };
