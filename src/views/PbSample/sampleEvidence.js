const { canonicalSampleId } = require('./sampleRecord');

async function requestSampleEvidence(route, sampleId) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 180000);
    try {
        const response = await fetch(`/__pb_phenotype_profile__/${route}`, { method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sample_id: canonicalSampleId(sampleId) }), signal: controller.signal });
        const raw = await response.text();
        let result;
        try { result = JSON.parse(raw); }
        catch (_) { throw Error('Sample analysis service is temporarily unavailable. Please retry.'); }
        if (!response.ok) throw Error(result.detail || 'Sample analysis failed.');
        if (result.sample_id !== canonicalSampleId(sampleId)) throw Error('Sample response ID mismatch.');
        return result;
    } finally { clearTimeout(timer); }
}

function sampleVariantRows(rows) {
    const variants = new Map();
    for (const row of rows) {
        const key = `${row.gene_symbol}|${row.variant_id}`;
        if (variants.has(key)) {
            if (variants.get(key).genotype !== row.gt) throw Error('Conflicting sample genotypes in processed source.');
            continue;
        }
        variants.set(key, { id: row.variant_id, gene: row.gene_symbol, genotype: row.gt || 'Unavailable',
            consequence: row.consequence || 'Unavailable', clinvar: row.clinvar_sig || 'Unavailable',
            crdcAlleleFrequency: row.cohort_af_dp20 == null ? 'Unavailable' : row.cohort_af_dp20,
            loftee: row.lof || (row.score_source === 'LoFTEE_HC' ? 'HC' : null),
            alphaMissense: row.alphamissense == null && row.score_source === 'AlphaMissense' ? row.pathogenicity_score : row.alphamissense,
            revel: row.revel == null && row.score_source === 'REVEL' ? row.pathogenicity_score : row.revel });
    }
    return [...variants.values()];
}
module.exports = { requestSampleEvidence, sampleVariantRows };
