const GENOTYPES = Object.freeze([
    {value: 'homozygous', label: 'Homozygous'},
    {value: 'heterozygous', label: 'Hetero'},
    {value: 'unknown', label: 'Unknown'},
]);
const allGenotypes = () => GENOTYPES.map(option => option.value);

function genotypeGroup(record) {
    const gt = String(record.genotype || record.gt || '').trim();
    if (!/^\d+[/|]\d+$/.test(gt)) return 'unknown';
    const [a, b] = gt.split(/[/|]/).map(Number);
    if (a === b) return a > 0 ? 'homozygous' : 'unknown';
    return 'heterozygous';
}

function selectGenotypeCarriers(records, selection) {
    const selected = new Set(selection);
    return records.filter(record => selected.has(genotypeGroup(record)));
}

function matchesSampleScope(result, ids) {
    const returned = result && result.sample_scope && result.sample_scope.sample_ids;
    return Array.isArray(returned) && JSON.stringify([...returned].sort()) === JSON.stringify([...new Set(ids)].sort());
}

module.exports = {GENOTYPES, allGenotypes, genotypeGroup, selectGenotypeCarriers, matchesSampleScope};
