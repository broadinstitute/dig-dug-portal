function normalizeSearchValue(value) {
    return String(value || "")
        .normalize("NFKD")
        .toLocaleLowerCase()
        .trim();
}

function currentSearchTerm(value) {
    return String(value || "").slice(String(value || "").lastIndexOf(",") + 1).trim();
}

function scoreSearchOption(option, normalizedQuery) {
    const fields = [option.searchKey, ...(option.aliases || [])];
    const tokens = normalizedQuery.split(/\s+/).filter(Boolean);

    if (!tokens.every((token) => fields.some((field) => field.includes(token)))) return Infinity;
    if (option.normalizedLabel === normalizedQuery || option.normalizedId === normalizedQuery) return 0;
    if (option.normalizedLabel.startsWith(normalizedQuery) || option.normalizedId.startsWith(normalizedQuery)) return 1;
    if ((option.aliases || []).some((alias) => alias.startsWith(normalizedQuery))) return 2;
    return 3;
}

function findSearchOptions(options, value, limit = 6) {
    const query = normalizeSearchValue(currentSearchTerm(value));
    if (query.length < 2) return [];

    return options
        .map((option) => ({ option, score: scoreSearchOption(option, query) }))
        .filter(({ score }) => Number.isFinite(score))
        .sort((a, b) => a.score - b.score || a.option.label.localeCompare(b.option.label))
        .slice(0, limit)
        .map(({ option }) => option);
}

function resolveSearchTarget(value, selectedKind, geneSymbols) {
    const query = String(value || "").trim();
    if (!query) return null;

    if (/^(?:BCH|CRDC)-/i.test(query)) {
        return { path: "./sampleresult.html", param: "sample_id", value: query };
    }

    if (/^(?:chr)?(?:\d{1,2}|x|y|m|mt):\d+:[acgtn]+:[acgtn]+$/i.test(query) || /^rs\d+$/i.test(query)) {
        return { path: "./variantresult.html", param: "query", value: query };
    }

    const normalized = normalizeSearchValue(query);
    if (selectedKind === "Gene" || geneSymbols.has(normalized)) {
        return { path: "./generesult.html", param: "query", value: query.toUpperCase() };
    }

    return { path: "./phenotypeResult.html", param: "query", value: query };
}

function buildSearchHref(target) {
    return `${target.path}?${target.param}=${encodeURIComponent(target.value)}`;
}

module.exports = {
    buildSearchHref,
    currentSearchTerm,
    findSearchOptions,
    normalizeSearchValue,
    resolveSearchTarget,
    scoreSearchOption,
};
