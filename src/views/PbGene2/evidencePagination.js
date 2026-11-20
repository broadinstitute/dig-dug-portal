function pageNumbers(current, count) {
    if (count <= 7) return Array.from({ length: count }, (_, index) => index + 1);
    const start = Math.max(2, Math.min(current - 1, count - 4));
    const end = Math.min(count - 1, Math.max(current + 1, start + 3));
    return [1, ...(start > 2 ? ['…'] : []), ...Array.from({ length: end - start + 1 }, (_, index) => start + index), ...(end < count - 1 ? ['…'] : []), count];
}
module.exports = { pageNumbers };
