const prefix = '/phenotype-analyzer-api/pb/bioindex';

export function request(path, params, { signal } = {}) {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        if (value != null) search.set(key, value);
    }
    return fetch(`${prefix}${path}?${search}`, { signal });
}

export async function query(index, q, { limit, onResolve } = {}) {
    const rows = [];
    let response = await request(`/api/bio/query/${index}`, { q, limit });
    const seen = new Set();
    while (true) {
        if (!response.ok) throw new Error(`BioIndex ${index} is unavailable (HTTP ${response.status}).`);
        const page = await response.json();
        if (!Array.isArray(page.data)) throw new Error(`BioIndex ${index} returned invalid results.`);
        rows.push(...page.data);
        if (onResolve) onResolve(page);
        if (!page.continuation) return rows;
        if (seen.has(page.continuation)) throw new Error(`BioIndex ${index} returned a repeated continuation.`);
        seen.add(page.continuation);
        response = await request('/api/bio/cont', { token: page.continuation });
    }
}
