// Keep database records separate: overlapping resources are reference links,
// not independent replications or inputs to the CRDC association statistics.
function buildGeneReferenceEvidence(orphanetRows, additionalRows, { multi = false, threshold = 0.1 } = {}) {
    const byGene = Object.create(null), ranks = Object.create(null), seen = Object.create(null);
    for (const disease of [...orphanetRows, ...additionalRows]) {
        if (disease.excludedBy.length) continue;
        const source = disease.source;
        ranks[source] = (ranks[source] || 0) + 1;
        if (source === 'orphanet' && multi && disease.score < threshold) continue;
        const key = `${source}:${disease.code}`;
        const link = Object.freeze({ key, source, code: disease.code, referenceId: disease.referenceId,
            name: disease.name, rank: disease.rank || ranks[source], matchedIds: disease.matchedIds });
        for (const gene of disease.genes) {
            const symbol = String(gene[0] || '').trim().toUpperCase();
            if (!symbol) continue;
            if (!byGene[symbol]) { byGene[symbol] = []; seen[symbol] = new Set(); }
            if (!seen[symbol].has(key)) { byGene[symbol].push(link); seen[symbol].add(key); }
        }
    }
    return byGene;
}

module.exports = { buildGeneReferenceEvidence };
