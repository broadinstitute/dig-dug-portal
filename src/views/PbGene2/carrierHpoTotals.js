export const carrierHpoTotalsMixin = {
    data: () => ({carrierHpoTotalResult: {key: '', status: 'idle', counts: {}}, carrierHpoTotalRevision: 0}),
    watch: {carrierTableRequestKey: {immediate: true, handler: 'loadCarrierHpoTotals'}},
    beforeDestroy() {this.carrierHpoTotalRevision++; if (this._carrierHpoTotalAbort) this._carrierHpoTotalAbort.abort();},
    methods: {
        async loadCarrierHpoTotals(key) {
            const revision = ++this.carrierHpoTotalRevision;
            if (this._carrierHpoTotalAbort) this._carrierHpoTotalAbort.abort();
            this.carrierHpoTotalResult = {key, status: key ? 'loading' : 'idle', counts: {}};
            if (!key) return;
            const [gene, variant, ids] = JSON.parse(key);
            if (!ids.length) {this.carrierHpoTotalResult = {key, status: 'ready', counts: {}}; return;}
            const controller = new AbortController(); this._carrierHpoTotalAbort = controller;
            try {
                const response = await fetch('/__gene_carrier_hpo_totals__', {method: 'POST', signal: controller.signal,
                    headers: {'Content-Type': 'application/json'}, body: JSON.stringify({gene, variant, sample_ids: ids})});
                if (!response.ok) throw new Error('Scoring HPO totals are unavailable.');
                const result = await response.json();
                if (revision !== this.carrierHpoTotalRevision || key !== this.carrierTableRequestKey) return;
                if (result.gene !== gene || result.variant !== variant || !result.counts || Array.isArray(result.counts)
                    || !result.source || result.source.method !== 'binary_hpo_matrix_row_sum' || result.source.covariate !== 'n_terms'
                    || ids.some(id => !Object.prototype.hasOwnProperty.call(result.counts, id)
                        || result.counts[id] !== null && (!Number.isSafeInteger(result.counts[id]) || result.counts[id] < 0)))
                    throw new Error('Scoring HPO totals did not match the requested carriers.');
                this.carrierHpoTotalResult = {key, status: 'ready', counts: result.counts};
            } catch (_) {
                if (revision === this.carrierHpoTotalRevision && key === this.carrierTableRequestKey)
                    this.carrierHpoTotalResult = {key, status: 'unavailable', counts: {}};
            }
        },
        carrierHpoTotalDisplay(sample) {
            const state = this.carrierHpoTotalResult;
            if (state.key !== this.carrierTableRequestKey || state.status === 'loading') return 'Loading…';
            const count = state.status === 'ready' ? state.counts[sample.id] : null;
            return count == null ? 'Unavailable' : count.toLocaleString();
        },
    },
};
