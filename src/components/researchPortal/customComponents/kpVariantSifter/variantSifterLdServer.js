import { LD_SERVER_BASE_URL } from "@/components/lz/beta/constants.js";
import variantUtils from "@/utils/variantUtils.js";

/**
 * KP ancestry codes → 1000G LD server population IDs.
 * Matches BYOR gem package "ld server".populations mapping.
 */
export const KP_ANCESTRY_LD_POPULATIONS = {
    Mixed: "ALL",
    EU: "EUR",
    EA: "EAS",
    SA: "SAS",
    AA: "AFR",
    HS: "AMR",
    SSAF: "AFR",
    ALL: "ALL",
    EUR: "EUR",
    EAS: "EAS",
    SAS: "SAS",
    AFR: "AFR",
    AMR: "AMR",
};

export const LD_SERVER_DEFAULTS = {
    baseUrl: LD_SERVER_BASE_URL.replace(/\/$/, ""),
    genomeBuild: "GRCh37",
    reference: "1000G",
    correlation: "rsquare",
    limit: 100000,
};

/**
 * Resolve the 1000G population for the U-M LD server from search ancestry.
 */
export function resolveLdPopulation(ancestry) {
    if (!ancestry || ancestry === "Mixed") {
        return KP_ANCESTRY_LD_POPULATIONS.Mixed;
    }
    return KP_ANCESTRY_LD_POPULATIONS[ancestry] || KP_ANCESTRY_LD_POPULATIONS.Mixed;
}

/**
 * LD server expects GEM-style variant IDs (chr:pos_ref/alt), not BioIndex varId
 * (chr:pos:ref:alt). See variantUtils.gaitVariant and ResearchRegionPlot.
 */
export function rowToLdVariant(row) {
    if (row?.["Variant ID"]) {
        return row["Variant ID"];
    }
    if (row?.varId) {
        return variantUtils.gaitVariant(row.varId);
    }
    return null;
}

function gemVariantToVarId(variantId) {
    const match = String(variantId).match(
        /^((?:\d+|X|Y|MT)):(\d+)_([^/]+)\/(.+)$/i
    );
    if (!match) {
        return variantId;
    }
    return `${match[1]}:${match[2]}:${match[3]}:${match[4]}`;
}

function variantAliasKeys(variant) {
    if (variant == null || variant === "") {
        return [];
    }

    const keys = new Set([String(variant), String(variant).toLowerCase()]);
    const asString = String(variant);

    const gemMatch = asString.match(/^((?:\d+|X|Y|MT)):(\d+)_([^/]+)\/(.+)$/i);
    if (gemMatch) {
        const [, chr, pos, ref, alt] = gemMatch;
        keys.add(`${chr}:${pos}:${ref}:${alt}`);
        keys.add(`${chr}:${pos}:${ref}:${alt}`.toLowerCase());
    }

    const varIdMatch = asString.match(/^((?:\d+|X|Y|MT)):(\d+):([^:]+):(.+)$/i);
    if (varIdMatch) {
        const [, chr, pos, ref, alt] = varIdMatch;
        keys.add(`${chr}:${pos}_${ref}/${alt}`);
        keys.add(`${chr}:${pos}_${ref}/${alt}`.toLowerCase());
    }

    keys.add(gemVariantToVarId(asString));
    return Array.from(keys);
}

export function pickLeadVariantRow(rows) {
    if (!rows?.length) {
        return null;
    }

    let lead = rows[0];
    rows.forEach((row) => {
        const pValue = row["P-Value"];
        const leadP = lead["P-Value"];
        if (typeof pValue === "number" && (leadP == null || pValue < leadP)) {
            lead = row;
        }
    });
    return lead;
}

export function findAssociationRefRow(rows, refVariant) {
    if (!rows?.length) {
        return null;
    }
    if (refVariant) {
        const match = rows.find(
            (row) =>
                row["Variant ID"] === refVariant || rowToLdVariant(row) === refVariant
        );
        if (match) {
            return match;
        }
    }
    return pickLeadVariantRow(rows);
}

