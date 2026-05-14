// This file owns the Liger API request and payload-shaping helpers so the view
// logic can stay focused on state transitions and rendering decisions.

export function buildFactorContext({ dataset, cellType, model, factor }) {
    const context = [dataset, cellType, model];

    if (factor) {
        context.push(factor);
    }

    return context;
}

export function buildLigerApiUrl(apiConfig, mode, endpoint, queryParts, extraParams = {}) {
    const searchParams = new URLSearchParams();
    searchParams.set("q", queryParts.join(","));

    Object.entries(extraParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            searchParams.set(key, value);
        }
    });

    return `${apiConfig.baseUrl}/${mode}/${endpoint}?${searchParams.toString()}`;
}

export function buildLigerCacheKey(queryParts, extraParams = {}) {
    const extraKey = Object.entries(extraParams)
        .filter(([, value]) => value !== undefined && value !== null && value !== "")
        .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
        .map(([key, value]) => `${key}=${value}`)
        .join("::");

    return extraKey ? `${queryParts.join("::")}::${extraKey}` : queryParts.join("::");
}

export async function fetchLigerJson(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Liger API request failed: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Liger API fetch error:", error);
        throw error;
    }
}

export async function fetchCachedLigerResource({ apiCache, cacheGroup, queryParts, urlBuilder, extraParams = {} }) {
    const cacheKey = buildLigerCacheKey(queryParts, extraParams);

    if (apiCache[cacheGroup][cacheKey]) {
        return apiCache[cacheGroup][cacheKey];
    }

    const url = urlBuilder(queryParts, extraParams);
    const payload = await fetchLigerJson(url);
    apiCache[cacheGroup][cacheKey] = payload;

    return payload;
}

export function parseGraphFactorValue(factorValue) {
    const [dataset, cellType, model, factor] = (factorValue || "").split(";");

    return {
        dataset: dataset || null,
        cellType: cellType || null,
        model: model || null,
        factor: factor || null
    };
}

export function normalizeGraphEdges(edges = []) {
    return edges.map((edge) => ({
        ...edge,
        factorContext: parseGraphFactorValue(edge.n2_value)
    }));
}

export function splitCommaSeparatedValues(value) {
    if (!value) return [];
    return value.split(",").map((item) => item.trim()).filter(Boolean);
}

export function normalizeFactorRows(rows = []) {
    return rows.map((row) => ({
        ...row,
        top_cells_list: splitCommaSeparatedValues(row.top_cells),
        top_gene_sets_list: Array.isArray(row.top_gene_sets) ? row.top_gene_sets : [],
        top_genes_list: Array.isArray(row.top_genes) ? row.top_genes : [],
        top_traits_list: Array.isArray(row.top_traits) ? row.top_traits : []
    }));
}

export function buildDetailScoreItems(labels = [], rows = []) {
    return labels.map((label, index) => {
        const row = rows[index] || {};

        return {
            label,
            value: row.value ?? null,
            pValue: row.pValue ?? row.p_value ?? null,
            beta: row.beta ?? null
        };
    });
}

export async function fetchLigerFactors({ apiConfig, apiCache, dataset, cellType, model }) {
    const queryParts = buildFactorContext({ dataset, cellType, model });
    const payload = await fetchCachedLigerResource({
        apiCache,
        cacheGroup: "factors",
        queryParts,
        urlBuilder: (parts) => buildLigerApiUrl(apiConfig, "query", apiConfig.queryEndpoints.factors, parts)
    });

    return {
        ...payload,
        data: normalizeFactorRows(payload.data || [])
    };
}

export async function fetchLigerFactorGenes({ apiConfig, apiCache, dataset, cellType, model, factor, limit }) {
    const queryParts = buildFactorContext({ dataset, cellType, model, factor });
    return await fetchCachedLigerResource({
        apiCache,
        cacheGroup: "factorGenes",
        queryParts,
        urlBuilder: (parts, extraParams) => buildLigerApiUrl(apiConfig, "query", apiConfig.queryEndpoints.factorGenes, parts, extraParams),
        extraParams: { limit }
    });
}

export async function fetchLigerFactorTraits({ apiConfig, apiCache, dataset, cellType, model, factor, limit }) {
    const queryParts = buildFactorContext({ dataset, cellType, model, factor });
    return await fetchCachedLigerResource({
        apiCache,
        cacheGroup: "factorTraits",
        queryParts,
        urlBuilder: (parts, extraParams) => buildLigerApiUrl(apiConfig, "query", apiConfig.queryEndpoints.factorTraits, parts, extraParams),
        extraParams: { limit }
    });
}

