import {
    VKS_CS2CT_MIN_OVERLAP_PPA,
    fetchCs2ctForCredibleSets,
} from "./variantSifterCs2ctApi.js";

/** Normalize tissue ids/labels for CS2CT ↔ GE catalog matching. */
export function normalizeTissueKey(tissue) {
    return String(tissue || "")
        .trim()
        .toLowerCase()
        .replace(/[%]/g, "")
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
}

export function matchCatalogTissue(cs2ctTissue, catalogTissues = []) {
    const key = normalizeTissueKey(cs2ctTissue);
    if (!key) {
        return null;
    }
    const list = Array.isArray(catalogTissues) ? catalogTissues : [];
    return (
        list.find((tissue) => normalizeTissueKey(tissue) === key) || null
    );
}

/**
 * Convert CS2CT overlapLeadSNP (`chr:pos:ref:alt`) to association Variant ID
 * (`chr:pos_ref/alt`).
 */
export function overlapLeadSnpToVariantId(overlapLeadSNP) {
    const raw = String(overlapLeadSNP || "").trim();
    if (!raw) {
        return "";
    }
    if (raw.includes("_") && raw.includes("/")) {
        return raw;
    }
    const parts = raw.split(":");
    if (parts.length >= 4) {
        return `${parts[0]}:${parts[1]}_${parts[2]}/${parts.slice(3).join(":")}`;
    }
    return raw;
}

export function parseOverlapLeadSnp(overlapLeadSNP) {
    const raw = String(overlapLeadSNP || "").trim();
    const parts = raw.split(":");
    if (parts.length < 2) {
        return null;
    }
    const chr = String(parts[0]).replace(/^chr/i, "");
    const position = Number(parts[1]);
    if (!chr || !Number.isFinite(position)) {
        return null;
    }
    return {
        chr,
        position,
        ref: parts[2] || null,
        alt: parts.length >= 4 ? parts.slice(3).join(":") : null,
        variantId: overlapLeadSnpToVariantId(raw),
    };
}

export function overlapLeadSnpInRegion(overlapLeadSNP, region) {
    if (!region) {
        return false;
    }
    const parsed = parseOverlapLeadSnp(overlapLeadSNP);
    if (!parsed) {
        return false;
    }
    const regionChr = String(region.chr || "").replace(/^chr/i, "");
    if (regionChr && parsed.chr !== regionChr) {
        return false;
    }
    const start = Number(region.start);
    const end = Number(region.end);
    if (!Number.isFinite(start) || !Number.isFinite(end)) {
        return false;
    }
    return parsed.position >= start && parsed.position <= end;
}

export function filterCs2ctRows(
    rows,
    {
        region = null,
        minOverlapPpa = VKS_CS2CT_MIN_OVERLAP_PPA,
    } = {}
) {
    return (Array.isArray(rows) ? rows : []).filter((row) => {
        const ppa = Number(row?.posteriorProbability);
        if (!Number.isFinite(ppa) || ppa < minOverlapPpa) {
            return false;
        }
        if (region && !overlapLeadSnpInRegion(row?.overlapLeadSNP, region)) {
            return false;
        }
        return true;
    });
}

function buildStarRowFromOverlap(overlapLeadSNP, associationRows = []) {
    const parsed = parseOverlapLeadSnp(overlapLeadSNP);
    if (!parsed?.variantId) {
        return null;
    }
    const fromAssoc = (associationRows || []).find((row) => {
        const id = String(row?.["Variant ID"] || row?.varId || "");
        return id === parsed.variantId;
    });
    if (fromAssoc) {
        return { ...fromAssoc };
    }
    return {
        "Variant ID": parsed.variantId,
        varId: parsed.variantId,
        Position: parsed.position,
        chromosome: parsed.chr,
    };
}

/**
 * Classify GE tissues from filtered CS2CT rows and collect star candidates
 * keyed by credible set id (overlap lead SNPs only).
 */
export function classifyGeTissuesFromCs2ct({
    rows = [],
    catalogTissues = [],
    catalogAnnotations = [],
    associationRows = [],
} = {}) {
    const relevantTissueSet = new Set();
    const tissuesByAnnotation = {};
    (catalogAnnotations || []).forEach((annotation) => {
        const key = String(annotation || "").trim();
        if (key) {
            tissuesByAnnotation[key] = new Set();
        }
    });
    const starByCsId = new Map();

    (rows || []).forEach((row) => {
        const catalogTissue = matchCatalogTissue(row?.tissue, catalogTissues);
        if (catalogTissue) {
            relevantTissueSet.add(catalogTissue);
            const annotation = String(row?.annotation || "").trim();
            if (annotation) {
                if (!tissuesByAnnotation[annotation]) {
                    tissuesByAnnotation[annotation] = new Set();
                }
                tissuesByAnnotation[annotation].add(catalogTissue);
            }
        }

        const csId = String(row?.credibleSetId || "").trim();
        const starRow = buildStarRowFromOverlap(row?.overlapLeadSNP, associationRows);
        if (!csId || !starRow) {
            return;
        }
        if (!starByCsId.has(csId)) {
            starByCsId.set(csId, new Map());
        }
        starByCsId.get(csId).set(starRow["Variant ID"], starRow);
    });

    const relevantTissues = [...relevantTissueSet].sort();
    const relevantTissuesByAnnotation = {};
    Object.keys(tissuesByAnnotation)
        .sort()
        .forEach((annotation) => {
            relevantTissuesByAnnotation[annotation] = [
                ...tissuesByAnnotation[annotation],
            ].sort();
        });

    const starOptions = [...starByCsId.entries()]
        .map(([credibleSetId, variantMap]) => ({
            credibleSetId,
            label: credibleSetId,
            variants: [...variantMap.values()],
        }))
        .sort((a, b) => a.credibleSetId.localeCompare(b.credibleSetId));

    return {
        relevantTissues,
        relevantTissuesByAnnotation,
        relevantAnnotations: [...catalogAnnotations],
        starOptions,
        filteredRowCount: rows.length,
        relevantTissueCount: relevantTissues.length,
    };
}

export async function runCs2ctTissueClassification({
    session,
    credibleSets = [],
    host,
    catalogTissues = [],
    catalogAnnotations = [],
    associationRows = [],
    region = null,
} = {}) {
    const phenotypeName = session?.phenotype?.name;
    if (!phenotypeName) {
        throw new Error("No phenotype is available for CS2CT classification.");
    }
    if (!host) {
        throw new Error("BioIndex host is not available for CS2CT.");
    }
    if (!credibleSets.length) {
        throw new Error(
            "No credible sets are available for this locus. Load credible sets before classifying tissues."
        );
    }

    const searchRegion = region || session?.region || null;
    const ancestry = session?.ancestry || null;
    const rawRows = await fetchCs2ctForCredibleSets(
        phenotypeName,
        credibleSets,
        host,
        { ancestry }
    );
    const filteredRows = filterCs2ctRows(rawRows, {
        region: searchRegion,
        minOverlapPpa: VKS_CS2CT_MIN_OVERLAP_PPA,
    });
    const classified = classifyGeTissuesFromCs2ct({
        rows: filteredRows,
        catalogTissues,
        catalogAnnotations,
        associationRows,
    });

    return {
        ...classified,
        rawRowCount: rawRows.length,
        source: "c2ct-credible-set",
        minOverlapPpa: VKS_CS2CT_MIN_OVERLAP_PPA,
    };
}
