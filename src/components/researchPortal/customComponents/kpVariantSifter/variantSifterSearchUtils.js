import { BIO_INDEX_HOST, match } from "@/utils/bioIndexUtils";
import variantUtils from "@/utils/variantUtils";

export const VARIANT_SIFTER_ANCESTRY_OPTIONS = [
    "Mixed",
    "EU",
    "EA",
    "SA",
    "AA",
    "HS",
    "SSAF",
];

export const VARIANT_SIFTER_ANCESTRY_LABELS = {
    ABA: "Aboriginal Australian",
    AA: "African American or Afro-Caribbean",
    AF: "African unspecified",
    SSAF: "Sub-Saharan African",
    ASUN: "Asian unspecified",
    CA: "Central Asian",
    EA: "East Asian",
    SA: "South Asian",
    SEA: "South East Asian",
    EU: "European",
    GME: "Greater Middle Eastern (Middle Eastern, North African, or Persian)",
    HS: "Hispanic or Latin American",
    NAM: "Native American",
    NR: "Not reported",
    OC: "Oceanian",
    OTH: "Other",
    OAD: "Other admixed ancestry",
    Mixed: "Mixed ancestry",
};

export function ancestryLabel(code) {
    return VARIANT_SIFTER_ANCESTRY_LABELS[code] || code;
}

/** Resolve a case-insensitive ancestry code to a known Variant Sifter option. */
export function normalizeAncestryCode(code) {
    if (code == null || code === "") {
        return null;
    }
    const trimmed = String(code).trim();
    const match = VARIANT_SIFTER_ANCESTRY_OPTIONS.find(
        (option) => option.toLowerCase() === trimmed.toLowerCase()
    );
    return match || null;
}

/**
 * Parse `sub_ancestries` URL values (`EA,SA` or space/| separated).
 * Drops Mixed, the primary ancestry, unknowns, and duplicates.
 */
export function parseSubAncestriesParam(value, primaryAncestry = null) {
    const primary = normalizeAncestryCode(primaryAncestry) || primaryAncestry || "Mixed";
    const raw = Array.isArray(value)
        ? value
        : String(value || "")
              .split(/[,+|;\s]+/)
              .map((part) => part.trim())
              .filter(Boolean);

    const seen = new Set();
    const codes = [];
    raw.forEach((part) => {
        const code = normalizeAncestryCode(part);
        if (!code || code === "Mixed" || code === primary || seen.has(code)) {
            return;
        }
        seen.add(code);
        codes.push(code);
    });
    return codes;
}

export function formatSubAncestriesParam(codes = []) {
    return parseSubAncestriesParam(codes).join(",");
}

export const REGION_EXPAND_OPTIONS = [
    { value: null, label: "Gene / variant bounds only" },
    { value: 50000, label: "± 50 kb" },
    { value: 100000, label: "± 100 kb" },
    { value: 150000, label: "± 150 kb" },
];

const REGION_RANGE_REGEXP =
    /^(?:chr)?(1\d?|2[0-2]?|[3-9]|x|y|xy|mt?)[:_](\d+)\s*-\s*(\d+)$/i;

/** Single genomic coordinate, e.g. `chr1:100000` or `1:100000`. */
const REGION_LOCATION_REGEXP =
    /^(?:chr)?(1\d?|2[0-2]?|[3-9]|x|y|xy|mt?)[:_](\d+)$/i;

function isRegionRangeQuery(query) {
    return REGION_RANGE_REGEXP.test(String(query || "").trim().replace(/,/g, ""));
}

function isRegionLocationQuery(query) {
    return REGION_LOCATION_REGEXP.test(String(query || "").trim().replace(/,/g, ""));
}

function isVariantQuery(query) {
    const trimmed = query.trim();
    return (
        /^rs\d+/i.test(trimmed) ||
        variantUtils.parseVariant(trimmed) != null ||
        (/[:_]/.test(trimmed) &&
            /\d/.test(trimmed) &&
            !isRegionRangeQuery(trimmed) &&
            !isRegionLocationQuery(trimmed))
    );
}

/** True when the locus field should offer gene symbol autocomplete. */
export function isGeneLookupQuery(query) {
    const trimmed = String(query || "").trim();
    if (trimmed.length < 2) {
        return false;
    }
    return (
        !isRegionRangeQuery(trimmed) &&
        !isRegionLocationQuery(trimmed) &&
        !isVariantQuery(trimmed)
    );
}

/** Gene symbol autocomplete via BioIndex `/api/bio/match/gene`. */
export async function lookupGeneMatches(query, limit = 10, host = null) {
    const trimmed = String(query || "").trim();
    if (!isGeneLookupQuery(trimmed)) {
        return [];
    }

    try {
        const matches = await match("gene", trimmed, {
            limit,
            ...(host ? { host } : {}),
        });
        return Array.isArray(matches) ? matches : [];
    } catch (error) {
        console.warn("Variant Sifter gene lookup failed", error);
        return [];
    }
}

async function lookupVariantPosition(variantQuery, host = null) {
    let parsed = variantUtils.parseVariant(variantQuery.trim());
    if (!parsed && /^rs\d+/i.test(variantQuery.trim())) {
        parsed = variantQuery.trim();
    }
    if (!parsed) {
        return null;
    }

    const lookupHost = host || BIO_INDEX_HOST;
    if (parsed.startsWith("rs")) {
        const json = await fetch(
            `${lookupHost}/api/bio/varIdLookup/${parsed}`
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

function parseRegionLocation(query) {
    const match = query.trim().replace(/,/g, "").match(REGION_LOCATION_REGEXP);
    if (!match) {
        return null;
    }

    const position = parseInt(match[2], 10);
    if (Number.isNaN(position)) {
        return null;
    }

    return {
        chr: match[1],
        position,
    };
}

/**
 * Resolve a gene, variant, chr:start-end range, or chr:position location into a locus region.
 * Gene, variant, and location queries are converted to regions; optional expandBp widens further.
 */
export async function resolveGeneOrVariantToRegion(
    query,
    regionUtils,
    expandBp = null,
    host = null
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

    if (isRegionLocationQuery(trimmed)) {
        const location = parseRegionLocation(trimmed);
        if (!location) {
            return null;
        }
        // Treat a point like a variant locus: expand around it (default ±50 kb).
        const region = regionAroundPosition(
            location.chr,
            location.position,
            expandBp || 100000
        );
        return {
            ...region,
            sourceQuery: trimmed,
            sourceType: "location",
        };
    }

    if (isVariantQuery(trimmed)) {
        const variantPos = await lookupVariantPosition(trimmed, host);
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

/** Phenotype · ancestry · region label for the workspace header. */
export function formatSearchSessionLabel(searchSession) {
    if (!searchSession) {
        return "";
    }

    const parts = [searchSession.phenotype?.description];
    if (searchSession.ancestry) {
        parts.push(searchSession.ancestry);
    }
    if (searchSession.regionLabel) {
        parts.push(searchSession.regionLabel);
    }
    return parts.filter(Boolean).join(" · ");
}

export function parseRegionParam(regionParam) {
    if (!regionParam) {
        return null;
    }

    const text = String(regionParam).trim();
    if (isRegionRangeQuery(text)) {
        return parseRegionRange(text);
    }

    if (isRegionLocationQuery(text)) {
        const location = parseRegionLocation(text);
        if (!location) {
            return null;
        }
        const region = regionAroundPosition(location.chr, location.position, 100000);
        return {
            ...region,
            sourceQuery: text,
            sourceType: "location",
        };
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
