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
import { downsampleAssociationRowsOnLoad } from "./gp2BrowserAssociationsDownsample.js";

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
