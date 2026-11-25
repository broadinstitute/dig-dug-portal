// Confirmed resource wording from External_DB_Provenance_and_Build_Scripts_2026-11-12.md,
// sections 9–10. Resource/snapshot dates are not claimed as download dates.
const catalogLink = id => ({label:'CRDC Data Sources', url:'/pb_sources.html' + (id ? '#' + id : '')});
const source = (label, url, text, {catalogId, ...metadata}) => Object.freeze({
    text, links: [{label, url}, catalogLink(catalogId)], ...metadata,
});
export const GENE_REFERENCE_SOURCES = Object.freeze({
    ddg2p: source('DDG2P', 'https://www.deciphergenomics.org/ddd/ddgenes',
        'Source: DECIPHER Developmental Disorders Gene2Phenotype (DDG2P). Reference snapshot: 2024-11-13.',
        {resourceDate:'2024-11-13', dateType:'snapshot', catalogId:'ddg2p'}),
    panelapp: source('PanelApp', 'https://panelapp.genomicsengland.co.uk/',
        'Source: Genomics England PanelApp. Rare-disease panels selected using pediatric keywords; snapshot: 2026-05-21.',
        {resourceDate:'2026-05-21', dateType:'snapshot', catalogId:'panelapp'}),
    pathways: source('MSigDB C2', 'https://www.gsea-msigdb.org/gsea/msigdb/collections.jsp#C2',
        'Source: MSigDB C2 Reactome and WikiPathways gene sets, release 2026.1.Hs. Retrieved on 2026-05-21.',
        {resourceVersion:'2026.1.Hs', resourceDate:'2026-05-21', dateType:'retrieved', catalogId:'msigdb'}),
});
export const GENE_REFERENCE_PROVENANCE = Object.freeze(Object.fromEntries(
    Object.entries(GENE_REFERENCE_SOURCES).map(([key, value]) => [key, value.text]),
));
const vep = 'https://www.ensembl.org/info/docs/tools/vep/index.html';
const annotationSoftware = 'Ensembl VEP 115.1';
const alphaMissense = source('AlphaMissense', 'https://github.com/google-deepmind/alphamissense',
    'Source: Google DeepMind AlphaMissense precomputed scores (hg38), added through the Ensembl VEP 115.1 AlphaMissense plugin.', {annotationSoftware, catalogId:'alphamissense'});
const revel = source('REVEL', 'https://sites.google.com/site/revelgenomics/downloads',
    'Source: REVEL precomputed missense scores (GRCh38), added through the Ensembl VEP 115.1 REVEL plugin.', {annotationSoftware, catalogId:'revel'});
const loftee = source('LOFTEE', 'https://github.com/konradjk/loftee/tree/grch38',
    'Loss-of-function confidence assigned by the LOFTEE plugin in Ensembl VEP 115.1 (GRCh38). HC: high confidence; LC: low confidence.', {annotationSoftware, catalogId:'loftee'});
export const VARIANT_ANNOTATION_SOURCES = Object.freeze({
    annotation: source('Ensembl VEP', vep,
        'Annotated with Ensembl VEP 115.1 using the release 115 cache (GRCh38.p14; GENCODE 49).',
        {annotationSoftware, resourceVersion:'115', catalogId:'vep'}),
    consequence: source('Ensembl VEP', vep,
        'Predicted by Ensembl VEP 115.1 using the release 115 cache (GRCh38.p14; GENCODE 49).',
        {annotationSoftware, resourceVersion:'115', catalogId:'vep'}),
    clinvar: source('NCBI ClinVar', 'https://www.ncbi.nlm.nih.gov/clinvar/',
        'Source: NCBI ClinVar, GRCh38 VCF dated 2025-08-24. Clinical significance imported through Ensembl VEP 115.1.',
        {annotationSoftware, resourceDate:'2025-08-24', dateType:'vcf_file_date', catalogId:'clinvar'}),
    alphaMissense, revel, loftee,
    gnomadAF: source('gnomAD', 'https://gnomad.broadinstitute.org/',
        'Source: gnomAD exomes v4.1, provided through the Ensembl release 115 cache (GRCh38).',
        {annotationSoftware, resourceVersion:'4.1', catalogId:'gnomad'}),
    predictors: Object.freeze({
        text: [alphaMissense, revel, loftee].map(item => item.text).join('\n\n'),
        links: [alphaMissense, revel, loftee].map(item => item.links[0]).concat(catalogLink()),
    }),
});
