/**
 * Assist messages + helpers for understudied bottom-line (blue-bubble) variants.
 * Phenotype-page meta types: `bottom-line` only = KP bottom-line significance
 * not shared with min_p / largest.
 */

export const VKS_BOTTOM_LINE_ONLY_META = "bottom-line";
export const VKS_UNDERSTUDIED_PREVIEW_COUNT = 10;

function normalizeChromosome(value) {
    return String(value || "")
        .trim()
        .replace(/^chr/i, "")
        .toUpperCase();
}

export function buildUnderstudiedOfferMessage(session) {
    const phenotype =
        session?.phenotype?.description ||
        session?.phenotype?.name ||
        "this phenotype";
    const ancestry = session?.ancestry || "Mixed";
    return [
        `You can also find understudied bottom-line variants for ${phenotype} (${ancestry}).`,
        "These are genome-wide significant in the Knowledge Portal bottom-line meta-analysis",
        "but not also significant in the largest or min_p datasets for this ancestry.",
        "Execute below to load phenotype-wide signals, keep the bottom-line-only set,",
        "and list those that fall in the searched region—then optionally star them.",
    ].join(" ");
}

export function buildUnderstudiedIntroMessage(session) {
    const phenotype =
        session?.phenotype?.description ||
        session?.phenotype?.name ||
        "this phenotype";
    const ancestry = session?.ancestry || "Mixed";
    return [
        `Loading global associations for ${phenotype} (${ancestry})`,
        "to find bottom-line-only (understudied) variants in the searched region.",
    ].join(" ");
}

export function buildUnderstudiedRunningMessage() {
    return "Finding understudied bottom-line variants in the searched region…";
}

export function buildUnderstudiedNoneFoundMessage(session) {
    const phenotype =
        session?.phenotype?.description ||
        session?.phenotype?.name ||
        "this phenotype";
    const ancestry = session?.ancestry || "Mixed";
    return [
        `No understudied bottom-line variants were found for ${phenotype} (${ancestry})`,
        "in the searched region.",
    ].join(" ");
}

export function buildUnderstudiedReportMessage(session, variants = []) {
    const count = variants.length;
    if (!count) {
        return buildUnderstudiedNoneFoundMessage(session);
    }
    const phenotype =
        session?.phenotype?.description ||
        session?.phenotype?.name ||
        "this phenotype";
    const ancestry = session?.ancestry || "Mixed";
    return [
        `Found ${count} understudied bottom-line variant${count === 1 ? "" : "s"}`,
        `for ${phenotype} (${ancestry}) in the searched region.`,
        "These reached genome-wide significance via the Knowledge Portal bottom-line meta-analysis",
        "and were not also present in the largest and/or min_p datasets.",
    ].join(" ");
}

export function buildUnderstudiedStarPromptMessage(variants = []) {
    const count = variants.length;
    if (!count) {
        return "No understudied bottom-line variants to star.";
    }
    return [
        `Star these ${count} understudied bottom-line variant${count === 1 ? "" : "s"}?`,
        "Yes stars all listed variants; No skips starring.",
    ].join(" ");
}

export function variantInSearchedRegion(row, region) {
    if (!region) {
        return false;
    }
    const regionChr = normalizeChromosome(region.chromosome ?? region.chr);
    const rowChr = normalizeChromosome(row?.chromosome ?? row?.chr);
    if (!regionChr || !rowChr || regionChr !== rowChr) {
        return false;
    }
    const position = Number(row?.position ?? row?.Position);
    const start = Number(region.start);
    const end = Number(region.end);
    if (!Number.isFinite(position) || !Number.isFinite(start) || !Number.isFinite(end)) {
        return false;
    }
    return position >= start && position <= end;
}

export function isBottomLineOnlyMeta(inMetaTypes) {
    return String(inMetaTypes || "").trim() === VKS_BOTTOM_LINE_ONLY_META;
}

/**
 * Keep bottom-line-only (blue bubble) rows that fall in the searched region.
 */
export function filterUnderstudiedBottomLineInRegion(rows = [], region = null) {
    return (rows || []).filter(
        (row) =>
            isBottomLineOnlyMeta(row?.inMetaTypes) &&
            variantInSearchedRegion(row, region)
    );
}

export function toUnderstudiedStarRow(row) {
    const variantId = String(row?.varId || row?.["Variant ID"] || "").trim();
    if (!variantId) {
        return null;
    }
    const position = Number(row?.position ?? row?.Position);
    return {
        "Variant ID": variantId,
        varId: variantId,
        Position: Number.isFinite(position) ? position : null,
        chromosome: row?.chromosome ?? row?.chr ?? null,
        dbSNP: row?.dbSNP || row?.rsId || null,
        "P-Value": row?.pValue ?? row?.["P-Value"] ?? null,
        inMetaTypes: row?.inMetaTypes || VKS_BOTTOM_LINE_ONLY_META,
        ancestry: row?.ancestry || null,
    };
}

export function formatUnderstudiedVariantLabel(row) {
    const dbSnp = String(row?.dbSNP || "").trim();
    const id = dbSnp || String(row?.["Variant ID"] || row?.varId || "variant").trim();
    const ancestry = String(row?.ancestry || "").trim();
    if (ancestry && ancestry !== "Mixed") {
        return `${id} (${ancestry})`;
    }
    return id;
}

export function buildUnderstudiedStarPrompt(variants = []) {
    const seen = new Set();
    const options = [];
    (variants || []).forEach((row) => {
        const starRow = toUnderstudiedStarRow(row);
        if (!starRow) {
            return;
        }
        if (seen.has(starRow["Variant ID"])) {
            return;
        }
        seen.add(starRow["Variant ID"]);
        options.push(starRow);
    });
    if (!options.length) {
        return null;
    }
    return {
        message: buildUnderstudiedStarPromptMessage(options),
        variants: options,
    };
}
