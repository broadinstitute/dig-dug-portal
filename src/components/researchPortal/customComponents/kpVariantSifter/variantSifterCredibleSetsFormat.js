import dataConvert from "@/utils/dataConvert.js";

export const CREDIBLE_VARIANTS_DATA_CONVERT = [
    { type: "raw", "field name": "Position", "raw field": "position" },
    { type: "raw", "field name": "PPA", "raw field": "posteriorProbability" },
    { type: "raw", "field name": "P-Value", "raw field": "pValue" },
    { type: "raw", "field name": "rsID", "raw field": "dbSNP" },
    { type: "raw", "field name": "chromosome", "raw field": "chromosome" },
    { type: "raw", "field name": "ref", "raw field": "reference" },
    { type: "raw", "field name": "alt", "raw field": "alt" },
    {
        type: "join multi",
        "field name": "Variant ID",
        "fields to join": ["chromosome", "position", "reference", "alt"],
        "join by": [":", "_", "/"],
    },
];

export const CREDIBLE_VARIANTS_TABLE_COLUMNS = [
    "Variant ID",
    "rsID",
    "Position",
    "PPA",
    "P-Value",
];

export function formatCredibleVariantRows(rawRows) {
    if (!Array.isArray(rawRows) || !rawRows.length) {
        return [];
    }

    const converted = dataConvert.convertData(CREDIBLE_VARIANTS_DATA_CONVERT, rawRows);

    return converted.map((row, index) => {
        const raw = rawRows[index] || {};
        const formatted = { ...row };

        if (raw.varId) {
            formatted.varId = raw.varId;
        }
        if (raw.credibleSetId) {
            formatted.credibleSetId = raw.credibleSetId;
        }
        if (raw.phenotype) {
            formatted.phenotype = raw.phenotype;
        }
        if (formatted.PPA == null && raw.posteriorProbability != null) {
            formatted.PPA = raw.posteriorProbability;
        }

        return formatted;
    });
}

export function normalizeCredibleSetAncestry(ancestry) {
    return ancestry && ancestry !== "Mixed" ? ancestry : "Mixed";
}

/**
 * Stable key for a selected credible set. Same credibleSetId can exist under
 * Mixed and ancestry-specific lists (e.g. SA), so ancestry is part of the key.
 */
export function makeCredibleSetSelectionKey(credibleSetId, ancestry = "Mixed") {
    if (!credibleSetId) {
        return "";
    }
    return `${credibleSetId}::${normalizeCredibleSetAncestry(ancestry)}`;
}

export function parseCredibleSetSelectionKey(selectionKey) {
    const raw = String(selectionKey || "");
    const sep = raw.lastIndexOf("::");
    if (sep < 0) {
        return { credibleSetId: raw, ancestry: "Mixed" };
    }
    return {
        credibleSetId: raw.slice(0, sep),
        ancestry: normalizeCredibleSetAncestry(raw.slice(sep + 2)),
    };
}

export function credibleSetOptionLabel(entry) {
    if (!entry?.credibleSetId) {
        return "";
    }
    const ancestry =
        entry.ancestry && entry.ancestry !== "Mixed"
            ? `Ancestry: ${entry.ancestry}`
            : null;
    const method = entry.method ? `Method: ${entry.method}` : null;
    const pmid = entry.pmid ? `PMID: ${entry.pmid}` : null;
    const suffix = [ancestry, method, pmid].filter(Boolean).join(", ");
    return suffix ? `${entry.credibleSetId} (${suffix})` : entry.credibleSetId;
}

/** Compact label for pills, tooltips, and table columns. */
export function credibleSetShortLabel(entry) {
    if (!entry?.credibleSetId) {
        return "";
    }
    const parts = [entry.credibleSetId];
    if (entry.phenotype) {
        parts.push(entry.phenotype);
    }
    if (entry.ancestry && entry.ancestry !== "Mixed") {
        parts.push(entry.ancestry);
    }
    return parts.join(", ");
}

export function credibleSetColorKey(credibleSetId, phenotype) {
    return `${credibleSetId}, ${phenotype || ""}`.trim();
}
