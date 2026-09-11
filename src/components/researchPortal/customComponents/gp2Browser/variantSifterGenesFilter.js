/** Default gene biotypes shown on the genes track. */
export const VKS_DEFAULT_GENE_TYPES = ["protein_coding"];

export function resolveGeneType(gene) {
    return gene?.gene_type || gene?.type || null;
}

export function formatGeneTypeLabel(geneType) {
    if (!geneType) {
        return "Unknown";
    }
    return String(geneType).replaceAll("_", " ");
}

export function formatGeneRegion(gene, fallbackChr = null) {
    if (!gene) {
        return "";
    }
    const chr = gene.chromosome || gene.chr || fallbackChr || "";
    const start = gene.start;
    const end = gene.end;
    if (start == null || end == null) {
        return "";
    }
    return chr ? `${chr}:${start}-${end}` : `${start}-${end}`;
}

export function collectGeneTypesFromData(genes = []) {
    const types = new Set();
    (genes || []).forEach((gene) => {
        const geneType = resolveGeneType(gene);
        if (geneType) {
            types.add(geneType);
        }
    });
    return types;
}

export function buildGeneTypeOptions(genes = []) {
    return Array.from(collectGeneTypesFromData(genes)).sort((left, right) =>
        formatGeneTypeLabel(left).localeCompare(formatGeneTypeLabel(right))
    );
}

export function normalizeSelectedGeneTypes(selectedTypes) {
    if (!Array.isArray(selectedTypes) || !selectedTypes.length) {
        return [...VKS_DEFAULT_GENE_TYPES];
    }
    return [...new Set(selectedTypes.filter(Boolean))];
}

/** Keep selected types in sync with biotypes present in the loaded genes data. */
export function resolveSelectedGeneTypesForData(selectedTypes, genes = []) {
    const available = buildGeneTypeOptions(genes);
    if (!available.length) {
        return [];
    }

    const normalized = normalizeSelectedGeneTypes(selectedTypes);
    const allowed = normalized.filter((type) => available.includes(type));
    if (allowed.length) {
        return allowed;
    }
    if (available.includes("protein_coding")) {
        return ["protein_coding"];
    }
    return [...available];
}

export function filterGenesByTypes(genes = [], selectedTypes = VKS_DEFAULT_GENE_TYPES) {
    const available = buildGeneTypeOptions(genes);
    const activeTypes = resolveSelectedGeneTypesForData(selectedTypes, genes);
    if (!activeTypes.length || !available.length) {
        return [];
    }
    const allowed = new Set(activeTypes);
    return (genes || []).filter((gene) => allowed.has(resolveGeneType(gene)));
}
