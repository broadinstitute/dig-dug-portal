export const ASSOCIATION_PAGE_SIZE = 5;
export const CO_CARRIER_PAGE_SIZE = 6;
export const INVESTIGATOR_PAGE_SIZE = 5;

export function paginate(rows, page, pageSize) {
    const current = Math.max(1, Math.min(Number(page) || 1, Math.ceil(rows.length / pageSize) || 1));
    return rows.slice((current - 1) * pageSize, current * pageSize);
}

function compareMissingLast(a, b, direction) {
    const missingA = a == null || a === "" || (typeof a === "number" && !Number.isFinite(a));
    const missingB = b == null || b === "" || (typeof b === "number" && !Number.isFinite(b));
    if (missingA || missingB) return missingA === missingB ? 0 : missingA ? 1 : -1;
    if (typeof a === "number" && typeof b === "number") return (a - b) * direction;
    return String(a).localeCompare(String(b), undefined, { sensitivity: "base" }) * direction;
}

export function sortAssociations(rows, key, dir) {
    const direction = dir === "desc" ? -1 : 1;
    return [...rows].sort((a, b) => {
        const value = row => key === "label" ? row.label : Number(row[key]);
        const aValue = key === "label" ? value(a) : a[key] == null ? null : value(a);
        const bValue = key === "label" ? value(b) : b[key] == null ? null : value(b);
        return compareMissingLast(aValue, bValue, direction) || String(a.hpoId).localeCompare(String(b.hpoId));
    });
}

export function sortCoCarrierGenes(rows, key, dir) {
    const direction = dir === "desc" ? -1 : 1;
    return [...rows].sort((a, b) => {
        const value = row => key === "gene" ? row.gene
            : key === "overlap" ? Number(row.count) / Number(row.denominator || 1)
                : Number(row.count);
        return compareMissingLast(value(a), value(b), direction) || String(a.gene).localeCompare(String(b.gene));
    });
}

export function sortInvestigators(rows, key, dir) {
    const direction = dir === "desc" ? -1 : 1;
    return [...rows].sort((a, b) =>
        compareMissingLast(key === "count" ? Number(a.count) : a.inv,
            key === "count" ? Number(b.count) : b.inv, direction) || String(a.inv).localeCompare(String(b.inv)));
}

export function sortProjects(rows, key, dir) {
    const direction = dir === "desc" ? -1 : 1;
    return [...rows].sort((a, b) =>
        compareMissingLast(key === "count" ? Number(a.count) : a.project,
            key === "count" ? Number(b.count) : b.project, direction) || String(a.project).localeCompare(String(b.project)));
}
