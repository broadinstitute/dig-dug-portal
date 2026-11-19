/**
 * GP2-only association fetch helpers.
 *
 * The shared `fetchAssociations` / `fetchGwasCeAssociations`
 * (`../kpVariantSifter/variantSifterAssociationsApi.js`) discard the raw,
 * pre-downsample row count once downsampling runs, so GP2's section legend
 * (which shows "downsampled from X to Y") has nothing to read. These forks
 * run the identical request + downsample steps (same BioIndex query, same
 * `downsampleAssociationRowsOnLoad` algorithm) but also return `rawCount`.
 */
import { query } from "@/utils/bioIndexUtils";
import {
    resolveAssociationsRequest,
    resolveGwasCeAssociationsRequest,
} from "../kpVariantSifter/variantSifterAssociationsApi.js";
import { formatAssociationRows } from "../kpVariantSifter/variantSifterAssociationsTable.js";
import { downsampleAssociationRowsOnLoad } from "./gp2BrowserAssociationsDownsample.js";

/**
 * Shared `formatAssociationRows` maps BioIndex fields into table columns
 * (`P-Value`, `Position`, `Consequence`, …) and drops fields the AI summary /
 * Literature evidence digest still need (`nearest`, plus the original
 * camelCase keys). Preserve both shapes so table UI and digest builders work
 * from the same `associationsState.rows`.
 */
export function formatGp2AssociationRows(rawRows, searchSession = null, options = {}) {
    const formatted = formatAssociationRows(rawRows, searchSession, options);
    if (!Array.isArray(formatted) || !formatted.length) {
        return formatted;
    }
    return formatted.map((row, index) => {
        const raw = rawRows?.[index] || {};
        return {
            ...row,
            nearest: Array.isArray(raw.nearest)
                ? raw.nearest
                : Array.isArray(row.nearest)
                  ? row.nearest
                  : undefined,
            position: raw.position ?? row.position ?? row.Position,
            pValue: raw.pValue ?? row.pValue ?? row["P-Value"],
            consequence: raw.consequence ?? row.consequence ?? row.Consequence,
            beta: raw.beta ?? row.beta ?? row.Beta,
            stdErr: raw.stdErr ?? row.stdErr ?? row["Standard Error"],
            maf: raw.maf ?? row.maf ?? row.MAF,
            eaf: raw.eaf ?? row.eaf ?? row.EAF,
            reference: raw.reference ?? row.reference ?? row.ref,
            dbSNP: raw.dbSNP ?? row.dbSNP ?? row.rsID,
            chromosome: raw.chromosome ?? row.chromosome ?? row.chr,
        };
    });
}

export async function fetchGp2AssociationsWithCount(session, host, projectId) {
    const { index, q, logicalIndex, fmt } = resolveAssociationsRequest(
        session,
        projectId
    );
    const data = await query(index, q, { host, fmt });
    const rawRows = Array.isArray(data) ? data : [];
    const rows = downsampleAssociationRowsOnLoad(rawRows);
    return { index: logicalIndex || index, q, rows, rawCount: rawRows.length };
}

export async function fetchGp2GwasCeAssociationsWithCount(session) {
    const { index, q, logicalIndex, fmt, host } =
        resolveGwasCeAssociationsRequest(session);
    if (!q) {
        return { index: logicalIndex, q, rows: [], rawCount: 0 };
    }
    const data = await query(index, q, { host, fmt });
    const rawRows = Array.isArray(data) ? data : [];
    const rows = downsampleAssociationRowsOnLoad(rawRows);
    return { index: logicalIndex || index, q, rows, rawCount: rawRows.length };
}
