const FOREST_GENE_API_URL =
    "https://bioindex-qa.hugeampkpnbi.org/matkp/api/bio/query/single-cell-forest";

export async function fetchForestGeneRows(geneSymbol) {
    const query = String(geneSymbol || "").trim();

    if (!query) {
        return [];
    }

    const url = `${FOREST_GENE_API_URL}?q=${encodeURIComponent(query)}`;
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Forest gene query failed with status ${response.status}`);
    }

    const payload = await response.json();

    return payload.data || [];
}
