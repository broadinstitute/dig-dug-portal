function sortedRows(rows, sort) {
    const direction = sort.direction === "desc" ? -1 : 1;
    return rows
        .map((row, index) => ({ row, index }))
        .sort((left, right) => {
            const a = left.row[sort.key];
            const b = right.row[sort.key];
            const missing = value => value == null || value === '' || value === 'Unavailable';
            if (missing(a) !== missing(b)) return missing(a) ? 1 : -1;
            if (missing(a)) return left.index - right.index;
            const comparison = typeof a === "number" && typeof b === "number"
                ? a - b
                : String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
            return comparison * direction || left.index - right.index;
        })
        .map(({ row }) => row);
}

function withPinnedRows(rows, pinnedIds) {
    const byId = new Map(rows.map(row => [row.sampleId, row]));
    const pinned = new Set(pinnedIds);
    return [...pinned].map(id => byId.get(id)).filter(Boolean).concat(rows.filter(row => !pinned.has(row.sampleId)));
}

function paginatePinnedRows(rows, pinnedIds, page, pageSize = 5) {
    const pinned = new Set(pinnedIds);
    const pinnedRows = withPinnedRows(rows, pinnedIds).filter(row => pinned.has(row.sampleId));
    const remaining = rows.filter(row => !pinned.has(row.sampleId));
    const pageCount = Math.max(1, Math.ceil(remaining.length / pageSize));
    const current = Math.max(1, Math.min(pageCount, Math.trunc(Number(page)) || 1));
    return { page: current, pageCount, rows: [...pinnedRows, ...remaining.slice((current - 1) * pageSize, current * pageSize)] };
}

module.exports = { sortedRows, withPinnedRows, paginatePinnedRows };
