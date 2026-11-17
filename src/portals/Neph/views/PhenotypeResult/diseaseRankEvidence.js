import { ancestorsOf } from './singlePhenotypeModel';

// Use the same highest-frequency descendant match as profilesFor() ranking.
export function diseaseRankEvidence(disease, ids, terms) {
    return ids.map(id => {
        const matching = disease.profile.filter(term => term.hpoId === id || ancestorsOf(term.hpoId, terms).has(id));
        const annotation = matching.reduce((best, term) => !best || (term.weight || 0) > (best.weight || 0) ? term : best, null);
        return { id, annotation };
    });
}
