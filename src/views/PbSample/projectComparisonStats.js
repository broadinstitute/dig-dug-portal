function numeric(values) { return values.filter(value => typeof value === 'number' && Number.isFinite(value)); }
function quantile(sorted, probability) {
    if (!sorted.length) return null;
    const at = (sorted.length - 1) * probability, low = Math.floor(at);
    return sorted[low] + (sorted[Math.ceil(at)] - sorted[low]) * (at - low);
}
function summary(rows, key) {
    const values = numeric(rows.map(row => row[key])).sort((a,b) => a-b);
    return {n:values.length, median:quantile(values,.5), q1:quantile(values,.25), q3:quantile(values,.75)};
}
function projectComparison(rows) {
    const distribution = new Map();
    for (const row of rows) {
        const value = typeof row.matchedHpo === 'number' && Number.isFinite(row.matchedHpo) ? row.matchedHpo : null;
        distribution.set(value,(distribution.get(value)||0)+1);
    }
    return { total:rows.length, phenotypeAvailable:numeric(rows.map(row=>row.rphersZ)).length,
        genotypeAvailable:numeric(rows.map(row=>row.sharedGenes)).length,
        withSharedVariants:rows.filter(row=>typeof row.sharedVariants==='number' && row.sharedVariants>0).length,
        metrics:[['Recorded HPO','recordedHpoCount'],['rPheRS Z-score','rphersZ'],['Shared genes','sharedGenes'],['Shared variants','sharedVariants']]
            .map(([label,key])=>({label,key,...summary(rows,key)})),
        matchedDistribution:[...distribution].sort(([a],[b])=>a==null?1:b==null?-1:b-a)
            .map(([matched,n])=>({matched,n,percentage:rows.length?100*n/rows.length:0})) };
}
module.exports = { projectComparison };
