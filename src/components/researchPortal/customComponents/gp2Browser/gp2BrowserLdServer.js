import {
    KP_ANCESTRY_LD_POPULATIONS,
    LD_SERVER_DEFAULTS,
    associationRowsByAscendingPValue,
    buildLdScoresUrl as buildSharedLdScoresUrl,
    findAssociationRefRow,
    isLikelyLdCapableVariant,
    ldReferenceCandidateRows,
    lookupLdScore,
    pickLeadVariantRow,
    resolveLdPopulation,
    resolveLdReferenceRow,
    rowToLdVariant,
} from "../kpVariantSifter/variantSifterLdServer.js";

export const GP2_GENOME_BUILD = "GRCh38";

export const GP2_LD_SERVER_DEFAULTS = {
    ...LD_SERVER_DEFAULTS,
    genomeBuild: GP2_GENOME_BUILD,
};

export {
    KP_ANCESTRY_LD_POPULATIONS,
    associationRowsByAscendingPValue,
    findAssociationRefRow,
    isLikelyLdCapableVariant,
    ldReferenceCandidateRows,
    lookupLdScore,
    pickLeadVariantRow,
    resolveLdPopulation,
    resolveLdReferenceRow,
    rowToLdVariant,
};

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

export function buildLdScoresUrl(options = {}) {
    return buildSharedLdScoresUrl({
        ...options,
        genomeBuild: options.genomeBuild || GP2_GENOME_BUILD,
    });
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

let latestGp2LdScoreMap = new Map();

export function getLatestGp2LdScoreMap() {
    return latestGp2LdScoreMap;
}

export function applyLatestGp2LdScoreMap(rows = []) {
    if (!Array.isArray(rows) || !rows.length || !latestGp2LdScoreMap?.size) {
        return rows;
    }
    return rows.map((row) => {
        if (row?.LDS != null && !Number.isNaN(row.LDS)) {
            return row;
        }
        const ldScore = lookupLdScore(latestGp2LdScoreMap, row);
        if (ldScore == null) {
            return row;
        }
        return {
            ...row,
            LDS: ldScore,
        };
    });
}

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
        genomeBuild: GP2_GENOME_BUILD,
    });

    try {
        const ldJson = await fetch(ldUrl).then((response) => response.json());
        if (ldJson?.error != null || !ldJson?.data?.variant1?.length) {
            return { scoreMap: new Map(), refVariant };
        }

        const scoreMap = buildLdScoreMap(ldJson);
        if (scoreMap.size) {
            latestGp2LdScoreMap = scoreMap;
        }
        return {
            scoreMap,
            refVariant,
        };
    } catch (error) {
        console.warn("GP2 Browser LD score fetch failed", error);
        return { scoreMap: new Map(), refVariant };
    }
}

export async function fetchLdScoreMap(rows, session, region = null) {
    const activeRegion = region || session?.region;
    if (!Array.isArray(rows) || !rows.length || !session || !activeRegion) {
        return { scoreMap: new Map(), refVariant: null, refRow: null };
    }

    const candidates = ldReferenceCandidateRows(rows);
    for (const candidate of candidates) {
        const result = await fetchLdScoreMapForRefRow(
            candidate,
            session,
            activeRegion
        );
        if (result.scoreMap.size) {
            return {
                scoreMap: result.scoreMap,
                refVariant: result.refVariant,
                refRow: candidate,
            };
        }
    }

    const leadRow = pickLeadVariantRow(rows);
    return {
        scoreMap: new Map(),
        refVariant: rowToLdVariant(leadRow),
        refRow: leadRow,
    };
}

function applyLdScoreMapToRows(rows, scoreMap) {
    if (!scoreMap?.size) {
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

export async function enrichAssociationRowsWithLdScoresForRef(
    rows,
    session,
    refRow,
    region
) {
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

    return applyLdScoreMapToRows(rows, scoreMap);
}

export async function enrichAssociationRowsWithLdScores(
    rows,
    session,
    region = null
) {
    if (!Array.isArray(rows) || !rows.length || !session?.region) {
        return { rows: rows || [], refVariant: null };
    }

    const { scoreMap, refVariant } = await fetchLdScoreMap(
        rows,
        session,
        region || session.region
    );
    if (!scoreMap.size) {
        return { rows, refVariant };
    }

    return {
        rows: applyLdScoreMapToRows(rows, scoreMap),
        refVariant,
    };
}