export function buildLdScoresUrl({
    population,
    refVariant,
    region,
    genomeBuild = LD_SERVER_DEFAULTS.genomeBuild,
    reference = LD_SERVER_DEFAULTS.reference,
    correlation = LD_SERVER_DEFAULTS.correlation,
    limit = LD_SERVER_DEFAULTS.limit,
    baseUrl = LD_SERVER_DEFAULTS.baseUrl,
}) {
    const params = new URLSearchParams({
        correlation,
        variant: refVariant,
        chrom: String(region.chr),
        start: String(region.start),
        stop: String(region.end),
        limit: String(limit),
    });

    return (
        `${baseUrl}/genome_builds/${genomeBuild}/references/${reference}/populations/` +
        `${population}/variants?${params.toString()}`
    );
}

function buildLdScoreMap(ldJson) {
    const scoreMap = new Map();
    if (!ldJson?.data?.variant2 || !ldJson?.data?.correlation) {
        return scoreMap;
    }

    ldJson.data.variant2.forEach((variant, index) => {
        const score = ldJson.data.correlation[index];
        variantAliasKeys(variant).forEach((key) => {
            scoreMap.set(key, score);
        });
    });

    return scoreMap;
}

export function lookupLdScore(scoreMap, row) {
    const candidates = [row.varId, row["Variant ID"]].filter(Boolean);
    for (const candidate of candidates) {
        for (const key of variantAliasKeys(candidate)) {
            if (scoreMap.has(key)) {
                return scoreMap.get(key);
            }
        }
    }
    return null;
}

/**
 * Fetch LD r² scores for a locus relative to the lead variant.
 */
export async function fetchLdScoreMap(rows, session) {
    if (!Array.isArray(rows) || !rows.length || !session?.region) {
        return { scoreMap: new Map(), refVariant: null };
    }

    const leadRow = pickLeadVariantRow(rows);
    return fetchLdScoreMapForRefRow(leadRow, session, session.region);
}

/**
 * Fetch LD r² scores for a locus relative to a user-selected reference variant.
 */
export async function fetchLdScoreMapForRefRow(refRow, session, region) {
    if (!refRow || !session || !region) {
        return { scoreMap: new Map(), refVariant: null };
    }

    const refVariant = rowToLdVariant(refRow);
    if (!refVariant) {
        return { scoreMap: new Map(), refVariant: null };
    }

    const population = resolveLdPopulation(session.ancestry);
    const ldUrl = buildLdScoresUrl({
        population,
        refVariant,
        region,
    });

    const ldJson = await fetch(ldUrl).then((response) => response.json());
    if (ldJson?.error != null) {
        throw new Error(ldJson.error || "LD server request failed");
    }

    if (!ldJson?.data?.variant1?.length) {
        throw new Error(
            `LD server did not recognize reference variant "${refVariant}".`
        );
    }

    return {
        scoreMap: buildLdScoreMap(ldJson),
        refVariant,
    };
}

export async function enrichAssociationRowsWithLdScoresForRef(rows, session, refRow, region) {
    if (!Array.isArray(rows) || !rows.length || !refRow) {
        return rows;
    }

    const { scoreMap } = await fetchLdScoreMapForRefRow(
        refRow,
        session,
        region || session.region
    );
    if (!scoreMap.size) {
        return rows;
    }

    return rows.map((row) => {
        const ldScore = lookupLdScore(scoreMap, row);
        if (ldScore == null) {
            return { ...row, LDS: null };
        }
        return {
            ...row,
            LDS: ldScore,
        };
    });
}

/**
 * Fetch LD r² scores for a locus and merge into association rows as LDS.
 */
export async function enrichAssociationRowsWithLdScores(rows, session) {
    if (!Array.isArray(rows) || !rows.length || !session?.region) {
        return rows;
    }

    const { scoreMap } = await fetchLdScoreMap(rows, session);
    if (!scoreMap.size) {
        return rows;
    }

    return rows.map((row) => {
        const ldScore = lookupLdScore(scoreMap, row);
        if (ldScore == null) {
            return row;
        }
        return {
            ...row,
            LDS: ldScore,
        };
    });
}
