import { formatRegion } from "./variantSifterSearchUtils.js";

const GENE_ANNOTATION_BATCH_SIZE = 40;

function resolveGenesAnnotationUrl(geneNames, genomeReference) {
    if (!geneNames.length) {
        return null;
    }
    const filter = `gene_name in ${geneNames.map((name) => `'${name}'`).join(",")}`;
    if (genomeReference === "GRCh38") {
        return `https://portaldev.sph.umich.edu/api/v1/annotation/genes/?filter=source in 1 and ${filter}`;
    }
    return `https://portaldev.sph.umich.edu/api/v1/annotation/genes/?filter=source in 3 and ${filter}`;
}

async function fetchGenesAnnotationBatch(geneNames, genomeReference) {
    const url = resolveGenesAnnotationUrl(geneNames, genomeReference);
    if (!url) {
        return [];
    }

    try {
        const genesDataText = await fetch(url).then((resp) => resp.text());
        const genesData = JSON.parse(genesDataText);

        if (genesData?.error != null || !Array.isArray(genesData?.data)) {
            return [];
        }

        return genesData.data;
    } catch (error) {
        console.warn("Variant Sifter gene annotation batch failed", error);
        return [];
    }
}

async function fetchAllGeneAnnotations(geneNames, genomeReference) {
    const uniqueNames = [...new Set(geneNames.filter(Boolean))];
    if (!uniqueNames.length) {
        return [];
    }

    const batches = [];
    for (let index = 0; index < uniqueNames.length; index += GENE_ANNOTATION_BATCH_SIZE) {
        batches.push(uniqueNames.slice(index, index + GENE_ANNOTATION_BATCH_SIZE));
    }

    const batchResults = await Promise.all(
        batches.map((batch) => fetchGenesAnnotationBatch(batch, genomeReference))
    );

    const genesByName = new Map();
    batchResults.flat().forEach((gene) => {
        const name = gene?.gene_name;
        if (name && !genesByName.has(name)) {
            genesByName.set(name, gene);
        }
    });

    return Array.from(genesByName.values()).sort(
        (left, right) => Number(left.start) - Number(right.start)
    );
}

/**
 * Fetch gene track annotation for a genomic region (full locus, not zoom window).
 * Annotation lookups are batched to avoid URL length limits on large loci.
 */
export async function fetchGenesTrackData(
    region,
    genomeReference = "GRCh37",
    host = null
) {
    const regionString = typeof region === "string" ? region : formatRegion(region);
    if (!regionString) {
        return [];
    }

    const bioHost = String(host || "https://bioindex.hugeamp.org").replace(
        /\/+$/,
        ""
    );
    const queryUrl = `${bioHost}/api/bio/query/genes?q=${encodeURIComponent(regionString)}`;

    try {
        const genesText = await fetch(queryUrl).then((resp) => resp.text());
        const genesInRegion = JSON.parse(genesText);

        if (genesInRegion?.error != null || !Array.isArray(genesInRegion?.data)) {
            return [];
        }

        const geneNames = genesInRegion.data.map((gene) => gene.name).filter(Boolean);
        return fetchAllGeneAnnotations(geneNames, genomeReference);
    } catch (error) {
        console.warn("Variant Sifter genes in region query failed", error);
        return [];
    }
}
