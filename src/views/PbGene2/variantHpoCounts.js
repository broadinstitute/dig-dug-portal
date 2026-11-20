export async function fetchGeneCarrierHpoCount(gene, ids, quality, expectedTotal, fetcher = fetch) {
    const hpo_terms = [...new Set(ids)].sort();
    const response = await fetcher('/phenotype-analyzer-api/pb/__gene_variant_hpo_counts__', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gene, hpo_terms, quality, scope: 'gene' }),
    });
    if (!response.ok) throw new Error('Gene carrier phenotype counts are unavailable.');

    const result = await response.json();
    const { count, carrierTotal, metadataCount } = result.gene_carriers || {};
    if (result.gene !== gene || result.match !== 'any' || result.population !== 'observed_gene_carriers' ||
        JSON.stringify(result.hpo_terms) !== JSON.stringify(hpo_terms) || carrierTotal !== expectedTotal ||
        !Number.isSafeInteger(metadataCount) || metadataCount < 0 || metadataCount > carrierTotal ||
        (metadataCount === 0 && carrierTotal > 0 ? count !== null :
            !Number.isSafeInteger(count) || count < 0 || count > metadataCount)) {
        throw new Error('The carrier phenotype count did not match the displayed gene and profile.');
    }
    return { count, carrierTotal, metadataCount };
}

export const variantHpoCountsMixin = {
    data: () => ({ variantHpoCounts: {}, variantHpoCountStatus: '', variantHpoRevision: 0 }),
    computed: {
        variantHpoCountKey() {
            const rows = this.variantSortKey === 'hpoCarriers'
                ? [...this.matchingVariantRows, ...this.pinnedVariantRows] : this.comparisonVariantRows;
            return this.appliedContext && rows.length ? JSON.stringify([
                this.geneInfo.symbol, [...this.appliedContext.terms].sort(), [...new Set(rows.map(row => row.id))].sort(),
            ]) : '';
        },
    },
    watch: { variantHpoCountKey: { immediate: true, handler: 'loadVariantHpoCounts' } },
    beforeDestroy() { this.variantHpoRevision++; if (this._variantHpoAbort) this._variantHpoAbort.abort(); },
    methods: {
        async loadVariantHpoCounts(key) {
            const revision = ++this.variantHpoRevision;
            if (this._variantHpoAbort) this._variantHpoAbort.abort();
            this.variantHpoCounts = {}; this.variantHpoCountStatus = key ? 'loading' : '';
            if (!key) return;
            const [gene, terms, variants] = JSON.parse(key);
            const controller = new AbortController(); this._variantHpoAbort = controller;
            try {
                const response = await fetch('/phenotype-analyzer-api/pb/__gene_variant_hpo_counts__', {method: 'POST', headers: {'Content-Type': 'application/json'},
                    signal: controller.signal, body: JSON.stringify({gene, hpo_terms: terms, variant_ids: variants, quality: this.geneVariantQuality})});
                if (!response.ok) throw new Error('Recorded HPO metadata is unavailable.');
                const result = await response.json();
                if (revision !== this.variantHpoRevision || key !== this.variantHpoCountKey) return;
                if (result.gene !== gene || result.match !== 'any' || JSON.stringify(result.hpo_terms) !== JSON.stringify(terms)) throw new Error('Recorded HPO metadata did not match the applied profile.');
                this.variantHpoCounts = result.variants || {}; this.variantHpoCountStatus = 'ready';
            } catch (error) {
                if (revision === this.variantHpoRevision && key === this.variantHpoCountKey) this.variantHpoCountStatus = 'unavailable';
            }
        },
        variantHpoCountDisplay(row) {
            if (!this.appliedContext) return '—';
            if (this.variantHpoCountStatus === 'loading') return 'Loading…';
            const count = this.variantHpoCounts[row.id];
            if (!count || count.count == null) return 'Unavailable';
            const lowerBound = count.metadataCount < count.carrierTotal ? '≥' : '';
            return lowerBound + count.count.toLocaleString();
        },
        variantHpoCountTitle(row) {
            const count = this.variantHpoCounts[row.id];
            return count ? `${count.metadataCount} of ${count.carrierTotal} observed variant carriers have HPO metadata. The cell shows matches among those with metadata. Counts require at least ONE HPO term in the applied profile (OR): with 3 terms, 1/3, 2/3 or 3/3 matches all count. Each carrier is counted once. Exact recorded HPO IDs are matched. This reference count does not filter the analysis population or enter the GRS, rPheRS, mean carrier Z-score, beta or p-value calculations.` : 'Apply a phenotype profile to count carriers with at least ONE of its HPO terms recorded (OR). With 3 terms, 1/3, 2/3 or 3/3 matches all count. Each carrier is counted once. This reference count does not affect score or regression calculations.';
        },
    },
};
