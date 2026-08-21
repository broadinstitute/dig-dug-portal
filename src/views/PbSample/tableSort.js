function sortedRows(rows, sort) {
    const direction = sort.direction === "desc" ? -1 : 1;
    return rows
        .map((row, index) => ({ row, index }))
        .sort((left, right) => {
            const a = left.row[sort.key];
            const b = right.row[sort.key];
            const comparison = typeof a === "number" && typeof b === "number"
                ? a - b
                : String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
            return comparison * direction || left.index - right.index;
        })
        .map(({ row }) => row);
}

module.exports = { sortedRows };
