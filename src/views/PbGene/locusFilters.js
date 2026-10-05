export function locusFilterActive(state) {
    const groupFilterActive = state.projectFilter !== undefined
        ? state.projectFilter !== "All projects"
        : state.investigatorFilter !== "All investigators";
    return state.carrierScopeFilter !== "All" || state.ageFilter !== "All ages" ||
        groupFilterActive || state.sexFilter !== "All";
}

export function locusFilterKey(state, start, end, bins, ready) {
    if (!ready || !locusFilterActive(state)) return "";
    const groupFilter = state.projectFilter !== undefined ? state.projectFilter : state.investigatorFilter;
    return JSON.stringify([state.geneInfo.symbol, start, end, bins,
        state.carrierScopeFilter, state.ageFilter, groupFilter, state.sexFilter]);
}

export async function refreshLocusFilter() {
    const sequence = ++this.locusFilterSequence;
    const key = this.publicLocusFilterRequestKey !== undefined
        ? this.publicLocusFilterRequestKey : this.locusFilterRequestKey;
    this.locusFilterResult = null;
    this.locusFilterError = "";
    this.locusFilterProgress = "";
    if (!key) return;
    const [gene, start, end, bins, scope, age, group, sex] = JSON.parse(key);
    const layout = this.publicLocusFilterRequestKey !== undefined ? "public" : "pb";
    const params = new URLSearchParams({ gene, start, end, bins, scope, age, sex, layout });
    params.set(layout === "public" ? "project" : "investigator", group);
    try {
        for (let attempt = 0; attempt < 2400; attempt += 1) {
            const response = await fetch(`/__gene_locus_filter__?${params.toString()}`);
            if (!response.ok) throw new Error(`Locus filter returned ${response.status}`);
            const result = await response.json();
            if (sequence !== this.locusFilterSequence) return;
            if (result.status === "ready") {
                this.locusFilterResult = result;
                this.locusFilterProgress = "";
                return;
            }
            if (result.status === "partial") this.locusFilterResult = result;
            this.locusFilterProgress = result.total
                ? `Filtering carriers · ${result.completed}/${result.total} metadata records checked`
                : "Loading carrier metadata for locus filters…";
            await new Promise(resolve => setTimeout(resolve, 1500));
        }
        throw new Error("Carrier metadata is still loading. Refresh to check again.");
    } catch (error) {
        if (sequence === this.locusFilterSequence) {
            this.locusFilterError = String(error && error.message ? error.message : error);
            this.locusFilterProgress = "";
        }
    }
}
