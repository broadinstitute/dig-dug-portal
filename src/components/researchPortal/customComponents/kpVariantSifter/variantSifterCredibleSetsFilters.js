/**
 * Table-panel filters for the Credible Sets drawer.
 * Empty score/variant fields and an empty CS checkbox list mean “no filter”.
 */

export function createCredibleSetsPanelFilters() {
    return {
        variantSearch: "",
        ppaMin: "",
        pValueMax: "",
        selectedSetKeys: [],
    };
}

export function cloneCredibleSetsPanelFilters(filters) {
    return {
        variantSearch: filters?.variantSearch || "",
        ppaMin: filters?.ppaMin || "",
        pValueMax: filters?.pValueMax || "",
        selectedSetKeys: [...(filters?.selectedSetKeys || [])],
    };
}

export function countActiveCredibleSetsPanelFilters(filters) {
    let count = 0;
    if ((filters?.variantSearch || "").trim()) {
        count += 1;
    }
    if ((filters?.ppaMin || "").trim()) {
        count += 1;
    }
    if ((filters?.pValueMax || "").trim()) {
        count += 1;
    }
    if ((filters?.selectedSetKeys || []).length) {
        count += 1;
    }
    return count;
}

function matchesVariantSearch(row, search) {
    const term = String(search || "")
        .trim()
        .toLowerCase();
    if (!term) {
        return true;
    }
    const variantId = String(row?.["Variant ID"] || row?.varId || "").toLowerCase();
    const rsId = String(row?.rsID || "").toLowerCase();
    return variantId.includes(term) || rsId.includes(term);
}

function matchesPpaMin(row, ppaMin) {
    const raw = String(ppaMin || "").trim();
    if (!raw) {
        return true;
    }
    const threshold = Number(raw);
    if (Number.isNaN(threshold)) {
        return true;
    }
    const value = Number(row?.PPA ?? row?.posteriorProbability);
    return !Number.isNaN(value) && value >= threshold;
}

function matchesPValueMax(row, pValueMax) {
    const raw = String(pValueMax || "").trim();
    if (!raw) {
        return true;
    }
    const threshold = Number(raw);
    if (Number.isNaN(threshold)) {
        return true;
    }
    const value = Number(row?.["P-Value"] ?? row?.pValue);
    return !Number.isNaN(value) && value <= threshold;
}

function matchesSelectedSets(row, selectedSetKeys) {
    if (!Array.isArray(selectedSetKeys) || !selectedSetKeys.length) {
        return true;
    }
    const key = row?.selectionKey || row?.credibleSetId;
    return selectedSetKeys.includes(key);
}

export function applyCredibleSetsPanelFilters(rows, filters) {
    if (!Array.isArray(rows) || !rows.length) {
        return [];
    }
    return rows.filter(
        (row) =>
            matchesVariantSearch(row, filters?.variantSearch) &&
            matchesPpaMin(row, filters?.ppaMin) &&
            matchesPValueMax(row, filters?.pValueMax) &&
            matchesSelectedSets(row, filters?.selectedSetKeys)
    );
}
