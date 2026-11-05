import {
    applyRegionExpand,
    formatRegion,
    isGeneLookupQuery,
    lookupGeneMatches,
    regionAroundPosition,
    resolveGeneOrVariantToRegion as resolveSharedGeneOrVariantToRegion,
} from "../kpVariantSifter/variantSifterSearchUtils.js";

/**
 * Fetch GRCh38 (hg38) gene track annotations directly from UMich LocusZoom
 * portaldev (`source in 1` = GRCh38) by genomic region bounds.
 */
export async function fetchGp2GenesTrackData(region) {
    if (!region || !region.chr || region.start == null || region.end == null) {
        return [];
    }

    const chrom = String(region.chr).replace(/^chr/i, "");
    const start = Math.max(0, Math.floor(Number(region.start)));
    const end = Math.ceil(Number(region.end));
    if (!chrom || !Number.isFinite(start) || !Number.isFinite(end) || end < start) {
        return [];
    }

    const filter = `source in 1 and chrom eq '${chrom}' and start le ${end} and end ge ${start}`;
    const url = `https://portaldev.sph.umich.edu/api/v1/annotation/genes/?filter=${encodeURIComponent(
        filter
    )}`;

    try {
        const resp = await fetch(url);
        const json = await resp.json();
        if (json?.error != null || !Array.isArray(json?.data)) {
            return [];
        }

        const genesByName = new Map();
        json.data.forEach((gene) => {
            const name = gene?.gene_name;
            if (name && !genesByName.has(name)) {
                genesByName.set(name, gene);
            }
        });

        return Array.from(genesByName.values()).sort(
            (left, right) => Number(left.start) - Number(right.start)
        );
    } catch (error) {
        console.warn("GP2 Browser GRCh38 genes in region query failed", error);
        return [];
    }
}

/**
 * Resolve a gene symbol to its GRCh38 (hg38) coordinates using UMich portaldev (`source in 1`).
 */
export async function lookupGp2GeneRegion(geneSymbol, expandBp = null) {
    const symbol = String(geneSymbol || "").trim();
    if (!symbol) {
        return null;
    }

    const candidates = Array.from(
        new Set([symbol, symbol.toUpperCase()])
    );
    const filter = `source in 1 and gene_name in ${candidates
        .map((name) => `'${name.replace(/'/g, "")}'`)
        .join(",")}`;
    const url = `https://portaldev.sph.umich.edu/api/v1/annotation/genes/?filter=${encodeURIComponent(
        filter
    )}`;

    try {
        const resp = await fetch(url);
        const json = await resp.json();
        const rows = Array.isArray(json?.data) ? json.data : [];
        if (!rows.length) {
            return null;
        }

        const exact =
            rows.find(
                (entry) =>
                    String(entry?.gene_name || "").toLowerCase() ===
                    symbol.toLowerCase()
            ) || rows[0];
        const chr = String(exact?.chrom || "").replace(/^chr/i, "");
        const start = Number(exact?.start);
        const end = Number(exact?.end);
        if (!chr || !Number.isFinite(start) || !Number.isFinite(end)) {
            return null;
        }

        const padding = expandBp != null ? Math.floor(Number(expandBp) / 2) : 50000;
        return {
            chr,
            start: Math.max(0, start - padding),
            end: end + padding,
            gene: exact.gene_name || symbol,
            sourceQuery: symbol,
            sourceType: "gene",
        };
    } catch (error) {
        console.warn("GP2 Browser GRCh38 gene lookup failed", error);
        return null;
    }
}

/**
 * Resolve an rsID (e.g. rs77365039) to its GRCh38 (hg38) chromosome and position
 * using UMich portaldev omnisearch (`build=GRCh38`).
 */
export async function lookupGp2RsIdPosition(rsId, expandBp = null) {
    const trimmed = String(rsId || "").trim();
    if (!/^rs\d+$/i.test(trimmed)) {
        return null;
    }

    const url = `https://portaldev.sph.umich.edu/api/v1/annotation/omnisearch/?q=${encodeURIComponent(
        trimmed
    )}&build=GRCh38`;

    try {
        const resp = await fetch(url);
        const json = await resp.json();
        const rows = Array.isArray(json?.data) ? json.data : [];
        const match = rows.find(
            (entry) => !entry?.error && entry?.chrom && entry?.start != null
        );
        if (!match) {
            return null;
        }
        const chr = String(match.chrom).replace(/^chr/i, "");
        const position = Number(match.start);
        if (!chr || !Number.isFinite(position)) {
            return null;
        }
        const region = regionAroundPosition(chr, position, expandBp || 100000);
        return {
            ...region,
            variant: `${chr}:${position}`,
            sourceQuery: trimmed,
            sourceType: "variant",
        };
    } catch (error) {
        console.warn("GP2 Browser GRCh38 rsID lookup failed", error);
        return null;
    }
}

/**
 * Resolve a gene, variant, chr:position, or chr:start-end query into a GRCh38 region.
 * Resolves gene symbols and rsIDs via GRCh38 (`portaldev`) first before falling back to shared resolution.
 */
export async function resolveGp2GeneOrVariantToRegion(
    query,
    regionUtils,
    expandBp = null,
    host = null
) {
    const trimmed = String(query || "").trim();
    if (!trimmed) {
        return null;
    }

    if (isGeneLookupQuery(trimmed)) {
        const grch38GeneRegion = await lookupGp2GeneRegion(trimmed, expandBp);
        if (grch38GeneRegion) {
            return grch38GeneRegion;
        }
    }

    if (/^rs\d+$/i.test(trimmed)) {
        const grch38RsRegion = await lookupGp2RsIdPosition(trimmed, expandBp);
        if (grch38RsRegion) {
            return grch38RsRegion;
        }
    }

    return resolveSharedGeneOrVariantToRegion(
        trimmed,
        regionUtils,
        expandBp,
        host
    );
}

/**
 * Fetch GRCh38 recombination rate (`id in 16`) from UMich portaldev.
 */
export async function fetchGp2RecombinationRate(region) {
    if (!region?.chr || region.start == null || region.end == null) {
        return null;
    }
    const chrom = String(region.chr).replace(/^chr/i, "");
    const signalURL =
        "https://portaldev.sph.umich.edu/api/v1/annotation/recomb/results/?filter=id in 16 and chromosome eq '" +
        chrom +
        "' and position gt " +
        region.start +
        " and position lt " +
        region.end;

    try {
        const signalJson = await fetch(signalURL).then((response) =>
            response.json()
        );
        if (signalJson?.error != null || !signalJson?.data?.position) {
            return null;
        }

        return {
            position: signalJson.data.position,
            recomb_rate: signalJson.data.recomb_rate,
        };
    } catch (error) {
        console.warn("GP2 Browser GRCh38 recombination rate fetch failed", error);
        return null;
    }
}

export {
    applyRegionExpand,
    formatRegion,
    isGeneLookupQuery,
    lookupGeneMatches,
};
