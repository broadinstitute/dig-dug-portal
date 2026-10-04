import { PB_GENE_ID_REFERENCE } from "../PbGene/geneIdReference.generated";
import { getGeneReferenceAnnotation } from "../PbGene/geneAnnotationReference";
import { getGeneExons } from "../PbGene/geneExonReference";

const EMPTY_ANNOTATION = {
    ddg2p: { support: false },
    panelapp: { greenSupport: false },
    pathways: { count: 0, displayNames: [], allNames: [], items: [], moreCount: 0 },
};

export function publicGeneReference(symbol) {
    const gene = String(symbol || "").trim().toUpperCase();
    const ids = PB_GENE_ID_REFERENCE[gene];
    const exons = getGeneExons(gene);
    const annotation = getGeneReferenceAnnotation(gene);
    const known = Boolean(ids || exons.length || annotation);
    const start = exons.length ? Math.min(...exons.map(row => Number(row.start))) : null;
    const end = exons.length ? Math.max(...exons.map(row => Number(row.end))) : null;
    const chrom = exons[0] ? String(exons[0].chrom).replace(/^chr/i, "") : "";
    const span = Number.isFinite(start) && Number.isFinite(end) ? Math.max(end - start, 1) : 1;

    return {
        known,
        geneInfo: {
            symbol: gene || "No gene selected",
            fullName: gene || "Unavailable",
            description: "",
            location: chrom && start != null && end != null
                ? `chr${chrom}:${start.toLocaleString()}-${end.toLocaleString()}`
                : "Genomic location unavailable",
            cytogeneticLocation: "",
            chromosome: chrom,
            strand: exons[0] && Number(exons[0].strand) < 0 ? "-" : "+",
            build: "GRCh38",
            ensemblId: ids && ids[0] || "Unavailable",
            omim: ids && ids[1] || "Unavailable",
            refseqAccession: ids && ids[2] || "Unavailable",
            maneSelect: ids && ids[3] || "Unavailable",
            referenceAnnotation: annotation || EMPTY_ANNOTATION,
        },
        genomeWindow: {
            axisTicks: exons.length ? Array.from({ length: 6 }, (_, index) => ({
                label: (start + Math.round((span * index) / 5)).toLocaleString(),
                left: `${index * 20}%`,
            })) : [],
            exons: exons.map((row, index) => ({
                label: `E${row.exonNumber || index + 1}`,
                left: `${(((Number(row.start) - start) / span) * 100).toFixed(2)}%`,
                width: `${Math.max(((Number(row.end) - Number(row.start)) / span) * 100, 0.3).toFixed(2)}%`,
                start: Number(row.start),
                end: Number(row.end),
                sequence: "",
            })),
            markers: [],
            densityAll: Array(120).fill(0),
            densityProband: Array(120).fill(0),
            queryDensityIndex: 0,
        },
    };
}
