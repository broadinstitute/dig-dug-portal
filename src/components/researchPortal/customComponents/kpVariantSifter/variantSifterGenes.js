import { formatRegion } from "./variantSifterSearchUtils.js";

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

/**
 * Fetch gene track annotation for a genomic region (full locus, not zoom window).
 * Mirrors ResearchGenesTrack lookup so zoom/pan only filters at render time.
 */
export async function fetchGenesTrackData(region, genomeReference = "GRCh37") {
    const regionString = typeof region === "string" ? region : formatRegion(region);
    if (!regionString) {
        return [];
    }

    const queryUrl = `https://bioindex.hugeamp.org/api/bio/query/genes?q=${encodeURIComponent(regionString)}`;
    const genesText = await fetch(queryUrl).then((resp) => resp.text());
    const genesInRegion = JSON.parse(genesText);

    if (genesInRegion?.error != null || !Array.isArray(genesInRegion?.data)) {
        return [];
    }

    const geneNames = genesInRegion.data.map((gene) => gene.name).filter(Boolean);

    const annotationUrl = resolveGenesAnnotationUrl(geneNames, genomeReference);
    if (!annotationUrl) {
        return [];
    }

    const genesDataText = await fetch(annotationUrl).then((resp) => resp.text());
    const genesData = JSON.parse(genesDataText);

    if (genesData?.error != null || !Array.isArray(genesData?.data)) {
        return [];
    }

    return genesData.data;
}