export async function fetchLigerFactorGeneSets({ apiConfig, apiCache, dataset, cellType, model, factor, limit }) {
    const queryParts = buildFactorContext({ dataset, cellType, model, factor });
    return await fetchCachedLigerResource({
        apiCache,
        cacheGroup: "factorGeneSets",
        queryParts,
        urlBuilder: (parts, extraParams) => buildLigerApiUrl(apiConfig, "query", apiConfig.queryEndpoints.factorGeneSets, parts, extraParams),
        extraParams: { limit }
    });
}

export async function fetchLigerFactorCells({ apiConfig, apiCache, dataset, cellType, model, factor }) {
    const queryParts = buildFactorContext({ dataset, cellType, model, factor });
    return await fetchCachedLigerResource({
        apiCache,
        cacheGroup: "factorCells",
        queryParts,
        urlBuilder: (parts) => buildLigerApiUrl(apiConfig, "query", apiConfig.queryEndpoints.factorCells, parts)
    });
}

export async function fetchLigerFactorDetailScores({ apiConfig, apiCache, dataset, cellType, model, factor, summary }) {
    const topGenes = summary?.top_genes_list || [];
    const topTraits = summary?.top_traits_list || [];
    const topGeneSets = summary?.top_gene_sets_list || [];

    const [genePayload, traitPayload, geneSetPayload] = await Promise.all([
        topGenes.length
            ? fetchLigerFactorGenes({ apiConfig, apiCache, dataset, cellType, model, factor, limit: topGenes.length })
            : Promise.resolve({ data: [] }),
        topTraits.length
            ? fetchLigerFactorTraits({ apiConfig, apiCache, dataset, cellType, model, factor, limit: topTraits.length })
            : Promise.resolve({ data: [] }),
        topGeneSets.length
            ? fetchLigerFactorGeneSets({ apiConfig, apiCache, dataset, cellType, model, factor, limit: topGeneSets.length })
            : Promise.resolve({ data: [] })
    ]);

    return {
        topGenes: buildDetailScoreItems(topGenes, genePayload.data || []),
        topTraits: buildDetailScoreItems(topTraits, traitPayload.data || []),
        topGeneSets: buildDetailScoreItems(topGeneSets, geneSetPayload.data || [])
    };
}

export async function searchLigerTraitMatches({ apiConfig, apiCache, searchTerm }) {
    const queryParts = ["trait", searchTerm];
    return await fetchCachedLigerResource({
        apiCache,
        cacheGroup: "graphTraitMatches",
        queryParts,
        urlBuilder: (parts) => buildLigerApiUrl(apiConfig, "match", apiConfig.matchEndpoints.graphEdges, parts)
    });
}

export async function searchLigerGeneMatches({ apiConfig, apiCache, searchTerm }) {
    const queryParts = ["gene", searchTerm];
    return await fetchCachedLigerResource({
        apiCache,
        cacheGroup: "graphGeneMatches",
        queryParts,
        urlBuilder: (parts) => buildLigerApiUrl(apiConfig, "match", apiConfig.matchEndpoints.graphEdges, parts)
    });
}

export async function fetchLigerTraitGraphResults({ apiConfig, apiCache, trait }) {
    const queryParts = ["trait", trait];
    const payload = await fetchCachedLigerResource({
        apiCache,
        cacheGroup: "graphTraitResults",
        queryParts,
        urlBuilder: (parts) => buildLigerApiUrl(apiConfig, "query", apiConfig.queryEndpoints.graphEdges, parts)
    });

    return {
        ...payload,
        data: normalizeGraphEdges(payload.data || [])
    };
}

export async function fetchLigerGeneGraphResults({ apiConfig, apiCache, gene }) {
    const queryParts = ["gene", gene];
    const payload = await fetchCachedLigerResource({
        apiCache,
        cacheGroup: "graphGeneResults",
        queryParts,
        urlBuilder: (parts) => buildLigerApiUrl(apiConfig, "query", apiConfig.queryEndpoints.graphEdges, parts)
    });

    return {
        ...payload,
        data: normalizeGraphEdges(payload.data || [])
    };
}

export async function fetchLigerSearchResults({ apiConfig, apiCache, searchType, searchTerm }) {
    if (searchType === "trait") {
        return await fetchLigerTraitGraphResults({ apiConfig, apiCache, trait: searchTerm });
    }

    if (searchType === "gene") {
        return await fetchLigerGeneGraphResults({ apiConfig, apiCache, gene: searchTerm });
    }

    throw new Error(`Unsupported Liger search type: ${searchType}`);
}

export async function fetchLigerSearchMatches({ apiConfig, apiCache, searchType, searchTerm }) {
    if (searchType === "trait") {
        return await searchLigerTraitMatches({ apiConfig, apiCache, searchTerm });
    }

    if (searchType === "gene") {
        return await searchLigerGeneMatches({ apiConfig, apiCache, searchTerm });
    }

    throw new Error(`Unsupported Liger search type: ${searchType}`);
}
