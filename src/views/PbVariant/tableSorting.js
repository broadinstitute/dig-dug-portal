const MISSING = new Set(["", "unavailable", "loading…", "n/a", "—"]);

function normalized(value, numeric) {
    if (value == null || MISSING.has(String(value).trim().toLowerCase())) return null;
    if (!numeric) return String(value).trim();
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
}

function sortRows(rows, sort, valueFor, numericKeys = []) {
    if (!sort || !sort.key) return rows;
    const numeric = numericKeys.includes(sort.key);
    const direction = sort.dir === "desc" ? -1 : 1;
    return rows.map((row, index) => ({ row, index })).sort((left, right) => {
        const a = normalized(valueFor(left.row, sort.key), numeric);
        const b = normalized(valueFor(right.row, sort.key), numeric);
        if (a == null || b == null) return a == null && b == null ? left.index - right.index : a == null ? 1 : -1;
        const comparison = numeric ? a - b : a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
        return comparison ? comparison * direction : left.index - right.index;
    }).map(item => item.row);
}

function carrierValue(carrier, key, metadataById = {}, residualById = {}) {
    const metadata = metadataById[carrier.id] || {};
    switch (key) {
    case "sample": return carrier.id;
    case "age": return metadata.ageYears ?? carrier.ageYears;
    case "sex": return metadata.sex ?? carrier.sex;
    case "gt": return carrier.genotype;
    case "residual": return residualById[String(carrier.id || "").toLowerCase()];
    case "affected": return metadata.affected ?? carrier.affected;
    case "project": return metadata.project ?? carrier.project;
    default: return null;
    }
}

function sortCarrierRows(rows, sort, metadataById, residualById) {
    return sortRows(rows, sort, (row, key) => carrierValue(row, key, metadataById, residualById), ["age", "residual"]);
}

function sortPhenotypeRows(rows, sort) {
    return sortRows(rows, sort, (row, key) => row[key], ["count", "pct"]);
}

function sortCoGeneRows(rows, sort) {
    return sortRows(rows, sort, (row, key) => row[key], ["count", "pct", "beta", "pValue", "fdr"]);
}

function sortCoVariantRows(rows, sort) {
    return sortRows(rows, sort, (row, key) => row[key], ["count", "pct", "variantScore"]);
}

module.exports = { sortCarrierRows, sortCoGeneRows, sortCoVariantRows, sortPhenotypeRows };
