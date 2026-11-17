import { hpoIdsOf } from "./carrierSummary";

// Carriers with at least one applied HPO term, counted from each carrier's
// recorded HPO list (samples-info). Carriers without a recorded list are not counted.
export const variantHpoCountsMixin = {
    computed: {
        variantHpoCountStatus() { return this.appliedContext ? 'ready' : ''; },
        variantHpoCounts() {
            if (!this.appliedContext) return {};
            const terms = new Set(this.appliedContext.terms);
            const counts = {};
            (this.variantRows || []).forEach(row => {
                const samples = row.carrierSamples || [];
                let metadataCount = 0, count = 0;
                samples.forEach(sample => {
                    const ids = hpoIdsOf(this.carrierSampleField ? this.carrierSampleField(sample, 'hpo') : sample.hpo);
                    if (!ids) return;
                    metadataCount++;
                    if (ids.some(id => terms.has(id))) count++;
                });
                counts[row.id] = { count: metadataCount ? count : null, complete: metadataCount >= samples.length, metadataCount, carrierTotal: samples.length };
            });
            return counts;
        },
    },
    methods: {
        variantHpoCountDisplay(row) {
            if (!this.appliedContext) return '—';
            const count = this.variantHpoCounts[row.id];
            return count && count.count != null ? Number(count.count).toLocaleString() + (count.complete ? '' : ' (partial)') : 'Unavailable';
        },
        variantHpoCountTitle(row) {
            const count = this.variantHpoCounts[row.id];
            return count ? `${count.metadataCount} / ${count.carrierTotal} observed variant carriers have HPO metadata available. Counts require at least ONE HPO term in the applied profile (OR).` : 'Apply a phenotype profile to count carriers with recorded HPO terms.';
        },
    },
};
