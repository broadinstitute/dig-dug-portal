function pageCount(length, pageSize) {
    return Math.max(1, Math.ceil(length / pageSize));
}

function clampPage(page, totalPages) {
    const number = Number(page);
    return Number.isSafeInteger(number) ? Math.max(1, Math.min(number, totalPages)) : 1;
}

function pageRows(rows, page, pageSize) {
    const currentPage = clampPage(page, pageCount(rows.length, pageSize));
    const start = (currentPage - 1) * pageSize;
    return rows.slice(start, start + pageSize);
}

module.exports = { pageCount, clampPage, pageRows };
