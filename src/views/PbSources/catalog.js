import { GENE_REFERENCE_SOURCES, VARIANT_ANNOTATION_SOURCES } from '../PbGene2/referenceProvenance';

const hpoReleases = 'https://github.com/obophenotype/human-phenotype-ontology/releases';
const hpoLicense = 'https://github.com/obophenotype/human-phenotype-ontology/blob/master/LICENSE.md';
const decipher = 'https://www.deciphergenomics.org/';
const orphadata = 'https://sciences.orphadata.com/';

const download = (label, url) => ({ label, url });

export const resources = [
    {
        id: 'hpo', name: 'Human Phenotype Ontology',
        use: 'Phenotype terms and hierarchy',
        version: 'Release · 2026-09-01',
        download: download('hp.obo', hpoReleases + '/download/v2026-09-01/hp.obo'),
        terms: hpoLicense,
    },
    {
        id: 'vep', name: 'Ensembl VEP',
        use: 'Variant consequences and transcript annotation',
        version: VARIANT_ANNOTATION_SOURCES.annotation.annotationSoftware.replace('Ensembl VEP ', '')
            + ' · cache ' + VARIANT_ANNOTATION_SOURCES.annotation.resourceVersion,
        detail: 'GRCh38.p14 · GENCODE 49',
        download: download('Release 115 cache files', 'https://sep2025.archive.ensembl.org/info/docs/tools/vep/script/vep_cache.html'),
        terms: 'https://www.ensembl.org/info/about/legal/disclaimer.html',
    },
    {
        id: 'clinvar', name: 'ClinVar',
        use: 'Clinical significance',
        version: 'VCF · ' + VARIANT_ANNOTATION_SOURCES.clinvar.resourceDate,
        detail: 'GRCh38',
        download: download('Publisher downloads', 'https://www.ncbi.nlm.nih.gov/clinvar/docs/downloads/'),
        terms: 'https://www.ncbi.nlm.nih.gov/home/about/policies/',
    },
    {
        id: 'gnomad', name: 'gnomAD exomes',
        use: 'Population allele frequencies',
        version: 'v' + VARIANT_ANNOTATION_SOURCES.gnomadAF.resourceVersion,
        download: download('v4.1 downloads', 'https://gnomad.broadinstitute.org/downloads#v4-1'),
        terms: 'https://gnomad.broadinstitute.org/terms',
    },
    {
        id: 'ddg2p', name: 'DDG2P',
        use: 'Curated gene–disease evidence',
        version: 'Gene snapshot · ' + GENE_REFERENCE_SOURCES.ddg2p.resourceDate,
        detail: 'Phenotype bundle release unrecorded',
        download: download('Publisher data access', 'https://www.ddduk.org/accessing-ddd-data/'),
    },
    {
        id: 'panelapp', name: 'PanelApp',
        use: 'Rare disease gene panels',
        version: 'Snapshot · ' + GENE_REFERENCE_SOURCES.panelapp.resourceDate,
        download: download('Publisher API and exports', 'https://panelapp.genomicsengland.co.uk/api/docs/'),
    },
    {
        id: 'hpo-annotations', name: 'HPO disease annotations',
        use: 'OMIM and DECIPHER phenotype associations',
        version: 'HPOA snapshot · 2026-02-16',
        download: download('Release files', hpoReleases + '/tag/v2026-02-16'),
        terms: hpoLicense,
    },
    {
        id: 'orphanet', name: 'Orphanet / Orphadata',
        use: 'Rare disease links to genes and phenotypes',
        version: 'XML version 1.3.42 / 4.1.8',
        detail: 'File metadata dated 2026-06-23',
        download: download('Phenotype data', orphadata + 'phenotypes/'),
        extraDownload: download('Gene data', orphadata + 'genes/'),
        terms: orphadata + 'legal-notice/',
    },
    {
        id: 'msigdb', name: 'MSigDB C2',
        use: 'Reactome and WikiPathways gene sets',
        version: GENE_REFERENCE_SOURCES.pathways.resourceVersion,
        detail: 'Retrieved ' + GENE_REFERENCE_SOURCES.pathways.resourceDate,
        download: download('Human gene set collections', GENE_REFERENCE_SOURCES.pathways.links[0].url),
        terms: 'https://www.gsea-msigdb.org/gsea/msigdb_license_terms.jsp',
    },
    {
        id: 'alphamissense', name: 'AlphaMissense',
        use: 'Missense prediction scores (GRCh38)',
        version: 'Source release unrecorded',
        detail: 'Added through ' + VARIANT_ANNOTATION_SOURCES.alphaMissense.annotationSoftware,
        download: download('Publisher downloads', 'https://github.com/google-deepmind/alphamissense#predictions'),
        terms: 'https://github.com/google-deepmind/alphamissense#alphamissense-predictions-license',
    },
    {
        id: 'revel', name: 'REVEL',
        use: 'Missense prediction scores (GRCh38)',
        version: 'Source release unrecorded',
        detail: 'Added through ' + VARIANT_ANNOTATION_SOURCES.revel.annotationSoftware,
        download: download('Publisher downloads', VARIANT_ANNOTATION_SOURCES.revel.links[0].url),
    },
    {
        id: 'loftee', name: 'LOFTEE',
        use: 'Loss-of-function confidence (GRCh38)',
        version: 'Plugin revision unrecorded',
        detail: 'Used with ' + VARIANT_ANNOTATION_SOURCES.loftee.annotationSoftware,
        download: download('Publisher repository', VARIANT_ANNOTATION_SOURCES.loftee.links[0].url),
    },
];
