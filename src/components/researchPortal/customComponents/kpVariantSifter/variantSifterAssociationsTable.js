import dataConvert from "@/utils/dataConvert.js";
import { ASSOCIATIONS_TABLE_FORMAT } from "./variantSifterAssociationsTableFormat.js";

function deriveZScore(row, raw) {
    const existing = row["Z Score"];
    if (existing != null && existing !== "") {
        return existing;
    }

    const beta = row.Beta ?? raw.beta;
    const stdErr = row["Standard Error"] ?? raw.stdErr;

    if (
        typeof beta === "number" &&
        typeof stdErr === "number" &&
        stdErr !== 0 &&
        !Number.isNaN(beta) &&
        !Number.isNaN(stdErr)
    ) {
        return beta / stdErr;
    }

    return existing;
}

/**
 * Convert raw BioIndex association rows into GEM package table rows.
 */
export function formatAssociationRows(rawRows, searchSession = null) {
    if (!Array.isArray(rawRows) || !rawRows.length) {
        return [];
    }

    const converted = dataConvert.convertData(
        ASSOCIATIONS_TABLE_FORMAT["data convert"],
        rawRows
    );

    const sessionAncestry = searchSession?.ancestry || null;

    return converted.map((row, index) => {
        const raw = rawRows[index] || {};
        const formatted = { ...row };

        if (raw.varId) {
            formatted.varId = raw.varId;
        }

        if (formatted.LDS == null && raw.lds != null) {
            formatted.LDS = raw.lds;
        }
        if (formatted.LDS == null && raw.LDS != null) {
            formatted.LDS = raw.LDS;
        }
        if (formatted.EAF == null && raw.EAF != null) {
            formatted.EAF = raw.EAF;
        }

        // Tag by the series we fetched. Combined (`Mixed` / null) always maps to
        // Mixed so multi-ancestry plot splitting does not drop primary rows that
        // carry a raw BioIndex ancestry field.
        if (sessionAncestry && sessionAncestry !== "Mixed") {
            formatted.Ancestry = sessionAncestry;
        } else {
            formatted.Ancestry = "Mixed";
        }

        const zScore = deriveZScore(formatted, raw);
        if (zScore != null && zScore !== "") {
            formatted["Z Score"] = zScore;
        }

        return formatted;
    });
}

const VARIANT_ID_KEY = "Variant ID";
const P_VALUE_KEY = "P-Value";

function variantIdForRow(row, index = 0) {
    return String(row?.[VARIANT_ID_KEY] || row?.varId || `row-${index}`);
}

function numericPValue(row) {
    const value = Number(row?.[P_VALUE_KEY]);
    return Number.isFinite(value) ? value : null;
}

/**
 * Sort association rows by P-value while keeping the same Variant ID together.
 * Groups are ordered by each variant's best (minimum) P-value; within a group,
 * rows stay ordered by P-value then Ancestry so multi-ancestry rows sit adjacent.
 */
export function sortAssociationRowsByPValueAndVariantId(
    rows = [],
    { ascending = true } = {}
) {
    const list = Array.isArray(rows) ? rows : [];
    if (!list.length) {
        return [];
    }

    const groups = new Map();
    list.forEach((row, index) => {
        const id = variantIdForRow(row, index);
        if (!groups.has(id)) {
            groups.set(id, []);
        }
        groups.get(id).push(row);
    });

    const comparePValue = (left, right) => {
        const leftVal = numericPValue(left);
        const rightVal = numericPValue(right);
        if (leftVal == null && rightVal == null) {
            return 0;
        }
        if (leftVal == null) {
            return 1;
        }
        if (rightVal == null) {
            return -1;
        }
        if (leftVal === rightVal) {
            return 0;
        }
        const cmp = leftVal < rightVal ? -1 : 1;
        return ascending ? cmp : -cmp;
    };

    const groupEntries = [...groups.entries()].map(([id, groupRows]) => {
        const sortedWithin = [...groupRows].sort((left, right) => {
            const byP = comparePValue(left, right);
            if (byP !== 0) {
                return byP;
            }
            return String(left?.Ancestry || "").localeCompare(
                String(right?.Ancestry || "")
            );
        });
        let bestP = null;
        sortedWithin.forEach((row) => {
            const value = numericPValue(row);
            if (value == null) {
                return;
            }
            if (bestP == null || value < bestP) {
                bestP = value;
            }
        });
        return { id, rows: sortedWithin, bestP };
    });

    groupEntries.sort((left, right) => {
        if (left.bestP == null && right.bestP == null) {
            return left.id.localeCompare(right.id);
        }
        if (left.bestP == null) {
            return 1;
        }
        if (right.bestP == null) {
            return -1;
        }
        if (left.bestP !== right.bestP) {
            const cmp = left.bestP < right.bestP ? -1 : 1;
            return ascending ? cmp : -cmp;
        }
        return left.id.localeCompare(right.id);
    });

    return groupEntries.flatMap((entry) => entry.rows);
}

export { ASSOCIATIONS_TABLE_FORMAT };
