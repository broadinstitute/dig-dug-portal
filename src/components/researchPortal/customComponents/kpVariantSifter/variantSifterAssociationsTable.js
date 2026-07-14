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

export { ASSOCIATIONS_TABLE_FORMAT };
