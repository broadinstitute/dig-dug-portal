import { query } from "@/utils/bioIndexUtils";
import { formatRegion } from "./variantSifterSearchUtils.js";

/**
 * Mixed ancestry uses the combined associations index; specific ancestries
 * use ancestry-associations.
 */
export function resolveAssociationsRequest(session) {
    const region = formatRegion(session.region);
    const phenotype = session.phenotype.name;
    const ancestry = session.ancestry;

    if (ancestry && ancestry !== "Mixed") {
        return {
            index: "ancestry-associations",
            q: `${phenotype},${ancestry},${region}`,
        };
    }

    return {
        index: "associations",
        q: `${phenotype},${region}`,
    };
}

export async function fetchAssociations(session, host) {
    const { index, q } = resolveAssociationsRequest(session);
    const data = await query(index, q, { host });
    const rows = Array.isArray(data) ? data : [];

    rows.sort((a, b) => {
        const pA = a?.pValue ?? 1;
        const pB = b?.pValue ?? 1;
        return pA - pB;
    });

    return { index, q, rows };
}

export async function fetchAssociationsForRegion(session, region, host) {
    return fetchAssociations(
        {
            ...session,
            region,
        },
        host
    );
}
