import { PB_GENE_EXON_REFERENCE } from "./geneExonReference.generated";

export function getGeneExons(geneSymbol) {
    const key = String(geneSymbol || "").trim().toUpperCase();
    const rows = PB_GENE_EXON_REFERENCE[key] || [];
    return rows.map(row => ({
        chrom: row[0],
        start: row[1],
        end: row[2],
        strand: row[3],
        exonNumber: row[4],
    }));
}
