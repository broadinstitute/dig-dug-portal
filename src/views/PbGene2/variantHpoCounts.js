export const variantHpoCountsMixin = {
    data: () => ({ variantHpoCounts: {}, variantHpoCountStatus: '', variantHpoRevision: 0 }),
    computed: {
        variantHpoCountKey() {
            return this.appliedContext && this.comparisonVariantRows.length ? JSON.stringify([
                this.geneInfo.symbol, [...this.appliedContext.terms].sort(), [...new Set(this.comparisonVariantRows.map(row => row.id))].sort(),
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
                const response = await fetch('/__gene_variant_hpo_counts__', {method: 'POST', headers: {'Content-Type': 'application/json'},
                    signal: controller.signal, body: JSON.stringify({gene, hpo_terms: terms, variant_ids: variants})});
                if (!response.ok) throw new Error('Recorded HPO metadata is unavailable.');
                const result = await response.json();
                if (revision !== this.variantHpoRevision || key !== this.variantHpoCountKey) return;
                if (result.gene !== gene || result.match !== 'all' || JSON.stringify(result.hpo_terms) !== JSON.stringify(terms)) throw new Error('Recorded HPO metadata did not match the applied profile.');
                this.variantHpoCounts = result.variants || {}; this.variantHpoCountStatus = 'ready';
            } catch (error) {
                if (revision === this.variantHpoRevision && key === this.variantHpoCountKey) this.variantHpoCountStatus = 'unavailable';
            }
        },
        variantHpoCountDisplay(row) {
            if (!this.appliedContext) return '—';
            if (this.variantHpoCountStatus === 'loading') return 'Loading…';
            const count = this.variantHpoCounts[row.id];
            return count && count.count != null ? Number(count.count).toLocaleString() + (count.complete ? '' : ' (partial)') : 'Unavailable';
        },
        variantHpoCountTitle(row) {
            const count = this.variantHpoCounts[row.id];
            return count ? `${count.metadataCount} / ${count.carrierTotal} observed variant carriers have HPO metadata. Counts require every applied HPO term and are independent of scoring eligibility.` : 'Apply a phenotype profile; recorded HPO metadata is required to count carriers with all profile terms.';
        },
    },
};
