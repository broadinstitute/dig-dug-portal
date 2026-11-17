function decodeSampleGeneScores(result, requestedIds, allowedGenes = null) {
    const requested = new Set(requestedIds);
    const allowed = allowedGenes ? new Set(allowedGenes) : null;
    const genes = result.genes;
    if (result.score_type !== 'max' || result.definition !== 'existing gene_score > 0' ||
        !Number.isInteger(result.analysis_sample_count) || result.analysis_sample_count < 1 ||
        !Array.isArray(genes) || !genes.length || new Set(genes).size !== genes.length ||
        !Array.isArray(result.available_sample_ids) || !Array.isArray(result.unavailable_sample_ids))
        throw new Error('Unexpected sample gene-score result.');
    const received = [...result.available_sample_ids, ...result.unavailable_sample_ids];
    if (received.length !== requested.size || new Set(received).size !== received.length || received.some(id => !requested.has(id)))
        throw new Error('Sample gene-score coverage does not match the requested samples.');
    const bySample = Object.create(null);
    for (const id of result.available_sample_ids) {
        const indices = (result.sample_gene_indices || {})[id];
        if (!Array.isArray(indices) || indices.some(index => !Number.isInteger(index) || index < 0 || index >= genes.length) || new Set(indices).size !== indices.length)
            throw new Error('Invalid sample gene-score membership.');
        bySample[id] = Object.freeze(indices.filter(index => !allowed || allowed.has(genes[index])));
    }
    return Object.freeze({ genes: Object.freeze([...genes]), bySample: Object.freeze(bySample), analysisSampleCount: result.analysis_sample_count });
}

function summarizeSampleGenes(samples, membership, keyOf, projectOf) {
    const genes = Object.create(null);
    let covered = 0;
    if (membership) for (const sample of samples) {
        const indices = membership.bySample[keyOf(sample)];
        if (!indices) continue;
        covered++;
        const project = projectOf(sample);
        for (const index of indices) {
            const symbol = membership.genes[index];
            if (!genes[symbol]) genes[symbol] = { count: 0, projects: new Set(), unknownProjectCount: 0 };
            genes[symbol].count++;
            if (project && project !== 'Unknown') genes[symbol].projects.add(project);
            else genes[symbol].unknownProjectCount++;
        }
    }
    return { total: samples.length, covered, genes };
}

module.exports = { decodeSampleGeneScores, summarizeSampleGenes };
