const { burdenScoreValue, burdenScoreSource } = require('./variantEvidence');
const { sortedRows } = require('./tableSort');
const RELEASE = '2025_crdc_16366_dp20_af001_20260907';
const missing = value => value == null || ['', '.', '-', '—', 'Unavailable'].includes(String(value).trim());
const variantKey = value => String(value).replace(/^chr/i, '').toUpperCase();
const numeric = value => missing(value) || !Number.isFinite(Number(value)) ? null : Number(value);
const unique = values => [...new Set(values)];
function pathogenic(value) {
    if (missing(value) || /conflict/i.test(value)) return false;
    return String(value).replace(/_/g, ' ').split(/[\/|;,]/).some(part => /^(likely )?pathogenic$/i.test(part.trim()));
}
function normalize(payload) {
    if (!payload || payload.data_version !== RELEASE || payload.genome_build !== 'GRCh38' || !Array.isArray(payload.rows)) throw Error('Comparison requires both complete GRCh38 sample variant lists from the approved processed release.');
    const byGene = new Map(), byVariant = new Map();
    payload.rows.forEach(raw => {
        if (!raw.gene_symbol || !/^chr(?:[0-9]+|X|Y|M|MT):[0-9]+:[ACGTN]+:[ACGTN*,]+$/i.test(raw.variant_id)) throw Error('Invalid gene or variant identity in comparison source.');
        if (raw.sample_id !== payload.sample_id) throw Error('Variant sample ID mismatch.');
        const gene = raw.gene_symbol, key = variantKey(raw.variant_id);
        const scoreRow = { loftee:raw.lof || (raw.score_source === 'LoFTEE_HC' ? 'HC' : null), alphaMissense:raw.alphamissense == null && raw.score_source === 'AlphaMissense' ? raw.pathogenicity_score : raw.alphamissense, revel:raw.revel };
        const row = { key, id:raw.variant_id, gene, gt:missing(raw.gt) || String(raw.gt).includes('.') ? null : raw.gt,
            consequence:missing(raw.consequence) ? null : raw.consequence.split('&').map(part=>part.replace(/_variant$/, '').replace(/_/g, ' ')).join('; '),
            af:numeric(raw.gnomade_af), clinvar:missing(raw.clinvar_sig) ? null : String(raw.clinvar_sig).replace(/_/g, ' '),
            score:burdenScoreValue(scoreRow), scoreSource:burdenScoreSource(scoreRow) };
        if (!byGene.has(gene)) byGene.set(gene,new Map());
        const previous = byGene.get(gene).get(key);
        if (previous) { if (previous.gt !== row.gt) previous.gt = null; return; }
        byGene.get(gene).set(key,row);
        if (!byVariant.has(key)) byVariant.set(key,[]);
        byVariant.get(key).push(row);
    });
    return {byGene,byVariant};
}
function singleValue(rows, key) { const values=unique(rows.map(row=>row[key]).filter(value=>value!=null)); return values.length === 1 ? values[0] : null; }
function buildSharedComparison(reference, candidate, expectedGenes) {
    const a=normalize(reference),b=normalize(candidate);
    const sharedGenes=[...a.byGene.keys()].filter(gene=>b.byGene.has(gene)).sort();
    if (expectedGenes != null && sharedGenes.length !== expectedGenes) throw Error('Shared gene totals differ between the comparison index and variant source. Retry after checking the source release.');
    const counts={},different=[];
    sharedGenes.forEach(gene=>{
        const left=a.byGene.get(gene),right=b.byGene.get(gene);
        counts[gene]=[...left.keys()].filter(id=>right.has(id)).length;
        if (counts[gene]) return;
        const lp=[...left.values()].some(row=>pathogenic(row.clinvar)),rp=[...right.values()].some(row=>pathogenic(row.clinvar));
        const hasAnnotation=[...left.values(),...right.values()].some(row=>row.clinvar!=null);
        const plp=lp&&rp?'both':lp?'reference':rp?'candidate':hasAnnotation?'none':'unavailable';
        different.push({gene,referenceCount:left.size,candidateCount:right.size,plp,plpOrder:{both:3,reference:2,candidate:1,none:0,unavailable:null}[plp]});
    });
    const identical=[];
    a.byVariant.forEach((left,id)=>{
        const right=b.byVariant.get(id);if(!right)return;
        const genes=unique([...left,...right].map(row=>row.gene)).sort();
        if (genes.some(gene=>!counts[gene])) throw Error('Inconsistent gene membership for an identical variant.');
        const rows=[...left,...right], clinical=unique(rows.map(row=>row.clinvar).filter(Boolean));
        const scores=unique(rows.filter(row=>row.score!=null).map(row=>`${row.score}|${row.scoreSource}`));
        identical.push({id:left[0].id,key:id,genes,gene:genes.join(', '),geneCounts:genes.map(gene=>({gene,count:counts[gene]})),sharedCount:Math.max(...genes.map(gene=>counts[gene])),
            referenceGt: left.every(row=>row.gt!=null)?singleValue(left,'gt'):null,candidateGt:right.every(row=>row.gt!=null)?singleValue(right,'gt'):null,
            consequence:unique(rows.map(row=>row.consequence).filter(Boolean)).join('; ') || null,
            af:singleValue(rows,'af'),clinvar:clinical.length>1?'Conflict':clinical[0]||null,
            score:scores.length===1?Number(scores[0].split('|')[0]):null,
            scoreSource:scores.length>1?'varies':scores.length===1?scores[0].split('|')[1]:'none'});
    });
    return {totalGenes:sharedGenes.length,identicalGenes:sharedGenes.length-different.length,differentGenes:different.length,identical,different};
}
function comparisonRows(rows, sort) {
    const baseline=[...rows].sort((a,b)=>a.gene.localeCompare(b.gene,undefined,{numeric:true}) || String(a.id||'').localeCompare(String(b.id||''),undefined,{numeric:true}));
    return sortedRows(baseline,sort);
}
function visibleVariantRows(rows,page,size=5) {
    const visible=rows.slice((page-1)*size,page*size).map(row=>({...row,geneSpan:1}));
    for(let i=0;i<visible.length;i++) {
        let j=i+1;while(j<visible.length&&visible[j].gene===visible[i].gene){visible[i].geneSpan++;visible[j].geneSpan=0;j++;}i=j-1;
    }
    return visible;
}
module.exports={buildSharedComparison,comparisonRows,visibleVariantRows,pathogenic};
