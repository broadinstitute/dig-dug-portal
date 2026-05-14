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

export async function fetchLigerText(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Liger API request failed: ${response.status} ${response.statusText}`);
        }

        return await response.text();
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

function firstNonEmptyValue(...values) {
    const flattened = values.flatMap((value) => {
        if (Array.isArray(value)) {
            return value;
        }

        return [value];
    });

    for (const value of flattened) {
        if (value === undefined || value === null) {
            continue;
        }

        if (typeof value === "string" && !value.trim()) {
            continue;
        }

        return value;
    }

    return null;
}

function unwrapJsonLdValue(value) {
    if (Array.isArray(value)) {
        const unwrappedValues = value
            .map((item) => unwrapJsonLdValue(item))
            .filter((item) => item !== null && item !== undefined && item !== "");

        if (!unwrappedValues.length) {
            return null;
        }

        return unwrappedValues.length === 1 ? unwrappedValues[0] : unwrappedValues;
    }

    if (value && typeof value === "object") {
        if (Object.prototype.hasOwnProperty.call(value, "@value")) {
            return unwrapJsonLdValue(value["@value"]);
        }

        if (Object.prototype.hasOwnProperty.call(value, "@id")) {
            return value["@id"];
        }

        if (Object.prototype.hasOwnProperty.call(value, "name")) {
            return unwrapJsonLdValue(value.name);
        }
    }

    return value;
}

function coerceString(value, fallback = "") {
    const unwrappedValue = unwrapJsonLdValue(value);

    if (Array.isArray(unwrappedValue)) {
        return unwrappedValue.map((item) => `${item}`).join(", ");
    }

    if (unwrappedValue === undefined || unwrappedValue === null) {
        return fallback;
    }

    return `${unwrappedValue}`;
}

function coerceNumber(value, fallback = null) {
    const unwrappedValue = unwrapJsonLdValue(value);

    if (unwrappedValue === undefined || unwrappedValue === null || unwrappedValue === "") {
        return fallback;
    }

    const numericValue = Number(unwrappedValue);
    return Number.isFinite(numericValue) ? numericValue : fallback;
}

function coerceArray(value) {
    const unwrappedValue = unwrapJsonLdValue(value);

    if (Array.isArray(unwrappedValue)) {
        return unwrappedValue.map((item) => `${item}`);
    }

    if (unwrappedValue === undefined || unwrappedValue === null || unwrappedValue === "") {
        return [];
    }

    return [`${unwrappedValue}`];
}

function normalizeDatasetMetadataEntry(entry = {}, fallbackKey = null) {
    const datasetId = coerceString(firstNonEmptyValue(
        entry.datasetId,
        entry.dataset_id,
        entry.identifier,
        entry.id,
        entry["@id"],
        fallbackKey
    ));

    if (!datasetId) {
        return null;
    }

    const summary = coerceString(firstNonEmptyValue(
        entry.summary,
        entry.description,
        entry.abstract
    ));

    const sourceValue = firstNonEmptyValue(
        entry.source,
        entry.publisher,
        entry.provider,
        entry.includedInDataCatalog
    );
    const doiValue = firstNonEmptyValue(
        entry.doi,
        entry.sameAs,
        entry.url
    );

    return {
        ...entry,
        datasetId,
        datasetName: coerceString(firstNonEmptyValue(
            entry.datasetName,
            entry.name,
            entry.title,
            entry.headline,
            datasetId
        ), datasetId),
        source: coerceString(sourceValue),
        species: coerceString(firstNonEmptyValue(entry.species, entry.organism, entry.species__ontology_label)),
        tissue: coerceString(firstNonEmptyValue(entry.tissue, entry.organ, entry.tissue__ontology_label, entry.organ__ontology_label)),
        method: coerceString(firstNonEmptyValue(entry.method, entry.assay, entry.measurementTechnique)),
        platform: coerceString(firstNonEmptyValue(entry.platform, entry.instrument, entry.technique)),
        summary,
        doi: coerceString(doiValue),
        authors: coerceString(firstNonEmptyValue(entry.authors, entry.author, entry.creator)),
        totalDonors: coerceNumber(firstNonEmptyValue(entry.totalDonors, entry.total_donors, entry.donorCount)),
        totalCells: coerceNumber(firstNonEmptyValue(entry.totalCells, entry.total_cells, entry.cellCount)),
        species__ontology_label: coerceArray(entry.species__ontology_label),
        tissue__ontology_label: coerceArray(entry.tissue__ontology_label),
        organ__ontology_label: coerceArray(entry.organ__ontology_label),
        disease__ontology_label: coerceArray(entry.disease__ontology_label)
    };
}

export function normalizeDatasetMetadataCollection(payload) {
    const payloadGraph = Array.isArray(payload?.["@graph"]) ? payload["@graph"] : null;
    const payloadData = Array.isArray(payload?.data) ? payload.data : null;
    const collection = Array.isArray(payload)
        ? payload
        : payloadGraph || payloadData;

    if (Array.isArray(collection)) {
        return collection.reduce((lookup, entry) => {
            const normalizedEntry = normalizeDatasetMetadataEntry(entry);

            if (normalizedEntry?.datasetId) {
                lookup[normalizedEntry.datasetId] = normalizedEntry;
            }

            return lookup;
        }, {});
    }

    return Object.entries(payload || {}).reduce((lookup, [key, value]) => {
        if (!value || typeof value !== "object" || key.startsWith("@")) {
            return lookup;
        }

        const normalizedEntry = normalizeDatasetMetadataEntry(value, key);

        if (normalizedEntry?.datasetId) {
            lookup[normalizedEntry.datasetId] = normalizedEntry;
        }

        return lookup;
    }, {});
}

export function parseDatasetMetadataPayload(payloadText) {
    const normalizedText = `${payloadText || ""}`.trim();

    if (!normalizedText) {
        return {};
    }

    try {
        return normalizeDatasetMetadataCollection(JSON.parse(normalizedText));
    } catch (jsonError) {
        const lines = normalizedText
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean);

        const parsedLines = lines.map((line) => JSON.parse(line));
        return normalizeDatasetMetadataCollection(parsedLines);
    }
}

export async function fetchLigerDatasetMetadata({ apiConfig, apiCache }) {
    if (apiCache.datasetMetadata) {
        return apiCache.datasetMetadata;
    }

    const payloadText = await fetchLigerText(apiConfig.datasetMetadataUrl);
    const normalizedPayload = parseDatasetMetadataPayload(payloadText);
    apiCache.datasetMetadata = normalizedPayload;

    return normalizedPayload;
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
