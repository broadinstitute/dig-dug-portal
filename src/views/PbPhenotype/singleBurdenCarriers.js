// The same opaque analysis-row ID identifies a sample in both supplied sets.
// Display filters, other cohort sources and rPheRS never enter this intersection.
function sampleSet(values, analysisN) {
    if (!Array.isArray(values) || values.some(id => !Number.isInteger(id) || id < 0 || id >= analysisN)) return null;
    const result = new Set(values);
    return result.size === values.length ? result : null;
}

function burdenCarrierCounts(hpoId, rows, membership) {
    const byGene = new Map();
    const observed = rows.filter(row => row.association);
    const counts = field => [...new Set(observed.map(row => row.association[field]))];
    const sizes = counts('nSamples'), cases = counts('nCases');
    const analysisN = sizes.length === 1 && Number.isInteger(sizes[0]) ? sizes[0] : null;
    const nCases = cases.length === 1 && Number.isInteger(cases[0]) ? cases[0] : null;
    const validBundle = membership && membership.schema === 'original-burden-memberships-v1' &&
        typeof membership.cohortId === 'string' && membership.cohortId.startsWith('sha256:') &&
        membership.hpoId === hpoId && membership.analysisN === analysisN && membership.nCases === nCases;
    const hpoSamples = validBundle ? sampleSet(membership.hpoSampleIds, analysisN) : null;
    const validHpo = hpoSamples && hpoSamples.size === nCases;
    for (const row of observed) {
        const all = row.association.nPositive;
        const carrierSamples = validHpo ? sampleSet(membership.geneCarrierSampleIds?.[row.gene], analysisN) : null;
        let withPhenotype = null;
        if (Number.isInteger(all) && all >= 0 && all <= analysisN && carrierSamples && carrierSamples.size === all) {
            withPhenotype = 0;
            for (const id of carrierSamples) if (hpoSamples.has(id)) withPhenotype++;
        }
        byGene.set(row.gene, { all: Number.isInteger(all) && all >= 0 && all <= analysisN ? all : null, withPhenotype });
    }
    return { analysisN, nCases, byGene };
}

module.exports = { burdenCarrierCounts };
