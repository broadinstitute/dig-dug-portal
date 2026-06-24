import { BIO_INDEX_HOST } from "@/utils/bioIndexUtils";
import variantUtils from "@/utils/variantUtils";

export const REGION_EXPAND_OPTIONS = [
    { value: null, label: "Gene / variant bounds only" },
    { value: 50000, label: "± 50 kb" },
    { value: 100000, label: "± 100 kb" },
    { value: 150000, label: "± 150 kb" },
];

const REGION_RANGE_REGEXP =
    /^(?:chr)?(1\d?|2[0-2]?|[3-9]|x|y|xy|mt?)[:_](\d+)\s*-\s*(\d+)$/i;

function isRegionRangeQuery(query) {
    return REGION_RANGE_REGEXP.test(query.trim().replace(/,/g, ""));
}

function isVariantQuery(query) {
    const trimmed = query.trim();
    return (
        /^rs\d+/i.test(trimmed) ||
        variantUtils.parseVariant(trimmed) != null ||
        (/[:_]/.test(trimmed) && /\d/.test(trimmed) && !isRegionRangeQuery(trimmed))
    );
}

async function lookupVariantPosition(variantQuery) {
    let parsed = variantUtils.parseVariant(variantQuery.trim());
    if (!parsed && /^rs\d+/i.test(variantQuery.trim())) {
        parsed = variantQuery.trim();
    }
    if (!parsed) {
        return null;
    }

    if (parsed.startsWith("rs")) {
        const json = await fetch(
            `${BIO_INDEX_HOST}/api/bio/varIdLookup/${parsed}`
        ).then((resp) => resp.json());
        if (!json?.data?.varid) {
            return null;
        }
        parsed = json.data.varid;
    }

    const [chr, pos] = parsed.split(":");
    const position = parseInt(pos, 10);
    if (!chr || Number.isNaN(position)) {
        return null;
    }

    return { chr, position, varId: parsed };
}

export function applyRegionExpand(region, expandBp) {
    if (!region || !expandBp) {
        return region;
    }

    const half = Math.floor(expandBp / 2);
    return {
        ...region,
        start: Math.max(0, region.start - half),
        end: region.end + half,
    };
}

export function regionAroundPosition(chr, position, expandBp) {
    const half = expandBp ? Math.floor(expandBp / 2) : 50000;
    return {
        chr,
        start: Math.max(0, position - half),
        end: position + half,
    };
}

function parseRegionRange(query) {
    const match = query.trim().replace(/,/g, "").match(REGION_RANGE_REGEXP);
    if (!match) {
        return null;
    }

    const start = parseInt(match[2], 10);
    const end = parseInt(match[3], 10);
    if (Number.isNaN(start) || Number.isNaN(end) || end <= start) {
        return null;
    }

    return {
        chr: match[1],
        start,
        end,
    };
}

/**
 * Resolve a gene, variant, or chr:start-end string into a locus region.
 * Gene and variant queries are converted to regions; optional expandBp widens further.
 */
export async function resolveGeneOrVariantToRegion(
    query,
    regionUtils,
    expandBp = null
) {
    const trimmed = String(query || "").trim();
    if (!trimmed) {
        return null;
    }

    if (isRegionRangeQuery(trimmed)) {
        const region = parseRegionRange(trimmed);
        return applyRegionExpand(
            { ...region, sourceQuery: trimmed, sourceType: "region" },
            expandBp
        );
    }

    if (isVariantQuery(trimmed)) {
        const variantPos = await lookupVariantPosition(trimmed);
        if (!variantPos) {
            return null;
        }

        const baseExpand = expandBp || 100000;
        const region = regionAroundPosition(
            variantPos.chr,
            variantPos.position,
            baseExpand
        );
        return {
            ...region,
            variant: variantPos.varId,
            sourceQuery: trimmed,
            sourceType: "variant",
        };
    }

    const genePadding = expandBp ? expandBp / 2 : 50000;
    const region = await regionUtils.parseRegion(trimmed, true, genePadding);
    if (!region) {
        return null;
    }

    return {
        ...region,
        sourceQuery: trimmed,
        sourceType: region.gene ? "gene" : "region",
    };
}

export function formatRegion(region) {
    if (!region) {
        return "";
    }
    return `${region.chr}:${region.start}-${region.end}`;
}

export function parseRegionParam(regionParam) {
    if (!regionParam) {
        return null;
    }

    const text = String(regionParam).trim();
    if (isRegionRangeQuery(text)) {
        return parseRegionRange(text);
    }

    const colonSplit = text.split(":");
    if (colonSplit.length !== 2) {
        return null;
    }

    const range = colonSplit[1].split("-");
    if (range.length !== 2) {
        return null;
    }

    const start = parseInt(range[0], 10);
    const end = parseInt(range[1], 10);
    if (Number.isNaN(start) || Number.isNaN(end)) {
        return null;
    }

    return {
        chr: colonSplit[0].replace(/^chr/i, ""),
        start,
        end,
        sourceQuery: text,
        sourceType: "region",
    };
}

export function filterPhenotypes(phenotypes, query, limit = 12) {
    if (!Array.isArray(phenotypes) || phenotypes.length === 0) {
        return [];
    }

    const trimmed = String(query || "").trim().toLowerCase();
    if (!trimmed) {
        return phenotypes.slice(0, limit);
    }

    const words = trimmed.split(/\s+/).filter(Boolean);
    const matches = phenotypes.filter((phenotype) => {
        const haystack = `${phenotype.name} ${phenotype.description || ""}`.toLowerCase();
        return words.every((word) => haystack.includes(word));
    });

    return matches
        .sort((a, b) => a.description.length - b.description.length)
        .slice(0, limit);
}
