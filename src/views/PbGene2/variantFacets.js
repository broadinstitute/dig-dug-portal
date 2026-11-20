function variantFacets(row, lofteeValue, amValue, revelValue, annotated) {
    const value = String(row.clinvar || row.classification || '').toLowerCase();
    const clinvar = !value || /unavailable|no assertion|not provided|^—$/.test(value) ? 'No ClinVar'
        : /conflict/.test(value) ? 'Conflict'
        : /pathogenic/.test(value) ? 'P/LP'
        : /uncertain|vus/.test(value) ? 'VUS'
        : /benign/.test(value) ? 'B/LB' : String(row.clinvar || row.classification).replace(/_/g, ' ');
    const rawConsequence = String(row.consequence || '').trim();
    const consequence = !rawConsequence || /^(?:unavailable|unknown|n\/?a|[-—])$/i.test(rawConsequence) ? 'Unavailable' : rawConsequence;
    if (annotated === undefined) annotated = Number.isFinite(amValue) || Number.isFinite(revelValue) || Boolean(lofteeValue && !/^(?:unavailable|unknown|n\/?a|[-—])$/i.test(String(lofteeValue).trim()));
    return { clinvar, consequence, predictionCoverage: annotated ? 'Annotated' : 'Not annotated', loftee: /^(HC|high confidence)$/i.test(String(lofteeValue || '').trim()),
        annotations: [ ...(Number.isFinite(amValue) ? ['AM annotated'] : []), ...(Number.isFinite(revelValue) ? ['REVEL annotated'] : []) ] };
}

function matchesVariantFacets(facets, filters) {
    return (!filters.clinvar.length || filters.clinvar.includes(facets.clinvar)) &&
        (!filters.consequence.length || filters.consequence.includes(facets.consequence)) &&
        (!(filters.predictionCoverage || []).length || filters.predictionCoverage.includes(facets.predictionCoverage)) &&
        (!(filters.annotations || []).length || filters.annotations.some(label => facets.annotations.includes(label))) &&
        (!filters.loftee || facets.loftee);
}

module.exports = { variantFacets, matchesVariantFacets };
