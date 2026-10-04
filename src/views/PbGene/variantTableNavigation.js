export const VARIANT_PAGE_SIZE = 5;

function chromosome(value) {
    return String(value || "").replace(/^chr/i, "").toUpperCase();
}

export function variantPosition(row) {
    const direct = Number(row && row.position);
    if (Number.isSafeInteger(direct) && direct > 0) return direct;
    const match = String(row && row.id || "").match(/^(?:chr)?[^:]+:(\d+):/i);
    return match ? Number(match[1]) : null;
}

export function positionSearchPlaceholder(rows) {
    const row = (rows || []).find(item => Number.isSafeInteger(variantPosition(item)));
    if (!row) return "chr4:70441000 or 70441000";
    const position = variantPosition(row);
    const rawChromosome = String(row.id || "").split(":")[0];
    const prefix = rawChromosome ? `chr${chromosome(rawChromosome)}` : "chr";
    return `${prefix}:${position} or ${position}`;
}

export function positionOrderedVariants(rows) {
    return [...(rows || [])]
        .filter(row => Number.isSafeInteger(variantPosition(row)))
        .sort((a, b) => variantPosition(a) - variantPosition(b) || String(a.id).localeCompare(String(b.id)));
}

export function parsePositionQuery(input) {
    const text = String(input || "").trim();
    const match = text.match(/^(?:(?:chr)?([0-9]{1,2}|X|Y|M|MT):)?([0-9][0-9,]*)$/i);
    if (!match) return null;
    const position = Number(match[2].replace(/,/g, ""));
    if (!Number.isSafeInteger(position) || position < 1) return null;
    return { chromosome: chromosome(match[1]), position };
}

function genePositionRange(geneInfo, orderedRows) {
    const firstId = orderedRows[0] && String(orderedRows[0].id || "");
    const firstChromosome = firstId ? chromosome(firstId.split(":")[0]) : "";
    const location = String(geneInfo && geneInfo.location || "");
    const locus = location.match(/^(?:chr)?([0-9]{1,2}|X|Y|M|MT):([0-9,]+)\s*[-–]\s*([0-9,]+)$/i);
    const expectedChromosome = chromosome(geneInfo && geneInfo.chromosome) ||
        (locus && chromosome(locus[1])) || firstChromosome;
    const variantStart = variantPosition(orderedRows[0]);
    const variantEnd = variantPosition(orderedRows[orderedRows.length - 1]);
    const locusStart = locus && chromosome(locus[1]) === expectedChromosome
        ? Number(locus[2].replace(/,/g, "")) : null;
    const locusEnd = locus && chromosome(locus[1]) === expectedChromosome
        ? Number(locus[3].replace(/,/g, "")) : null;
    return {
        chromosome: expectedChromosome,
        start: Number.isSafeInteger(locusStart) && locusStart > 0 ? Math.min(locusStart, variantStart) : variantStart,
        end: Number.isSafeInteger(locusEnd) && locusEnd > 0 ? Math.max(locusEnd, variantEnd) : variantEnd,
    };
}

export function findPositionWindow(rows, geneInfo, input) {
    const ordered = positionOrderedVariants(rows);
    if (!ordered.length) return { error: "Variants are not available yet." };
    const query = parsePositionQuery(input);
    const range = genePositionRange(geneInfo, ordered);
    if (!query || (query.chromosome && query.chromosome !== range.chromosome) ||
        query.position < range.start || query.position > range.end) {
        return { error: "Invalid position" };
    }
    let nearestIndex = 0;
    let nearestDistance = Infinity;
    ordered.forEach((row, index) => {
        const distance = Math.abs(variantPosition(row) - query.position);
        if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestIndex = index;
        }
    });
    const start = Math.max(0, Math.min(nearestIndex - 2, ordered.length - VARIANT_PAGE_SIZE));
    return { ordered, start, nearestIndex, match: ordered[nearestIndex] };
}

export function visiblePageNumbers(activePage, totalPages) {
    if (!totalPages) return [];
    const count = Math.min(5, totalPages);
    const start = Math.max(1, Math.min(activePage - 2, totalPages - count + 1));
    return Array.from({ length: count }, (_, index) => start + index);
}
